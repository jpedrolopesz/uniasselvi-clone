# Infraestrutura AWS — Vitru AVA

> Justificativa técnica de cada serviço AWS utilizado, custos estimados,
> e como a infraestrutura seria provisionada com AWS CDK em produção.

---

## 1. Visão Geral dos Serviços

```
┌─────────────────────────────────────────────────────────────────────┐
│                          AWS Cloud                                   │
│                                                                     │
│  ┌───────────┐    ┌───────────┐    ┌───────────┐    ┌───────────┐  │
│  │CloudFront │    │  Cognito  │    │    S3     │    │    SES    │  │
│  │   (CDN)   │    │  (Auth)   │    │ (Storage) │    │  (Email)  │  │
│  └─────┬─────┘    └─────┬─────┘    └─────┬─────┘    └─────┬─────┘  │
│        │                │                │                │        │
│  ┌─────▼─────────────────▼────────────────▼────────────────▼─────┐  │
│  │                  Amplify / Vercel (Hosting)                    │  │
│  │                  Next.js (Frontend + API)                     │  │
│  └───────────────────────────┬───────────────────────────────────┘  │
│                              │                                      │
│        ┌─────────────────────┼─────────────────────┐               │
│        │                     │                     │               │
│  ┌─────▼─────┐        ┌─────▼─────┐        ┌─────▼─────┐         │
│  │  Bedrock  │        │  Aurora   │        │EventBridge│         │
│  │  (LLM IA) │        │Serverless │        │ (Eventos) │         │
│  └───────────┘        │   v2      │        └─────┬─────┘         │
│                       └───────────┘              │               │
│                                            ┌─────▼─────┐         │
│                                            │  Lambda   │         │
│                                            │(Risk Score│         │
│                                            │ SF Sync)  │         │
│                                            └───────────┘         │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 2. Justificativa por Serviço

### 2.1 AWS Bedrock (IA Generativa)

**O que faz no projeto:**
- Assistente conversacional Vitru (chat/voz)
- Geração de resumos adaptativos (estilo NotebookLM)
- Criação de flashcards, mapas mentais, quizzes
- Análise de sentimento das mensagens do aluno

**Por que Bedrock e não OpenAI/Claude direto:**
| Critério | Bedrock | OpenAI API | Self-hosted |
|----------|---------|-----------|-------------|
| Integração AWS nativa | ✅ IAM, VPC, CloudWatch | ❌ Chave externa | ❌ |
| Sem dados saindo da AWS | ✅ | ❌ Dados vão para US | ✅ |
| Pay-per-token (sem provisionamento) | ✅ | ✅ | ❌ GPU cara |
| Múltiplos modelos (troca sem mudar código) | ✅ | ❌ Vendor lock | ❌ |
| Latência para Aurora na mesma região | ✅ ~50ms | ❌ ~200ms | Depende |

**Modelo escolhido:** `amazon.nova-micro-v1:0`
- Custo: ~$0.035 / 1M tokens input, ~$0.14 / 1M tokens output
- Latência: ~1-2s por resposta
- Suficiente para chat educacional e geração de conteúdo curto

**Uso estimado (10.000 alunos):**
- ~5.000 interações/dia × 500 tokens médio = 2.5M tokens/dia
- Custo: ~$10-15/dia = **~$350/mês**

---

### 2.2 Aurora Serverless v2 (Banco de Dados)

**O que faz no projeto:**
- Armazena tudo: alunos, disciplinas, perfis, scores, conversas, comunidades
- Relações complexas (aluno → disciplinas → avaliações → notas)
- Queries analíticas para risk score

**Por que Aurora Serverless e não RDS/DynamoDB:**
| Critério | Aurora Serverless v2 | RDS Postgres | DynamoDB |
|----------|---------------------|-------------|----------|
| Escala a zero | ✅ (0.5 ACU mínimo) | ❌ Sempre ligado | ✅ |
| SQL/Relacional | ✅ PostgreSQL | ✅ | ❌ NoSQL |
| Pay-per-use | ✅ Por ACU-hora | ❌ Por instância | ✅ Por RCU/WCU |
| Joins complexos | ✅ | ✅ | ❌ |
| Custo em repouso | ~$43/mês (0.5 ACU) | ~$50-200/mês | $0 |
| Data API (HTTP) | ✅ Sem connection pool | ❌ Precisa de pool | ✅ |

**Data API** é essencial: Next.js serverless não mantém conexão TCP aberta. A Data API é HTTP puro — cada request é independente.

**Custo estimado:**
- 0.5-4 ACUs em horário de pico = **~$80-120/mês**

---

### 2.3 AWS Cognito (Autenticação)

**O que faz no projeto:**
- Login do aluno (email + senha)
- Federação com Google / Microsoft (muitos alunos usam)
- MFA (segundo fator via SMS ou app)
- JWT tokens para autorizar API calls
- Groups: `aluno`, `coordenador`, `admin`

**Por que Cognito e não Auth0/Firebase Auth:**
| Critério | Cognito | Auth0 | Firebase Auth |
|----------|---------|-------|--------------|
| Integração IAM (Aurora, S3, Lambda) | ✅ Nativo | ❌ Manual | ❌ Manual |
| Custo até 50k MAU | ✅ Free tier | ❌ ~$228/mês | ✅ Free |
| Customização de UI | ⚠️ Hosted UI ok | ✅ Lock | ✅ |
| Self-hosted | ❌ | ❌ | ❌ |
| Compliance BR (LGPD) | ✅ Dados na região | ⚠️ US | ⚠️ US |

**Custo estimado:**
- Primeiros 50.000 MAU: **gratuito**
- Acima: $0.0055/MAU

---

### 2.4 Amazon S3 (Armazenamento)

**O que faz no projeto:**
- Materiais didáticos (PDFs, slides)
- Gravações de aula (vídeo/áudio)
- Imagens de perfil e community
- Exports de relatórios

**Estrutura de buckets:**
```
vitru-content-{env}/
├── materials/{courseCode}/{subjectCode}/
│   ├── lesson-01.pdf
│   └── slides-01.pptx
├── recordings/{subjectCode}/
│   └── aula-2025-03-15.mp4
├── profiles/{studentId}/
│   └── avatar.jpg
└── exports/
    └── risk-report-2025-03.csv
