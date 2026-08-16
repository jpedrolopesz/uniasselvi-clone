# Backend — Vitru AVA

> Documentação completa das API Routes, módulos de negócio, schemas de banco e contratos de request/response.

---

## 1. Visão Geral

O backend roda como **Next.js API Routes** (serverless). Cada endpoint é um arquivo em `app/api/v1/*/route.ts` que exporta funções `GET`, `POST`, `PATCH`, `DELETE`.

```
Requisição HTTP → API Route → Módulo de Negócio (lib/) → Banco (Aurora/PGlite) → Resposta JSON
```

**Stack do backend:**
- **Runtime:** Node.js 20 (serverless)
- **Framework:** Next.js 16 (App Router)
- **ORM:** Drizzle ORM (type-safe, SQL-first)
- **Banco:** Aurora Serverless v2 (PostgreSQL 16) / PGlite (dev)
- **IA Texto:** Salesforce Agentforce (Agent API v62.0)
- **IA Voz:** Amazon Nova Sonic (Bedrock, speech-to-speech)
- **CRM:** Salesforce Education Cloud (REST API v62.0)

---

## 2. Mapa de Endpoints

| Método | Endpoint | Módulo | Descrição |
|--------|---------|--------|-----------|
| GET | `/api/v1/profile?studentId=` | Profile | Retorna perfil completo do aluno |
| POST | `/api/v1/profile` | Profile | Cria perfil (onboarding completo) |
| PATCH | `/api/v1/profile` | Profile | Atualiza parcialmente (por step) |
| GET | `/api/v1/recommend?studentId=` | Recommender | Recomendações de estudo |
| GET | `/api/v1/recommend?studentId=&generate=true` | Recommender | Recomendações + conteúdo IA |
| GET | `/api/v1/risk-score?studentId=` | Risk Score | Score atual + histórico + tendência |
| POST | `/api/v1/risk-score` | Risk Score | Recalcula score de um aluno |
| GET | `/api/v1/community?studentId=` | Community | Grupos recomendados (matching) |
| GET | `/api/v1/community?action=groups` | Community | Lista todos os grupos ativos |
| GET | `/api/v1/community?action=my&studentId=` | Community | Grupos do aluno |
| POST | `/api/v1/community` | Community | Entrar ou sair de grupo |
| POST | `/api/v1/salesforce/sync` | Salesforce | Força sincronização → SF |
| POST | `/api/v1/salesforce/webhook` | Salesforce | Recebe eventos do Salesforce |
| POST | `/api/v1/vitru/chat` | Vitru | Assistente IA conversacional |

---

## 3. Contratos de API (Request/Response)

### 3.1 Profile API

**Arquivo:** `app/api/v1/profile/route.ts`  
**Módulo de negócio:** `lib/profile/learning-profile.ts`  
**Tabela:** `vitru.learning_profiles`

#### GET /api/v1/profile

```
Request:  GET /api/v1/profile?studentId=uuid-do-aluno
Response: 200 OK
{
  "ok": true,
  "profile": {
    "studentId": "uuid",
    "varkScores": { "visual": 80, "auditory": 40, "reading": 60, "kinesthetic": 90 },
    "primaryStyle": "kinesthetic",
    "schedule": {
      "worksFullTime": true,
      "workDays": [1,2,3,4,5],
      "workStartTime": "08:00",
      "workEndTime": "18:00",
      "preferredStudyTimes": [{"weekday":1,"startTime":"19:00","endTime":"21:00"}],
      "sessionDurationMinutes": 45
    },
    "goals": {
      "primaryMotivation": "career_advancement",
      "careerObjective": "Ser gerente de TI",
      "shortTermGoal": null,
      "expectedGraduationYear": 2027
    },
    "challenges": {
      "reportedDifficulties": ["time_management", "isolation"],
      "strongSubjects": [],
      "weakSubjects": ["CALC1"],
      "preferredContentFormats": ["video", "flashcards"]
    },
    "interests": {
      "categories": ["empresa_junior", "networking"],
      "skills": ["programacao", "marketing"],
      "openToMentoring": true,
      "openToNetworking": true
    },
    "completeness": 85,
    "createdAt": "2025-08-01T10:00:00Z",
    "updatedAt": "2025-08-10T15:30:00Z"
  }
}
```

