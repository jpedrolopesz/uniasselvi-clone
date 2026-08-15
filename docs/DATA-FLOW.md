# Fluxo de Dados — Vitru AVA

> Documento que descreve como os dados transitam desde a interação do aluno
> até a ação do coordenador no Salesforce, passando por IA e análise de risco.

---

## 1. Visão Macro — De Ponta a Ponta

```
┌─────────┐     ┌──────────┐     ┌──────────┐     ┌───────────┐     ┌─────────────┐
│  ALUNO  │────▶│ FRONTEND │────▶│ BACKEND  │────▶│  SERVIÇOS │────▶│ COORDENADOR │
│(browser)│◀────│ (React)  │◀────│(API Route)│◀───│  (AWS/SF) │     │(Salesforce) │
└─────────┘     └──────────┘     └──────────┘     └───────────┘     └─────────────┘
    │                                                                       │
    └───────────────── feedback loop (intervenção) ────────────────────────┘
```

---

## 2. Fluxos Detalhados

### 2.1 Login e Autenticação

```
Aluno digita email/senha
  │
  ▼
┌──────────────────────────────────────────────────────┐
│ Frontend                                              │
│ POST /api/auth/login { email, password }              │
└───────────────────────────┬──────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────┐
│ AWS Cognito                                           │
│ • Valida credenciais                                  │
│ • Gera JWT (access_token + id_token + refresh_token)  │
│ • Retorna tokens                                      │
└───────────────────────────┬──────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────┐
│ Frontend                                              │
│ • Armazena access_token em cookie HttpOnly            │
│ • Redireciona para Dashboard                          │
│ • Todas as chamadas subsequentes incluem o JWT        │
└──────────────────────────────────────────────────────┘
```

**Dados transitados:** email, senha (TLS), JWT tokens
**Onde persiste:** Cognito User Pool (dados de auth), cookie no browser (token)

---

### 2.2 Dashboard — Carregamento Inicial

```
Browser acessa /
  │
  ▼
┌──────────────────────────────────────────────────────┐
│ Next.js Server Component (SSR)                        │
│                                                       │
│ 1. resolveActiveUserId(cookie)                        │
│ 2. Parallel queries para Aurora:                      │
│    ├─ loadDisciplines(userId)                         │
│    ├─ loadCurrentSemester(userId)                     │
│    └─ loadFinancialTitles(userId)                     │
│ 3. Processa: sortDisciplinesByProgress()              │
│ 4. Renderiza HTML com dados                           │
└───────────────────────────┬──────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────┐
│ Browser recebe HTML pronto (fast first paint)         │
│ • Disciplinas com progresso                           │
│ • Alertas financeiros                                 │
│ • Atalhos de jornada                                  │
└──────────────────────────────────────────────────────┘
```

**Dados transitados:** student ID → Aurora → disciplinas, notas, status financeiro → HTML
**Latência esperada:** ~200ms (SSR + Aurora Data API na mesma região)

---

### 2.3 Onboarding — Construção do Perfil

```
Aluno acessa /perfil pela primeira vez
  │
  ▼
┌──────────────────────────────────────────────────────┐
│ Frontend (React Client Component)                     │
│ • Exibe wizard progressivo (5 passos)                 │
│ • Coleta: VARK, rotina, objetivos, dificuldades,     │
│   interesses de comunidade                            │
│ • A cada passo, salva parcial:                        │
│   POST /api/profile { step: "routine", data: {...} }  │
└───────────────────────────┬──────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────┐
│ API Route: /api/profile                               │
│                                                       │
│ 1. Valida dados (zod schema)                          │
│ 2. Calcula VARK scores                                │
│ 3. Calcula completeness (%)                           │
│ 4. Upsert no Aurora (student_profiles)                │
│ 5. Emite evento: student.profile_updated              │
│ 6. Retorna { success, completeness }                  │
└───────────────────────────┬──────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────┐
│ EventBridge → Lambda                                  │
│ • Recalcula risk score (perfil incompleto = +risco)   │
│ • Atualiza recomendações de estudo                    │
│ • Calcula community matches                           │
└──────────────────────────────────────────────────────┘
```

