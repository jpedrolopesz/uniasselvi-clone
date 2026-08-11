import asyncio
import os
import json

from dotenv import load_dotenv
from loguru import logger
from pipecat.audio.vad.silero import SileroVADAnalyzer
from pipecat.frames.frames import LLMRunFrame
from pipecat.pipeline.pipeline import Pipeline
from pipecat.pipeline.worker import PipelineParams, PipelineWorker
from pipecat.processors.aggregators.llm_context import LLMContext
from pipecat.processors.aggregators.llm_response_universal import (
    LLMContextAggregatorPair,
    LLMUserAggregatorParams,
)
from pipecat.runner.types import RunnerArguments
from pipecat.runner.utils import create_transport
from pipecat.services.kokoro.tts import KokoroTTSService
from pipecat.services.ollama.llm import OLLamaLLMService
from pipecat.services.whisper.stt import MLXModel, WhisperSTTServiceMLX
from pipecat.transcriptions.language import Language
from pipecat.transports.base_transport import BaseTransport, TransportParams
from pipecat.workers.runner import WorkerRunner

load_dotenv(override=True)

STT_MODEL = os.getenv("STT_MODEL", MLXModel.LARGE_V3_TURBO_Q4.value)

SYSTEM_PROMPT = os.getenv(
    "ASSISTANT_SYSTEM_PROMPT",
    """
Você é Alê, assistente virtual por voz de uma instituição de ensino a distância.
Converse em português brasileiro de modo natural, acolhedor e objetivo.
Use frases curtas, sem markdown, listas longas ou linguagem de texto escrito.
Ajude com AVA, prazos, secretaria, financeiro, estágio, TCC e suporte básico.
Nunca invente datas, valores, notas ou dados do aluno. Nunca peça senha, CPF
completo ou dados de cartão. Quando não tiver acesso a um dado real, explique
isso com transparência e indique atendimento humano. Responda normalmente em
uma ou duas frases para reduzir a latência da conversa.
""".strip(),
)


def build_system_prompt(request_data: dict | None) -> str:
    """Acrescenta o contexto visual enviado pelo portal à conversa de voz."""
    if not request_data or request_data.get("surface") != "calendario":
        return SYSTEM_PROMPT

    suggestions = request_data.get("suggestions")
    if not isinstance(suggestions, list):
        suggestions = []

    calendar_context = json.dumps(suggestions[:20], ensure_ascii=False)
    return f"""{SYSTEM_PROMPT}

CONTEXTO DA TELA ATUAL
O aluno está no Calendário de Estudos. O portal já analisou avaliações, prazos e
horários livres e mostrou estas sugestões na janela do Vitru:
{calendar_context}

Converse sobre esse planejamento e explique datas e horários quando solicitado.
Não afirme que um horário foi salvo apenas pela fala: peça ao aluno para confirmar
o cartão visível na tela. Se não houver sugestões, diga que a análise ainda está
em andamento e ajude o aluno a explicar sua prioridade de estudo.
"""


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
    ),
}


async def run_bot(transport: BaseTransport, request_data: dict | None = None):
    logger.info("Iniciando agente local Pipecat")

    warmup = asyncio.create_task(prewarm_stt())

    stt = WhisperSTTServiceMLX(
        settings=WhisperSTTServiceMLX.Settings(
            model=STT_MODEL,
            language=Language.PT,
            temperature=0.0,
        ),
    )

    llm = OLLamaLLMService(
        base_url=f"{os.getenv('OLLAMA_BASE_URL', 'http://127.0.0.1:11434')}/v1",
        settings=OLLamaLLMService.Settings(
            model=os.getenv("LLM_MODEL", "llama3.2:latest"),
            system_instruction=build_system_prompt(request_data),
            temperature=0.6,
            max_tokens=300,
        ),
    )

    tts = KokoroTTSService(
        settings=KokoroTTSService.Settings(
            voice=os.getenv("KOKORO_VOICE", "pf_dora"),
            language=Language.PT,
        ),
    )

    context = LLMContext()
    user_aggregator, assistant_aggregator = LLMContextAggregatorPair(
        context,
        user_params=LLMUserAggregatorParams(
            vad_analyzer=SileroVADAnalyzer(),
        ),
    )

    pipeline = Pipeline(
        [
            transport.input(),
            stt,
            user_aggregator,
            llm,
            tts,
            transport.output(),
            assistant_aggregator,
        ]
    )

    worker = PipelineWorker(
        pipeline,
        params=PipelineParams(
            audio_in_sample_rate=16000,
            audio_out_sample_rate=24000,
            enable_metrics=True,
            enable_usage_metrics=True,
        ),
    )

    @transport.event_handler("on_client_connected")
    async def on_client_connected(_transport, _client):
        logger.info("Cliente conectado")
        context.add_message(
            {
                "role": "user",
                "content": "Cumprimente o aluno brevemente, apresente-se e pergunte como pode ajudar.",
            }
        )
        await worker.queue_frames([LLMRunFrame()])

    @transport.event_handler("on_client_disconnected")
    async def on_client_disconnected(_transport, _client):
        logger.info("Cliente desconectado")
        warmup.cancel()
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

    main()
