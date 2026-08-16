---
marp: true
theme: default
paginate: true
backgroundColor: #0d0d0d
color: #ffffff
style: |
  section { font-family: 'Segoe UI', sans-serif; }
  h1 { color: #ffcc00; }
  h2 { color: #ffcc00; }
  strong { color: #ffcc00; }
  table { font-size: 0.75em; }
---

# Vitru AVA
## Plataforma Anti-Evasão EAD

**Unicesumar | UNIASSELVI**

AWS + Salesforce Agentforce + Amazon Nova Sonic + Sala Virtual

---

# O Problema

## Evasão em EAD: **+30%**

| Fator | Impacto |
|-------|---------|
| Falta de direcionamento | 35% |
| Isolamento social | 25% |
| Sem acompanhamento | 20% |
| Dificuldade com conteúdo | 12% |
| Financeiro | 8% |

> Ninguém percebe. Ninguém age a tempo.

---

# A Solução — 4 Pilares

| Pilar | Tecnologia |
|-------|-----------|
| 🤖 IA que conversa (texto + voz) | Salesforce **Agentforce** + AWS **Nova Sonic** |
| 📊 Detecção de risco | AWS Lambda + **Risk Score Engine** |
| 🤝 Comunidade integrada | Hub + **Sala Virtual** (avatares + voz) |
| 📚 Recomendação adaptativa | Perfil VARK + planejamento inteligente |

---

# Agentes de IA — Texto + Voz

```
┌───────────────────────────────────────────────────────┐
│              ASSISTENTE VITRU (canto esquerdo)         │
│                                                       │
│  Modo Texto: Salesforce Agentforce                    │
│  • Agent API REST                                     │
│  • Topics: estudo, comunidade, planejamento           │
│  • Consulta dados do aluno no CRM                     │
│                                                       │
│  Modo Voz: Amazon Nova Sonic (Bedrock)                │
│  • Speech-to-speech (sem STT+TTS separados)           │
│  • WebSocket bidirectional                            │
│  • Latência <1s, português nativo                     │
│  • Hands-free, acessível                              │
└───────────────────────────────────────────────────────┘
```

---

# Amazon Nova Sonic — IA por Voz

**O que é:** Modelo speech-to-speech da AWS (Bedrock)

**Como funciona:**
```
Aluno fala → Mic captura áudio
  → WebSocket → Bedrock Nova Sonic
  → Processa (entende + gera resposta)
  → Retorna áudio da resposta
  → Browser reproduz
```

**Vantagens:**
- Sem pipeline cascata (STT → LLM → TTS)
- Latência <1s
- Contexto do aluno no system prompt
- Pay-per-second (~$0.0007/s)

---

# Sala Virtual — Campus com Avatares

**Conceito:** Mapa 2D estilo Habbo com avatares e voz por proximidade

```
┌─────────────────────────────────────────┐
│          CAMPUS VIRTUAL                  │
│                                         │
│  🧑 João ──🔊── 👩 Maria               │
│  (próximos = se ouvem)                  │
│                                         │
│  📌 EJ Admin    🏋️ Atlética            │
│  (sala)          (sala)                 │
│                                         │
│  🎤 Auditório (evento ao vivo)          │
└─────────────────────────────────────────┘
```

---

# Sala Virtual — AWS Stack

| Serviço AWS | Função |
|-------------|--------|
| **API Gateway WebSocket** | Sync posição avatares (real-time) |
| **Lambda** | Broadcast, lógica de sala |
| **DynamoDB** | Posições, conexões (TTL) |
| **Amazon Chime SDK** | Voz WebRTC por proximidade |
| **S3 + CloudFront** | Sprites, mapas, tiles |
| **Cognito** | Mesmo login do AVA |

**Voz por proximidade:**
```
Volume = 1 - (distância / raio)
Se longe → silêncio
Se perto → volume alto
```

---

# Arquitetura Completa

```
      ALUNO
        │
  ┌─────┼──────────────────────┐
  │     │                      │
  ▼     ▼                      ▼
AVA   Agente IA          Sala Virtual
React  (texto/voz)       (avatares+voz)
  │     │                      │
  └─────┼──────────────────────┘
        │
        ▼
┌─────────────────────────────────┐
│           AWS CLOUD             │
│ Aurora · Cognito · Lambda       │
│ Bedrock · Chime · DynamoDB      │
│ API GW WS · S3 · EventBridge   │
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│         SALESFORCE              │
│ Agentforce · Education Cloud    │
│ Cases · Campaigns · Flows       │
└─────────────────────────────────┘
```

---

# Perfil Inteligente (VARK)

Onboarding em **5 passos:**

1. Estilo de aprendizagem (Visual/Auditivo/Leitura/Cinestésico)
2. Rotina (trabalho, horários livres)
3. Objetivos (carreira, motivação)
4. Dificuldades (tempo, conteúdo, isolamento)
5. Interesses (EJ, pesquisa, atlética, networking)

> Alimenta Agentforce + Nova Sonic + Sala Virtual + Risk Score

---

# Risk Score — Detecção de Evasão

Score **0 a 100** calculado diariamente (Lambda + EventBridge):

| Fator | Peso |
|-------|------|
| Frequência de acesso | 25% |
| Desempenho acadêmico | 20% |
| Progresso na trilha | 15% |
| Engajamento social | 15% |
| Situação financeira | 10% |
| Disciplinas em risco | 15% |

🟢 Low → 🟡 Medium → 🟠 High → 🔴 Critical

---

# Risk Score → Salesforce → Ação

```
Lambda calcula score (diário 02:00)
        │
        ▼ (se alto/crítico)
EventBridge → Lambda sync → Salesforce
        │
        ▼
Score > 70 → Cria CASE (coordenador intervém)
Score > 50 → Add to CAMPAIGN (email retenção)
        │
        ▼
Coordenador age → liga, agenda mentoria
        │
        ▼
Webhook → AVA personaliza → aluno volta
```

---

# Hub de Comunidade + Sala Virtual

**Matching inteligente** (score 0-100):
- Categoria de interesse: 40 pts
- Skills em comum: 25 pts
- Curso afim: 15 pts
- Horário compatível: 10 pts
- Grupo ativo: 10 pts

**Categorias:** EJ · Pesquisa · Atlética · Networking · Mentoria · Voluntariado · Hackathon

**Sala Virtual:** aluno entra na sala do grupo e interage por voz

---

# Cenário Real — Maria

| Dia | Acontecimento |
|-----|---------------|
| 1 | Matricula em ADM. Perfil: visual, integral |
| 7 | Nova Sonic: "Priorize Estatística. Use mapas mentais" |
| 14 | Entra na EJ via sala virtual. Score -15 pts |
| 30 | Para de acessar. Score: 25 → 62 (HIGH) |
| 30 | Salesforce cria Case. Coordenador notificado |
| 32 | Coordenador liga. Maria: "Sobrecarregada" |
| 33 | Volta. Vitru: "Que bom! Ajusto plano para 25min?" |
| 40 | Score volta para 38 ✓ |

---

# Stack Tecnológica

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React 19, Next.js 16, Tailwind |
| IA Texto | Salesforce Agentforce |
| IA Voz | Amazon Nova Sonic (Bedrock) |
| Sala Virtual | PixiJS + Chime SDK + API GW WS |
| Banco | Aurora Serverless v2 (PostgreSQL) |
| Real-time | DynamoDB + API Gateway WebSocket |
| Auth | AWS Cognito |
| CRM | Salesforce Education Cloud |
| IaC | AWS CDK |

---

# Custo (10.000 alunos)

| Serviço | Custo/mês |
|---------|-----------|
| Aurora + Amplify | $115 |
| Nova Sonic (voz) | $100 |
| Chime SDK (sala) | $50 |
| API GW + Lambda + DynamoDB | $35 |
| S3 + CloudFront | $90 |
| Cognito + SES | $5 |
| **Total AWS** | **~$395/mês** |

Sem custo adicional de OpenAI/GPU — tudo serverless AWS.

---

# Decisões Arquiteturais

| Escolha | Motivo |
|---------|--------|
| Agentforce + Nova Sonic | Texto detalhado + voz rápida |
| Chime SDK (voz sala) | AWS nativo, serverless |
| API GW WebSocket | Paga por msg, sem servidor |
| Aurora + DynamoDB | Relacional + real-time |
| Monorepo Next.js | Tudo num deploy |
| PixiJS (sala 2D) | Leve, 60fps, sem Unity |

---

# Evolução Futura

1. **Nova Sonic com tool-use** — Voz executa ações no AVA
2. **Einstein Prediction** — ML preditivo de evasão
3. **Sala 3D** — Three.js / WebXR
4. **Mobile** — React Native
5. **Multi-tenant** — Outras IES
6. **Data Cloud** — Unifica dados

---

# Demo

```
http://localhost:3000              → Dashboard
http://localhost:3000/perfil       → Onboarding VARK
http://localhost:3000/recomendacoes → Recomendações IA
http://localhost:3000/comunidade   → Hub comunidade
http://localhost:3000/risco        → Score engajamento
http://localhost:3000/campus-virtual → Sala Virtual (futuro)

Botão mic (canto esquerdo) → Assistente Vitru
  • Modo texto: Salesforce Agentforce
  • Modo voz: Amazon Nova Sonic
```

---

# Obrigado

## Vitru AVA — Reduzindo evasão com IA + Comunidade + Sala Virtual

**Stack:** React · AWS (Cognito, Aurora, Bedrock, Chime, Lambda) · Salesforce Agentforce

---
