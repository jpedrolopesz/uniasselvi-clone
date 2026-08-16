# Documento de Arquitetura — Vitru AVA

> Plataforma EAD anti-evasão para Unicesumar e UNIASSELVI.
> AWS (Aurora, Cognito, Lambda, Bedrock Nova Sonic, Chime SDK, API Gateway WS) + Salesforce (Agentforce + Education Cloud).

---

## 1. Problema

Evasão em EAD no Brasil: **+30%** (INEP/MEC).

| Fator | Impacto | Solução Vitru |
|-------|---------|--------------|
| Falta de direcionamento | 35% | Agentforce (texto) + Nova Sonic (voz) |
| Isolamento social | 25% | Sala Virtual com avatares + voz por proximidade |
| Sem acompanhamento | 20% | Risk score + alertas Salesforce CRM |
| Dificuldade com conteúdo | 12% | Conteúdo adaptativo por perfil VARK |
| Financeiro | 8% | Detecção + encaminhamento |

---

## 2. Arquitetura de Alto Nível

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                             ALUNO (Browser)                                  │
└──────┬───────────────────┬────────────────────┬─────────────────────────────┘
       │                   │                    │
  Navega no AVA     Conversa com IA      Sala Virtual (avatares)
       │                   │                    │
       ▼                   ▼                    ▼
┌────────────────┐  ┌──────────────┐  ┌───────────────────────────────────────┐
│  FRONTEND      │  │ AGENTES IA   │  │         CAMPUS VIRTUAL                │
│  React/Next.js │  │              │  │                                       │
│                │  │ Texto:       │  │  PixiJS (Canvas 2D)                   │
│  • Dashboard   │  │ Salesforce   │  │  API Gateway WebSocket (sync posição) │
│  • Disciplinas │  │ Agentforce   │  │  Amazon Chime SDK (voz proximidade)   │
│  • Perfil VARK │  │              │  │  DynamoDB (estado real-time)           │
│  • Comunidade  │  │ Voz:         │  │  S3 + CloudFront (assets/sprites)     │
│  • Calendário  │  │ Amazon Nova  │  │                                       │
│  • Risk Score  │  │ Sonic        │  │  Salas: EJ, Pesquisa, Atlética,       │
│                │  │ (Bedrock)    │  │  Networking, Auditório, Estudo        │
└──────┬─────────┘  └──────┬───────┘  └──────────────────┬────────────────────┘
       │                   │                             │
       ▼                   ▼                             ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                              AWS CLOUD                                        │
│                                                                              │
│  ┌──────────┐ ┌──────────┐ ┌───────────┐ ┌──────────┐ ┌────────────────┐   │
│  │ Cognito  │ │ Aurora   │ │ Lambda +  │ │ Bedrock  │ │ API Gateway WS │   │
│  │ (auth)   │ │ Server v2│ │ EventBridge│ │Nova Sonic│ │ + Chime SDK    │   │
│  └──────────┘ └──────────┘ └───────────┘ └──────────┘ └────────────────┘   │
│                                                                              │
│  ┌──────────┐ ┌──────────┐ ┌───────────┐                                   │
│  │ S3 + CF  │ │ DynamoDB │ │ SES       │                                   │
│  │ (assets) │ │(real-time)│ │ (emails)  │                                   │
│  └──────────┘ └──────────┘ └───────────┘                                   │
└──────────────────────────────────────────────────────────────────────────────┘
                               │
                               ▼ (sync risk score + perfil)
┌──────────────────────────────────────────────────────────────────────────────┐
│                        SALESFORCE                                             │
│                                                                              │
│  Agentforce Builder (IA texto)  │  Education Cloud (CRM retenção)            │
│  • Topics: estudo, comunidade,  │  • Contact = aluno                         │
│    planejamento, progresso      │  • Case = intervenção coordenador          │
│  • Actions: Apex invocable      │  • Campaign = ação retenção                │
│                                 │  • Flow = automação                        │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Agentes de IA — Duas Opções Complementares

### 3.1 Salesforce Agentforce (Texto)

**Canal:** Painel aberto pelo botão "Vitru" no menu lateral (sidebar) → tab "Agentforce"
**Protocolo:** REST API (Agent API v62.0)
**Quando usar:** Interações textuais, recomendações detalhadas, ações no CRM

| Topic | O que faz |
|-------|----------|
| Recomendação de Estudo | Prioriza disciplinas por prazo/nota/progresso |
| Modos de Estudo | Sugere método baseado no VARK (mapas mentais, exercícios) |
| Planejamento | Cria plano semanal respeitando rotina |
| Comunidade | Matching com grupos por skills/curso |
| Progresso | Resume score + notas + tendência |

**Fluxo:**
```
Aluno digita → POST /api/v1/agentforce/chat
  → Backend autentica (OAuth Client Credentials)
  → Cria sessão / envia mensagem para Agent API
  → Agentforce consulta Contact + Disciplines__c + Risk_Score__c
  → Retorna resposta personalizada
```

### 3.2 Amazon Nova Sonic (Voz)

**Canal:** Painel aberto pelo botão "Vitru" no menu lateral (sidebar) → tab "Nova Sonic"
**Protocolo:** WebSocket bidirectional (Bedrock Converse Stream)
**Quando usar:** Interações por voz, hands-free, acessibilidade

**O que é Nova Sonic:**
- Modelo speech-to-speech da AWS (Bedrock)
- Recebe áudio do aluno → processa → retorna áudio como resposta
- Sem pipeline separado de STT + LLM + TTS (tudo em um modelo)
- Latência: <1s para primeira resposta
- Suporta português brasileiro

