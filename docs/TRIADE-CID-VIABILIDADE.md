# Tríade CID e Viabilidade — Vitru AVA

> Análise de segurança da informação (Confidencialidade, Integridade, Disponibilidade) aplicada ao projeto e estudo de viabilidade técnica, econômica e operacional.

---

## 1. Tríade CID — Conceito

A Tríade CID (CIA Triad em inglês) é o modelo fundamental de segurança da informação:

| Pilar | Definição | Pergunta-chave |
|-------|----------|----------------|
| **Confidencialidade** | Apenas pessoas autorizadas acessam os dados | Quem pode ver? |
| **Integridade** | Dados não são alterados sem autorização | Os dados são confiáveis? |
| **Disponibilidade** | O sistema está acessível quando necessário | Funciona quando preciso? |

---

## 2. Aplicação da Tríade CID no Vitru AVA

### 2.1 Confidencialidade

**Dados sensíveis do sistema:**
- Perfil acadêmico do aluno (notas, frequência, progresso)
- Perfil comportamental (VARK, rotina, dificuldades)
- Risk score de evasão (dado estratégico da instituição)
- Conversas com o assistente IA (podem conter desabafos pessoais)
- Dados financeiros (pendências de mensalidade)

**Como garantimos:**

| Controle | Implementação | Camada |
|----------|--------------|--------|
| Autenticação forte | AWS Cognito (JWT + MFA) | Acesso |
| Autorização por papel | Grupos: aluno, coordenador, admin | API |
| Sem CPF no sistema | Identifica por UUID (Cognito sub) | Design |
| Encryption at rest | AWS KMS (Aurora, S3, DynamoDB) | Storage |
| Encryption in transit | TLS 1.3 em todas as conexões | Rede |
| Isolamento de dados | Aluno só vê seus próprios dados | Query-level |
| Secrets gerenciados | AWS Secrets Manager (credenciais SF, DB) | Infra |
| Voz criptografada | Amazon Chime SDK (end-to-end) | Sala Virtual |
| OAuth 2.0 | Salesforce Connected App com scope limitado | Integração |
| Network isolation | Aurora em VPC com subnets privadas | Infra |

**Fluxo de confidencialidade:**
```
Aluno faz login → Cognito valida → JWT com claims (sub, groups)
  → API verifica JWT em cada request
  → Query filtra por studentId do token
  → Aluno NUNCA vê dados de outro aluno
  → Coordenador vê apenas alunos do seu curso
  → Admin vê tudo (com auditoria)
```

---

### 2.2 Integridade

**Riscos à integridade no contexto educacional:**
- Aluno altera próprias notas
- Manipulação do risk score (para evitar intervenção)
- Alteração de progresso na trilha (fingir que completou)
- Injeção de dados falsos via API
- Corrompimento do perfil VARK (enviesar recomendações)

**Como garantimos:**

| Controle | Implementação | Protege contra |
|----------|--------------|---------------|
| Input validation | Zod schemas em todas as APIs | Injeção de dados malformados |
| Read-only para alunos | Schema `academic` é somente leitura | Aluno alterar notas |
| Risk score calculado server-side | Lambda batch (aluno não interfere) | Manipulação de score |
| Audit trail | Tabela `interactions` registra mudanças | Rastreabilidade |
| Database constraints | FK, UNIQUE, CHECK no PostgreSQL | Dados inconsistentes |
| Backup automático | Aurora (35 dias point-in-time recovery) | Corrupção de dados |
| Imutabilidade de histórico | Risk scores nunca são deletados | Adulteração retroativa |
| Versionamento de perfil | `updatedAt` em toda alteração | Rollback se necessário |
| Separação de concerns | Aluno escreve perfil, sistema escreve score | Cada ator só muda o que pode |

**Separação de quem pode alterar o quê:**

| Dado | Quem escreve | Quem lê |
|------|-------------|---------|
| Notas, frequência | Sistema acadêmico (sync) | Aluno, Coordenador |
| Perfil VARK | Aluno (onboarding) | IA, Recommender |
| Risk score | Lambda (cálculo automático) | Aluno, Coordenador, SF |
| Intervenção | Coordenador (via Salesforce) | Aluno (parcialmente) |
| Plano de estudo | IA (sugere) + Aluno (confirma) | Aluno |
| Comunidade (join) | Aluno (ação própria) | Todos do grupo |

---

### 2.3 Disponibilidade

**Requisitos de disponibilidade:**
- Alunos EAD estudam predominantemente à noite (18h-23h)
- Picos de acesso: véspera de prova, início de semestre
- Downtime impacta diretamente na evasão (se não funciona, aluno desiste)
- Sala Virtual precisa de real-time (voz não tolera latência)

**Como garantimos:**