#### POST /api/v1/profile

```
Request:  POST /api/v1/profile
Body:
{
  "studentId": "uuid",
  "varkScores": { "visual": 80, "auditory": 40, "reading": 60, "kinesthetic": 90 },
  "schedule": { "worksFullTime": true, "preferredStudyTimes": [...], "sessionDurationMinutes": 45 },
  "goals": { "primaryMotivation": "career_advancement", "careerObjective": "..." },
  "challenges": { "reportedDifficulties": ["time_management"], "preferredContentFormats": ["video"] },
  "interests": { "categories": ["empresa_junior"], "skills": ["marketing"], "openToMentoring": true }
}

Response: 201 Created
{ "ok": true, "completeness": 85, "primaryStyle": "kinesthetic" }
```

#### PATCH /api/v1/profile

```
Request:  PATCH /api/v1/profile
Body:
{
  "studentId": "uuid",
  "step": "learning_style",    // learning_style | routine | goals | challenges | community
  "data": { "visual": 80, "auditory": 40, "reading": 60, "kinesthetic": 90 }
}

Response: 200 OK
{ "ok": true, "step": "learning_style", "completeness": 25 }
```

---

### 3.2 Recommend API

**Arquivo:** `app/api/v1/recommend/route.ts`  
**Módulo de negócio:** `lib/recommender/study-recommender.ts`  
**Integração:** AWS Bedrock (quando `generate=true`)

#### GET /api/v1/recommend

```
Request:  GET /api/v1/recommend?studentId=uuid&generate=true
Response: 200 OK
{
  "ok": true,
  "hasProfile": true,
  "studentId": "uuid",
  "generatedAt": "2025-08-15T10:00:00Z",
  "prioritizedSubjects": [
    {
      "subjectCode": "CALC1",
      "subjectName": "Cálculo I",
      "score": 75,
      "reasons": ["Avaliação em 3 dia(s)", "Nota atual: 5.2"],
      "nextDeadline": "2025-09-01",
      "currentGrade": 5.2,
      "suggestedHoursPerWeek": 6
    }
  ],
  "suggestedMethods": [
    {
      "type": "mind_mapping",
      "name": "Mapas Mentais",
      "description": "Organize conceitos em diagrama visual.",
      "estimatedEfficiency": 0.9
    }
  ],
  "contentFormats": ["video", "flashcards", "infographic"],
  "adaptiveContent": {
    "format": "flashcards",
    "title": "Cálculo I — Conteúdo Adaptativo",
    "content": "1. Frente: O que é derivada? | Verso: Taxa de variação instantânea..."
  },
  "tips": [
    "Use cores diferentes para categorizar informações.",
    "Use a técnica Pomodoro para manter consistência."
  ]
}
```

---

### 3.3 Risk Score API

**Arquivo:** `app/api/v1/risk-score/route.ts`  
**Módulo de negócio:** `lib/risk-score/calculate.ts`  
**Tabelas:** `vitru.risk_scores`, `vitru.engagement_snapshots`

#### GET /api/v1/risk-score

```
Request:  GET /api/v1/risk-score?studentId=uuid
Response: 200 OK
{
  "ok": true,
  "hasScore": true,
  "currentScore": {
    "score": 62,
    "level": "high",
    "factors": [
      { "name": "Frequência de Acesso", "weight": 0.25, "value": 70, "contribution": 18, "description": "Último acesso há 8d, 3 acessos em 14 dias" },
      { "name": "Desempenho Acadêmico", "weight": 0.20, "value": 75, "contribution": 15, "description": "Média 5.2, 40% entregas no prazo" },
      { "name": "Progresso na Trilha", "weight": 0.15, "value": 60, "contribution": 9, "description": "Progresso: 30%" },
      { "name": "Engajamento Social", "weight": 0.15, "value": 35, "contribution": 5, "description": "0 grupo(s)" },
      { "name": "Situação Financeira", "weight": 0.10, "value": 80, "contribution": 8, "description": "Pendências financeiras" },
      { "name": "Disciplinas em Risco", "weight": 0.15, "value": 45, "contribution": 7, "description": "2 de 5 abaixo da média" }
    ],
    "calculatedAt": "2025-08-15T02:00:00Z",
    "syncedToSalesforce": "2025-08-15T02:01:30Z"
  },
  "history": [
    { "score": 62, "level": "high", "calculatedAt": "2025-08-15T02:00:00Z" },
    { "score": 55, "level": "high", "calculatedAt": "2025-08-14T02:00:00Z" },
    { "score": 42, "level": "medium", "calculatedAt": "2025-08-13T02:00:00Z" }
  ],
  "trend": "worsening"
}
```