```

**Custo estimado:**
- 100GB de conteúdo: **~$2.30/mês** (S3 Standard)
- 1TB de transfer out via CloudFront: **~$85/mês**

---

### 2.5 Amazon CloudFront (CDN)

**O que faz no projeto:**
- Entrega rápida de vídeos e PDFs (edge locations no Brasil)
- Cache do frontend estático (JS, CSS, imagens)
- HTTPS automático (ACM certificate)
- Proteção DDoS básica (Shield Standard incluído)

**Latência esperada:**
- Sem CDN (S3 us-east-1 → aluno em SP): ~150ms
- Com CloudFront (edge SP): **~20ms**

---

### 2.6 AWS Lambda (Processamento Assíncrono)

**O que faz no projeto:**

| Lambda | Trigger | Função |
|--------|---------|--------|
| `calculate-risk-scores` | EventBridge (cron: 02:00 UTC diário) | Calcula score de todos os alunos |
| `sync-salesforce` | EventBridge (evento: risk_score_changed) | Envia score para Salesforce |
| `generate-weekly-report` | EventBridge (cron: segunda 08:00) | Relatório semanal para coordenadores |
| `process-engagement-event` | EventBridge (evento: student.*) | Atualiza métricas de engajamento |

**Por que Lambda e não ECS/Fargate:**
- Executa por segundos, não minutos — Lambda é mais barato
- Sem servidor para gerenciar
- Escala automaticamente com eventos
- Pay-per-invocation (não paga ociosa)

**Custo estimado:**
- ~50.000 invocações/mês × 3s médio = **~$3/mês** (free tier cobre a maior parte)

---

### 2.7 Amazon EventBridge (Orquestração)

**O que faz no projeto:**
- Bus de eventos que conecta módulos sem acoplamento direto
- Rules que roteiam eventos para Lambdas específicas
- Scheduler para cron jobs (risk score diário, reports semanais)

**Eventos definidos:**
```json
{
  "source": "vitru.ava",
  "detail-type": "student.risk_score_changed",
  "detail": {
    "studentId": "uuid",
    "previousScore": 45,
    "newScore": 72,
    "level": "high",
    "timestamp": "2025-08-15T02:00:00Z"
  }
}
```

**Rules:**
```
student.risk_score_changed WHERE detail.level IN ["high","critical"]
  → Target: Lambda sync-salesforce

student.completed_lesson
  → Target: Lambda process-engagement-event

schedule: rate(1 day)
  → Target: Lambda calculate-risk-scores
