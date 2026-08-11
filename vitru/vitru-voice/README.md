# Voice AI com Pipecat

Agente de voz em português brasileiro para atendimento de alunos EAD.

```text
WebRTC → Silero VAD → Whisper MLX → Ollama → Kokoro → WebRTC
```

## Componentes

- Pipecat: pipeline, WebRTC, turnos, contexto, métricas e interrupções.
- Silero VAD: detecção local de início e fim da fala.
- Whisper `large-v3-turbo-q4`: STT local otimizado para Apple Silicon pelo MLX.
- Ollama `llama3.2:latest`: modelo de linguagem local.
- Kokoro `pf_dora`: síntese de voz local em português.

Todos os modelos rodam localmente e nenhuma chave de API é necessária. Apenas a
primeira execução precisa de internet para baixar os modelos.

## Instalação

```bash
python3.12 -m venv .venv-kokoro
UV_PROJECT_ENVIRONMENT=.venv-kokoro uv sync --python python3.12
ollama pull llama3.2
```

## Configuração

Copie `.env.example` para `.env` e configure:

```env
STT_MODEL=mlx-community/whisper-large-v3-turbo-q4

OLLAMA_BASE_URL=http://127.0.0.1:11434
LLM_MODEL=llama3.2:latest

KOKORO_VOICE=pf_dora
```

O prompt pode ser sobrescrito por `ASSISTANT_SYSTEM_PROMPT`.

## Executar

Confirme que o Ollama está ativo e execute:

```bash
npm start
```

Na primeira execução, aguarde o download do Whisper (aproximadamente 460 MB).
Nas próximas execuções, ele será carregado do cache local e pré-aquecido assim
que a sessão abre, antes da primeira fala do aluno.

Para o Ollama não descarregar o modelo entre turnos, suba o servidor com
`OLLAMA_KEEP_ALIVE=-1 ollama serve`.

Abra `http://localhost:3001`, autorize o microfone e conecte-se ao agente.

Se a porta estiver ocupada:

```bash
lsof -nP -iTCP:3001 -sTCP:LISTEN
kill PID_ENCONTRADO
npm start
```

## Estrutura principal

```text
pipecat_app/bot.py  pipeline Pipecat
pyproject.toml      dependências Python
uv.lock             versões reproduzíveis
.env.example        configuração segura de exemplo
src/                implementação Node anterior (fallback)
```

Para executar a implementação Node anterior:

```bash
npm run start:legacy
```

## Estado atual

- Canal web por WebRTC.
- Interrupção de fala gerenciada pelo Pipecat/Silero.
- STT Whisper MLX local segmentado pelo Silero VAD, sem chave de API.
- Sem persistência, dashboard ou integração acadêmica real.

## Latência

Medições num MacBook Air M2 de 16 GB, com 5,4 s de fala em pt-BR:

| Estágio            | Antes (Voxtral 4B) | Depois (Whisper turbo-q4) |
| ------------------ | ------------------ | ------------------------- |
| VAD `stop_secs`    | 200 ms             | 200 ms                    |
| STT                | 13.200–39.600 ms   | ~1.325 ms                 |
| LLM (TTFT)         | 186–426 ms         | 186–426 ms                |
| TTS (TTFB)         | 1.100–1.850 ms     | 1.100–1.850 ms            |
| **Até o 1º áudio** | **~15–42 s**       | **~2,8–3,8 s**            |

O pipeline é serial e os três modelos disputam a mesma GPU, então espaço livre
em disco importa: sob pressão de swap as latências de STT chegaram a triplicar.
O próximo gargalo é o TTFB do Kokoro.