**Fluxo:**
```
Aluno pressiona mic → captura áudio (MediaRecorder API)
  → WebSocket bidirectional com Bedrock
  → Nova Sonic processa speech-to-speech
  → Retorna áudio da resposta
  → Browser reproduz (AudioContext)
```

**Integração com contexto do aluno:**
```typescript
// System prompt enviado junto com o áudio
const systemPrompt = `Você é Vitru, assistente de estudos EAD.
Aluno: visual/cinestésico, trabalha integral, curso ADM.
Disciplinas: Estatística (prova em 3 dias), Cálculo I (nota 5.2).
Risk score: 62/100.
Responda de forma breve e direta.`;

// Nova Sonic recebe: system prompt + áudio do aluno
// Nova Sonic retorna: áudio da resposta
```

**Custo:** ~$0.0007/segundo de áudio (input + output)
**Estimativa:** 5.000 interações/dia × 30s médio = **~$100/mês**

---

## 4. Sala Virtual (Campus 2D) — 100% AWS

### Conceito
Mapa 2D estilo Habbo onde alunos andam com avatares e conversam por voz conforme se aproximam.

### Serviços AWS

| Serviço | Função |
|---------|--------|
| **API Gateway WebSocket** | Sync de posição real-time (30 msgs/s) |
| **Lambda** | Handlers: connect, message, disconnect, broadcast |
| **DynamoDB** | Posições (TTL), connections, estado das salas |
| **Amazon Chime SDK** | Voz WebRTC com controle de volume por participante |
| **S3 + CloudFront** | Sprites, mapas (Tiled JSON), assets estáticos |
| **Cognito** | Mesmo auth do AVA |

### Voz por Proximidade (Chime SDK)
```
Volume de cada peer = f(distância entre avatares)

Se distância < 150px → volume = 1 - (dist/150)
Se distância > 150px → volume = 0 (silêncio)
```

### Salas Temáticas
- Hall Principal (lobby)
- Empresa Júnior
- Grupo de Pesquisa
- Atlética
- Networking
- Auditório (eventos ao vivo)
- Sala de Estudo (silêncio)

Documentação completa: [`docs/SALA-VIRTUAL.md`](SALA-VIRTUAL.md)

---

## 5. Serviços AWS — Resumo

| Serviço | Função |
|---------|--------|
| **Amplify** | Hospeda Next.js (frontend + API) |
| **Cognito** | Auth (login, MFA, JWT, grupos) |
| **Aurora Serverless v2** | Banco PostgreSQL (dados do AVA) |
| **Bedrock (Nova Sonic)** | IA por voz speech-to-speech |
| **Lambda + EventBridge** | Risk score + sync SF + broadcast sala |
| **API Gateway WebSocket** | Real-time sala virtual |
| **DynamoDB** | Estado real-time (posições, conexões) |
| **Amazon Chime SDK** | Voz WebRTC (sala virtual) |
| **S3 + CloudFront** | Conteúdo + assets (CDN) |
| **SES** | Emails (alertas, campanhas) |

---

## 6. Integração Salesforce

| Objeto SF | Representa |
|-----------|-----------|
| Contact | Aluno (perfil, curso, VARK, risk level) |
| Discipline__c | Matérias, notas, prazos |
| Study_Preferences__c | Preferências de estudo |
| Community_Group__c | Grupos disponíveis |
| Risk_Score__c | Histórico de scores |
| Case | Intervenção do coordenador |
| Campaign | Ações de retenção |

**Fluxo:**
```
Aurora (dados AVA) → Lambda (sync diário) → Salesforce (CRM)
  → Agentforce consulta dados → conversa com aluno
  → Score alto → Flow cria Case → Coordenador age
  → Webhook → AVA personaliza experiência
```

---

## 7. Custo Total (10.000 alunos)

| Serviço | Custo/mês |
|---------|-----------|
| Amplify | $15 |
| Aurora Serverless | $100 |
| Cognito | $0 |
| Nova Sonic (voz) | $100 |
| Lambda + EventBridge | $10 |
| API Gateway WS (sala) | $15 |
| DynamoDB (sala) | $10 |
| Chime SDK (voz sala) | $50 |
| S3 + CloudFront | $90 |
| SES | $5 |
| **Total AWS** | **~$395/mês** |
| Salesforce (licença edu) | Variável |

---

## 8. Decisões Arquiteturais

| Decisão | Motivo |
|---------|--------|
| Agentforce (texto) + Nova Sonic (voz) | Dois canais: texto detalhado + voz rápida/acessível |
| Aurora (banco AVA) + DynamoDB (real-time) | Relacional para dados + key-value para posições |
| Chime SDK (voz sala) | AWS nativo, serverless, integra Cognito |
| API Gateway WS (sala) | Serverless, paga por msg, sem servidor |
| Monorepo Next.js | SSR + API + sala no mesmo deploy |
| CDK (IaC) | Toda infra provisionável com 1 comando |

---

## 9. Segurança e LGPD

| Item | Implementação |
|------|--------------|
| Auth | Cognito + JWT + MFA |
| Identidade | UUID (sem CPF) |
| Encryption | KMS (rest) + TLS 1.3 (transit) |
| Dados | Aurora em VPC, sa-east-1 |
| Voz | Chime SDK criptografado end-to-end |
| Exclusão | Endpoint de delete cascade |

---

## 10. Evolução Futura

1. Einstein Prediction — ML preditivo de evasão no Salesforce
2. Nova Sonic com tool-use — agente de voz executa ações no AVA
3. React Native — App mobile com mesmo backend
4. Data Cloud — Unifica dados multi-instituição
5. Sala Virtual 3D — Migrar de 2D para Three.js/WebXR
