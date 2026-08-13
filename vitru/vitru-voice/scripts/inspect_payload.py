#!/usr/bin/env python3
import json
import os
import urllib.request
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from pipecat_app.context import build_system_prompt, replace_page_snapshot


browser_context = {
    "page": {"name": "Disciplinas", "pathname": "/disciplinas/GTI03"},
    "title": "Disciplina",
    "visibleComponents": [
        {
            "target": f"accessible:button:Abrir material complementar da unidade {index} de Fundamentos de Sistemas de Informação",
            "role": "button",
            "name": f"Abrir material complementar da unidade {index} de Fundamentos de Sistemas de Informação",
            "disabled": False,
        }
        for index in range(1, 41)
    ],
}
request_data = {
    "surface": "portal",
    "browserContext": browser_context,
    "navigationDestinations": [{"name": "Início", "href": "/"}],
}
messages = replace_page_snapshot(
    [{"role": "user", "content": "Cumprimente o aluno brevemente."}],
    {"type": "page_context", "version": 0, "context": browser_context},
)
payload = {
    "model": os.getenv("LLM_MODEL", "llama3.2:latest"),
    "stream": False,
    "messages": [{"role": "system", "content": build_system_prompt(request_data)}, *messages],
    "tools": [
        {
            "type": "function",
            "function": {
                "name": name,
                "description": description,
                "parameters": {
                    "type": "object",
                    "properties": properties,
                    "required": required,
                },
            },
        }
        for name, description, properties, required in [
            ("navigate_to", "Abre uma rota interna segura do portal.", {"href": {"type": "string", "description": "Href interno iniciado por /"}}, ["href"]),
            ("go_back", "Volta para a página anterior do histórico do navegador.", {}, []),
            ("go_forward", "Avança para a próxima página do histórico do navegador.", {}, []),
            ("highlight_component", "Rola até um componente visível e o destaca para o aluno.", {"target": {"type": "string", "description": "Target exato informado no contexto visual"}}, ["target"]),
            ("close_interface", "Fecha modal ou região que tenha um botão seguro Fechar, Cancelar ou Voltar.", {"target": {"type": "string", "description": "Target exato do contêiner visível"}}, ["target"]),
        ]
    ],
}
print(json.dumps(payload, ensure_ascii=False, indent=2))

request = urllib.request.Request(
    f"{os.getenv('OLLAMA_BASE_URL', 'http://127.0.0.1:11434')}/v1/chat/completions",
    data=json.dumps(payload).encode(),
    headers={"Content-Type": "application/json"},
)
with urllib.request.urlopen(request, timeout=120) as response:
    result = json.load(response)
print(json.dumps({"prompt_tokens": result["usage"]["prompt_tokens"]}))
