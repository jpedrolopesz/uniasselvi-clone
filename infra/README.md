# Infraestrutura AWS — CDK Stacks

> Como provisionar a infraestrutura completa do Vitru AVA na AWS usando CDK (TypeScript).

---

## Visão Geral

A infraestrutura é dividida em **stacks independentes**, cada uma responsável por um domínio:

```
infra/
├── bin/
│   └── vitru-infra.ts              # Entry point — instancia os stacks
├── lib/
│   ├── database-stack.ts           # Aurora Serverless v2 + VPC
│   ├── auth-stack.ts               # Cognito User Pool + Client
│   ├── storage-stack.ts            # S3 buckets + CloudFront distribution
│   ├── compute-stack.ts            # Lambdas (risk score, SF sync)
│   ├── events-stack.ts             # EventBridge bus + rules + scheduler
│   └── monitoring-stack.ts         # CloudWatch dashboards + alarms
├── lambdas/
│   ├── calculate-risk-scores/
│   │   └── index.ts                # Lambda: batch diário de risk score
│   └── sync-salesforce/
│       └── index.ts                # Lambda: sync risk → Salesforce
├── cdk.json
├── tsconfig.json
└── package.json
```

---

## Stacks

### 1. DatabaseStack — Aurora Serverless v2

**O que provisiona:**
- VPC com 2 AZs (subnets privadas para o banco)
- Aurora Serverless v2 (PostgreSQL 16)
- Data API habilitada (HTTP, sem connection pool)
- Secrets Manager para credenciais
- Security Group restritivo

**Parâmetros:**
| Param | Default | Descrição |
|-------|---------|-----------|
| minCapacity | 0.5 ACU | Mínimo (custo em repouso ~$43/mês) |
| maxCapacity | 8 ACU | Máximo sob carga |
| databaseName | vitru | Nome do database |
| backupRetention | 35 days | Point-in-time recovery |

**Exemplo CDK:**
```typescript
const cluster = new rds.DatabaseCluster(this, "VitruDB", {
  engine: rds.DatabaseClusterEngine.auroraPostgres({
    version: rds.AuroraPostgresEngineVersion.VER_16_1,
  }),
  serverlessV2MinCapacity: 0.5,
  serverlessV2MaxCapacity: 8,
  writer: rds.ClusterInstance.serverlessV2("writer"),
  vpc,
  defaultDatabaseName: "vitru",
  enableDataApi: true,
});
```

---

### 2. AuthStack — AWS Cognito

**O que provisiona:**
- User Pool com email como username
- App Client (para o frontend)
- Grupos: `aluno`, `coordenador`, `admin`
- MFA opcional (TOTP)
- Federated Identity (Google, Microsoft)

**Fluxo de auth:**
```
Aluno → Cognito Hosted UI → JWT → Cookie HttpOnly → API Routes
```

**Exemplo CDK:**
```typescript
const userPool = new cognito.UserPool(this, "VitruUsers", {
  selfSignUpEnabled: true,
  signInAliases: { email: true },
  autoVerify: { email: true },
  mfa: cognito.Mfa.OPTIONAL,
  passwordPolicy: {
    minLength: 8,
    requireUppercase: true,
    requireDigits: true,
  },
});

const client = userPool.addClient("WebApp", {
  authFlows: { userSrp: true },
  oAuth: {
    flows: { authorizationCodeGrant: true },
    callbackUrls: ["https://vitru-ava.com/api/auth/callback"],
  },
});
```

---

### 3. StorageStack — S3 + CloudFront

**O que provisiona:**
- Bucket S3 para materiais didáticos
- Bucket S3 para uploads de alunos
- CloudFront distribution com OAI
- Certificado ACM (HTTPS)
- Cache policies otimizadas

**Estrutura S3:**
```
vitru-content-prod/
├── materials/{courseCode}/{subjectCode}/  # PDFs, slides
├── recordings/{subjectCode}/              # Vídeos de aulas
├── profiles/{studentId}/                  # Avatares
└── community/{groupId}/                   # Imagens de grupos
```

---

### 4. ComputeStack — Lambdas

**O que provisiona:**
- Lambda `calculate-risk-scores` (Node.js 20, 512MB, 5min timeout)
- Lambda `sync-salesforce` (Node.js 20, 256MB, 30s timeout)
- IAM Roles com least privilege
- Layers compartilhadas (Drizzle, AWS SDK)
- Dead letter queue (SQS) para falhas

