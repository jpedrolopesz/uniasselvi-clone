import asyncio
import os
import json
import uuid
import time
import sys

from dotenv import load_dotenv
from loguru import logger
from pipecat.audio.vad.silero import SileroVADAnalyzer
from pipecat.adapters.schemas.function_schema import FunctionSchema
from pipecat.adapters.schemas.tools_schema import ToolsSchema
from pipecat.frames.frames import (
    Frame, LLMRunFrame, OutputTransportMessageFrame, TTSAudioRawFrame,
    UserStartedSpeakingFrame, UserStoppedSpeakingFrame,
)
from pipecat.pipeline.pipeline import Pipeline
from pipecat.pipeline.worker import PipelineParams, PipelineWorker
from pipecat.processors.aggregators.llm_context import LLMContext
from pipecat.processors.aggregators.llm_response_universal import (
    LLMContextAggregatorPair,
    LLMUserAggregatorParams,
)
from pipecat.runner.types import RunnerArguments
from pipecat.runner.utils import create_transport
from pipecat.services.llm_service import FunctionCallParams
from pipecat.transcriptions.language import Language
from pipecat.transports.base_transport import BaseTransport, TransportParams
from pipecat.workers.runner import WorkerRunner
from pipecat.processors.frame_processor import FrameDirection, FrameProcessor

load_dotenv(override=True)

try:
    # Forma recomendada: python -m pipecat_app.bot
    from pipecat_app.context import SNAPSHOT_SENTINEL, build_system_prompt, replace_page_snapshot
    from pipecat_app.call_guards import call_guard_reason
    from pipecat_app.thinking_filter import ThinkingFilterProcessor
except ModuleNotFoundError as error:
    # Também suporta: python pipecat_app/bot.py. Não capture dependências
    # ausentes dentro dos módulos — o fallback só vale para o pacote raiz.
    if error.name != "pipecat_app":
        raise
    from context import SNAPSHOT_SENTINEL, build_system_prompt, replace_page_snapshot
    from call_guards import call_guard_reason
    from thinking_filter import ThinkingFilterProcessor

STT_MODEL = os.getenv("STT_MODEL", "mlx-community/whisper-large-v3-turbo-q4")
DEBUG = os.getenv("VITRU_DEBUG", "").lower() in ("1", "true", "yes")

LEGACY_PORTAL_TOOLS = ToolsSchema(
    standard_tools=[
        FunctionSchema(
            name="navigate_to",
            description="Abre uma rota interna segura do portal.",
            properties={"href": {"type": "string", "description": "Href interno iniciado por /"}},
            required=["href"],
        ),
        FunctionSchema(
            name="go_back",
            description="Volta para a página anterior do histórico do navegador.",
            properties={},
            required=[],
        ),
        FunctionSchema(
            name="go_forward",
            description="Avança para a próxima página do histórico do navegador.",
            properties={},
            required=[],
        ),
        FunctionSchema(
            name="highlight_component",
            description="Rola até um componente visível e o destaca para o aluno.",
            properties={"target": {"type": "string", "description": "Target exato informado no contexto visual"}},
            required=["target"],
        ),
        FunctionSchema(
            name="close_interface",
            description="Fecha modal ou região que tenha um botão seguro Fechar, Cancelar ou Voltar.",
            properties={"target": {"type": "string", "description": "Target exato do contêiner visível"}},
            required=["target"],
        ),
    ]
)


