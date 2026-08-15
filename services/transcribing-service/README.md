# vitru-rag-service

Serviço Next.js (App Router + TypeScript) que ingere transcrições de aulas do
YouTube (legendas automáticas via `yt-dlp`), as embeda em pgvector e serve um
endpoint de RAG para tirada de dúvidas dos alunos, **com citação no minuto exato
da aula**.

## Pipeline

```
POST /api/ingest        → enfileira o vídeo (não processa inline)
POST /api/worker/process → cron: baixa legenda, limpa, chunka, embeda, grava
POST /api/ask           → pergunta do aluno → retrieve + LLM + fontes citadas
```

Estágios internos: `fetchAutoSubs` (yt-dlp json3) → `parseJson3` (dedup rolante)
→ `chunkByTime` (janela temporal + overlap + timestamps) → `embed` → `upsertChunks`.

## Os três gotchas tratados

1. **Legenda não existe no upload** — o YouTube leva minutos/horas pra gerar o
   ASR. Por isso `/api/ingest` só *enfileira*; o worker tenta e, se não houver
   legenda ainda (`CaptionsNotReadyError`), reagenda com backoff
   (5→15→30→60→120→240→360→720 min, até `MAX_ATTEMPTS`).
2. **Duplicação de legendas rolantes** — baixamos em `json3` (não VTT) e
   deduplicamos em `parseJson3` (janela dos últimos 8 segmentos).
3. **Sem pontuação / erro de ASR** — chunk por tempo (não por frase) com
   overlap; o prompt do `/api/ask` avisa o LLM que o texto é de legenda
   automática. (Re-pontuação via LLM antes de embedar fica como roadmap.)

## Pré-requisitos

- **Node.js 18+**
- **Binário `yt-dlp`** instalado no host (`pip install yt-dlp` ou `brew install yt-dlp`)
- **Postgres com a extensão `pgvector`**

## Setup

```bash
npm install
cp .env.example .env        # preencha DATABASE_URL e as chaves
psql "$DATABASE_URL" -f db/schema.sql
npm run dev
```

`tsconfig.json` precisa do alias `@/*` → raiz (padrão do Next):
```json
{ "compilerOptions": { "paths": { "@/*": ["./*"] } } }
```

## Uso

```bash
# 1. enfileirar uma aula
curl -X POST localhost:3000/api/ingest \
  -H 'content-type: application/json' \
  -d '{"videoId":"dQw4w9WgXcQ","course":"engenharia","materia":"calculo-1"}'

# 2. rodar o worker (normalmente via cron a cada ~10 min)
curl -X POST localhost:3000/api/worker/process

# 3. perguntar
curl -X POST localhost:3000/api/ask \
  -H 'content-type: application/json' \
  -d '{"question":"como funciona a regra da cadeia?","materia":"calculo-1"}'
```

Resposta do `/api/ask` inclui `sources[]` com `url` já no timestamp
(`...&t=872s`) — o aluno pula direto pro ponto da aula.

## ⚠️ Restrição de deploy (importante)

`yt-dlp` é um binário nativo e o worker é longo → **não roda em serverless/edge
da Vercel** (sem binário, limite de tempo). Opções:

- App em qualquer host, **worker em container/VM** com `yt-dlp` instalado
  (Railway, Render, Fly.io, ou uma VM), agendado por cron.
- Ou rode `app/api/worker/process` como um processo Node dedicado.

`/api/ingest` e `/api/ask` podem ficar em serverless; só o **worker** precisa do
host com `yt-dlp`. Todas as rotas já fixam `export const runtime = "nodejs"`.

## Como encaixa no projeto Vitru

- **`materia` = namespace do retrieval.** A comunidade `/r/calculo-1` filtra o
  RAG para o corpus daquela matéria (passe `materia` no `/api/ask`).
- **Citação com timestamp** = o racional verificável (o agente não responde, ele
  leva o aluno ao minuto exato da aula).
- **Desacoplamento por estágio** = trocar o modelo de embedding re-embeda sem
  re-baixar legenda (o `model_version` versiona os chunks).

## Trocar de modelo/dimensão

`text-embedding-3-small` → `vector(1536)`. Se usar um modelo local (ex.
`nomic-embed-text`, dim 768), ajuste a coluna `embedding vector(768)` no
`db/schema.sql` **antes** de ingerir.

> Nota: este código foi escrito para ser adaptado, não executado no ambiente de
> geração — rode os passos de setup acima no seu host.
