# Arquitetura do Sistema — Vitru AVA

> Documento de decisão arquitetural (ADR) para apresentação à banca avaliadora.
> Descreve a arquitetura ideal em produção (multi-repo, microsserviços) e justifica
> a implementação atual como monorepo para viabilidade de prazo.

---

## 1. Resumo Executivo

O Vitru AVA é uma plataforma de ensino a distância focada em **reduzir a evasão** por meio de:
- Perfil comportamental inteligente do aluno
- Recomendação adaptativa de conteúdo e métodos de estudo
- Detecção precoce de risco de abandono
- Integração com comunidade acadêmica (empresa júnior, pesquisa, atlética, networking)
- Intervenção proativa via CRM (Salesforce)

A arquitetura foi projetada para escalar de um protótipo acadêmico até uma solução de produção para milhares de alunos.

---

## 2. Decisão: Monorepo vs Multi-repo

### Implementação Atual — Monorepo

```
vitru-ava/
├── app/              # Frontend + API (Next.js)
├── lib/              # Lógica de negócio
│   ├── profile/      # Learning Profile Engine
│   ├── recommender/  # Study Recommender
│   ├── community/    # Community Hub
│   ├── risk-score/   # Motor de Risco
│   ├── salesforce/   # Client CRM
│   ├── vitru/        # Assistente IA
│   └── db/           # Banco de Dados
├── infra/            # AWS CDK
├── lambdas/          # Funções serverless
└── docs/             # Documentação
```

**Justificativa**: velocidade de desenvolvimento, deploy unificado, refatoração segura com TypeScript.

### Arquitetura Ideal em Produção — Multi-repo com Microsserviços

Em um cenário de produção com equipe de 10+ desenvolvedores e milhares de alunos simultâneos, a arquitetura evoluiria para:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         REPOSITÓRIOS INDEPENDENTES                       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  vitru-web              vitru-infra            vitru-salesforce          │
│  ┌──────────────┐       ┌──────────────┐      ┌──────────────┐         │
│  │ Frontend     │       │ AWS CDK      │      │ SFDX Project │         │
│  │ React/Next.js│       │ Stacks       │      │ Apex Classes │         │
│  │ BFF API      │       │ Pipelines    │      │ Flows        │         │
│  └──────┬───────┘       └──────┬───────┘      │ Custom Obj   │         │
│         │                      │              └──────┬───────┘         │
│         │               vitru-risk-engine            │                  │
│         │               ┌──────────────┐             │                  │
│         │               │ Lambda       │             │                  │
│         │               │ Risk Score   │─────────────┘                  │
│         │               │ Batch/Event  │                                │
│         │               └──────┬───────┘                                │
│         │                      │                                        │
│         │               vitru-community-api                             │
│         │               ┌──────────────┐                                │
│         │               │ API REST     │                                │
│         │               │ Matching     │                                │
│         │               │ Events       │                                │
│         └───────────────┴──────────────┘                                │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

| Repositório | Stack | Time Responsável | Motivo da Separação |
|-------------|-------|-----------------|---------------------|
| `vitru-web` | Next.js, React, Tailwind | Frontend + Product | Ciclo de release independente (deploy diário) |
| `vitru-infra` | AWS CDK, TypeScript | DevOps/Platform | Mudanças de infra não devem bloquear feature delivery |
| `vitru-salesforce` | SFDX, Apex, Flows | CRM/RevOps | Salesforce tem seu próprio ciclo de deploy e sandbox |
| `vitru-risk-engine` | TypeScript, Lambda | Data/ML | Modelo de risco evolui com dados, precisa de pipeline própria |
| `vitru-community-api` | Node.js ou Go | Backend | Domínio separado, pode escalar independente |

---

## 3. Padrões Arquiteturais Adotados

### 3.1 Event-Driven Architecture (EDA)

Os módulos se comunicam via **eventos**, não chamadas diretas:

```
┌─────────┐    StudentAccessedAVA     ┌──────────────┐
│   Web   │ ─────────────────────────▶│  EventBridge │
└─────────┘                           └──────┬───────┘
                                             │
                    ┌────────────────────────┬┴───────────────────────┐
                    ▼                        ▼                        ▼
           ┌──────────────┐        ┌──────────────┐        ┌──────────────┐
           │ Risk Engine  │        │  Analytics   │        │  Salesforce  │
           │ (atualiza    │        │  (registra   │        │  (atualiza   │
           │  score)      │        │   métrica)   │        │   Contact)   │
           └──────────────┘        └──────────────┘        └──────────────┘
```

**Eventos principais:**
- `student.accessed` — Aluno acessou o AVA
- `student.completed_lesson` — Completou aula na trilha
- `student.submitted_assessment` — Entregou avaliação
- `student.risk_score_changed` — Score de risco mudou
- `student.joined_community` — Entrou em grupo
- `student.profile_updated` — Atualizou perfil
- `salesforce.case_created` — CRM criou intervenção
- `salesforce.campaign_member_added` — Aluno adicionado em campanha