#### POST /api/v1/risk-score

```
Request:  POST /api/v1/risk-score
Body:
{
  "studentId": "uuid",
  "engagementData": {
    "daysSinceLastAccess": 8,
    "accessesLast14Days": 3,
    "averageGrade": 5.2,
    "onTimeSubmissionRate": 0.4,
    "vitruInteractionsLast30Days": 2,
    "communityParticipations": 0,
    "learningPathProgress": 0.3,
    "hasFinancialPending": true,
    "daysSinceEnrollment": 120,
    "activeDisciplines": 5,
    "disciplinesBelowAverage": 2
  }
}

Response: 201 Created
{
  "ok": true,
  "score": 62,
  "level": "high",
  "factors": [...],
  "calculatedAt": "2025-08-15T10:30:00Z",
  "shouldSyncSalesforce": true
}
```

---

### 3.4 Community API

**Arquivo:** `app/api/v1/community/route.ts`  
**Módulo de negócio:** `lib/community/community-hub.ts`  
**Tabelas:** `community.groups`, `community.memberships`, `community.events`

#### GET /api/v1/community (recomendações)

```
Request:  GET /api/v1/community?studentId=uuid
Response: 200 OK
{
  "ok": true,
  "hasProfile": true,
  "recommendations": [
    {
      "group": {
        "id": "uuid-grupo",
        "name": "EJ Admin UNIASSELVI",
        "category": "empresa_junior",
        "description": "Empresa Júnior de Administração...",
        "memberCount": 23,
        "maxMembers": 40,
        "skills": ["marketing", "gestao", "financas"],
        "isActive": true
      },
      "matchScore": 75,
      "matchReasons": ["Interesse em Empresa Júnior", "Skills: marketing", "Alinhado com seu curso"]
    }
  ],
  "totalGroups": 15
}
```

#### POST /api/v1/community (join/leave)

```
Request:  POST /api/v1/community
Body: { "studentId": "uuid", "groupId": "uuid-grupo", "action": "join" }

Response: 201 Created
{ "ok": true, "action": "joined", "groupId": "uuid-grupo", "groupName": "EJ Admin UNIASSELVI" }
```

---

### 3.5 Salesforce API

**Arquivos:**  
- `app/api/v1/salesforce/sync/route.ts`  
- `app/api/v1/salesforce/webhook/route.ts`  
**Módulo:** `lib/salesforce/client.ts`, `lib/salesforce/sync-student-risk.ts`

#### POST /api/v1/salesforce/sync

```
Request:  POST /api/v1/salesforce/sync
Body: { "studentId": "uuid" }

Response: 200 OK (quando SF não configurado — modo simulação)
{
  "ok": false,
  "error": { "code": "SALESFORCE_NOT_CONFIGURED", "message": "..." },
  "simulated": true,
  "payload": {
    "studentId": "uuid",
    "studentName": "João Pedro",
    "riskScore": 62,
    "riskLevel": "high",
    "factors": [...]
  }
}

Response: 200 OK (quando SF configurado)
{
  "ok": true,
  "synced": true,
  "salesforce": {
    "contactId": "003xxx",
    "riskScoreId": "a0Bxxx",
    "caseId": "500xxx",
    "caseCreated": true
  }
}
```

#### POST /api/v1/salesforce/webhook

```
Request:  POST /api/v1/salesforce/webhook
Headers:  x-sf-webhook-secret: <secret>
Body:
{
  "event": "student_contacted",
  "studentId": "uuid",
  "caseId": "500ABC123",
  "status": "Contacted",
  "notes": "Aluno orientado sobre bolsa",
  "assignedTo": "Coord. Maria"
}

Response: 200 OK
{ "ok": true, "processed": "student_contacted", "studentId": "uuid" }
```

**Eventos aceitos:** `case_updated`, `case_closed`, `student_contacted`, `campaign_activated`

---

### 3.6 Assistente Vitru — Interface Unificada (Frontend)

