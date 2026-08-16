# uniasselvi-clone

AVA (Ambiente Virtual de Aprendizagem) simulado da UNIASSELVI, usado como base
para o **Vitru** — o assistente de IA do aluno EAD. A aplicação reproduz as
telas do portal com dados fictícios e serve de superfície para o assistente
agir: ler o contexto do aluno, sugerir plano de estudos, agendar avaliação e
navegar até a aula certa.

Todos os dados de aluno neste repositório são **fictícios**. Nenhum dado real
de estudante, credencial ou export de workflow com segredo deve ser versionado.

## Stack

| Camada | Escolha |
| --- | --- |
| App | Next.js 16.2 (App Router) · React 19 · TypeScript |
| Estilo | Tailwind CSS 4 |
| Banco | Postgres via Drizzle ORM — PGlite (WASM, sem daemon) por padrão |
| LLM | Amazon Bedrock (`amazon.nova-micro-v1:0` por padrão) |
| Testes | Vitest + Testing Library (jsdom) |

> ⚠️ Esta versão do Next.js tem breaking changes em relação ao que a maioria
> das referências descreve. Antes de escrever código, consulte o guia relevante
> em `node_modules/next/dist/docs/` (ver `AGENTS.md`).

## Começando

```bash
npm install
npm run db:migrate   # cria os schemas em .vitru/pglite
npm run db:seed      # carrega os fixtures de public/data
npm run dev
```

Abra <http://localhost:3000>.

A aplicação lê **do banco**, não dos arquivos — sem `db:migrate` + `db:seed` as
páginas sobem vazias. Para recomeçar do zero: `npm run db:reset`.

### Variáveis de ambiente

Nenhuma é obrigatória para navegar no portal. Elas passam a valer para o
assistente e para os backends alternativos:

| Variável | Efeito |
| --- | --- |
| `DATABASE_DRIVER` | `pglite` (padrão) · `postgres` · `aws-data-api` |
| `DATABASE_URL` | Obrigatória com `DATABASE_DRIVER=postgres`; se definida sozinha, já seleciona esse driver |
| `PGLITE_PATH` | Diretório do banco embarcado (padrão `.vitru/pglite`) |
| `AURORA_CLUSTER_ARN`, `AURORA_SECRET_ARN`, `AURORA_DATABASE` | Obrigatórias com `aws-data-api` |
| `AWS_REGION` | Região do Bedrock e da Data API (padrão `us-east-1`) |
| `BEDROCK_MODEL_ID` | Modelo do chat (padrão `amazon.nova-micro-v1:0`) |
| `NEXT_PUBLIC_VITRU_VOICE_URL` | Endereço do serviço de voz (ver `vitru/vitru-voice/`) |
| `NEXT_PUBLIC_VITRU_DEBUG` | Habilita o painel de depuração do assistente |

## Estrutura

```text
app/                 rotas do App Router e a API do Vitru (/api/v1/vitru/*)
components/          UI por domínio (assessments, calendar, learning-path, vitru, …)
lib/                 dados, seletores, formatadores, schema do banco e núcleo do Vitru
public/data/         fixtures dos alunos fictícios — fonte do seed e simulador da API
scripts/             CLIs de banco (migrate, seed, status, verify)
services/            subprojetos independentes (RAG de transcrições, clustering)
vitru/               artefatos do assistente fora do Next: docs, infra, n8n, voz
graphify-out/        grafo de conhecimento do repositório
```

### Rotas principais

| Rota | O que é |
| --- | --- |
| `/` | Home do semestre: disciplinas, atalhos da jornada, recuperação |
| `/disciplinas/[subjectCode]` | Disciplina, com trilha de aprendizagem, notas e avaliações, frequência e contato com o mediador |
| `/disciplinas/.../notas-avaliacoes/[testCode]/agendamento` | Agendamento de prova (locais, datas, colegas na mesma cidade) |
| `/calendario-de-estudos` | Planejador de estudos com o painel do assistente |
| `/comunidade` | Feed por disciplina (conteúdo estático — ainda sem backend) |
| `/meu-grupo` | Grupo de apadrinhamento veterano/calouro (conteúdo estático) |
| `/portal-responsavel` | Portal de conteúdo: edição da trilha por disciplina |
| `/vitru-debug` | Painel de depuração do assistente |
| `/campus-vitru` | Placeholder ("em breve") |

## Banco de dados

Um único conjunto de migrations (SQL puro) roda em três backends, escolhidos em
tempo de execução por `DATABASE_DRIVER` — ver `lib/db/client.ts`:

- **`pglite`** — Postgres compilado para WASM, dentro do processo. Padrão em
  desenvolvimento e teste, sem daemon.
- **`postgres`** — conexão TCP comum. Use com o `docker-compose.yml` da raiz
  quando quiser paridade total ou várias conexões simultâneas.
- **`aws-data-api`** — Aurora Serverless v2 pela Data API, sem pool.

Dois schemas, com donos distintos (`lib/db/schema/`):

