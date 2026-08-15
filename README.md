# Vitru AVA — Plataforma Anti-Evasão EAD

> Ambiente Virtual de Aprendizagem inteligente focado em reduzir a evasão em cursos EAD (Unicesumar / UNIASSELVI), com recomendação adaptativa de estudos, perfil comportamental do aluno e integração com comunidade acadêmica.

## Visão do Projeto

Alunos EAD abandonam cursos por falta de direcionamento, isolamento social e ausência de acompanhamento personalizado. O Vitru AVA resolve isso com:

1. **Perfil Inteligente** — Coleta estilo de aprendizagem, rotina, objetivos e dificuldades
2. **Recomendação Adaptativa** — Direciona matérias, métodos de estudo e conteúdos (estilo NotebookLM)
3. **Detecção de Risco** — Score de evasão com alertas proativos via Salesforce CRM
4. **Comunidade Integrada** — Conecta o aluno a empresa júnior, grupos de pesquisa, atlética e networking

## Arquitetura

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (React/Next.js)                  │
├─────────────────────────────────────────────────────────────────┤
│  Dashboard │ Perfil │ Estudos │ Comunidade │ Assistente Vitru   │
└──────┬─────────┬─────────┬──────────┬──────────┬───────────────┘
       │         │         │          │          │
┌──────▼─────────▼─────────▼──────────▼──────────▼───────────────┐
│                     API Routes (Next.js)                         │
├─────────────────────────────────────────────────────────────────┤
│  /api/v1/vitru/chat          — Assistente IA                    │
│  /api/v1/vitru/study-plan    — Plano de estudo adaptativo       │
│  /api/v1/profile             — Perfil e onboarding              │
│  /api/v1/community           — Hub de comunidade                │
│  /api/v1/salesforce          — Webhooks e sincronização CRM     │
└──────┬─────────┬─────────┬──────────┬──────────┬───────────────┘
       │         │         │          │          │
┌──────▼─────────▼─────────▼──────────▼──────────▼───────────────┐
│                        Serviços                                  │
├────────────────┬────────────────────┬───────────────────────────┤
│   AWS          │   Salesforce       │   Módulos Internos        │
│                │                    │                           │
│ • Bedrock      │ • Education Cloud  │ • Learning Profile Engine │
│   (LLM IA)    │ • Lead Scoring     │ • Study Recommender       │
│ • Aurora       │ • Campaigns        │ • Community Matcher       │
│   Serverless   │ • Case Management  │ • Risk Score Calculator   │
│ • S3 (assets)  │ • Flow Automation  │                           │
│ • Cognito      │                    │                           │
│   (auth)       │                    │                           │
│ • CloudFront   │                    │                           │
│ • Lambda       │                    │                           │
└────────────────┴────────────────────┴───────────────────────────┘
```

## Stack Tecnológica

| Camada | Tecnologia | Função |
|--------|-----------|--------|
| Frontend | React 19, Next.js 16, Tailwind CSS 4 | Interface do aluno |
| Backend | Next.js API Routes, TypeScript | Lógica de negócio |
| Banco de Dados | Aurora Serverless v2 (PostgreSQL) | Persistência |
| ORM | Drizzle ORM | Acesso tipado ao banco |
| IA/ML | AWS Bedrock (Nova Micro) | Assistente, recomendações |
| CRM | Salesforce Education Cloud | Gestão de alunos em risco |
| Autenticação | AWS Cognito | Login, SSO |
| CDN/Assets | CloudFront + S3 | Conteúdo estático, materiais |
| IaC | AWS CDK (TypeScript) | Infraestrutura como código |
| CI/CD | GitHub Actions | Build, test, deploy |

## Integração Salesforce — Como Funciona

O Salesforce atua como **CRM de retenção**, não como backend do AVA:

```
Aluno interage no AVA
        │
        ▼
┌─────────────────────┐     ┌─────────────────────────────────┐
│  Risk Score Engine  │────▶│  Salesforce Education Cloud     │
│  (calcula risco de  │     │                                 │
│   evasão baseado em │     │  • Contact = Aluno              │
│   engajamento,      │     │  • Opportunity = Matrícula      │
│   notas, frequência)│     │  • Lead Score = Risco Evasão    │
└─────────────────────┘     │  • Campaign = Ação de Retenção  │
                            │  • Case = Intervenção           │
                            │  • Flow = Automação             │
                            └───────────┬─────────────────────┘
                                        │
                                        ▼
                            Coordenador recebe alerta →
                            Liga para o aluno, envia material,
                            agenda mentoria, convida para evento