**Componente:** `src/components/agentforce/AgentforceChat.tsx`  
**Trigger:** Botão "Vitru" no menu lateral (sidebar) — usa evento `vitru-open-assistant`  
**Sem API route própria** — respostas simuladas no frontend para demo.

**Em produção:**
- Tab Agentforce: conectaria via Salesforce Agent API v62.0 (OAuth → sessão → mensagem)
- Tab Nova Sonic: conectaria via WebSocket bidirectional com Bedrock (áudio in → áudio out)

**Modo Agentforce (texto):**
```
Aluno digita "O que estudar hoje?"
  → Resposta simulada baseada no perfil:
    "📚 Prioridades: 1. Estatística (avaliação em 3 dias)..."
```

**Modo Nova Sonic (voz):**
```
Aluno pressiona mic → simula captura → processa → mostra transcrição + resposta
  → "Priorize Estatística — avaliação em 3 dias. Use mapas mentais..."
```

---

### 3.7 Vitru Chat API (backend existente)

**Arquivo:** `app/api/v1/vitru/chat/route.ts`  
**Módulo:** `lib/vitru/generate.ts`, `lib/vitru/build-student-context.ts`  
**Integração:** AWS Bedrock (Converse API — texto)

```
Request:  POST /api/v1/vitru/chat
Body:
{
  "surface": "calendario",
  "message": "O que devo estudar hoje?",
  "focus": null
}

Response: 200 OK
{
  "reply": "Olá! Com base nos seus prazos, sugiro focar em Estatística...",
  "resolution": "generation",
  "conversationId": "conv-uuid",
  "actions": [
    { "type": "navigate", "label": "Ver trilha de Estatística", "href": "/disciplinas/EST01/trilha-de-aprendizagem" }
  ],
  "inputTokens": 450,
  "outputTokens": 180
}
```

---

## 4. Módulos de Negócio (lib/)

### Estrutura

```
lib/
├── profile/
│   └── learning-profile.ts        # Tipos, VARK, onboarding steps, cálculo de completude
├── recommender/
│   └── study-recommender.ts       # Priorização, métodos, formatos, prompt builder
├── community/
│   └── community-hub.ts           # Matching de grupos, scoring
├── risk-score/
│   └── calculate.ts               # Motor de cálculo (6 fatores ponderados)
├── salesforce/
│   ├── client.ts                  # OAuth, query, upsert, create
│   └── sync-student-risk.ts       # Sync score → Contact + Risk_Score__c + Case
├── vitru/
│   ├── generate.ts                # Client Bedrock (Converse API)
│   ├── build-student-context.ts   # Monta contexto completo do aluno para IA
│   ├── conversation-store.ts      # Histórico de conversas
│   ├── prompts.ts                 # System prompts por superfície
│   └── ...
└── db/
    ├── client.ts                  # Conexão (PGlite | Postgres | Aurora Data API)
    └── schema/
        ├── index.ts               # Re-exporta todos os schemas
        ├── academic.ts            # Dados da instituição (disciplinas, notas, etc)
        ├── vitru.ts               # Dados do produto (conversas, memórias, etc)
        ├── learning-profile.ts    # Tabela learning_profiles
        ├── community.ts           # Tabelas groups, memberships, events, badges
        └── risk-score.ts          # Tabelas risk_scores, interventions, engagements
```

---

## 5. Schema do Banco

### 5.1 Schema `academic` (dados da instituição)

| Tabela | Registros | Propósito |
|--------|-----------|-----------|
| `students` | Alunos | ID, nome, curso, status, polo |
| `disciplines` | Disciplinas | Código, nome, período, classe |
| `assessments` | Avaliações | Notas, prazos, pesos |
| `attendances` | Frequência | Presenças/faltas |
| `learning_paths` | Trilha | Conteúdo das aulas |
| `recordings` | Gravações | Vídeos de aula |
| `financial_titles` | Financeiro | Mensalidades, pendências |

### 5.2 Schema `vitru` (dados do produto)