| Controle | Implementação | SLA |
|----------|--------------|-----|
| Serverless | Amplify + Lambda (escala automática) | Sem provisionamento manual |
| Aurora Multi-AZ | Failover automático em <30s | 99.99% |
| CDN global | CloudFront (edge em São Paulo) | <20ms latência |
| Graceful degradation | PGlite fallback se Aurora cair | Sistema não para |
| Chime SDK managed | AWS gerencia infra de voz | 99.9% uptime |
| DynamoDB | Sem servidor, TTL auto-cleanup | Milliseconds latency |
| Rate limiting | Protege APIs contra DDoS/abuso | Estabilidade |
| Health checks | CloudWatch alarms + auto-recovery | Detecção <1min |
| Backups | Aurora 35d, S3 versionado | RPO <5min |

**Disaster Recovery:**

| Cenário | RTO | RPO | Estratégia |
|---------|-----|-----|-----------|
| Aurora falha (1 AZ) | <30s | 0 | Multi-AZ failover automático |
| Região inteira cai | <1h | <5min | Aurora Global Database |
| Deploy quebra app | <5min | 0 | Rollback automático (Vercel/Amplify) |
| Dados corrompidos | <2h | <5min | Point-in-time recovery |
| DDoS | Automático | 0 | WAF + CloudFront Shield |

**Estimativa de SLA composto:**
```
Aurora: 99.99%
Amplify: 99.95%
CloudFront: 99.9%
Cognito: 99.9%
Chime SDK: 99.9%

SLA composto = 99.99 × 99.95 × 99.9 × 99.9 × 99.9 ≈ 99.64%
= ~31h de downtime/ano (máximo teórico)
```

---

## 3. Mapeamento de Riscos (CID)

| Risco | Pilar | Probabilidade | Impacto | Mitigação |
|-------|-------|--------------|---------|-----------|
| Vazamento de dados acadêmicos | C | Baixa | Alto | Encryption + IAM + VPC |
| Aluno acessa dados de outro | C | Média | Alto | Row-level filtering + JWT |
| Credencial Salesforce exposta | C | Baixa | Crítico | Secrets Manager + rotação |
| Manipulação de risk score | I | Baixa | Médio | Cálculo server-side (Lambda) |
| Injeção SQL | I | Baixa | Alto | ORM + parameterized queries |
| Dados corrompidos por bug | I | Média | Médio | Backup 35d + migrations versionadas |
| AVA fora do ar em véspera de prova | D | Baixa | Crítico | Multi-AZ + serverless |
| Sala Virtual com lag | D | Média | Médio | Chime SDK + CDN + DynamoDB |
| Ataque DDoS | D | Baixa | Alto | CloudFront Shield + WAF + rate limit |
| PGlite falha em dev | D | Alta | Baixo | `:memory:` fallback |

---

## 4. Conformidade LGPD (Lei 13.709/2018)

| Princípio LGPD | Como atendemos |
|----------------|---------------|
| **Finalidade** | Dados usados exclusivamente para melhorar experiência educacional |
| **Adequação** | Apenas dados necessários (sem CPF, sem dados excessivos) |
| **Necessidade** | Perfil VARK é opt-in (aluno escolhe preencher) |
| **Livre acesso** | Endpoint `/api/v1/profile?export=true` retorna todos os dados |
| **Transparência** | Onboarding explica o que é coletado e por quê |
| **Segurança** | Tríade CID implementada (este documento) |
| **Prevenção** | Risk score previne evasão (benefício ao titular) |
| **Não discriminação** | Algoritmo não usa raça, gênero, religião |
| **Responsabilização** | Logs de auditoria em todas as operações |

**Direitos do titular implementados:**
- Acesso: endpoint de export de dados
- Correção: PATCH no perfil
- Exclusão: DELETE cascade (apaga tudo do aluno)
- Portabilidade: export JSON
- Revogação: pode deletar perfil a qualquer momento

---

## 5. Viabilidade do Projeto

### 5.1 Viabilidade Técnica

| Aspecto | Avaliação | Justificativa |
|---------|-----------|---------------|
| Stack escolhida | ✅ Viável | Next.js + AWS são mainstream, documentação ampla |
| Equipe necessária | ✅ Viável | 2-3 devs full-stack + 1 Salesforce admin |
| Complexidade IA | ✅ Viável | Agentforce é low-code, Nova Sonic é API gerenciada |
| Sala Virtual | ⚠️ Moderada | WebSocket + Chime SDK exigem conhecimento especializado |
| Integração SF | ✅ Viável | REST API bem documentada, Connected App padrão |
| Deploy | ✅ Viável | Vercel/Amplify = 1 click |
| Manutenção | ✅ Viável | Serverless = AWS gerencia infra |

