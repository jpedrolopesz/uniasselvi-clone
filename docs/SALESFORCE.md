# Integração Salesforce — Vitru AVA

> Como e por que o Salesforce Education Cloud é usado para gestão de retenção de alunos em risco de evasão.

---

## 1. Por que Salesforce (e não outro CRM)?

| Critério | Salesforce Education Cloud | HubSpot | Custom |
|----------|---------------------------|---------|--------|
| Objetos acadêmicos nativos | ✅ Contact, Course, Program | ❌ Genérico | ❌ Tem que criar tudo |
| Automação low-code (Flow) | ✅ Drag-and-drop | ⚠️ Limitado | ❌ Código puro |
| Case Management | ✅ Nativo, com SLA | ⚠️ Básico | ❌ Implementar |
| Relatórios e Dashboards | ✅ Drag-and-drop | ✅ Bom | ❌ BI separado |
| Escalabilidade enterprise | ✅ Milhões de registros | ⚠️ Limites | Depende |
| Ecossistema de apps | ✅ AppExchange | ⚠️ Marketplace | ❌ |
| Custo | ❌ Alto | ✅ Free tier | ✅ Só infra |

**Decisão**: Salesforce foi escolhido porque a equipe de retenção (coordenadores, pedagogos) precisa de uma ferramenta que funcione **sem código** para criar campanhas, atribuir casos e acompanhar alunos. O AVA faz a detecção; o Salesforce operacionaliza a intervenção humana.

---

## 2. Modelo de Dados no Salesforce

### Objetos Standard (nativos)

```
┌──────────────┐         ┌──────────────┐
│   Contact    │────1:N──│    Case      │
│  (= Aluno)   │         │(= Intervenção)│
└──────┬───────┘         └──────────────┘
       │
       │ 1:N
       ▼
┌──────────────┐         ┌──────────────┐
│ Opportunity  │         │  Campaign    │
│(= Matrícula) │         │(= Ação de    │
│              │         │  Retenção)   │
└──────────────┘         └──────┬───────┘
                                │ N:N
                                ▼
                         ┌──────────────┐
                         │CampaignMember│
                         │(= Aluno na   │
                         │  campanha)   │
                         └──────────────┘
```

### Objetos Custom (criados para o Vitru)

| Objeto | API Name | Campos | Propósito |
|--------|----------|--------|-----------|
| Risk Score | `Vitru_Risk_Score__c` | Score__c, Risk_Level__c, Factors__c, Calculated_At__c | Histórico de scores de evasão |
| Student Engagement | `Vitru_Engagement__c` | Last_Access__c, Accesses_14d__c, Lessons_Completed__c | Snapshot de engajamento |
| Community Participation | `Vitru_Community__c` | Groups_Count__c, Events_Attended__c, Mentor_Status__c | Participação social |

### Campos Custom no Contact

| Campo | API Name | Tipo | Descrição |
|-------|----------|------|-----------|
| Student ID | `Vitru_Student_Id__c` | Text (External ID) | ID do aluno no AVA |
| Course Code | `Vitru_Course_Code__c` | Text | Código do curso |
| Course Name | `Vitru_Course_Name__c` | Text | Nome do curso |
| Risk Level | `Vitru_Risk_Level__c` | Picklist | low / medium / high / critical |
| Last Risk Score | `Vitru_Last_Risk_Score__c` | Number | 0-100 |
| Last AVA Access | `Vitru_Last_Access__c` | DateTime | Último acesso ao AVA |
| Profile Completeness | `Vitru_Profile_Complete__c` | Percent | Completude do perfil |
| Community Groups | `Vitru_Groups_Count__c` | Number | Qtd de grupos ativos |

---

## 3. Fluxo de Integração

### 3.1 AVA → Salesforce (push de dados)

```
                         ┌─── a cada 24h (Lambda batch) ───┐
                         │                                  │
┌──────────┐      ┌──────▼──────┐      ┌──────────────────▼────────────┐
│  Aurora   │─────▶│ Risk Score  │─────▶│  Salesforce REST API          │
│  (dados   │      │  Lambda     │      │                               │
│  do aluno)│      │             │      │  1. Upsert Contact            │
└──────────┘      └─────────────┘      │  2. Create Risk_Score__c      │
                                       │  3. IF critical → Create Case │
                                       └───────────────────────────────┘
```

**Endpoints utilizados:**
- `PATCH /sobjects/Contact/Vitru_Student_Id__c/{id}` — Upsert por External ID
- `POST /sobjects/Vitru_Risk_Score__c` — Novo registro de score
- `POST /sobjects/Case` — Nova intervenção
- `POST /sobjects/CampaignMember` — Adiciona em campanha
- `GET /query?q=SELECT...` — Consultas SOQL

### 3.2 Salesforce → AVA (webhook de retorno)

```
┌───────────────────┐      Outbound Message       ┌──────────────────┐
│   Salesforce      │ ──────────────────────────▶  │  /api/salesforce/ │
│   Flow            │                              │  webhook          │
│                   │      HTTP POST (XML/JSON)    │                   │
│ "Case fechado"    │                              │  → Atualiza Aurora│
│ "Campanha enviada"│                              │  → Muda UX aluno  │
└───────────────────┘                              └──────────────────┘
```

**Eventos que o Salesforce envia de volta:**
- Case fechado com resolução → AVA registra que aluno foi contactado
- Campanha ativada → AVA mostra banner/notificação ao aluno
- Coordenador adicionou nota → AVA exibe no próximo acesso