- **`academic`** — réplica consultável das APIs da instituição (SOFIA/AVA):
  alunos, disciplinas, avaliações, trilhas, frequência, títulos financeiros,
  gravações, colegas. O objeto bruto fica em `payload` (jsonb) e só os campos
  filtrados/ordenados viram coluna. O Vitru nunca é fonte da verdade aqui.
- **`vitru`** — o que o produto gera: perfil do aluno, memórias, visitas por
  superfície, conversas, atividades de estudo, programas e sessões de estudo,
  overrides de agendamento, progresso de trilha e telemetria de interações.

| Comando | O que faz |
| --- | --- |
| `npm run db:generate` | Gera migration a partir do schema |
| `npm run db:migrate` | Aplica as migrations |
| `npm run db:seed` | Carrega `public/data` no banco (idempotente) |
| `npm run db:reset` | Apaga o PGlite, migra e semeia de novo |
| `npm run db:status` | Mostra o estado do banco |
| `npm run db:verify` | Compara o banco com os fixtures campo a campo |
| `npm run db:studio` | Drizzle Studio |

## Alunos fictícios

`public/data/user/` traz um aluno principal e cenários fictícios de borda —
calouro, em dia, prazo urgente, atividades acumuladas, baixa frequência,
conflito de horários, sem horário livre, prova liberada, agendamento pendente.

O aluno ativo vem do parâmetro `?u=<id>` na URL e, na ausência dele, do
`defaultUserId` persistido no banco (`lib/data/resolve-active-user.ts`). Em
desenvolvimento, o seletor no canto inferior direito (`UserSwitcher`) troca de
aluno sem editar a URL na mão.

## Vitru (assistente)

O núcleo do assistente está em `lib/vitru/`: contexto do aluno
(`build-student-context.ts`), snapshot semântico da tela, protocolo de ações,
divulgação progressiva, memória (`memory/`), resolução de referências e alvos,
prompts e a chamada ao Bedrock (`generate.ts`). As superfícies atendidas hoje
são `trilha` e `calendario` (`lib/vitru/surfaces.ts`).

Endpoints em `app/api/v1/vitru/`:

| Endpoint | Papel |
| --- | --- |
| `POST /chat` | Conversa nas superfícies, com histórico, memória e ações sugeridas |
| `POST /study-plan/confirm` | Aplica as sugestões de plano de estudos confirmadas pelo aluno |
| `POST /exam-schedule` | Agenda ou cancela avaliação — exige autorização já consumida e hash dos argumentos |
| `POST /voice-metrics` | Registra métricas do pipeline de voz |
| `GET /identity/whatsapp` | Resolve o aluno a partir do telefone recebido |

Ações que alteram o sistema exigem confirmação explícita do aluno. As regras de
identidade, confirmação, mascaramento de dados e retenção estão em
[`vitru/docs/fundamental-decisions.md`](vitru/docs/fundamental-decisions.md).

## Subprojetos

Cada um tem `package.json`/dependências próprias e é excluído do `tsconfig` e do
ESLint da raiz. Consulte o README de cada pasta.

- **[`vitru/vitru-voice/`](vitru/vitru-voice/README.md)** — agente de voz em
  pt-BR com Pipecat. Cascata (Whisper MLX + Nova Micro + Kokoro) ou
  speech-to-speech com `amazon.nova-2-sonic-v1:0`. Tem conjunto dourado
  semântico com gate no CI (`.github/workflows/vitru-golden.yml`).
- **[`services/transcribing-service/`](services/transcribing-service/README.md)** —
  RAG sobre transcrições de aulas do YouTube (yt-dlp + pgvector), com resposta
  citando o **minuto exato** da aula. O namespace `materia` é o mesmo slug das
  comunidades.
- **[`services/clustering/`](services/clustering/saida_clusters/relatorio_perfis.md)** —
  k-means de perfis de aluno (457k alunos, 8 perfis, 20 variáveis de
  engajamento) e CLI para classificar um aluno novo (`prever_cluster.py`).
- **[`vitru/n8n/`](vitru/n8n/README.md)** — ambiente n8n local (porta 5679) e
  exportações sanitizadas dos workflows.
- **[`vitru/infra/`](vitru/infra/README.md)** — reservado para o projeto AWS
  CDK; nenhuma stack criada ainda.

## Testes e qualidade

```bash
npm test     # vitest run
npm run lint # eslint
```

A suíte roda sequencial e sem isolamento de módulo de propósito: o PGlite é
single-writer sobre um diretório em disco e os testes compartilham o mesmo
banco semeado (ver os comentários em `vitest.config.mts`).

## Grafo de conhecimento

O repositório mantém um grafo em `graphify-out/` (god nodes, comunidades e
relações entre arquivos). Para perguntas sobre o código, prefira:

```bash
graphify query "<pergunta>"
graphify path "<A>" "<B>"
graphify explain "<conceito>"
graphify update .          # depois de alterar o código (só AST, sem custo de API)
```

`graphify-out/GRAPH_REPORT.md` serve para revisão ampla de arquitetura;
`graphify-out/wiki/index.md`, quando existir, para navegação.