**Riscos técnicos:**
| Risco | Mitigação |
|-------|-----------|
| PGlite não escala para produção | Migra para Aurora (já preparado no código) |
| Agent API indisponível em org gratuita | Simulação funcional + plano enterprise |
| Nova Sonic latência alta em pt-BR | Modelo otimizado + fallback texto |
| Chime SDK custo alto | Push-to-talk + limite de peers |

---

### 5.2 Viabilidade Econômica

**Investimento inicial:**
| Item | Custo |
|------|-------|
| Desenvolvimento (3 meses, 3 devs) | ~R$ 90.000 |
| Salesforce Education (licença anual) | ~R$ 50.000 |
| Design UI/UX | ~R$ 15.000 |
| **Total inicial** | **~R$ 155.000** |

**Custo operacional mensal (AWS):**
| Escala | Custo AWS | Custo por aluno |
|--------|-----------|----------------|
| 1.000 alunos | ~R$ 600/mês | R$ 0,60/aluno |
| 10.000 alunos | ~R$ 2.300/mês | R$ 0,23/aluno |
| 50.000 alunos | ~R$ 4.500/mês | R$ 0,09/aluno |

**ROI estimado:**
```
Evasão atual: 30% (INEP)
Meta com Vitru: 20% (redução de 10pp)
Alunos retidos: 10.000 × 10% = 1.000 alunos/ano

Mensalidade média EAD: R$ 250/mês × 12 = R$ 3.000/aluno/ano
Receita preservada: 1.000 × R$ 3.000 = R$ 3.000.000/ano

Custo total Vitru (ano 1): ~R$ 155.000 + R$ 27.600 = ~R$ 182.600
ROI ano 1: (R$ 3.000.000 - R$ 182.600) / R$ 182.600 = 1.542%
Payback: < 1 mês
```

---

### 5.3 Viabilidade Operacional

| Aspecto | Avaliação | Observação |
|---------|-----------|-----------|
| Adoção pelo aluno | ✅ Positiva | Interface familiar (estilo Habbo + WhatsApp) |
| Treinamento coordenadores | ✅ Simples | Salesforce tem UI drag-and-drop |
| Resistência à mudança | ⚠️ Moderada | Substituir AVA existente exige migração gradual |
| Escalabilidade | ✅ Automática | Serverless = escala sob demanda |
| Manutenção | ✅ Baixa | Sem servidor para gerenciar, updates automáticos |
| Suporte | ✅ Viável | AWS + SF têm suporte enterprise 24/7 |

**Plano de implantação:**
| Fase | Duração | Ação |
|------|---------|------|
| Piloto | 3 meses | 1 curso, 200 alunos, coleta feedback |
| Validação | 2 meses | Análise de métricas vs grupo controle |
| Expansão | 3 meses | Todos os cursos da unidade |
| Escala | 6 meses | Multi-instituição (Unicesumar + UNIASSELVI) |

---

### 5.4 Viabilidade Legal

| Requisito | Status | Como atende |
|-----------|--------|-------------|
| LGPD (Lei 13.709/2018) | ✅ | Sem CPF, consent, export, delete |
| Marco Civil da Internet | ✅ | Logs de acesso, guarda 6 meses |
| ECA (menores de idade) | ✅ | Público-alvo: adultos (EAD superior) |
| Diretrizes MEC para EAD | ✅ | AVA com trilha, avaliação, mediador |
| Contrato Salesforce | ✅ | Education Cloud aceita dados acadêmicos |
| Termos AWS | ✅ | LGPD compliance (sa-east-1) |

---

## 6. Matriz de Viabilidade (Resumo)

| Dimensão | Viabilidade | Score |
|----------|-------------|-------|
| Técnica | Alta | 9/10 |
| Econômica | Muito Alta | 10/10 |
| Operacional | Alta | 8/10 |
| Legal | Alta | 9/10 |
| Segurança (CID) | Alta | 9/10 |
| **Média Geral** | **Alta** | **9/10** |

---

## 7. Conclusão

O Vitru AVA é **viável em todas as dimensões** analisadas:

1. **Segurança (CID):** Confidencialidade garantida por IAM/Cognito + encryption, integridade por separação de concerns + audit trail, disponibilidade por serverless + Multi-AZ.

2. **Economicamente:** ROI >1.500% no primeiro ano. O custo de reter 1 aluno (R$ 3.000/ano) supera em ordens de magnitude o custo do sistema por aluno (R$ 2,76/ano).

3. **Tecnicamente:** Stack madura (AWS + Salesforce + Next.js), equipe de 3 devs é suficiente, complexidade gerenciável.

4. **Legalmente:** LGPD-ready by design (sem CPF, consent explícito, direito de exclusão).

A principal barreira é a **resistência organizacional** à mudança de AVA — mitigada pela estratégia de implantação gradual (piloto → validação → escala).
