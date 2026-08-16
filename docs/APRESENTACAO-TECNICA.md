---
marp: true
theme: default
paginate: true
backgroundColor: #0d0d0d
color: #ffffff
style: |
  section { font-family: 'Segoe UI', sans-serif; }
  h1 { color: #ffcc00; font-size: 2em; }
  h2 { color: #ffcc00; font-size: 1.5em; }
  h3 { color: #22d3ee; }
  strong { color: #ffcc00; }
  table { font-size: 0.7em; }
  code { background: #1e1e1e; font-size: 0.85em; }
  blockquote { border-left: 4px solid #ffcc00; padding-left: 1em; font-style: italic; color: #9a9a9a; }
---

# Vitru AVA — Apresentação Técnica
## Arquitetura, Backend, Custos e Infraestrutura

Projeto de redução de evasão em EAD
Unicesumar | UNIASSELVI

---

# Agenda

1. Arquitetura geral
2. Backend — Stack e API Routes
3. Agentes de IA (Agentforce + Nova Sonic)
4. Sala Virtual (100% AWS)
5. Infraestrutura como Código (CDK)
6. Custos detalhados
7. Segurança e LGPD
8. Decisões técnicas (trade-offs)

---

# 1. Arquitetura Geral

```
      ALUNO (Browser)
           │
     ┌─────┼─────────────────────────────┐
     │     │                             │
     ▼     ▼                             ▼
   AVA    Agente IA                 Sala Virtual
  React   (Agentforce/Sonic)       (avatares+voz)
     │     │                             │
     └─────┼─────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────┐
│              AWS CLOUD                    │
│  Aurora · Cognito · Lambda · Bedrock     │
│  Chime SDK · DynamoDB · API GW WS       │
│  S3 · CloudFront · EventBridge · SES    │
└──────────────────┬───────────────────────┘
                   │ sync
                   ▼
┌──────────────────────────────────────────┐
│           SALESFORCE                      │
│  Education Cloud · Agentforce · Flows    │
└──────────────────────────────────────────┘
```

---

# 2. Backend — Stack

| Camada | Tecnologia | Justificativa |
|--------|-----------|---------------|
| Runtime | Node.js 20 (serverless) | Sem servidor para gerenciar |
| Framework | Next.js 16 (App Router) | SSR + API no mesmo deploy |
| Linguagem | TypeScript 5 | Type-safety end-to-end |
| ORM | Drizzle ORM | SQL-first, leve, Data API |
| Banco | Aurora Serverless v2 | Escala a zero, PostgreSQL |
| Dev local | PGlite (Postgres WASM) | Zero dependências |
| IA Texto | Salesforce Agentforce | Low-code, CRM nativo |
| IA Voz | Amazon Nova Sonic | Speech-to-speech |
| CRM | Salesforce Education Cloud | Objetos acadêmicos |

---

# 2. Backend — API Routes

| Endpoint | Método | Função |
|---------|--------|--------|
| `/api/v1/profile` | GET/POST/PATCH | CRUD perfil VARK |
| `/api/v1/recommend` | GET | Recomendações + IA |
| `/api/v1/community` | GET/POST | Grupos + join/leave |
| `/api/v1/risk-score` | GET/POST | Score evasão |
| `/api/v1/salesforce/sync` | POST | Push → Salesforce |
| `/api/v1/salesforce/webhook` | POST | Recebe eventos SF |
| `/api/v1/vitru/chat` | POST | Chat IA (Bedrock) |

> Cada endpoint = 1 arquivo em `src/app/api/v1/*/route.ts`
> Serverless: escala automática, paga por request

---

# 2. Backend — Fluxo de Dados

```
1. Login → Cognito → JWT (cookie HttpOnly)

2. Dashboard → Server Component → Aurora → HTML

3. Recomendação:
   API Route → Aurora (perfil + disciplinas)
     → Calcula prioridade
     → Bedrock (gera conteúdo adaptativo)
     → Response JSON

4. Risk Score (Lambda, diário 02:00):
   Aurora → calcula 6 fatores → persiste
     → IF alto/crítico → EventBridge → Lambda → Salesforce

5. Salesforce → Coordenador age → Webhook → AVA personaliza
```

---

# 2. Backend — Schema do Banco

### 3 schemas PostgreSQL:

| Schema | Propósito | Tabelas |
|--------|----------|---------|
| `academic` | Dados da instituição | students, disciplines, assessments, attendances, learning_paths, recordings |
| `vitru` | Dados do produto | learning_profiles, risk_scores, conversations, memories, study_activities |
| `community` | Comunidade | groups, memberships, events, mentorship_matches, badges |

**ORM:** Drizzle — type-safe, migrations automáticas, compatível com Aurora Data API

---

# 3. Agentes de IA

### Dois canais complementares:

| | Agentforce (texto) | Nova Sonic (voz) |
|--|--|--|
| **Provider** | Salesforce | AWS Bedrock |
| **Protocolo** | REST (Agent API v62.0) | WebSocket bidirectional |
| **Input** | Texto digitado | Áudio do microfone |
| **Output** | Texto formatado | Áudio de resposta |
| **Latência** | ~2s | <1s |
| **Uso ideal** | Respostas detalhadas | Hands-free, acessível |
| **Custo** | Incluso licença SF | $0.0007/s áudio |

> Ambos consultam: perfil VARK, disciplinas, risk score, comunidades

---

# 3. Agentforce — Fluxo de Produção

```
Aluno digita "O que estudar hoje?"
       │
       ▼
Backend: OAuth Client Credentials → access_token
       │
       ▼
POST /agents/{id}/sessions → sessionId
       │
       ▼
POST /sessions/{id}/messages
  Body: { message: { role: "user", content: "..." }, variables: [] }
       │
       ▼
Agentforce consulta:
  • Contact (perfil, VARK, curso)
  • Discipline__c (notas, prazos)
  • Risk_Score__c (engajamento)
       │
       ▼
Retorna resposta personalizada ao aluno
```

---

# 3. Nova Sonic — Fluxo de Produção

```
Aluno pressiona mic → MediaRecorder captura áudio
       │
       ▼
WebSocket bidirectional → Bedrock (amazon.nova-sonic-v1:0)
       │
       ▼
System prompt enviado junto:
  "Aluno visual/cinestésico, ADM, Estatística prova em 3 dias,
   Cálculo nota 5.2, score 62/100. Responda breve. PT-BR."
       │
       ▼
Nova Sonic processa speech-to-speech:
  • Entende fala do aluno
  • Gera resposta contextualizada
  • Retorna áudio (streaming)
       │
       ▼
Browser reproduz via AudioContext
```

**Sem pipeline cascata** (STT → LLM → TTS) = menor latência

---

# 4. Sala Virtual — Arquitetura AWS

```
┌─────────────┐     ┌──────────────────┐     ┌──────────────┐
│   Browser   │←WS→│ API Gateway WS   │←───→│   Lambda     │
│  (PixiJS)   │     │ (posição sync)   │     │  (handlers)  │
│             │     └──────────────────┘     └──────┬───────┘
│             │                                     │
│             │←WebRTC→┌──────────────┐      ┌─────▼──────┐
│             │        │ Chime SDK    │      │  DynamoDB  │
│             │        │ (voz prox.)  │      │ (posições) │
└─────────────┘        └──────────────┘      └────────────┘
```

---

# 4. Sala Virtual — Serviços AWS

| Serviço | Função | Custo (500 alunos) |
|---------|--------|-------------------|
| **API Gateway WebSocket** | Sync posição 30x/s | $12/mês |
| **Lambda** | connect, message, disconnect, broadcast | $5/mês |
| **DynamoDB** | Posições (TTL 5min), connections, rooms | $10/mês |
| **Amazon Chime SDK** | Voz WebRTC, volume por participante | $40/mês |
| **S3 + CloudFront** | Sprites, mapas Tiled, assets | $15/mês |
| **Cognito** | Mesmo auth do AVA | $0 |

**Voz por proximidade:**
```
volume = 1 - (distância_entre_avatares / raio_audição)
Se longe → silêncio | Se perto → volume alto
```

---

# 4. Sala Virtual — Salas Temáticas

| Sala | Propósito | Features |
|------|----------|----------|
| Hall Principal | Lobby | Portais, mural eventos |
| Empresa Júnior | Sede EJ | Quadro projetos, reunião |
| Grupo de Pesquisa | Lab | Papers, discussão |
| Atlética | Esportes | Campeonatos, troféus |
| Networking | Lounge | Coffee area, LinkedIn |
| Auditório | Eventos ao vivo | Palco, plateia, screen share |
| Sala de Estudo | Focus | Sem voz, Pomodoro coletivo |

---

# 5. Infraestrutura como Código (CDK)

```
infra/
├── bin/vitru-infra.ts          # Entry point
├── lib/
│   ├── database-stack.ts       # Aurora Serverless v2 + VPC
│   ├── auth-stack.ts           # Cognito User Pool
│   ├── storage-stack.ts        # S3 + CloudFront
│   ├── compute-stack.ts        # Lambdas + DLQ
│   └── events-stack.ts         # EventBridge + Scheduler
└── package.json
```

**Deploy:** `cd infra && cdk deploy --all`

**Ambientes:**
| Env | Banco | IA | Deploy trigger |
|-----|-------|---|----------------|
| Dev | PGlite local | Simulado | `npm run dev` |
| Staging | Aurora dev | Bedrock sandbox | Push `staging` |
| Prod | Aurora prod | Bedrock + Agentforce | Merge `main` |

---

# 5. CDK — Exemplo: Database Stack

```typescript
const cluster = new rds.DatabaseCluster(this, "VitruDB", {
  engine: rds.DatabaseClusterEngine.auroraPostgres({
    version: rds.AuroraPostgresEngineVersion.VER_16_1,
  }),
  serverlessV2MinCapacity: 0.5,  // Mínimo (repouso)
  serverlessV2MaxCapacity: 8,    // Máximo (pico)
  writer: rds.ClusterInstance.serverlessV2("writer"),
  vpc,
  defaultDatabaseName: "vitru",
  enableDataApi: true,           // HTTP (sem connection pool)
  backup: { retention: cdk.Duration.days(35) },
  storageEncrypted: true,
});
```

> Aurora Data API = HTTP puro. Perfeito para serverless (sem TCP).

---

# 6. Custos — Breakdown Detalhado

### AVA Principal (sem sala virtual)

| Serviço | 1k alunos | 10k alunos | 50k alunos |
|---------|-----------|-----------|-----------|
| Amplify (hosting) | $15 | $15 | $50 |
| Aurora Serverless | $43 | $100 | $300 |
| Cognito | $0 | $0 | $0 |
| Lambda + EventBridge | $3 | $10 | $40 |
| S3 + CloudFront | $10 | $90 | $400 |
| SES (emails) | $1 | $5 | $20 |
| **Subtotal AVA** | **$72** | **$220** | **$810** |

---

# 6. Custos — IA

| Serviço | Estimativa | Base de cálculo |
|---------|-----------|----------------|
| Nova Sonic (voz) | $100/mês | 5k interações/dia × 30s × $0.0007/s |
| Bedrock Nova Micro (texto) | $50/mês | 5k calls × 500 tokens |
| Agentforce | Incluso | Licença Salesforce Education |

**Total IA:** ~$150/mês para 10k alunos

---

# 6. Custos — Sala Virtual

| Componente | 500 simultâneos | 5.000 simultâneos |
|-----------|----------------|------------------|
| API Gateway WS | $12 | $120 |
| Lambda | $5 | $50 |
| DynamoDB | $10 | $80 |
| Chime SDK | $40 | $400 |
| S3 + CF (assets) | $15 | $50 |
| **Subtotal Sala** | **$82** | **$700** |

---

# 6. Custos — Total Consolidado

| Componente | 10k alunos/mês |
|-----------|---------------|
| AVA (frontend + API + banco) | $220 |
| IA (Nova Sonic + Bedrock) | $150 |
| Sala Virtual (500 simultâneos) | $82 |
| Salesforce (licença education) | Variável |
| **Total AWS** | **~$452/mês** |

### Comparativo:
| Abordagem | Custo/mês | Escalabilidade |
|-----------|-----------|---------------|
| Servidores tradicionais (EC2) | ~$800+ | Manual |
| **Vitru (serverless)** | **~$452** | **Automática** |
| SaaS terceiro (Moodle Cloud) | ~$1.200 | Limitada |

---

# 7. Segurança e LGPD

| Camada | Implementação |
|--------|--------------|
| **Autenticação** | Cognito (JWT + MFA + OAuth 2.0) |
| **Identidade** | UUID interno — sem CPF no sistema |
| **Encryption at rest** | KMS (Aurora, S3, DynamoDB) |
| **Encryption in transit** | TLS 1.3 (todas as conexões) |
| **Rede** | VPC com subnets privadas (Aurora) |
| **Voz** | Chime SDK criptografado end-to-end |
| **API** | Rate limiting + input validation (zod) |
| **Salesforce** | OAuth 2.0 + IP whitelist |
| **LGPD — Região** | sa-east-1 (São Paulo) |
| **LGPD — Exclusão** | Endpoint cascade delete implementado |
| **LGPD — Acesso** | Endpoint de export de dados |

---

# 7. Disaster Recovery

| Cenário | RTO | RPO | Estratégia |
|---------|-----|-----|-----------|
| Aurora falha | <30s | 0 | Multi-AZ failover |
| Região inteira | <1h | <5min | Global Database |
| Deploy quebrou | <5min | 0 | Rollback Amplify |
| Dados corrompidos | <2h | <5min | Point-in-time recovery |

---

# 8. Decisões Técnicas (Trade-offs)

| Decisão | Alternativa | Por que escolhemos |
|---------|------------|-------------------|
| Next.js (monolito) | React + Express | SSR + API + mesmo deploy |
| Aurora Serverless | DynamoDB | Joins complexos (aluno↔disciplina↔grupo) |
| Aurora Serverless | RDS comum | Escala a zero, Data API (HTTP) |
| Drizzle ORM | Prisma | Mais leve, SQL-first, Data API |
| Agentforce | GPT-4 | Low-code, incluso SF, CRM nativo |
| Nova Sonic | Whisper+GPT+TTS | 1 modelo (sem cascata), <1s |
| Chime SDK | Twilio/Agora | AWS nativo, serverless |
| API GW WebSocket | Socket.io/EC2 | Serverless, paga por msg |
| DynamoDB (sala) | Redis | Serverless, TTL nativo |
| PGlite (dev) | Docker Postgres | Zero dependências |
| Monorepo | Multi-repo | Prazo curto, refatoração segura |
| CDK | Terraform | Mesma linguagem (TypeScript) |

---

# 8. Por que Serverless?

| Critério | Serverless (Vitru) | Tradicional (EC2) |
|----------|-------------------|-------------------|
| Custo em repouso | ~$0 | ~$50-200/mês |
| Escala | Automática (0 → ∞) | Manual (resize) |
| Manutenção | Zero (AWS gerencia) | Patches, monitoramento |
| Deploy | `git push` → produção | CI/CD + provisioning |
| Cold start | ~200ms (Aurora) | N/A (sempre on) |

> Para um AVA educacional com picos previsíveis (horário noturno), serverless é ideal.

---

# Evolução Futura

| Fase | Feature | Tecnologia |
|------|---------|-----------|
| v2 | Nova Sonic com tool-use | Agente executa ações no AVA por voz |
| v2 | Einstein Prediction | ML preditivo de evasão no SF |
| v3 | Sala Virtual 3D | Three.js / WebXR |
| v3 | Mobile nativo | React Native (mesmo backend) |
| v4 | Multi-tenant | Suporte a múltiplas IES |
| v4 | Data Cloud | Unifica dados cross-instituição |

---

# Resumo

| Pilar | Stack | Status |
|-------|-------|--------|
| Frontend | React 19 + Next.js 16 + Tailwind | ✅ Funcional |
| Backend API | Next.js API Routes + Drizzle + Aurora | ✅ Funcional |
| IA Texto | Salesforce Agentforce (simulado) | ✅ Demo |
| IA Voz | Amazon Nova Sonic (simulado) | ✅ Demo |
| Risk Score | Lambda + EventBridge + SF sync | ✅ Funcional |
| Comunidade | Hub + matching + gamificação | ✅ Funcional |
| Sala Virtual | Chime + API GW WS + DynamoDB | 📐 Arquitetado |
| Infra (CDK) | 5 stacks prontos | 📐 Arquitetado |
| Custo total | ~$452/mês (10k alunos) | 📊 Estimado |

---

# Perguntas?

## Repositório: github.com/seu-usuario/vitru-ava

### Documentação:
- `docs/ARQUITETURA.md` — Visão completa
- `docs/BACKEND.md` — APIs e contratos
- `docs/SALA-VIRTUAL.md` — Campus 2D
- `docs/APRESENTACAO-TECNICA.md` — Estes slides

---
