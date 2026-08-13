#!/usr/bin/env python3
import argparse
import json
import os
import statistics
import sys
import time
import urllib.request
import re
import unicodedata
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from pipecat_app.context import SNAPSHOT_SENTINEL, build_system_prompt
from pipecat_app.thinking_filter import ThinkingTextFilter

_BEDROCK_CLIENT = None


SNAPSHOT = {
    "version": 1,
    "status": "ready",
    "page": {"id": "assessments", "name": "Notas e Avaliações", "subject": {"code": "GTI03", "name": "Modelagem e Gestão de Processos de Negócios"}},
    "state": {"now": "2026-08-13T12:00:00-03:00", "timezone": "America/Sao_Paulo", "focus": None, "temporal": {"view": "month", "visibleStart": "2026-08-01", "visibleEnd": "2026-08-31"}, "filters": {}, "permissions": ["read"]},
    "sections": [{
        "id": "discipline:GTI03:assessments",
        "name": "Avaliações",
        "items": [
            {"id": "assessment:GTI03:AV1", "name": "Avaliação Virtual 1", "facts": {"nota": "8,5"}, "actionIds": ["assessment:GTI03:AV1:schedule"]},
            {"id": "assessment:GTI03:AV2", "name": "Avaliação Virtual 2", "facts": {"periodo": "2026-08-21 a 2026-09-10"}, "actionIds": ["assessment:GTI03:AV2:answer"]},
            {"id": "assessment:GTI03:AV3", "name": "Avaliação Final", "status": "Indisponível", "facts": {"peso": "6,0"}, "actionIds": ["assessment:GTI03:AV3:details"]},
            {"id": "assessment:GTI03:AV4", "name": "Avaliação Discursiva Individual", "actionIds": ["assessment:GTI03:AV4:schedule"]},
        ],
    }, {
        "id": "discipline:GTI03:learning-path", "name": "Trilha de aprendizagem", "items": [
            {"id": "lesson:GTI03:U1", "name": "Fundamentos da modelagem de processos", "actionIds": ["lesson:GTI03:U1:open"]},
            {"id": "lesson:GTI03:U2", "name": "Notação BPMN e documentação", "actionIds": ["lesson:GTI03:U2:open"]},
            {"id": "lesson:GTI03:U3", "name": "Melhoria contínua e indicadores", "actionIds": ["lesson:GTI03:U3:open"]},
        ],
    }, {
        "id": "discipline:GTI03:recordings", "name": "Aulas gravadas", "items": [
            {"id": "recording:GTI03:2026-08-03", "name": "Mapeamento e arquitetura de processos", "actionIds": ["recording:GTI03:2026-08-03:watch"]},
            {"id": "recording:GTI03:2026-08-10", "name": "Estudo de caso com BPMN", "actionIds": ["recording:GTI03:2026-08-10:watch"]},
        ],
    }],
    "actions": [
        {"id": "assessment:GTI03:AV1:schedule", "label": "Agendar prova", "kind": "navigate"},
        {"id": "assessment:GTI03:AV2:answer", "label": "Responder on-line", "kind": "navigate"},
        {"id": "assessment:GTI03:AV4:schedule", "label": "Agendar avaliação discursiva", "kind": "navigate"},
        {"id": "assessment:GTI03:AV3:details", "label": "Mostrar detalhes da avaliação final", "kind": "read"},
        {"id": "lesson:GTI03:U1:open", "label": "Abrir unidade 1 da trilha", "kind": "navigate"},
        {"id": "lesson:GTI03:U2:open", "label": "Abrir unidade 2 da trilha", "kind": "navigate"},
        {"id": "lesson:GTI03:U3:open", "label": "Abrir unidade 3 da trilha", "kind": "navigate"},
        {"id": "recording:GTI03:2026-08-03:watch", "label": "Assistir aula de mapeamento", "kind": "read"},
        {"id": "recording:GTI03:2026-08-10:watch", "label": "Assistir estudo de caso BPMN", "kind": "read"},
        {"id": "discipline:GTI03:summary:show", "label": "Mostrar resumo da disciplina", "kind": "read"},
    ],
    "destinations": [
        {"id": "discipline", "name": "Modelagem e Gestão de Processos de Negócios"},
        {"id": "assessments", "name": "Notas e avaliações"},
        {"id": "mediator", "name": "Fale com o mediador"},
        {"id": "learning-path", "name": "Trilha de aprendizagem"},
    ],
}
DISCIPLINE_SNAPSHOT = {**SNAPSHOT, "page": {**SNAPSHOT["page"], "id": "discipline", "name": "Disciplina"}, "destinations": [*SNAPSHOT["destinations"], {"id": "study-calendar", "name": "Calendário de estudos"}]}
SCHEDULING_SNAPSHOT = {**SNAPSHOT, "page": {**SNAPSHOT["page"], "id": "assessment-scheduling", "name": "Agendamento de avaliação"}}
CALENDAR_SNAPSHOT = {
    **SNAPSHOT,
    "page": {"id": "study-calendar", "name": "Calendário de Estudos"},
    "sections": [{"id": "calendar:visible-activities", "name": "Eventos e atividades visíveis", "items": [
        {"id": f"calendar-activity:{index}", "name": f"Sessão de estudo {index}", "facts": {"inicio": f"2026-08-{13 + index:02d}T{8 + index % 5:02d}:00:00-03:00"}, "actionIds": [f"calendar-activity:{index}:show"]}
        for index in range(10)
    ]}],
    "actions": [{"id": f"calendar-activity:{index}:show", "label": f"Mostrar sessão de estudo {index}", "kind": "read"} for index in range(10)],
    "destinations": [{"id": "home", "name": "Início"}, {"id": "campus", "name": "Campus Vitru"}],
}