**Dados coletados:**
```json
{
  "varkScores": { "visual": 75, "auditory": 40, "reading": 60, "kinesthetic": 85 },
  "schedule": {
    "worksFullTime": true,
    "preferredStudyTimes": [{ "weekday": 1, "startTime": "19:00", "endTime": "21:00" }],
    "sessionDurationMinutes": 45
  },
  "goals": { "primaryMotivation": "career_advancement", "careerObjective": "..." },
  "challenges": { "reportedDifficulties": ["time_management", "isolation"] },
  "interests": { "categories": ["empresa_junior", "networking"], "openToMentoring": true }
}
```

---

### 2.4 Recomendação de Estudos (estilo NotebookLM)

```
Aluno acessa /calendario-de-estudos ou pede ao Vitru "o que estudar hoje?"
  │
  ▼
┌──────────────────────────────────────────────────────┐
│ API Route: /api/recommend                             │
│                                                       │
│ 1. Carrega perfil do aluno (Aurora)                   │
│ 2. Carrega disciplinas + avaliações (Aurora)          │
│ 3. prioritizeSubjects() → ranking de urgência         │
│ 4. recommendMethods(profile) → métodos por VARK      │
│ 5. suggestContentFormats(profile) → formatos          │
│ 6. Para cada disciplina prioritária:                  │
│    └─ buildAdaptiveContentPrompt() → prompt           │
│ 7. Chama Bedrock (generate) → conteúdo adaptativo     │
│ 8. Retorna plano personalizado                        │
└───────────────────────────┬──────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────┐
│ Resposta ao Frontend                                  │
│                                                       │
│ {                                                     │
│   "weekPlan": [...],           // Plano da semana     │
│   "prioritizedSubjects": [...],// Ranking urgência    │
│   "suggestedMethods": [...],   // Pomodoro, Feynman...│
│   "adaptiveContent": [         // Gerado por IA       │
│     {                                                 │
│       "format": "flashcards",                         │
│       "title": "10 Flashcards: Direito Civil",        │
│       "content": "..."          // Conteúdo gerado   │
│     }                                                 │
│   ]                                                   │
│ }                                                     │
└──────────────────────────────────────────────────────┘
```

**Fluxo de dados para IA:**
```
Perfil VARK + Conteúdo da Aula + Formato Preferido
  │
  ▼
┌──────────────────────────────────────────────────────┐
│ AWS Bedrock (amazon.nova-micro-v1:0)                  │
│                                                       │
│ System: "Você é um tutor acadêmico. O aluno é        │
│          visual/cinestésico. Gere flashcards..."      │
│                                                       │
│ Input: conteúdo da aula (até 3000 chars)              │
│ Output: flashcards/resumo/mapa mental formatado       │
└──────────────────────────────────────────────────────┘
```

---

### 2.5 Assistente Vitru (Chat/Voz)

```
Aluno envia mensagem "Não tô entendendo essa matéria de cálculo"
  │
  ▼
┌──────────────────────────────────────────────────────┐
│ POST /api/v1/vitru/chat                               │
│ { surface: "trilha", message: "...", focus: {...} }   │
│                                                       │
│ 1. Resolve conversa (session por aluno+surface)       │
│ 2. Carrega histórico recente (últimas 10 msgs)        │
│ 3. Carrega contexto do aluno:                         │
│    ├─ Perfil (Aurora → student_profiles)              │
│    ├─ Disciplinas ativas (Aurora → disciplines)       │
│    ├─ Progresso na trilha (Aurora → trilha_progress)  │
│    ├─ Risk score atual (Aurora)                       │
│    └─ Memórias episódicas (Aurora → memories)         │
│ 4. Tenta resolução local (FAQ, conteúdo da aula)     │
│ 5. Se não resolve → chama Bedrock com contexto full   │
│ 6. Salva mensagem + resposta (Aurora)                 │
│ 7. Emite evento: student.vitru_interaction            │
│ 8. Retorna resposta + ações sugeridas                 │
└───────────────────────────┬──────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────┐
│ Resposta                                              │
│ {                                                     │
│   "reply": "Entendi. Cálculo pode ser desafiador...",│
│   "resolution": "generation",                         │
│   "actions": [                                        │
│     { "type": "navigate", "label": "Ver flashcards",  │
│       "href": "/disciplinas/CALC1/..." },             │
│     { "type": "open_lesson", "label": "Rever aula 3"}│
│   ]                                                   │
│ }                                                     │
└──────────────────────────────────────────────────────┘
```

