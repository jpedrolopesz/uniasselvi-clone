# Graph Report - .  (2026-08-12)

## Corpus Check
- 231 files · ~81,138 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1075 nodes · 2664 edges · 57 communities (45 shown, 12 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 26 edges (avg confidence: 0.77)
- Token cost: 0 input · 72,956 output

## Community Hubs (Navigation)
- Vitru Study Plan API
- Vitru Identity & WhatsApp
- Vitru Chat Assistant Panel
- Assessment Cards UI
- Exam Schedule & Assessments UI
- Graphify Skill Docs
- Data Loading & Formatting Utils
- Infra & Fundamental Decisions Docs
- Vitru Voice Service
- Discipline Info UI & Icons
- TS Config References
- Vitru Chat Route Handlers
- Vitru Voice Dependencies
- Learning Path Content Editor UI
- Database Client
- Trilha Editor Internals
- Academic DB Schema
- Vitru & Student DB Schema
- Vitru Student Context & Disclosure
- Dev Dependencies (Lint/Test)
- Test Runner UI Components
- Lesson Markdown Rendering
- Learning Path Progress & DB Test Helpers
- Student Data Helpers
- Core Package Dependencies
- Study Program Management
- Fixture Seeding & Current Semester
- App Shell Layout
- NPM Build & DB Scripts
- Mediator Request Form UI
- User Index & Data Fidelity Verification
- Home Semester Header & User Selectors
- Study Planner Calendar Toolbar
- Vitru Surface Visit Memory
- Recorded Classes UI
- Home Recovery Section UI
- Package Metadata
- Root App Layout
- Next.js/Vercel README Docs
- Vitru Voice README (Pipecat)
- Drizzle Kit Dependency
- ESLint Config
- ESLint Next Config
- Next.js Config
- Tailwind CSS Dependency
- Postgres Types Dependency
- React DOM Types Dependency
- Vitest Dependency
- PostCSS Config
- LGPD & Data Retention Policy
- Pipecat Package

## God Nodes (most connected - your core abstractions)
1. `getDb()` - 62 edges
2. `resolveActiveUserId()` - 32 edges
3. `findStudentBySlug()` - 31 edges
4. `Graphify Skill (/graphify Pipeline)` - 29 edges
5. `loadDisciplines()` - 28 edges
6. `StudyActivity` - 26 edges
7. `buildVitruStudentContext()` - 26 edges
8. `requireStudentBySlug()` - 23 edges
9. `toIsoDateKey()` - 23 edges
10. `formatDateBr()` - 22 edges

## Surprising Connections (you probably didn't know these)
- `Next.js Breaking-Changes Notice` --semantically_similar_to--> `Honesty Rules`  [INFERRED] [semantically similar]
  AGENTS.md → .claude/skills/graphify/SKILL.md
- `postgres service (root docker-compose)` --semantically_similar_to--> `postgres service (n8n compose)`  [INFERRED] [semantically similar]
  docker-compose.yml → vitru/n8n/compose.yaml
- `main()` --calls--> `getDb()`  [EXTRACTED]
  scripts/db-status.ts → lib/db/client.ts
- `resolveTrilhaMessage()` --calls--> `loadSubjectLearningPath()`  [EXTRACTED]
  app/api/v1/vitru/chat/route.ts → lib/data/load-subject-data.ts
- `resolveTrilhaMessage()` --calls--> `resolveLocally()`  [EXTRACTED]
  app/api/v1/vitru/chat/route.ts → lib/vitru/trilha-resolution.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Graphify Full Pipeline Steps** — _claude_skills_graphify_skill_graphify_skill, _claude_skills_graphify_skill_step_0_github_clone, _claude_skills_graphify_skill_step_1_ensure_installed, _claude_skills_graphify_skill_step_2_detect_files, _claude_skills_graphify_skill_step_2_5_video_audio, _claude_skills_graphify_skill_step_3_extract, _claude_skills_graphify_skill_step_4_build_cluster, _claude_skills_graphify_skill_step_4_5_health_check, _claude_skills_graphify_skill_step_5_label_communities, _claude_skills_graphify_skill_step_6_obsidian_html, _claude_skills_graphify_skill_step_9_manifest_cleanup [INFERRED 0.85]
- **Graphify Optional Export Targets** — _claude_skills_graphify_references_exports_wiki_export, _claude_skills_graphify_references_exports_neo4j_export, _claude_skills_graphify_references_exports_falkordb_export, _claude_skills_graphify_references_exports_svg_graphml_export, _claude_skills_graphify_references_exports_mcp_server [EXTRACTED 1.00]
- **Query/Path/Explain Feedback Loop via save-result** — _claude_skills_graphify_references_query_graphify_query, _claude_skills_graphify_references_query_graphify_path, _claude_skills_graphify_references_query_graphify_explain, _claude_skills_graphify_references_query_save_result, _claude_skills_graphify_references_query_reflect_lessons [EXTRACTED 1.00]
- **Local voice pipeline (WebRTC → Silero VAD → Whisper → Ollama → Kokoro → WebRTC)** — vitru_vitru_voice_readme_silero_vad, vitru_vitru_voice_readme_whisper, vitru_vitru_voice_readme_ollama, vitru_vitru_voice_readme_kokoro, vitru_vitru_voice_readme_pipecat [EXTRACTED 1.00]
- **Amazon Bedrock integration path for Vitru text generation** — vitru_docs_fundamental_decisions_bedrock, vitru_docs_fundamental_decisions_mvp_services, vitru_n8n_workflows_readme_bedrock_credential, vitru_n8n_workflows_readme_vitru_router [INFERRED 0.85]

## Communities (57 total, 12 thin omitted)

### Community 0 - "Vitru Study Plan API"
Cohesion: 0.05
Nodes (91): ConfirmationBody, invalid(), POST(), StudyCalendarPage(), ActivityBlock(), ActivityBlockProps, ActivityFormDraft, ActivityFormModal() (+83 more)

### Community 1 - "Vitru Identity & WhatsApp"
Cohesion: 0.07
Nodes (62): GET(), normalizePhone(), WhatsAppIdentity, WhatsAppIdentityFile, CampusVitruPage(), MediatorRequestPage(), AssessmentsPage(), ExamSchedulePage() (+54 more)

### Community 2 - "Vitru Chat Assistant Panel"
Cohesion: 0.05
Nodes (55): SurfaceResolutionResult, SendIcon(), SparklesIcon(), AssistantPanel(), AssistantPanelProps, ChatApiResponse, ChatMessage, DisplayedAction (+47 more)

### Community 3 - "Assessment Cards UI"
Cohesion: 0.06
Nodes (43): AssessmentCard(), AssessmentCardProps, AssessmentStatus(), CompletedTestSummary(), CalendarDay(), CalendarDayProps, CalendarGrid(), CalendarGridProps (+35 more)

### Community 4 - "Exam Schedule & Assessments UI"
Cohesion: 0.07
Nodes (46): AssessmentAction(), AssessmentActionProps, CityComparisonNotice(), ClassmatesSection(), ClassmatesSectionProps, initials(), StudentConnectionCard(), ExamDateCalendarProps (+38 more)

### Community 5 - "Graphify Skill Docs"
Cohesion: 0.05
Nodes (52): Graphify Skill Trigger (/graphify), /graphify add <url>, --watch Background Watcher, FalkorDB Export (--falkordb/--falkordb-push), MCP Stdio Server (--mcp), Neo4j Export (--neo4j/--neo4j-push), SVG/GraphML Export, Token Reduction Benchmark (+44 more)

### Community 6 - "Data Loading & Formatting Utils"
Cohesion: 0.09
Nodes (37): isEnvelopedTestContent(), NAMED_ENTITIES, stripHtml(), consumeInboxEvent(), deleteInboxEvent(), getInboxEvent(), InboxEvent, InboxEventStore (+29 more)

### Community 7 - "Infra & Fundamental Decisions Docs"
Cohesion: 0.05
Nodes (40): PGlite as default dev/test Postgres driver, postgres service (root docker-compose), Orçamento AWS US$20/mês; execução local no MVP, AWS CDK, Amazon Bedrock, Uso do CPF na verificação/recuperação, Política de exposição de dados sensíveis no WhatsApp, Serviços planejados — Evolução (+32 more)

### Community 8 - "Vitru Voice Service"
Cohesion: 0.11
Nodes (19): config, ASSISTANT_SYSTEM_PROMPT, handleWebSocketClient(), app, __dirname, server, webWss, generateReply() (+11 more)

### Community 9 - "Discipline Info UI & Icons"
Cohesion: 0.10
Nodes (20): DisciplineMoreInfo(), DisciplineMoreInfoProps, INFO_ITEMS, InfoItem, BarChartIcon(), BookOpenIcon(), CalculatorIcon(), CalendarIcon() (+12 more)

### Community 10 - "TS Config References"
Cohesion: 0.07
Nodes (28): dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+20 more)