def build_semantic_tools(snapshot: dict) -> ToolsSchema:
    destination_ids = [item["id"] for item in snapshot.get("destinations", []) if isinstance(item, dict) and isinstance(item.get("id"), str)]
    standard_tools = [
            FunctionSchema(
                name="responder_sem_acao",
                description="Só responde fatos: página, nota, peso, prazo ou status. Nunca use para 'onde', 'mostre', abrir, responder ou agendar.",
                properties={},
                required=[],
            ),
            FunctionSchema(
                name="navigate_to",
                description="Abre OUTRA página por destination_id permitido. Se page.id/page.name já é o pedido, não use esta ferramenta. Nunca use URL.",
                properties={"destination_id": {"type": "string", "enum": destination_ids}},
                required=["destination_id"],
            ),
            FunctionSchema(
                name="show",
                description="Use para 'onde', 'mostre', responder ou agendar uma ação. O portal resolve o alvo.",
                properties={"referencia": {"type": "string", "description": "Expressão original do aluno"}},
                required=["referencia"],
            ),
            FunctionSchema(
                name="close_interface",
                description="Fecha uma interface descrita pelo aluno; o portal resolve o alvo.",
                properties={"referencia": {"type": "string", "description": "Expressão original do aluno"}},
                required=["referencia"],
            ),
            FunctionSchema(
                name="pedir_esclarecimento",
                description="Pergunta somente quando a referência continua ambígua depois de usar o snapshot atual.",
                properties={"pergunta": {"type": "string"}},
                required=["pergunta"],
            ),
            FunctionSchema(name="go_back", description="Volta no histórico.", properties={}, required=[]),
            FunctionSchema(name="go_forward", description="Avança no histórico.", properties={}, required=[]),
        ]
    if snapshot.get("page", {}).get("id") == "assessment-scheduling":
        standard_tools.extend([
            FunctionSchema(name="listar_opcoes", description="Lista horários disponíveis; não grava.", properties={}, required=[]),
            FunctionSchema(name="selecionar_opcao", description="Seleciona pela referência do aluno; não use ids, datas inventadas nem tokens.", properties={"referencia": {"type": "string"}}, required=["referencia"]),
            FunctionSchema(name="confirmar", description="Confirma somente a proposta pendente exibida na tela. Não recebe argumentos.", properties={}, required=[]),
        ])
    return ToolsSchema(standard_tools=standard_tools)


async def prewarm_stt():
    """Carrega o Whisper MLX antes da primeira fala, evitando pagar o load no turno 1."""

    def warm():
        import mlx_whisper
        import numpy as np

        mlx_whisper.transcribe(
            np.zeros(16000, dtype=np.float32),
            path_or_hf_repo=STT_MODEL,
            language=Language.PT.value,
            temperature=0.0,
        )

    try:
        await asyncio.to_thread(warm)
        logger.info(f"STT pré-aquecido: {STT_MODEL}")
    except Exception:
        logger.exception("Falha ao pré-aquecer o STT")


transport_params = {
    "webrtc": lambda: TransportParams(
        audio_in_enabled=True,
        audio_out_enabled=True,
        audio_out_10ms_chunks=2,
        vad_analyzer=SileroVADAnalyzer(),
    ),
}


class VoiceTimingProcessor(FrameProcessor):
    def __init__(self, voice_mode: str):
        super().__init__()
        self.voice_mode = voice_mode
        self.last_speech_at = time.monotonic()
        self.user_stopped_at: float | None = None
        self.first_audio_reported = False
        self.time_to_first_audio_ms: list[float] = []
        self.metric_callback = None

    async def process_frame(self, frame: Frame, direction: FrameDirection):
        await super().process_frame(frame, direction)
        if isinstance(frame, UserStartedSpeakingFrame):
            self.last_speech_at = time.monotonic()
            self.first_audio_reported = False
        elif isinstance(frame, UserStoppedSpeakingFrame):
            self.last_speech_at = time.monotonic()
            self.user_stopped_at = self.last_speech_at
        elif isinstance(frame, TTSAudioRawFrame) and self.user_stopped_at and not self.first_audio_reported:
            value = (time.monotonic() - self.user_stopped_at) * 1000
            self.time_to_first_audio_ms.append(value)
            self.first_audio_reported = True
            logger.info(json.dumps({"event": "voice_metric", "voice_mode": self.voice_mode, "time_to_first_audio_ms": round(value, 1)}))
            if self.metric_callback:
                await self.metric_callback(round(value, 1))
        await self.push_frame(frame, direction)