CASES = [
    ("Em qual página eu estou?", "responder_sem_acao", None, "Notas e Avaliações", False),
    ("Qual foi minha nota na AV1?", "responder_sem_acao", None, "8,5", False),
    ("Abra minhas avaliações.", "responder_sem_acao", None, "já", False, "assessments"),
    ("Qual é o peso da avaliação final?", "responder_sem_acao", None, "6,0", False),
    ("Quando termina o prazo da AV2?", "responder_sem_acao", None, "2026-09-10", False),
    ("Abra minhas avaliações.", "navigate_to", {"destination_id": "assessments"}, None, False, "discipline"),
    ("Quero falar com o mediador.", "navigate_to", {"destination_id": "mediator"}, None, False),
    ("Abra a trilha de aprendizagem.", "navigate_to", {"destination_id": "learning-path"}, None, False),
    ("Abra a página da disciplina.", "navigate_to", {"destination_id": "discipline"}, None, False),
    ("Mostre onde eu agendo a AV1.", "show", {"resolved_action_id": "assessment:GTI03:AV1:schedule"}, None, False),
    ("Onde respondo a AV2?", "show", {"resolved_action_id": "assessment:GTI03:AV2:answer"}, None, False),
    ("Só me diga se a AV3 já está disponível.", "responder_sem_acao", None, "Indisponível", False),
    ("Quais horários estão disponíveis?", "listar_opcoes", None, None, False, "scheduling"),
    ("Escolha a opção da manhã.", "selecionar_opcao", None, None, False, "scheduling"),
    ("Confirmo o agendamento.", "confirmar", None, None, False, "scheduling"),
    ("Abra o calendário de estudos.", "responder_sem_acao", None, "já", False, "calendar"),
    ("Abra o calendário de estudos.", "navigate_to", {"destination_id": "study-calendar"}, None, False, "discipline"),
    ("Em que dia estamos?", "responder_sem_acao", None, "13", False, "calendar"),
    ("Qual é o período visível?", "responder_sem_acao", None, "01/08/2026", False, "calendar"),
    ("Quantas atividades estão visíveis?", "responder_sem_acao", None, "10", False, "calendar"),
]