**Detecção de sinais de evasão no chat:**
```
Mensagem contém: "trancar", "desistir", "não consigo", "muito difícil"
  │
  ▼
Emite evento especial: student.distress_signal
  │
  ▼
Lambda processa: incrementa risk score + notifica imediatamente
```

---

### 2.6 Cálculo de Risco de Evasão (Batch Diário)

```
EventBridge Scheduler (todo dia 02:00 UTC)
  │
  ▼
┌──────────────────────────────────────────────────────┐
│ Lambda: calculate-risk-scores                         │
│                                                       │
│ Para cada aluno ativo:                                │
│ 1. Query Aurora:                                      │
│    ├─ Último acesso (logins table)                    │
│    ├─ Acessos últimos 14 dias                         │
│    ├─ Média de notas (assessments)                    │
│    ├─ Taxa de submissão no prazo                      │
│    ├─ Interações com Vitru (conversations)            │
│    ├─ Participações em comunidade                     │
│    ├─ Progresso na trilha                             │
│    └─ Pendências financeiras                          │
│ 2. calculateRiskScore(data) → score 0-100             │
│ 3. Salva score no Aurora (risk_scores table)          │
│ 4. IF score mudou significativamente:                 │
│    └─ Emite evento: student.risk_score_changed        │
└───────────────────────────┬──────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────┐
│ EventBridge Rule:                                     │
│ IF detail.level IN ["high", "critical"]               │
│ THEN → Lambda: sync-salesforce                        │
└───────────────────────────┬──────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────┐
│ Lambda: sync-salesforce                               │
│                                                       │
│ 1. Autentica via OAuth 2.0                            │
│ 2. Upsert Contact (aluno)                             │
│ 3. Create Vitru_Risk_Score__c (histórico)             │
│ 4. IF critical → Create Case                          │
│ 5. IF high → Add to Campaign                          │
│ 6. Log resultado                                      │
└──────────────────────────────────────────────────────┘
```

---

### 2.7 Intervenção do Coordenador (Salesforce → AVA)

```
Coordenador no Salesforce:
  • Vê Case: "Aluno João — Risco CRÍTICO (score 82)"
  • Liga para o aluno
  • Marca Case como "Contactado"
  • Adiciona nota: "Aluno com dificuldade financeira, encaminhado para bolsa"
  │
  ▼
┌──────────────────────────────────────────────────────┐
│ Salesforce Flow (Outbound Message)                    │
│ POST https://vitru-ava.com/api/salesforce/webhook     │
│ {                                                     │
│   "event": "case_updated",                            │
│   "caseId": "500...",                                 │
│   "studentId": "uuid",                                │
│   "status": "Contacted",                              │
│   "notes": "Encaminhado para bolsa"                   │
│ }                                                     │
└───────────────────────────┬──────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────┐
│ API Route: /api/salesforce/webhook                    │
│                                                       │
│ 1. Valida assinatura do Salesforce                    │
│ 2. Registra intervenção no Aurora                     │
│ 3. Atualiza memória do Vitru:                         │
│    "Coordenador entrou em contato em {data}"          │
│ 4. Define flag: show_support_message = true           │
└───────────────────────────┬──────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────┐
│ Próximo acesso do aluno                               │
│                                                       │
│ • Vitru saúda: "Que bom te ver de volta!             │
│   Vi que o coordenador conversou com você.            │
│   Posso ajudar com algo hoje?"                        │
│ • Banner: "Programa de bolsas disponível"             │
│ • Plano de recuperação adaptado à nova situação       │
└──────────────────────────────────────────────────────┘
```

---

### 2.8 Hub de Comunidade — Matching