### Community 11 - "Vitru Chat Route Handlers"
Cohesion: 0.13
Nodes (22): DEFAULT_GREETING, handleSurfaceChat(), invalid(), isSurfaceFocus(), POST(), resolveCalendarMessage(), resolveTrilhaMessage(), SurfaceChatBody (+14 more)

### Community 12 - "Vitru Voice Dependencies"
Cohesion: 0.09
Nodes (24): BaseTransport, dotenv, express, RunnerArguments, dependencies, dotenv, express, ws (+16 more)

### Community 13 - "Learning Path Content Editor UI"
Cohesion: 0.14
Nodes (20): TrilhaEditorProps, ChevronDownIcon(), LayersIcon(), LockIcon(), TargetIcon(), LearningPathView(), LearningPathViewProps, useLearningPathProgress() (+12 more)

### Community 14 - "Database Client"
Cohesion: 0.13
Nodes (12): closeDb(), Connection, createConnection(), Database, DatabaseDriver, globalForDb, pgliteLocation(), requireEnv() (+4 more)

### Community 15 - "Trilha Editor Internals"
Cohesion: 0.19
Nodes (16): allIds(), fieldClass(), LessonEditor(), move(), newLesson(), newSection(), SectionEditor(), TrilhaEditor() (+8 more)