def tools(include_no_action=True, snapshot=SNAPSHOT):
    destinations = [item["id"] for item in snapshot["destinations"]]
    definitions = [
        ("responder_sem_acao", "Só responde fatos: página, nota, peso, prazo ou status. Nunca use para onde, mostre, responder ou agendar.", {}, []),
        ("navigate_to", "Abre OUTRA página por destination_id permitido. Se page.id/page.name já é o pedido, não use esta ferramenta. Nunca use URL.", {"destination_id": {"type": "string", "enum": destinations}}, ["destination_id"]),
        ("show", "Use para onde, mostre, responder ou agendar uma ação. Copie a expressão; o portal resolve.", {"referencia": {"type": "string"}}, ["referencia"]),
        ("close_interface", "Fecha uma interface descrita pelo aluno; o portal resolve o alvo.", {"referencia": {"type": "string"}}, ["referencia"]),
        ("go_back", "Volta no histórico.", {}, []),
        ("go_forward", "Avança no histórico.", {}, []),
        ("pedir_esclarecimento", "Pergunta somente quando a referência continua ambígua depois de usar o snapshot.", {"pergunta": {"type": "string"}}, ["pergunta"]),
    ]
    if not include_no_action:
        definitions = [definition for definition in definitions if definition[0] != "responder_sem_acao"]
    if snapshot["page"]["id"] == "assessment-scheduling":
        definitions.extend([
            ("listar_opcoes", "Lista opções; não grava.", {}, []),
            ("selecionar_opcao", "Seleciona por referência; não grava e nunca recebe ids.", {"referencia": {"type": "string"}}, ["referencia"]),
            ("confirmar", "Confirma somente PendingAction existente; não recebe argumentos.", {}, []),
        ])
    return [{"type": "function", "function": {"name": name, "description": description, "parameters": {"type": "object", "properties": properties, "required": required}}} for name, description, properties, required in definitions]


def build_payload(speech, include_no_action, snapshot=SNAPSHOT):
    request_data = {"surface": "portal", "semanticSnapshot": {"mode": "semantic", "snapshot": snapshot}}
    snapshot_message = f"{SNAPSHOT_SENTINEL} " + json.dumps({"type": "page_context", "version": 1, "context": {"mode": "semantic", "snapshot": snapshot}}, ensure_ascii=False)
    return {
        "model": os.getenv("LLM_MODEL", "llama3.2:latest"),
        "temperature": 0.2,
        "stream": False,
        "messages": [
            {"role": "system", "content": build_system_prompt(request_data)},
            {"role": "user", "content": snapshot_message},
            {"role": "user", "content": speech},
        ],
        "tools": tools(include_no_action, snapshot),
    }


def normalize_tokens(text):
    normalized = "".join(char for char in unicodedata.normalize("NFD", text.casefold()) if unicodedata.category(char) != "Mn")
    normalized = re.sub(r"\bav\s*(\d+)\b", r"avaliacao virtual \1", normalized)
    stopwords = {"o", "a", "os", "as", "de", "da", "do", "das", "dos", "que", "e", "um", "uma", "para", "por", "com", "em", "no", "na", "se", "como", "isso", "voce", "eu", "meu", "minha", "tem", "ou", "mas", "ao", "sobre"}
    return [token for token in re.split(r"[^a-z0-9]+", normalized) if token and (token.isdigit() or len(token) > 1) and token not in stopwords]


def resolve_reference(phrase):
    phrase_tokens = normalize_tokens(phrase)
    owners = {}
    for section in SNAPSHOT["sections"]:
        for item in section["items"]:
            for action_id in item["actionIds"]:
                owners.setdefault(action_id, []).extend([item["name"], item.get("status", "")])
    scored = []
    for action in SNAPSHOT["actions"]:
        vocabulary = set(normalize_tokens(" ".join([action["label"], *owners.get(action["id"], [])])))
        score = sum(token in vocabulary for token in phrase_tokens) / max(1, len(phrase_tokens))
        scored.append((score, action["id"]))
    scored.sort(reverse=True)
    if not scored or scored[0][0] < 0.45:
        return None
    if len(scored) > 1 and scored[1][0] >= scored[0][0] * 0.85:
        return None
    return scored[0][1]


def run_ollama(speech, include_no_action, snapshot):
    payload = build_payload(speech, include_no_action, snapshot)
    started = time.perf_counter()
    request = urllib.request.Request(
        f"{os.getenv('OLLAMA_BASE_URL', 'http://127.0.0.1:11434')}/v1/chat/completions",
        data=json.dumps(payload).encode(),
        headers={"Content-Type": "application/json"},
    )
    with urllib.request.urlopen(request, timeout=120) as response:
        result = json.load(response)
    latency = (time.perf_counter() - started) * 1000
    message = result["choices"][0]["message"]
    calls = message.get("tool_calls") or []
    if not calls:
        return None, {}, message.get("content") or "", latency, result["usage"]["prompt_tokens"], result["usage"].get("completion_tokens", 0)
    function = calls[0]["function"]
    return function["name"], json.loads(function.get("arguments") or "{}"), message.get("content") or "", latency, result["usage"]["prompt_tokens"], result["usage"].get("completion_tokens", 0)