```

## Integração AWS — Como Funciona

| Serviço | Uso no Projeto |
|---------|---------------|
| **Bedrock** | Geração de resumos adaptativos, assistente conversacional, recomendação de método de estudo |
| **Aurora Serverless v2** | Banco principal (pay-per-use, escala a zero) |
| **Cognito** | Autenticação do aluno com MFA, federação com Google/Microsoft |
| **S3** | Armazenamento de materiais didáticos, gravações de aula |
| **CloudFront** | CDN para entrega rápida de conteúdo |
| **Lambda** | Processamento assíncrono (cálculo de risk score, sync Salesforce) |
| **EventBridge** | Orquestração de eventos entre módulos |

## Módulos do Sistema

### 1. Learning Profile (Perfil Inteligente)
- Onboarding com perguntas sobre estilo de aprendizagem (visual, auditivo, leitura, cinestésico)
- Coleta de rotina (horários de trabalho, compromissos fixos)
- Objetivos de carreira e motivação
- Dificuldades acadêmicas autodeclaradas
- Score VARK + personalidade de estudo

### 2. Study Recommender (Recomendação Adaptativa)
- Direciona matérias por prioridade (prazo + peso + dificuldade)
- Sugere método de estudo baseado no perfil (flashcards, resumos, mapas mentais, questões)
- Gera resumos adaptativos com IA (Bedrock) — estilo NotebookLM
- Cria plano de estudo semanal que respeita a rotina do aluno
- Ajusta dificuldade progressivamente

### 3. Community Hub (Integração Social)
- Matching com grupos por área de interesse e curso
- Categorias: Empresa Júnior, Grupo de Pesquisa, Atlética, Networking Profissional
- Feed de eventos e oportunidades
- Sistema de mentoria entre veteranos e calouros
- Gamificação (badges, pontos por participação)

### 4. Risk Score Engine (Motor de Risco)
- Calcula score de evasão (0-100) baseado em:
  - Frequência de acesso ao AVA
  - Notas e submissões
  - Engajamento com assistente
  - Participação na comunidade
  - Padrão temporal (intervalos sem acesso)
- Sincroniza com Salesforce para ação da equipe de retenção

## Como Rodar Localmente

```bash
# 1. Clone o repositório
git clone https://github.com/seu-usuario/vitru-ava.git
cd vitru-ava

# 2. Instale as dependências
npm install

# 3. Configure variáveis de ambiente
cp .env.example .env.local
# Edite .env.local com suas credenciais

# 4. Inicialize o banco local (PGlite — não precisa de Docker)
npm run db:migrate
npm run db:seed

# 5. Rode o servidor de desenvolvimento
npm run dev
```

### Variáveis de Ambiente

```env
# AWS
AWS_REGION=us-east-1
BEDROCK_MODEL_ID=amazon.nova-micro-v1:0
AURORA_CLUSTER_ARN=arn:aws:rds:...
AURORA_SECRET_ARN=arn:aws:secretsmanager:...
AURORA_DATABASE=vitru

# Salesforce
SALESFORCE_INSTANCE_URL=https://sua-org.my.salesforce.com
SALESFORCE_CLIENT_ID=seu_connected_app_id
SALESFORCE_CLIENT_SECRET=seu_secret
SALESFORCE_USERNAME=integration@suaorg.com

# Auth
COGNITO_USER_POOL_ID=us-east-1_xxx
COGNITO_CLIENT_ID=xxx

# Database (local dev usa PGlite por padrão, não precisa dessas)
# DATABASE_DRIVER=pglite
# DATABASE_URL=postgresql://...
```

## Estrutura de Diretórios

```
vitru-ava/
├── app/                          # Next.js App Router (páginas)
│   ├── api/v1/                   # API Routes
│   │   ├── vitru/                # Assistente IA
│   │   ├── profile/              # Perfil do aluno
│   │   ├── community/            # Hub comunidade
│   │   └── salesforce/           # Webhooks Salesforce
│   ├── comunidade/               # Página de comunidade
│   ├── perfil/                   # Página de perfil/onboarding
│   ├── disciplinas/              # Disciplinas e trilha
│   └── calendario-de-estudos/    # Planner adaptativo
├── components/                   # Componentes React
│   ├── community/                # UI do hub de comunidade
│   ├── profile/                  # UI de perfil/onboarding
│   ├── study-recommender/        # UI de recomendações
│   └── vitru/                    # Assistente IA
├── lib/                          # Lógica de negócio
│   ├── salesforce/               # Client e sync Salesforce
│   ├── profile/                  # Learning Profile Engine
│   ├── recommender/              # Study Recommender
│   ├── community/                # Community Matcher
│   ├── risk-score/               # Motor de risco de evasão
│   ├── db/                       # Schema e client do banco
│   └── vitru/                    # Core do assistente IA
├── infra/                        # AWS CDK (infraestrutura)
└── .github/workflows/            # CI/CD
```

## Documentação Técnica

Documentos detalhados para avaliação aprofundada da arquitetura:

| Documento | Conteúdo |
|-----------|---------|
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Decisões arquiteturais, multi-repo vs monorepo, padrões (EDA, CQRS, BFF), trade-offs, evolução futura |
| [docs/AWS-INFRASTRUCTURE.md](docs/AWS-INFRASTRUCTURE.md) | Cada serviço AWS com justificativa, custos estimados, CDK, segurança, disaster recovery |
| [docs/SALESFORCE.md](docs/SALESFORCE.md) | Modelo de dados CRM, Flows de automação, OAuth, estrutura SFDX, KPIs de retenção |
| [docs/DATA-FLOW.md](docs/DATA-FLOW.md) | Fluxos completos de ponta a ponta (login → dashboard → IA → risk score → Salesforce → intervenção) |
| [infra/README.md](infra/README.md) | Como provisionar a infraestrutura com AWS CDK |

## Roadmap

- [x] AVA base com disciplinas, trilha de aprendizagem, avaliações
- [x] Assistente IA (Vitru) com AWS Bedrock
- [x] Banco Aurora Serverless com fallback PGlite
- [x] Módulo de Perfil Inteligente (Learning Profile)
- [x] Motor de Recomendação Adaptativa (Study Recommender)
- [x] Hub de Comunidade
- [x] Integração Salesforce (Risk Score → CRM)
- [ ] Autenticação com Cognito
- [ ] Infraestrutura CDK (deploy)
- [ ] CI/CD com GitHub Actions

## Licença

Projeto acadêmico — uso educacional.