async def run_bot(transport: BaseTransport, request_data: dict | None = None):
    request_data = request_data or {}
    voice_mode = request_data.get("voiceMode", "cascade")
    if voice_mode not in ("cascade", "sonic"):
        voice_mode = "cascade"
    logger.info(f"Iniciando agente Pipecat voice_mode={voice_mode}")

    initial_semantic = request_data.get("semanticSnapshot")
    initial_snapshot = initial_semantic.get("snapshot") if isinstance(initial_semantic, dict) else None
    tools = build_semantic_tools(initial_snapshot) if isinstance(initial_snapshot, dict) else LEGACY_PORTAL_TOOLS
    warmup = None
    stt = thinking_filter = tts = None

    if voice_mode == "cascade":
        from pipecat.services.aws.llm import AWSBedrockLLMService
        from pipecat.services.kokoro.tts import KokoroTTSService
        from pipecat.services.whisper.stt import WhisperSTTServiceMLX
        warmup = asyncio.create_task(prewarm_stt())
        stt = WhisperSTTServiceMLX(
            settings=WhisperSTTServiceMLX.Settings(model=STT_MODEL, language=Language.PT, temperature=0.0),
        )
        llm = AWSBedrockLLMService(
            aws_region=os.getenv("AWS_REGION", "us-east-1"),
            settings=AWSBedrockLLMService.Settings(
                model="amazon.nova-micro-v1:0",
                system_instruction=build_system_prompt(request_data),
                temperature=0.0,
                max_tokens=200,
            ),
        )
        thinking_filter = ThinkingFilterProcessor()
        tts = KokoroTTSService(settings=KokoroTTSService.Settings(voice=os.getenv("KOKORO_VOICE", "pf_dora"), language=Language.PT))
    else:
        import boto3
        from pipecat.services.aws.nova_sonic.llm import AWSNovaSonicLLMService, AudioConfig
        class InstrumentedSonicService(AWSNovaSonicLLMService):
            def __init__(self, *args, **kwargs):
                super().__init__(*args, **kwargs)
                self.modality_usage = {"speech_input": 0, "speech_output": 0, "text_input": 0, "text_output": 0}

            async def _handle_usage_event(self, event_json):
                delta = event_json["usageEvent"].get("details", {}).get("delta", {})
                input_usage, output_usage = delta.get("input", {}), delta.get("output", {})
                self.modality_usage["speech_input"] += input_usage.get("speechTokens", 0)
                self.modality_usage["text_input"] += input_usage.get("textTokens", 0)
                self.modality_usage["speech_output"] += output_usage.get("speechTokens", 0)
                self.modality_usage["text_output"] += output_usage.get("textTokens", 0)
                estimated_cost_usd = (
                    self.modality_usage["speech_input"] * 0.0034 / 1000
                    + self.modality_usage["speech_output"] * 0.0136 / 1000
                    + self.modality_usage["text_input"] * 0.00006 / 1000
                    + self.modality_usage["text_output"] * 0.00024 / 1000
                )
                logger.info(json.dumps({"event": "sonic_usage", "voice_mode": "sonic", **self.modality_usage,
                                        "estimated_cost_usd": round(estimated_cost_usd, 8)}))
                await super()._handle_usage_event(event_json)
        credentials = boto3.Session().get_credentials()
        if credentials is None:
            raise RuntimeError("Credenciais AWS não disponíveis para o Nova Sonic.")
        frozen = credentials.get_frozen_credentials()
        llm = InstrumentedSonicService(
            access_key_id=frozen.access_key,
            secret_access_key=frozen.secret_key,
            session_token=frozen.token,
            region=os.getenv("AWS_REGION", "us-east-1"),
            settings=AWSNovaSonicLLMService.Settings(
                model="amazon.nova-2-sonic-v1:0",
                voice=os.getenv("SONIC_VOICE", "carolina"),
                system_instruction=build_system_prompt(request_data),
                temperature=0.0,
                max_tokens=200,
                endpointing_sensitivity=os.getenv("SONIC_ENDPOINTING", "MEDIUM").upper(),
            ),
            audio_config=AudioConfig(input_sample_rate=16000, output_sample_rate=24000),
            tools=tools,
        )

    context = LLMContext(tools=tools)
    pending_actions: dict[str, asyncio.Future] = {}
    pending_action_metadata: dict[str, dict] = {}
    applied_version = 0

    def debug_log(event: str, **fields):
        if DEBUG:
            logger.info(json.dumps({"event": event, **fields}, ensure_ascii=False))

    original_usage_metrics = llm.start_llm_usage_metrics

    async def log_usage_metrics(tokens):
        messages = context.get_messages()
        debug_log(
            "llm_turn",
            prompt_tokens=tokens.prompt_tokens,
            inputTokens=tokens.prompt_tokens,
            outputTokens=tokens.completion_tokens,
            snapshot_messages=sum(
                1
                for message in messages
                if isinstance(message.get("content"), str)
                and message["content"].startswith(SNAPSHOT_SENTINEL)
            ),
            total_messages=len(messages),
        )
        await worker.queue_frames([OutputTransportMessageFrame(message={
            "type": "debug_turn",
            "backend": "nova-sonic" if voice_mode == "sonic" else "bedrock",
            "voice_mode": voice_mode,
            "payload": {"system": build_system_prompt(request_data), "messages": messages},
            "usage": {"prompt_tokens": tokens.prompt_tokens, "output_tokens": tokens.completion_tokens,
                      "over_2000": tokens.prompt_tokens > 2000,
                      "blocks": [{"role": "system", "tokens": len(build_system_prompt(request_data)) // 4},
                                 *[{"role": message.get("role"), "tokens": len(str(message.get("content", ""))) // 4} for message in messages]]},
        })])
        await original_usage_metrics(tokens)

    llm.start_llm_usage_metrics = log_usage_metrics
    user_params = LLMUserAggregatorParams(vad_analyzer=SileroVADAnalyzer()) if voice_mode == "cascade" else LLMUserAggregatorParams()
    user_aggregator, assistant_aggregator = LLMContextAggregatorPair(context, user_params=user_params)
    timing = VoiceTimingProcessor(voice_mode)

    processors = [transport.input()]
    if voice_mode == "cascade": processors.extend([stt, user_aggregator, llm, thinking_filter, tts])
    else: processors.extend([user_aggregator, llm])
    processors.extend([timing, transport.output(), assistant_aggregator])
    pipeline = Pipeline(processors)

    worker = PipelineWorker(
        pipeline,
        params=PipelineParams(
            audio_in_sample_rate=16000,
            audio_out_sample_rate=24000,
            enable_metrics=True,
            enable_usage_metrics=True,
        ),
    )
    call_started_at = time.monotonic()

    async def emit_ttfa(value: float):
        await worker.queue_frames([OutputTransportMessageFrame(message={
            "type": "voice_metric", "voice_mode": voice_mode,
            "metrics": {"time_to_first_audio_ms": value},
        })])

    timing.metric_callback = emit_ttfa

    async def enforce_call_guards():
        idle_seconds = float(os.getenv("SONIC_IDLE_SECONDS", "60"))
        max_seconds = float(os.getenv("SONIC_MAX_CALL_SECONDS", "600"))
        while True:
            await asyncio.sleep(1)
            now = time.monotonic()
            reason = call_guard_reason(call_started_at=call_started_at, last_speech_at=timing.last_speech_at,
                                       now=now, idle_seconds=idle_seconds, max_seconds=max_seconds)
            if reason:
                elapsed = now - (call_started_at if reason == "max_duration" else timing.last_speech_at)
                debug_log("call_guard", voice_mode=voice_mode, reason=reason, seconds=round(elapsed, 1))
                await worker.cancel()
                return

    guard_task: asyncio.Task | None = None

    async def portal_tool(params: FunctionCallParams):
        if params.function_name == "responder_sem_acao":
            await params.result_callback({"ok": True, "message": "Nenhuma ação no portal é necessária."})
            return
        action_types = {
            "navigate_to": "navigate",
            "go_back": "go_back",
            "go_forward": "go_forward",
            "highlight_component": "highlight",
            "close_interface": "close",
            "show": "show",
            "listar_opcoes": "list_options",
            "selecionar_opcao": "select_option",
            "confirmar": "confirm_write",
            "pedir_esclarecimento": "clarify",
        }
        action_type = action_types.get(params.function_name)
        if not action_type:
            await params.result_callback({"ok": False, "message": "Ferramenta desconhecida."})
            return

        action = {"id": str(uuid.uuid4()), "type": action_type, **dict(params.arguments)}
        if action_type == "navigate":
            latest_utterance = next((
                message.get("content") for message in reversed(context.get_messages())
                if message.get("role") == "user"
                and isinstance(message.get("content"), str)
                and not message["content"].startswith(SNAPSHOT_SENTINEL)
            ), "")
            # O texto veio do STT/contexto, não do modelo. Permite ao portal
            # impedir deterministicamente que um enum errado tire o aluno da
            # página que ele acabou de pedir.
            action["utterance"] = latest_utterance
        action_id = action["id"]
        future = asyncio.get_running_loop().create_future()
        pending_actions[action_id] = future
        sent_at = time.time()
        pending_action_metadata[action_id] = {"tool": params.function_name, "sent_at": sent_at}
        debug_log("action_sent", actionId=action_id, tool=params.function_name, sent_at=sent_at)
        try:
            await worker.queue_frames(
                [OutputTransportMessageFrame(message={
                    "type": "action_proposed", "actionId": action_id,
                    "version": applied_version, "action": action,
                })]
            )
            result = await asyncio.wait_for(future, timeout=7.0)
            await params.result_callback(result)
        except asyncio.TimeoutError:
            debug_log(
                "action_result",
                actionId=action_id,
                tool=params.function_name,
                sent_at=sent_at,
                result_at=time.time(),
                ok=False,
                timeout=True,
            )
            await params.result_callback(
                {"ok": False, "message": "O portal não confirmou a ação a tempo.", "actionId": action_id}
            )
        except Exception:
            logger.exception(f"Falha ao executar ação do portal: {action_id}")
            await params.result_callback(
                {"ok": False, "message": "Não foi possível enviar a ação ao portal.", "actionId": action_id}
            )
        finally:
            pending_actions.pop(action_id, None)
            pending_action_metadata.pop(action_id, None)

    for tool_name in (
        "navigate_to",
        "go_back",
        "go_forward",
        "highlight_component",
        "close_interface",
        "show",
        "responder_sem_acao",
        "listar_opcoes",
        "selecionar_opcao",
        "confirmar",
        "pedir_esclarecimento",
    ):
        llm.register_function(tool_name, portal_tool)

    @transport.event_handler("on_app_message")
    async def on_app_message(_transport, message, _sender):
        nonlocal applied_version
        if not isinstance(message, dict):
            return
        message_type = message.get("type")
        message_version = message.get("version", 0)
        if not isinstance(message_version, int):
            return
        if message_version < applied_version:
            logger.warning(f"Evento obsoleto descartado: {message_type} v{message_version} < v{applied_version}")
            return
        applied_version = message_version
        if message_type == "page_context":
            page_context = message.get("context")
            if isinstance(page_context, dict) and page_context.get("mode") == "semantic":
                snapshot = page_context.get("snapshot")
                if isinstance(snapshot, dict):
                    context.set_tools(build_semantic_tools(snapshot))
            else:
                context.set_tools(LEGACY_PORTAL_TOOLS)
            context.set_messages(replace_page_snapshot(context.get_messages(), message))
            if voice_mode == "sonic" and getattr(llm, "_context", None) is not None:
                debug_log("sonic_snapshot_refresh", mechanism="reset_conversation", version=message_version)
                await llm.reset_conversation()
            return
        if message_type in ("action_completed", "action_failed"):
            action_id = message.get("actionId")
            future = pending_actions.get(action_id)
            if not future or future.done():
                logger.warning(f"Resultado tardio ou desconhecido descartado: {action_id}")
                return
            result = {
                "ok": message_type == "action_completed" and message.get("ok") is True,
                "message": str(message.get("message", "")),
                "actionId": action_id,
                **{key: value for key, value in message.items() if key not in {"type", "ok", "message", "actionId", "version", "actionType"}},
            }
            metadata = pending_action_metadata.get(action_id, {})
            debug_log(
                "action_result",
                actionId=action_id,
                tool=metadata.get("tool"),
                sent_at=metadata.get("sent_at"),
                result_at=time.time(),
                ok=result["ok"],
                timeout=False,
            )
            future.set_result(result)

    @transport.event_handler("on_client_connected")
    async def on_client_connected(_transport, _client):
        nonlocal guard_task
        logger.info("Cliente conectado")
        context.add_message(
            {
                "role": "user",
                "content": "Cumprimente o aluno brevemente, apresente-se pelo nome Vitru e pergunte como pode ajudar. Nunca use o nome Alê ou Ale.",
            }
        )
        seeded_context = None
        if request_data:
            seeded_context = request_data.get("semanticSnapshot") or request_data.get("browserContext")
        if isinstance(seeded_context, dict):
            initial_snapshot = {
                "type": "page_context",
                "version": 0,
                "context": seeded_context,
            }
            context.set_messages(replace_page_snapshot(context.get_messages(), initial_snapshot))
        await worker.queue_frames([LLMRunFrame()])
        guard_task = asyncio.create_task(enforce_call_guards())

    @transport.event_handler("on_client_disconnected")
    async def on_client_disconnected(_transport, _client):
        logger.info("Cliente desconectado")
        if warmup:
            warmup.cancel()
        if guard_task:
            guard_task.cancel()
        await worker.cancel()

    runner = WorkerRunner(handle_sigint=False)
    await runner.add_workers(worker)
    await runner.run()


async def bot(runner_args: RunnerArguments):
    transport = await create_transport(runner_args, transport_params)
    request_data = runner_args.body if isinstance(runner_args.body, dict) else None
    await run_bot(transport, request_data)


if __name__ == "__main__":
    from pipecat.runner.run import main

    # O runner 1.7 não lê `PORT` por conta própria. Preserve uma flag explícita
    # do operador; caso contrário, converta a configuração do .env em CLI.
    if "--port" not in sys.argv:
        sys.argv.extend(["--port", os.getenv("PORT", "3001")])
    main()