```
Aluno acessa /comunidade
  │
  ▼
┌──────────────────────────────────────────────────────┐
│ API Route: /api/community/recommendations             │
│                                                       │
│ 1. Carrega perfil (interesses, skills, curso)         │
│ 2. Carrega grupos disponíveis (Aurora)                │
│ 3. recommendGroups(profile, groups, courseCode)        │
│    ├─ Categoria match (40 pontos)                     │
│    ├─ Skills em comum (25 pontos)                     │
│    ├─ Afinidade de curso (15 pontos)                  │
│    ├─ Horário compatível (10 pontos)                  │
│    └─ Grupo ativo com vagas (10 pontos)               │
│ 4. Retorna top 10 com score e razões                  │
└───────────────────────────┬──────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────┐
│ Frontend exibe:                                       │
│ • Cards de grupos ordenados por relevância            │
│ • Badges: "Skills em comum: marketing, design"        │
│ • CTA: "Entrar no grupo" → POST /api/community/join  │
│                                                       │
│ Ao entrar:                                            │
│ • Emite evento: student.joined_community              │
│ • Atualiza risk score (-15 pontos por participação)   │
│ • Sincroniza com Salesforce (campo Groups_Count__c)   │
└──────────────────────────────────────────────────────┘
```

---

## 3. Mapa de Dados — Onde cada dado vive

| Dado | Origem | Armazenamento | Consumido por |
|------|--------|--------------|---------------|
| Credenciais de login | Aluno | Cognito | Auth middleware |
| Perfil VARK | Onboarding | Aurora (student_profiles) | Recommender, Vitru, Community |
| Disciplinas e notas | Sistema acadêmico | Aurora (academic schema) | Dashboard, Risk Score |
| Conversas com Vitru | Chat | Aurora (conversations) | Vitru, Risk Score |
| Risk Score | Lambda batch | Aurora (risk_scores) | Dashboard, Salesforce |
| Intervenções | Salesforce | Aurora (interventions) + SF | Vitru, Dashboard |
| Materiais didáticos | Instituição | S3 | Frontend (via CloudFront) |
| Memberships comunidade | Aluno | Aurora (community_memberships) | Community Hub, Risk Score |
| Eventos de engajamento | Sistema | EventBridge → Aurora | Analytics, Risk Score |
| Histórico de risk score | Lambda | Aurora + Salesforce | Relatórios, Dashboards |

---

## 4. Formatos de Comunicação

| De → Para | Protocolo | Formato | Autenticação |
|-----------|-----------|---------|-------------|
| Browser → API | HTTPS | JSON | JWT (cookie HttpOnly) |
| API → Aurora | HTTPS (Data API) | SQL → JSON | IAM Role |
| API → Bedrock | HTTPS | JSON (Converse API) | IAM Role |
| Lambda → Salesforce | HTTPS | JSON (REST API) | OAuth 2.0 Bearer |
| Salesforce → API | HTTPS | JSON (webhook) | Shared secret |
| EventBridge → Lambda | Async invoke | JSON (event) | IAM Role |
| CloudFront → S3 | HTTPS | Binary (files) | OAI (Origin Access) |

---

## 5. Latências Esperadas

| Operação | Latência | Gargalo |
|----------|---------|---------|
| Dashboard load (SSR) | ~200ms | Aurora query |
| Chat com Vitru (sem IA) | ~100ms | Aurora + lógica local |
| Chat com Vitru (com Bedrock) | ~2-3s | Bedrock generation |
| Recomendação com conteúdo IA | ~3-5s | Bedrock (conteúdo longo) |
| Risk score batch (10k alunos) | ~5min | Aurora queries em batch |
| Sync Salesforce (1 aluno) | ~500ms | HTTP + auth |
| Community recommendations | ~150ms | Aurora + algoritmo local |

---

## 6. Privacidade e LGPD

| Princípio | Implementação |
|-----------|--------------|
| Minimização | Sem CPF, sem dados além do necessário |
| Consentimento | Onboarding explica o que é coletado e por quê |
| Direito de acesso | Endpoint /api/profile/export → JSON com todos os dados |
| Direito de exclusão | Endpoint /api/profile/delete → cascade em todas as tabelas |
| Retenção | Conversas: 90 dias. Risk scores: 2 anos. Perfil: enquanto matriculado |
| Anonimização | Relatórios agregados nunca expõem dados individuais |