### Community 16 - "Academic DB Schema"
Cohesion: 0.11
Nodes (17): academic, assessments, attendances, calendarEvents, classmates, datasets, disciplines, examScheduleOptions (+9 more)

### Community 17 - "Vitru & Student DB Schema"
Cohesion: 0.11
Nodes (18): students, appSettings, conversationMessages, conversations, interactions, memories, studentProfiles, studyActivities (+10 more)

### Community 18 - "Vitru Student Context & Disclosure"
Cohesion: 0.17
Nodes (12): VitruStudentContext, DisclosureLevel, resolveDisclosure(), buildKnownFieldsManifest(), formatWeekdays(), WEEKDAY_LABELS_PT, getStudentProfile(), PreferredWindow (+4 more)

### Community 19 - "Dev Dependencies (Lint/Test)"
Cohesion: 0.11
Nodes (19): eslint, jsdom, devDependencies, eslint, jsdom, pg, @tailwindcss/postcss, @testing-library/react (+11 more)

### Community 20 - "Test Runner UI Components"
Cohesion: 0.18
Nodes (12): TestInfoCard(), TestQuestionCard(), TestQuestionCardProps, TestRunner(), TestStepper(), TestStepperProps, TestToolbar(), TestToolbarProps (+4 more)

### Community 21 - "Lesson Markdown Rendering"
Cohesion: 0.15
Nodes (13): PlayCircleIcon(), TerminalIcon(), LessonMarkdown(), LessonMarkdownProps, renderInline(), LessonVideos(), LessonView(), LessonViewProps (+5 more)

### Community 22 - "Learning Path Progress & DB Test Helpers"
Cohesion: 0.20
Nodes (13): createTestStudent(), deleteTestStudent(), assertValidId(), markLessonCompleted(), markParagraph(), addMemory(), listActiveMemories(), Memory (+5 more)

### Community 23 - "Student Data Helpers"
Cohesion: 0.32
Nodes (12): findStudentBySlug(), hasDataset(), StudentRow, loadExamScheduleOptions(), loadSubjectCalendarEvents(), loadSubjectRecordings(), loadSubjectTestContent(), loadFinancialTitles() (+4 more)

### Community 24 - "Core Package Dependencies"
Cohesion: 0.13
Nodes (15): @aws-sdk/client-bedrock-runtime, @aws-sdk/client-rds-data, drizzle-orm, @electric-sql/pglite, next, dependencies, @aws-sdk/client-bedrock-runtime, @aws-sdk/client-rds-data (+7 more)

### Community 25 - "Study Program Management"
Cohesion: 0.29
Nodes (11): requireStudentBySlug(), saveStudyActivities(), StudyProgram, applyStudySessionDecision(), createStudyProgram(), getActiveStudyProgram(), loadProgramWithSessions(), PersistedStudyProgram (+3 more)

### Community 26 - "Fixture Seeding & Current Semester"
Cohesion: 0.23
Nodes (11): CurrentSemesterRaw, counted(), Counters, listDirs(), listFiles(), main(), NON_SUBJECT_DIRS, seedClassmates() (+3 more)

