# Vitru AVA — Plataforma Anti-Evasão EAD

[![Next.js](https://img.shields.io/badge/Next.js-16.2-black?logo=next.js)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-blue?logo=react)](https://react.dev)
[![AWS](https://img.shields.io/badge/AWS-Aurora%20%7C%20Cognito%20%7C%20Lambda-orange?logo=amazonaws)](https://aws.amazon.com)
[![Salesforce](https://img.shields.io/badge/Salesforce-Agentforce-00A1E0?logo=salesforce)](https://www.salesforce.com/agentforce)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)](https://typescriptlang.org)

---

## Problema

A evasão em cursos EAD no Brasil supera **30%** (INEP/MEC). Alunos desistem por:
- Falta de direcionamento (35%)
- Isolamento social (25%)
- Ausência de acompanhamento (20%)

**Ninguém percebe a tempo. Ninguém age.**

## Solução

O Vitru AVA combina **IA conversacional (Salesforce Agentforce + Amazon Nova Sonic)** com **infraestrutura AWS** para criar um ambiente de aprendizagem que:

| Pilar | O que faz | Tecnologia |
|-------|----------|-----------|
| Assistente IA (texto) | Conversa, recomenda estudos, indica comunidade | Salesforce Agentforce |
| Assistente IA (voz) | Conversa por voz, speech-to-speech, hands-free | Amazon Nova Sonic (Bedrock) |
| Detecção de Risco | Calcula score de evasão, alerta coordenadores | AWS Lambda + Salesforce CRM |
| Comunidade | Conecta a EJ, pesquisa, atlética, networking | React + Aurora |
| Sala Virtual | Campus 2D com avatares e voz por proximidade | PixiJS + Chime SDK + API GW WS |
| Perfil Inteligente | Coleta estilo VARK, adapta tudo ao aluno | Onboarding progressivo |

---

## Demo

```
http://localhost:3000              → Dashboard do aluno
http://localhost:3000/perfil       → Onboarding de perfil (VARK)
http://localhost:3000/recomendacoes → Recomendações de estudo (IA)
http://localhost:3000/comunidade   → Hub de comunidade (matching)
http://localhost:3000/risco        → Score de engajamento
http://localhost:3000/campus-virtual → Sala Virtual (roadmap)

Widget Vitru (canto inferior esquerdo, logo animado):
  → Tab "Agentforce": chat por escrita (Salesforce)
  → Tab "Nova Sonic": conversa por voz (AWS Bedrock)
```

---

## Arquitetura

```
 ALUNO ──── Login (Cognito) ────▶ Frontend React/Next.js
                                        │
                              API Routes (serverless)
                                        │
              ┌─────────────────────────┬┼┬─────────────────────────┐
              ▼                         ▼ ▼                         ▼
        AWS Aurora              AWS Lambda +              Salesforce
       (banco dados)           Bedrock Nova Sonic        (Agentforce +
                               (risk score, voz,          CRM retenção)
                                sync SF)
                                        │
              ┌─────────────────────────┘
              ▼
        Sala Virtual
       (API GW WS + Chime SDK + DynamoDB)
```

Documentação completa: [`docs/ARQUITETURA.md`](docs/ARQUITETURA.md) | [`docs/SALA-VIRTUAL.md`](docs/SALA-VIRTUAL.md)

---

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React 19, Next.js 16, Tailwind CSS 4 |
| Backend | Next.js API Routes (serverless), TypeScript |
| Banco | Aurora Serverless v2 (PostgreSQL) / PGlite (dev) |
| ORM | Drizzle ORM |
| IA Texto | Salesforce Agentforce (Agent API v62.0) |
| IA Voz | Amazon Nova Sonic (Bedrock, speech-to-speech) |
| CRM | Salesforce Education Cloud |
| Auth | AWS Cognito |
| Sala Virtual | PixiJS + Amazon Chime SDK + API Gateway WS + DynamoDB |
| Storage | S3 + CloudFront |
| IaC | AWS CDK (TypeScript) |
| CI/CD | GitHub Actions |

---

## Setup Local (5 min)

```bash
# 1. Clone
git clone https://github.com/seu-usuario/vitru-ava.git
cd vitru-ava

# 2. Instale
npm install

# 3. Configure (PGlite funciona sem editar nada)
cp .env.example .env.local

# 4. Inicialize o banco
mkdir .vitru\pglite
npm run db:migrate
npm run db:seed

# 5. Rode
npm install
npm run db:migrate   # cria os schemas em .vitru/pglite
npm run db:seed      # carrega os fixtures de public/data
npm run dev
```

Acesse http://localhost:3000

> O banco local (PGlite) roda sem Docker — Postgres embarcado em WASM.

---

## Estrutura do Projeto

```
vitru-ava/
├── app/                        # Páginas e API Routes (Next.js App Router)
│   ├── api/v1/                 # Backend REST
│   │   ├── profile/            # CRUD perfil do aluno
│   │   ├── recommend/          # Recomendações de estudo
│   │   ├── community/          # Hub de comunidade
│   │   ├── risk-score/         # Motor de risco
│   │   ├── salesforce/         # Webhooks + sync SF
│   │   └── agentforce/        # Proxy chat Agentforce
│   ├── perfil/                 # Página de onboarding
│   ├── recomendacoes/          # Página de recomendações
│   ├── comunidade/             # Página de comunidade
│   └── risco/                  # Página de risk score
├── components/                 # React components
│   ├── agentforce/             # Chat widget (Agentforce)
│   ├── profile/                # Onboarding UI
│   ├── community/              # Community Hub UI
│   ├── study-recommender/      # Recomendações UI
│   └── risk-score/             # Dashboard de risco
├── lib/                        # Lógica de negócio
│   ├── agentforce/             # Client Salesforce Agent API
│   ├── profile/                # Learning Profile Engine
│   ├── recommender/            # Study Recommender
│   ├── community/              # Community Matcher
│   ├── risk-score/             # Risk Score Calculator
│   ├── salesforce/             # Salesforce REST client
│   └── db/                     # Drizzle ORM + schemas
├── lambdas/                    # AWS Lambda handlers
├── infra/                      # AWS CDK stacks
├── docs/                       # Documentação
│   ├── ARQUITETURA.md          # Arquitetura completa
│   ├── BACKEND.md              # APIs e contratos
│   ├── SALA-VIRTUAL.md         # Campus virtual (avatares + voz)
│   └── APRESENTACAO.md         # Slides (Marp)
└── .github/workflows/          # CI/CD
```

---

## Documentação

| Documento | Conteúdo |
|-----------|---------|
| [ARQUITETURA.md](docs/ARQUITETURA.md) | AWS, Salesforce, Agentforce, Nova Sonic, fluxos, custos |
| [BACKEND.md](docs/BACKEND.md) | APIs, schemas, contratos request/response |
| [SALA-VIRTUAL.md](docs/SALA-VIRTUAL.md) | Campus 2D: Chime SDK, API GW WS, DynamoDB, avatares |
| [APRESENTACAO.md](docs/APRESENTACAO.md) | Slides para banca (formato Marp) |

---

## APIs

| Método | Endpoint | Função |
|--------|---------|--------|
| GET/POST/PATCH | `/api/v1/profile` | Perfil inteligente do aluno |
| GET | `/api/v1/recommend` | Recomendações de estudo + IA |
| GET/POST | `/api/v1/community` | Hub de comunidade |
| GET/POST | `/api/v1/risk-score` | Score de risco de evasão |
| POST | `/api/v1/salesforce/sync` | Sync para Salesforce |
| POST | `/api/v1/salesforce/webhook` | Webhooks do Salesforce |
| POST | `/api/v1/agentforce/chat` | Chat com Agentforce |

---

## Licença

Projeto acadêmico — uso educacional.