| Tabela | Propósito |
|--------|-----------|
| `learning_profiles` | Perfil VARK, rotina, objetivos, interesses |
| `risk_scores` | Histórico de scores de evasão |
| `engagement_snapshots` | Snapshots diários de engajamento |
| `interventions` | Ações de retenção (vindas do SF) |
| `conversations` | Sessões de conversa com Vitru |
| `conversation_messages` | Mensagens individuais |
| `memories` | Memória episódica do assistente |
| `student_profiles` | Preferências de estudo (schedule) |
| `surface_visits` | Contagem de visitas por superfície |
| `study_activities` | Atividades de estudo planejadas |

### 5.3 Schema `community` (dados de comunidade)

| Tabela | Propósito |
|--------|-----------|
| `groups` | Grupos disponíveis (EJ, pesquisa, atlética...) |
| `memberships` | Relação aluno ↔ grupo |
| `events` | Eventos dos grupos |
| `mentorship_matches` | Pares mentor ↔ mentee |
| `student_badges` | Gamificação (badges conquistados) |

---

## 6. Lambdas (Processamento Assíncrono)

### 6.1 calculate-risk-scores

**Arquivo:** `lambdas/calculate-risk-scores/index.ts`  
**Trigger:** EventBridge Scheduler (cron: `0 2 * * ? *` — diário 02:00 UTC)  
**Timeout:** 5 minutos  
**Memória:** 512MB

**Fluxo:**
1. Query Aurora: todos os alunos ativos
2. Para cada aluno: coleta métricas de engajamento
3. `calculateRiskScore(data)` → score 0-100
4. Persiste no Aurora (`risk_scores` + `engagement_snapshots`)
5. Se mudou significativamente (±5) E nível alto/crítico:
   - Emite evento `student.risk_score_changed` no EventBridge

### 6.2 sync-salesforce

**Arquivo:** `lambdas/sync-salesforce/index.ts`  
**Trigger:** EventBridge Rule (pattern: `student.risk_score_changed [high|critical]`)  
**Timeout:** 30 segundos  
**Memória:** 256MB

**Fluxo:**
1. Recebe evento com `{ studentId, score, level }`
2. Busca dados do aluno no Aurora
3. Autentica no Salesforce (OAuth 2.0)
4. Upsert Contact
5. Create Vitru_Risk_Score__c
6. Se critical → Create Case
7. Se high → Add to Campaign

---

## 7. Variáveis de Ambiente

```env
# Obrigatórias em produção
DATABASE_DRIVER=aws-data-api
AURORA_CLUSTER_ARN=arn:aws:rds:...
AURORA_SECRET_ARN=arn:aws:secretsmanager:...
AURORA_DATABASE=vitru
AWS_REGION=us-east-1
BEDROCK_MODEL_ID=amazon.nova-micro-v1:0

# Salesforce
SALESFORCE_INSTANCE_URL=https://org.my.salesforce.com
SALESFORCE_CLIENT_ID=...
SALESFORCE_CLIENT_SECRET=...
SALESFORCE_USERNAME=integration@org.com
SALESFORCE_PASSWORD=...
SALESFORCE_WEBHOOK_SECRET=...

# Auth
COGNITO_USER_POOL_ID=us-east-1_xxx
COGNITO_CLIENT_ID=xxx

# Dev local (padrões — não precisa configurar)
# DATABASE_DRIVER=pglite (automático se DATABASE_URL não definida)
```

---

## 8. Tratamento de Erros

Todas as APIs seguem o mesmo padrão de resposta de erro:

```json
{
  "ok": false,
  "error": {
    "code": "INVALID_REQUEST",
    "message": "studentId é obrigatório"
  }
}
```

**Códigos HTTP:**
| Status | Significado |
|--------|------------|
| 200 | Sucesso |
| 201 | Criado com sucesso |
| 400 | Request inválida (campo faltando, formato errado) |
| 401 | Não autenticado (webhook secret inválido) |
| 404 | Recurso não encontrado |
| 502 | Erro na integração externa (Salesforce, Bedrock) |

---

## 9. Como Rodar o Backend Localmente

```bash
# 1. Instalar
npm install

# 2. Criar banco local
mkdir .vitru\pglite
npm run db:migrate
npm run db:seed

# 3. Rodar
npm run dev
# Backend disponível em http://localhost:3000/api/v1/...

# 4. Testar
curl http://localhost:3000/api/v1/risk-score?studentId=joao-pedro-lopes-zamonelo
```

O `DATABASE_DRIVER=pglite` é automático — Postgres embarcado em WASM, sem Docker, sem instalação.