### Community 27 - "App Shell Layout"
Cohesion: 0.21
Nodes (9): AppShellChrome(), AppShellChromeProps, Header(), HeaderProps, initialsFromName(), PageContainer(), PageContainerProps, MENU_ITEMS (+1 more)

### Community 28 - "NPM Build & DB Scripts"
Cohesion: 0.15
Nodes (13): scripts, build, db:generate, db:migrate, db:reset, db:seed, db:status, db:studio (+5 more)

### Community 29 - "Mediator Request Form UI"
Cohesion: 0.18
Nodes (8): BriefcaseIcon(), CheckCircleIcon(), InfoIcon(), UserIcon(), MediatorDisciplineOption, MediatorRequestForm(), MediatorRequestFormProps, MOTIVOS

### Community 30 - "User Index & Data Fidelity Verification"
Cohesion: 0.31
Nodes (6): UserIndex, UserManifest, canonical(), check(), main(), USER_ROOT

### Community 31 - "Home Semester Header & User Selectors"
Cohesion: 0.36
Nodes (5): SemesterHeader(), displaySemesterLabel(), SofiaParticipationDerived, SofiaDadosAlunoData, SofiaDadosAlunoRaw

### Community 32 - "Study Planner Calendar Toolbar"
Cohesion: 0.38
Nodes (5): PlusIcon(), CalendarToolbar(), CalendarToolbarProps, VIEW_MODE_OPTIONS, StudyPlannerViewMode

### Community 33 - "Vitru Surface Visit Memory"
Cohesion: 0.52
Nodes (5): getSurfaceVisit(), markSurfaceOnboarded(), recordSurfaceVisit(), SurfaceVisit, toSurfaceVisit()

### Community 34 - "Recorded Classes UI"
Cohesion: 0.60
Nodes (3): RecordedClassesModal(), RecordingItem(), RecordingRaw

### Community 35 - "Home Recovery Section UI"
Cohesion: 0.60
Nodes (3): RecoverySection(), RecoverySectionProps, FinancialTitleRaw

### Community 36 - "Package Metadata"
Cohesion: 0.50
Nodes (3): name, private, version

### Community 38 - "Next.js/Vercel README Docs"
Cohesion: 0.67
Nodes (3): Next.js App (create-next-app), Vercel Deployment, Portal integrations follow Next.js conventions (app/, components/, lib/)

### Community 39 - "Vitru Voice README (Pipecat)"
Cohesion: 0.67
Nodes (3): Implementação Node anterior (fallback, src/), Pipecat, Pipeline de voz (WebRTC → VAD → Whisper → Ollama → Kokoro → WebRTC)

## Knowledge Gaps
- **253 isolated node(s):** `{ generateMock }`, `SurfaceChatBody`, `VALID_SURFACES`, `DEFAULT_GREETING`, `SurfaceResolutionOutcome` (+248 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **12 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `getDb()` connect `Student Data Helpers` to `Vitru Study Plan API`, `Vitru Identity & WhatsApp`, `Vitru Surface Visit Memory`, `Exam Schedule & Assessments UI`, `Vitru Chat Route Handlers`, `Database Client`, `Trilha Editor Internals`, `Vitru Student Context & Disclosure`, `Lesson Markdown Rendering`, `Learning Path Progress & DB Test Helpers`, `Study Program Management`, `Fixture Seeding & Current Semester`, `User Index & Data Fidelity Verification`?**
  _High betweenness centrality (0.043) - this node is a cross-community bridge._
- **Why does `StudyActivity` connect `Vitru Study Plan API` to `Fixture Seeding & Current Semester`, `Assessment Cards UI`, `Student Data Helpers`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._
- **Why does `resolveActiveUserId()` connect `Vitru Identity & WhatsApp` to `Vitru Study Plan API`, `Vitru Chat Route Handlers`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **What connects `{ generateMock }`, `SurfaceChatBody`, `VALID_SURFACES` to the rest of the system?**
  _253 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Vitru Study Plan API` be split into smaller, more focused modules?**
  _Cohesion score 0.054376657824933686 - nodes in this community are weakly interconnected._
- **Should `Vitru Identity & WhatsApp` be split into smaller, more focused modules?**
  _Cohesion score 0.07046442461679249 - nodes in this community are weakly interconnected._
- **Should `Vitru Chat Assistant Panel` be split into smaller, more focused modules?**
  _Cohesion score 0.053830227743271224 - nodes in this community are weakly interconnected._