**Por que Event-Driven?**
- Desacopla módulos: o frontend não precisa saber que o Salesforce existe
- Escalabilidade: cada consumer processa no seu ritmo
- Auditoria: eventos são log natural do sistema
- Resiliência: se Salesforce cair, eventos ficam na fila

### 3.2 Backend for Frontend (BFF)

O Next.js API Route atua como BFF — agrega dados de múltiplos serviços numa única resposta otimizada para o frontend:

```
Browser pede GET /api/dashboard
  → BFF consulta Aurora (disciplinas)
  → BFF consulta Aurora (risk score)
  → BFF consulta Aurora (community)
  → Retorna JSON unificado
```

Em multi-repo, o BFF continua no `vitru-web` e faz chamadas HTTP para os outros serviços.

### 3.3 CQRS (Command Query Responsibility Segregation)

- **Commands** (escrita): perfil.atualizar, avaliação.submeter, comunidade.entrar
- **Queries** (leitura): dashboard.carregar, recomendações.listar, risk_score.consultar

Na prática:
- Escritas passam pelo EventBridge (async, podem falhar e retry)
- Leituras vão direto ao Aurora (sync, rápido)

### 3.4 Strangler Fig Pattern (migração gradual)

O monorepo pode migrar para multi-repo **um módulo por vez**:

```
Fase 1: Monorepo (atual)
  lib/salesforce/ → chamada local

Fase 2: Extrai Salesforce
  lib/salesforce/ → HTTP call para vitru-salesforce service

Fase 3: Extrai Risk Engine
  lib/risk-score/ → Lambda standalone via EventBridge

Fase 4: Extrai Community
  lib/community/ → API independente
```

Cada extração é transparente para o frontend — a interface (API route) não muda.

---

## 4. Segurança

| Camada | Mecanismo |
|--------|-----------|
| Autenticação | AWS Cognito (JWT, MFA, OAuth 2.0) |
| Autorização | Role-based: aluno, coordenador, admin |
| API | Rate limiting, validação de input (zod) |
| Banco | Row-level security no Aurora, secrets no Secrets Manager |
| Salesforce | Connected App com OAuth 2.0, IP whitelist |
| Frontend | HTTPS only, CSP headers, HttpOnly cookies |
| Dados | Sem CPF no sistema — identificação por personId + subscriptionCode |

---

## 5. Observabilidade

| Pilar | Ferramenta | O que monitora |
|-------|-----------|---------------|
| Logs | CloudWatch Logs | Erros, requests, Bedrock calls |
| Métricas | CloudWatch Metrics | Latência, risk scores, evasão |
| Traces | X-Ray | Request flow entre serviços |
| Alertas | CloudWatch Alarms + SNS | Score crítico, falha Salesforce |
| Dashboard | Grafana ou CloudWatch Dashboard | KPIs de retenção |

---

## 6. Escalabilidade

| Componente | Estratégia |
|------------|-----------|
| Frontend | Edge caching (CloudFront), ISR (Next.js) |
| API | Serverless (Lambda/Vercel) — escala automática |
| Banco | Aurora Serverless v2 — 0 a 128 ACUs sob demanda |
| IA | Bedrock — pay-per-token, sem provisioning |
| Salesforce | API rate limits gerenciados com retry + backoff |

**Projeção de carga:**
- 10.000 alunos ativos → ~50 req/s em pico
- Aurora Serverless v2 suporta sem config adicional
- Bedrock: ~200 chamadas/min no plano padrão (suficiente)

---

## 7. Trade-offs Documentados

| Decisão | Alternativa Descartada | Motivo |
|---------|----------------------|--------|
| Next.js monolito | Micro-frontends | Complexidade desnecessária para o tamanho atual |
| Aurora Serverless | DynamoDB | Relações complexas entre aluno/disciplina/comunidade |
| Bedrock Nova Micro | GPT-4 / Claude | Integração nativa AWS, sem chave externa, menor custo |
| Salesforce | HubSpot / Pipedrive | Education Cloud tem objetos acadêmicos nativos |
| Monorepo | Multi-repo | Velocidade de entrega, time pequeno, prazo curto |
| TypeScript | Python | Mesma linguagem front/back, type-safety end-to-end |
| Drizzle ORM | Prisma | Mais leve, SQL-first, melhor com Aurora Data API |
| EventBridge | SQS/SNS direto | Roteamento por padrão, schema registry, menos código |

---

## 8. Evolução Futura (pós-banca)

1. **ML Pipeline** — Treinar modelo próprio de predição de evasão com SageMaker
2. **Real-time** — WebSockets para notificações instantâneas (AppSync)
3. **Mobile** — React Native compartilhando lógica do monorepo
4. **Multi-tenant** — Suportar múltiplas instituições (Unicesumar, UNIASSELVI, etc.)
5. **Analytics** — Data Lake em S3 + Athena para análise de retenção
6. **A/B Testing** — Testar diferentes intervenções de retenção com CloudWatch Evidently