```

---

### 2.8 Amazon SES (Email)

**O que faz no projeto:**
- Emails transacionais (reset de senha, confirmação de cadastro)
- Alertas para coordenadores (aluno em risco)
- Newsletters de comunidade (eventos, oportunidades)

**Custo:** $0.10 por 1.000 emails = desprezível

---

## 3. Custo Total Estimado (10.000 alunos)

| Serviço | Estimativa Mensal |
|---------|------------------|
| Aurora Serverless v2 | $80-120 |
| Bedrock (IA) | $300-400 |
| CloudFront + S3 | $90 |
| Lambda | $3-5 |
| Cognito | $0 (free tier) |
| EventBridge | $1-2 |
| SES | $5 |
| **Total** | **~$500-620/mês** |

**Comparativo:** Uma instância EC2 m5.xlarge (abordagem tradicional) custaria ~$140/mês só de compute — mas não escala, não tem IA, e exige manutenção 24/7.

---

## 4. AWS CDK — Infraestrutura como Código

O CDK provisiona tudo automaticamente. Estrutura:

```
infra/
├── bin/
│   └── vitru-infra.ts          # Entry point
├── lib/
│   ├── database-stack.ts       # Aurora Serverless v2
│   ├── auth-stack.ts           # Cognito User Pool
│   ├── storage-stack.ts        # S3 + CloudFront
│   ├── compute-stack.ts        # Lambdas
│   ├── events-stack.ts         # EventBridge bus + rules
│   └── monitoring-stack.ts     # CloudWatch dashboards + alarms
├── lambdas/
│   ├── calculate-risk-scores/
│   │   └── index.ts
│   └── sync-salesforce/
│       └── index.ts
├── cdk.json
├── tsconfig.json
└── package.json
```

### Exemplo: Database Stack

```typescript
import * as cdk from "aws-cdk-lib";
import * as rds from "aws-cdk-lib/aws-rds";
import * as ec2 from "aws-cdk-lib/aws-ec2";

export class DatabaseStack extends cdk.Stack {
  public readonly cluster: rds.DatabaseCluster;

  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, "VitruVpc", { maxAzs: 2 });

    this.cluster = new rds.DatabaseCluster(this, "VitruAurora", {
      engine: rds.DatabaseClusterEngine.auroraPostgres({
        version: rds.AuroraPostgresEngineVersion.VER_16_1,
      }),
      serverlessV2MinCapacity: 0.5,
      serverlessV2MaxCapacity: 8,
      writer: rds.ClusterInstance.serverlessV2("writer"),
      vpc,
      defaultDatabaseName: "vitru",
      enableDataApi: true, // Habilita HTTP Data API
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });
  }
}
```

### Deploy

```bash
# Instalar CDK
npm install -g aws-cdk

# Bootstrap (primeira vez na conta)
cdk bootstrap aws://ACCOUNT_ID/us-east-1

# Deploy todos os stacks
cdk deploy --all

# Deploy específico
cdk deploy VitruDatabaseStack
```

---

## 5. Ambientes

| Ambiente | Banco | IA | Salesforce | Deploy |
|----------|-------|---|-----------|--------|
| **Local (dev)** | PGlite (embarcado) | Bedrock (sandbox) | Mock/Sandbox | `npm run dev` |
| **Staging** | Aurora Serverless (dev) | Bedrock | Salesforce Sandbox | Push → branch `staging` |
| **Produção** | Aurora Serverless (prod) | Bedrock | Salesforce Prod | Merge → `main` |

O `DATABASE_DRIVER` env var controla qual backend usar:
- `pglite` → desenvolvimento local sem dependências
- `postgres` → Docker local para paridade
- `aws-data-api` → produção com Aurora

---

## 6. Segurança da Infraestrutura

| Camada | Proteção |
|--------|---------|
| Rede | VPC com subnets privadas para Aurora, sem acesso público |
| Secrets | AWS Secrets Manager (credenciais Salesforce, DB) |
| IAM | Princípio de menor privilégio — cada Lambda tem role específica |
| Encryption | At rest (KMS) e in transit (TLS) para todos os serviços |
| WAF | CloudFront com AWS WAF (rate limiting, bot detection) |
| Backup | Aurora backup automático (35 dias de retenção) |
| LGPD | Dados na região sa-east-1 (São Paulo) quando possível |

---

## 7. Disaster Recovery

| Cenário | RTO | RPO | Estratégia |
|---------|-----|-----|-----------|
| Aurora falha | < 30s | 0 (multi-AZ) | Failover automático |
| Região inteira cai | < 1h | < 5min | Aurora Global Database (cross-region) |
| Dados corrompidos | < 2h | < 5min | Point-in-time recovery |
| Deploy quebrou | < 5min | 0 | Rollback automático no Amplify |
