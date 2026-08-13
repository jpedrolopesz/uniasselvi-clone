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

### Janela de contexto do Ollama.app

A janela é configurada no servidor do Ollama, não no processo Pipecat. No macOS:

```bash
launchctl setenv OLLAMA_CONTEXT_LENGTH 8192
```

Depois, encerre e reinicie o Ollama.app. Durante uma chamada ativa, confirme com
`ollama ps`: a coluna `CONTEXT` deve mostrar `8192`. Nessa configuração o modelo
usa aproximadamente 3,1 GB de GPU, contra 2,5 GB com a janela de 4096.

Não coloque `num_ctx` no `.env` do Pipecat nem nas Settings do serviço. O endpoint
Ollama `/v1/chat/completions` ignora `options.num_ctx`, e
`OLLamaLLMService.Settings` não oferece `num_ctx`, `options` ou `extra_body`.

Para habilitar os logs estruturados de diagnóstico, defina `VITRU_DEBUG=1` no
ambiente do processo de voz.

O orquestrador padrão é o Amazon Nova Micro no Bedrock. O extra AWS e o cliente
CRT fazem parte do lock de produção:

```bash
UV_PROJECT_ENVIRONMENT=.venv-kokoro uv run --frozen \
  python -m pipecat_app.bot --port 3001
```

O fallback Ollama foi removido do pipeline de produção: no instrumento corrigido
ele marcou 29/60, contra 50/60 do Nova Micro. Se o Bedrock estiver indisponível,
o serviço devolve erro explícito em vez de degradar silenciosamente. O script do
conjunto dourado mantém Ollama apenas como diagnóstico informativo. O serviço
Bedrock usa `converse_stream`; os deltas chegam ao filtro e ao Kokoro durante a
resposta.

## Conjunto dourado semântico

O gate de CI executa 15 casos × 5 repetições. Com cerca de 1.900 tokens de
entrada por repetição, uma execução consome aproximadamente 142.500 tokens de
entrada; o custo monetário depende da tabela vigente da AWS e não é fixado aqui.
Nova falha abaixo de 76% ou navegação abaixo de 90%. O piso geral deixa quatro
pontos de margem sobre o baseline de 80% para não oscilar por uma única resposta,
sem aceitar a degradação de 55% observada anteriormente. Ollama é somente
diagnóstico local e não bloqueia o build.

Com o Ollama ativo e o modelo carregado, execute os 12 casos cinco vezes cada:

```bash
cd vitru/vitru-voice
PYTHONDONTWRITEBYTECODE=1 .venv-kokoro/bin/python scripts/golden_set.py
```

Para medir o Bedrock com e sem a ferramenta explícita de não agir:

```bash
UV_PROJECT_ENVIRONMENT=.venv-kokoro uv run --frozen \
  python scripts/golden_set.py --backend bedrock

UV_PROJECT_ENVIRONMENT=.venv-kokoro uv run --frozen \
  python scripts/golden_set.py --backend bedrock --without-responder-sem-acao
```

Para validar fixtures, imports e quantidade de execuções sem chamar o modelo:

```bash
PYTHONDONTWRITEBYTECODE=1 .venv-kokoro/bin/python scripts/golden_set.py --validate
```

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
- Modo selecionável por chamada: cascata (Whisper + Nova Micro + Kokoro) ou
  `amazon.nova-2-sonic-v1:0` speech-to-speech. O Sonic usa Carolina por padrão;
  altere `SONIC_VOICE=leo` para o teste de voz masculina.
- O Sonic recebe áudio PCM 16 kHz e devolve PCM 24 kHz. Atualizações do snapshot
  semanticamente único reconectam a conversa Sonic via `reset_conversation`,
  preservando o histórico e reenviando somente o snapshot de maior versão.
- Chamadas fecham após 60 s sem fala ou 10 min totais (`SONIC_IDLE_SECONDS` e
  `SONIC_MAX_CALL_SECONDS`). O log `sonic_usage` separa tokens de fala/texto e
  calcula custo acumulado com as tarifas configuradas para esta etapa.
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