### 3.3 Autenticação OAuth 2.0

```
┌──────────┐                          ┌──────────────┐
│  Lambda  │── POST /oauth2/token ───▶│  Salesforce  │
│          │   grant_type=password     │              │
│          │   client_id=XXX           │              │
│          │   client_secret=XXX       │              │
│          │◀── access_token ──────────│              │
│          │                           │              │
│          │── GET /sobjects/... ─────▶│              │
│          │   Authorization: Bearer   │              │
└──────────┘                           └──────────────┘
```

**Em produção**, migra para **JWT Bearer Flow** com certificado X.509 — sem senha transitando.

---

## 4. Automações no Salesforce (Flows)

### Flow 1: Alerta de Risco Crítico

```
TRIGGER: Vitru_Risk_Score__c criado com Risk_Level__c = "critical"
  │
  ├─▶ Buscar Contact vinculado
  ├─▶ Verificar se já existe Case aberto
  │     └─ SIM → Atualizar Case com novo score
  │     └─ NÃO → Criar Case com prioridade Alta
  ├─▶ Atribuir Case ao Coordenador do curso
  ├─▶ Enviar email ao Coordenador
  └─▶ Agendar task de follow-up em 3 dias
```

### Flow 2: Campanha de Retenção

```
TRIGGER: Admin cria Campaign com Type = "Retention"
  │
  ├─▶ Query: Contacts WHERE Vitru_Risk_Level__c IN ("high", "critical")
  │                    AND Vitru_Course_Code__c = Campaign.Course__c
  ├─▶ Para cada Contact:
  │     ├─▶ Criar CampaignMember
  │     └─▶ Enviar email personalizado (template)
  └─▶ Atualizar Campaign status = "In Progress"
```

### Flow 3: Aluno Retornou ao AVA

```
TRIGGER: Platform Event → Vitru_Student_Returned__e
  │
  ├─▶ Buscar Cases abertos do Contact
  ├─▶ Atualizar Case: "Aluno retornou ao AVA em {data}"
  ├─▶ IF Risk_Score < 30 → Fechar Case como "Resolved"
  └─▶ Enviar notificação ao Coordenador
```

---

## 5. Relatórios e Dashboards no Salesforce

A equipe de retenção visualiza:

| Dashboard | Métricas |
|-----------|---------|
| **Visão Geral de Risco** | Distribuição de alunos por nível de risco (pizza), tendência mensal (linha) |
| **Eficácia de Campanhas** | Taxa de retorno por campanha, custo por aluno retido |
| **Pipeline de Intervenção** | Cases abertos vs fechados, tempo médio de resolução |
| **Performance por Curso** | Cursos com maior evasão, comparativo semestral |
| **Coordenadores** | Cases por coordenador, SLA de atendimento |

---

## 6. Configuração Salesforce (SFDX)

Em um cenário multi-repo, o projeto Salesforce teria esta estrutura:

```
vitru-salesforce/
├── sfdx-project.json
├── force-app/
│   └── main/default/
│       ├── objects/
│       │   ├── Contact/fields/
│       │   │   ├── Vitru_Student_Id__c.field-meta.xml
│       │   │   ├── Vitru_Risk_Level__c.field-meta.xml
│       │   │   └── ...
│       │   └── Vitru_Risk_Score__c/
│       │       ├── Vitru_Risk_Score__c.object-meta.xml
│       │       └── fields/
│       │           ├── Score__c.field-meta.xml
│       │           ├── Risk_Level__c.field-meta.xml
│       │           └── Factors__c.field-meta.xml
│       ├── flows/
│       │   ├── Vitru_Critical_Risk_Alert.flow-meta.xml
│       │   ├── Vitru_Retention_Campaign.flow-meta.xml
│       │   └── Vitru_Student_Returned.flow-meta.xml
│       ├── classes/
│       │   ├── VitruRiskScoreHandler.cls
│       │   ├── VitruWebhookController.cls
│       │   └── VitruRiskScoreHandlerTest.cls
│       └── connectedApps/
│           └── Vitru_AVA.connectedApp-meta.xml
├── scripts/
│   └── deploy.sh
└── README.md
```

### Deploy no Salesforce

```bash
# Autenticar na org
sfdx auth:web:login -a vitru-prod

# Deploy metadata
sfdx force:source:deploy -p force-app/main/default

# Rodar testes Apex
sfdx force:apex:test:run --testlevel RunLocalTests
```

---

## 7. Tratamento de Erros e Resiliência

| Cenário | Tratamento |
|---------|-----------|
| Salesforce indisponível | Retry com exponential backoff (3 tentativas) |
| Rate limit atingido | Queue de mensagens com delay progressivo |
| Token expirado | Re-autenticação automática transparente |
| Dados inválidos | Log de erro + skip do registro + alerta |
| Webhook falhou | Salesforce faz retry automático (até 24h) |

---

## 8. Métricas de Sucesso (KPIs)

| KPI | Meta | Como medir |
|-----|------|-----------|
| Redução de evasão | -20% vs semestre anterior | Compare abandono antes/depois |
| Tempo de intervenção | < 48h após score crítico | Case criado → primeiro contato |
| Taxa de retorno pós-intervenção | > 40% | Alunos que voltaram ao AVA após Case |
| Cobertura de monitoramento | 100% dos alunos | Contacts com Risk Score no SF |
| Satisfação do coordenador | > 4/5 | Survey trimestral |