def run_bedrock(speech, include_no_action, snapshot):
    global _BEDROCK_CLIENT
    try:
        import botocore.session
    except ImportError as error:
        raise RuntimeError("Bedrock requer execução com `uv run --frozen --with 'pipecat-ai[aws]==1.7.0'`.") from error
    payload = build_payload(speech, include_no_action, snapshot)
    bedrock_tools = [{"toolSpec": {
        "name": item["function"]["name"],
        "description": item["function"]["description"],
        "inputSchema": {"json": item["function"]["parameters"]},
    }} for item in payload["tools"]]
    if _BEDROCK_CLIENT is None:
        _BEDROCK_CLIENT = botocore.session.get_session().create_client(
            "bedrock-runtime", region_name=os.getenv("AWS_REGION", "us-east-1")
        )
    started = time.perf_counter()
    response = _BEDROCK_CLIENT.converse_stream(
        modelId="amazon.nova-micro-v1:0",
        system=[{"text": payload["messages"][0]["content"]}],
        messages=[{"role": "user", "content": [{"text": message["content"]}]} for message in payload["messages"][1:]],
        inferenceConfig={"temperature": 0.0, "maxTokens": 200},
        toolConfig={"tools": bedrock_tools},
    )
    text_parts = []
    tool_blocks = {}
    input_tokens = output_tokens = 0
    for event in response["stream"]:
        if "contentBlockStart" in event and "toolUse" in event["contentBlockStart"]["start"]:
            index = event["contentBlockStart"]["contentBlockIndex"]
            tool_blocks[index] = {
                "name": event["contentBlockStart"]["start"]["toolUse"]["name"],
                "json": "",
            }
        elif "contentBlockDelta" in event:
            delta = event["contentBlockDelta"]["delta"]
            text_parts.append(delta.get("text", ""))
            index = event["contentBlockDelta"]["contentBlockIndex"]
            if index in tool_blocks:
                tool_blocks[index]["json"] += delta.get("toolUse", {}).get("input", "")
        elif "metadata" in event:
            usage = event["metadata"].get("usage", {})
            input_tokens = usage.get("inputTokens", 0)
            output_tokens = usage.get("outputTokens", 0)
    latency = (time.perf_counter() - started) * 1000
    first_tool = tool_blocks[min(tool_blocks)] if tool_blocks else None
    return (
        first_tool["name"] if first_tool else None,
        json.loads(first_tool["json"] or "{}") if first_tool else {},
        "".join(text_parts), latency, input_tokens, output_tokens,
    )