**Permissões:**
| Lambda | Acessa |
|--------|--------|
| calculate-risk-scores | Aurora (read/write), EventBridge (put) |
| sync-salesforce | Secrets Manager (read), HTTPS outbound (SF) |

---

### 5. EventsStack — EventBridge

**O que provisiona:**
- Event Bus customizado: `vitru-events`
- Rules de roteamento
- Scheduler para cron jobs

**Rules:**
```typescript
// Risk score mudou para alto/crítico → sync Salesforce
new events.Rule(this, "HighRiskRule", {
  eventBus,
  eventPattern: {
    source: ["vitru.risk-engine"],
    detailType: ["student.risk_score_changed"],
    detail: { level: ["high", "critical"] },
  },
  targets: [new targets.LambdaFunction(syncSalesforceLambda)],
});

// Cron: calcular risk scores toda madrugada
new scheduler.CfnSchedule(this, "DailyRiskCalc", {
  scheduleExpression: "cron(0 2 * * ? *)",
  target: { arn: calculateRiskLambda.functionArn, ... },
});
```

---

### 6. MonitoringStack — CloudWatch

**O que provisiona:**
- Dashboard com métricas-chave
- Alarmes para situações críticas
- SNS topics para notificação

**Alarmes configurados:**
| Alarme | Condição | Ação |
|--------|---------|------|
| Aurora CPU > 80% | 5min sustained | Email DevOps |
| Lambda errors > 5 | Em 15min | Email DevOps |
| Bedrock throttling | Qualquer | Email DevOps |
| Risk Score Lambda timeout | Qualquer | Email + PagerDuty |

---

## Como Fazer Deploy

### Pré-requisitos

```bash
# 1. AWS CLI configurada com credenciais
aws configure

# 2. CDK instalado globalmente
npm install -g aws-cdk

# 3. Dependências do projeto de infra
cd infra
npm install
```

### Primeiro deploy (bootstrap)

```bash
# Bootstrap da conta AWS (só na primeira vez)
cdk bootstrap aws://ACCOUNT_ID/us-east-1
```

### Deploy dos stacks

```bash
# Deploy tudo de uma vez
cdk deploy --all

# Ou deploy individual (em ordem de dependência)
cdk deploy VitruDatabaseStack
cdk deploy VitruAuthStack
cdk deploy VitruStorageStack
cdk deploy VitruComputeStack
cdk deploy VitruEventsStack
cdk deploy VitruMonitoringStack
```

### Verificar o que será criado (sem executar)

```bash
cdk diff        # Mostra mudanças pendentes
cdk synth       # Gera CloudFormation template
```

---

## Ambientes

| Ambiente | Account | Região | Branch |
|----------|---------|--------|--------|
| Dev | 111111111111 | us-east-1 | `develop` |
| Staging | 222222222222 | us-east-1 | `staging` |
| Prod | 333333333333 | sa-east-1 | `main` |

```typescript
// bin/vitru-infra.ts
const app = new cdk.App();
const env = app.node.tryGetContext("env") || "dev";

new VitruDatabaseStack(app, `Vitru-${env}-Database`, {
  env: { account: accounts[env], region: regions[env] },
});
```

Deploy por ambiente:
```bash
cdk deploy --all --context env=staging
cdk deploy --all --context env=prod
```

---

## Custos por Ambiente

| Recurso | Dev | Staging | Prod |
|---------|-----|---------|------|
| Aurora | $0 (PGlite local) | $43/mês (0.5 ACU) | $80-120/mês |
| Cognito | $0 (mock) | $0 (< 50k MAU) | $0 |
| Lambda | $0 (local) | $1/mês | $3-5/mês |
| S3 + CF | $0 | $5/mês | $90/mês |
| Bedrock | $0 (sandbox) | $20/mês | $300-400/mês |
| **Total** | **$0** | **~$70/mês** | **~$500-620/mês** |

---

## Destruir Infraestrutura

```bash
# Remove tudo (cuidado: irreversível para dados)
cdk destroy --all

# O Aurora tem RemovalPolicy.RETAIN — precisa deletar manualmente no console
```

---

## CI/CD (GitHub Actions)

O deploy é automatizado via GitHub Actions:

```yaml
# .github/workflows/deploy-infra.yml
name: Deploy Infrastructure
on:
  push:
    branches: [main]
    paths: ['infra/**']

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: cd infra && npm ci
      - run: cd infra && npx cdk deploy --all --require-approval never
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
```