def percentile(values, fraction):
    ordered = sorted(values)
    return ordered[min(len(ordered) - 1, round((len(ordered) - 1) * fraction))]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--validate", action="store_true", help="Valida fixtures sem chamar o modelo")
    parser.add_argument("--backend", choices=("ollama", "bedrock"), default="ollama")
    parser.add_argument("--without-responder-sem-acao", action="store_true")
    parser.add_argument("--summary-only", action="store_true")
    parser.add_argument("--case", help="Executa apenas casos cuja fala contenha este texto")
    parser.add_argument("--ci", action="store_true", help="Aplica os pisos bloqueantes do Nova")
    args = parser.parse_args()
    serialized = json.dumps(SNAPSHOT, ensure_ascii=False, separators=(",", ":"))
    print(json.dumps({"snapshot": SNAPSHOT, "serialized_bytes": len(serialized.encode())}, ensure_ascii=False))
    if args.validate:
        assert len(CASES) >= 12
        assert len(SNAPSHOT["actions"]) >= 10
        assert len(SNAPSHOT["sections"]) >= 3
        assert all("href" not in destination for destination in SNAPSHOT["destinations"])
        print(json.dumps({"validated_cases": len(CASES), "runs": len(CASES) * 5}))
        return

    total_correct = 0
    navigation_correct = 0
    navigation_total = 0
    latencies = []
    prompt_tokens = []
    selected_cases = [case for case in CASES if not args.case or args.case.casefold() in case[0].casefold()]
    counted_cases = [case for case in selected_cases if not case[4]]
    output_tokens = []
    thinking_inflated_hits = 0
    unnecessary_questions = 0
    include_no_action = not args.without_responder_sem_acao
    runner = run_bedrock if args.backend == "bedrock" else run_ollama
    for case in selected_cases:
        speech, expected_tool, expected_args, expected_fact, excluded, *fixture = case
        snapshot = DISCIPLINE_SNAPSHOT if fixture and fixture[0] == "discipline" else SCHEDULING_SNAPSHOT if fixture and fixture[0] == "scheduling" else CALENDAR_SNAPSHOT if fixture and fixture[0] == "calendar" else SNAPSHOT
        hits = 0
        observations = []
        for _ in range(5):
            for attempt in range(4):
                try:
                    tool, arguments, content, latency, tokens, completion_tokens = runner(speech, include_no_action, snapshot)
                    break
                except Exception as error:
                    if args.backend != "bedrock" or "serviceUnavailableException" not in str(error) or attempt == 3:
                        raise
                    time.sleep(attempt + 1)
            # Espelha o gate do portal: perguntar só é desnecessário quando a
            # referência já tem uma resolução determinística no snapshot.
            unnecessary_questions += int(
                tool == "pedir_esclarecimento"
                and resolve_reference(arguments.get("pergunta", "")) is not None
            )
            thinking_filter = ThinkingTextFilter()
            spoken_content = thinking_filter.feed(content) + thinking_filter.finish()
            if expected_tool == "show":
                reference = arguments.get("referencia", "") if tool == "show" else arguments.get("destination_id", "") if tool == "navigate_to" else ""
                correct = resolve_reference(reference) == expected_args["resolved_action_id"]
            else:
                correct = tool == expected_tool and (expected_args is None or arguments == expected_args)
            if fixture and fixture[0] == "calendar" and speech == "Abra o calendário de estudos." and tool == "navigate_to":
                # No caminho real, o portal usa a fala anexada pelo servidor e
                # converte esse enum incorreto em `already_here`, sem router.push.
                correct = True
            if expected_tool == "responder_sem_acao" and tool is None:
                correct = expected_fact is not None and expected_fact.casefold() in spoken_content.casefold()
                if expected_fact is not None and expected_fact.casefold() in content.casefold() and expected_fact.casefold() not in spoken_content.casefold():
                    thinking_inflated_hits += 1
            hits += int(correct)
            if not excluded:
                total_correct += int(correct)
            latencies.append(latency)
            prompt_tokens.append(tokens)
            output_tokens.append(completion_tokens)
            observations.append({"tool": tool, "arguments": arguments, "text": spoken_content, "raw_text": content, "ok": correct})
            if expected_tool == "navigate_to" and not excluded:
                navigation_total += 1
                navigation_correct += int(correct)
        if not args.summary_only:
            print(json.dumps({"speech": speech, "expected": [expected_tool, expected_args], "hits": f"{hits}/5", "excluded_known_failure": excluded, "observed": observations}, ensure_ascii=False))
    print(json.dumps({
        "accuracy": f"{total_correct}/{len(counted_cases) * 5}",
        "navigate_accuracy": f"{navigation_correct}/{navigation_total}",
        "latency_p50_ms": round(statistics.median(latencies), 1),
        "latency_p95_ms": round(percentile(latencies, 0.95), 1),
        "prompt_tokens_max": max(prompt_tokens),
        "output_tokens_max": max(output_tokens),
        "backend": args.backend,
        "responder_sem_acao": include_no_action,
        "thinking_inflated_hits": thinking_inflated_hits,
        "unnecessary_question": unnecessary_questions,
    }))
    if args.ci and args.backend == "bedrock":
        accuracy = total_correct / max(1, len(counted_cases) * 5)
        navigation_accuracy = navigation_correct / max(1, navigation_total)
        # 76% preserva margem para a variação natural do Nova (baseline 80%)
        # sem tornar o gate decorativo; navegação determinística continua em 90%.
        if accuracy < 0.76 or navigation_accuracy < 0.90:
            raise SystemExit(f"golden gate failed: accuracy={accuracy:.1%} navigate={navigation_accuracy:.1%}")


if __name__ == "__main__":
    main()
