# Graph Report - uniasselvi-clone  (2026-08-11)

## Corpus Check
- 375 files · ~4,991,491 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1286 nodes · 2591 edges · 81 communities (61 shown, 20 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 16 edges (avg confidence: 0.79)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `665796b9`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- load-subject-data.ts
- Graphify Skill (/graphify Pipeline)
- Decisões fundamentais do Vitru
- devDependencies
- trilha-resolution.ts
- compilerOptions
- TestRunner.tsx
- usuario-ficticio-calouro/manifest.json
- joao-pedro-lopes-zamonelo/manifest.json
- usuario-ficticio-baixa-frequencia/manifest.json
- usuario-ficticio-em-dia/manifest.json
- StudyActivity
- AppShellChrome.tsx
- layout.tsx
- Next.js Framework
- eslint.config.mjs
- next.config.ts
- postcss.config.mjs
- File Icon (document/page glyph)
- Globe Icon
- Next.js Logo (next.svg)
- Vercel Logo Icon
- Window Icon
- date-formatters.ts
- LessonView.tsx
- n8n do Vitru
- infra/README.md
- server.js
- Workflows versionados
- usuario-ficticio-agendamento-pendente/manifest.json
- usuario-ficticio-atividades-acumuladas/manifest.json
- usuario-ficticio-conflito-horarios/manifest.json
- usuario-ficticio-prazo-urgente/manifest.json
- usuario-ficticio-prova-liberada/manifest.json
- usuario-ficticio-sem-horario-livre/manifest.json
- calendar-selectors.ts
- agendamento/page.tsx
- index.tsx
- vitru-voice/package.json
- VoiceAssistantWindow.tsx
- MediatorRequestForm.tsx
- read-json-file.ts
- AssistantPanel.tsx
- LearningPathView.tsx
- build-student-context.ts
- chat/route.ts
- db-verify-fidelity.ts
- academic.ts
- StudyPlannerView.tsx
- vitru.ts
- date-utils.ts
- assessment-plan.ts
- conversation-store.ts
- dependencies
- learning-path.ts
- seed-from-fixtures.ts
- TrilhaEditor.tsx
- WeekGridView.tsx
- scripts
- confirm/route.ts
- Voice AI com Pipecat
- user-selectors.ts
- CalendarToolbar.tsx
- load-classmates.ts
- RecordedClassesModal.tsx
- FinancialTitleRaw
- package.json
- PcmProcessor
- db-migrate.ts
- drizzle-kit
- eslint-config-next
- @testing-library/react
- @types/pg
- @types/react-dom
- vitest
- voice-ai-pipecat

## God Nodes (most connected - your core abstractions)
1. `resolveActiveUserId()` - 32 edges
2. `Graphify Skill (/graphify Pipeline)` - 29 edges
3. `loadDisciplines()` - 26 edges
4. `buildVitruStudentContext()` - 24 edges
5. `StudyActivity` - 23 edges
6. `readUserJsonFileOptional()` - 21 edges
7. `toIsoDateKey()` - 21 edges
8. `formatDateBr()` - 20 edges
9. `findDisciplineByCode()` - 19 edges
10. `addDays()` - 16 edges

## Surprising Connections (you probably didn't know these)
- `Next.js Breaking-Changes Notice` --semantically_similar_to--> `Honesty Rules`  [INFERRED] [semantically similar]
  AGENTS.md → .claude/skills/graphify/SKILL.md
- `TimeGridColumnProps` --references--> `StudyActivity`  [EXTRACTED]
  components/study-planner/TimeGridColumn.tsx → lib/types/study-activity.ts
- `resolveTrilhaMessage()` --calls--> `resolveLocally()`  [EXTRACTED]
  app/api/v1/vitru/chat/route.ts → lib/vitru/trilha-resolution.ts
- `handleSurfaceChat()` --calls--> `appendMessage()`  [EXTRACTED]
  app/api/v1/vitru/chat/route.ts → lib/vitru/conversation-store.ts
- `handleSurfaceChat()` --calls--> `getRecentHistory()`  [EXTRACTED]
  app/api/v1/vitru/chat/route.ts → lib/vitru/conversation-store.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Graphify Full Pipeline Steps** — _claude_skills_graphify_skill_graphify_skill, _claude_skills_graphify_skill_step_0_github_clone, _claude_skills_graphify_skill_step_1_ensure_installed, _claude_skills_graphify_skill_step_2_detect_files, _claude_skills_graphify_skill_step_2_5_video_audio, _claude_skills_graphify_skill_step_3_extract, _claude_skills_graphify_skill_step_4_build_cluster, _claude_skills_graphify_skill_step_4_5_health_check, _claude_skills_graphify_skill_step_5_label_communities, _claude_skills_graphify_skill_step_6_obsidian_html, _claude_skills_graphify_skill_step_9_manifest_cleanup [INFERRED 0.85]
- **Graphify Optional Export Targets** — _claude_skills_graphify_references_exports_wiki_export, _claude_skills_graphify_references_exports_neo4j_export, _claude_skills_graphify_references_exports_falkordb_export, _claude_skills_graphify_references_exports_svg_graphml_export, _claude_skills_graphify_references_exports_mcp_server [EXTRACTED 1.00]
- **Query/Path/Explain Feedback Loop via save-result** — _claude_skills_graphify_references_query_graphify_query, _claude_skills_graphify_references_query_graphify_path, _claude_skills_graphify_references_query_graphify_explain, _claude_skills_graphify_references_query_save_result, _claude_skills_graphify_references_query_reflect_lessons [EXTRACTED 1.00]

## Communities (81 total, 20 thin omitted)

### Community 0 - "load-subject-data.ts"
Cohesion: 0.08
Nodes (57): CampusVitruPage(), ChatIaPage(), SubjectCalendarPage(), MediatorRequestPage(), AssessmentsPage(), AnswerTestPage(), DisciplinePage(), AttendanceLogPage() (+49 more)

### Community 1 - "Graphify Skill (/graphify Pipeline)"
Cohesion: 0.05
Nodes (52): Graphify Skill Trigger (/graphify), /graphify add <url>, --watch Background Watcher, FalkorDB Export (--falkordb/--falkordb-push), MCP Stdio Server (--mcp), Neo4j Export (--neo4j/--neo4j-push), SVG/GraphML Export, Token Reduction Benchmark (+44 more)

### Community 2 - "Decisões fundamentais do Vitru"
Cohesion: 0.13
Nodes (13): AWS, Ações que exigem confirmação, Dados no WhatsApp, Decisões fundamentais do Vitru, Evolução, Identidade e canais, Identificação e confirmação, MVP (+5 more)

### Community 3 - "devDependencies"
Cohesion: 0.11
Nodes (19): eslint, jsdom, devDependencies, eslint, jsdom, pg, tailwindcss, @tailwindcss/postcss (+11 more)

### Community 4 - "trilha-resolution.ts"
Cohesion: 0.09
Nodes (36): NAMED_ENTITIES, stripHtml(), consumeInboxEvent(), deleteInboxEvent(), getInboxEvent(), InboxEvent, InboxEventStore, loadStore() (+28 more)

### Community 5 - "compilerOptions"
Cohesion: 0.07
Nodes (28): dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+20 more)

### Community 6 - "TestRunner.tsx"
Cohesion: 0.18
Nodes (12): TestInfoCard(), TestQuestionCard(), TestQuestionCardProps, TestRunner(), TestStepper(), TestStepperProps, TestToolbar(), TestToolbarProps (+4 more)

### Community 7 - "usuario-ficticio-calouro/manifest.json"
Cohesion: 0.08
Nodes (25): cohortBaseUserId, datasets, currentSemester, disciplines, financialTitles, sofiaDadosAluno, userData, displayLabel (+17 more)

### Community 8 - "joao-pedro-lopes-zamonelo/manifest.json"
Cohesion: 0.10
Nodes (19): datasets, currentSemester, disciplines, financialTitles, sofiaDadosAluno, userData, displayLabel, isFictional (+11 more)

### Community 9 - "usuario-ficticio-baixa-frequencia/manifest.json"
Cohesion: 0.08
Nodes (25): cohortBaseUserId, datasets, currentSemester, disciplines, financialTitles, sofiaDadosAluno, userData, displayLabel (+17 more)

### Community 10 - "usuario-ficticio-em-dia/manifest.json"
Cohesion: 0.08
Nodes (25): cohortBaseUserId, datasets, currentSemester, disciplines, financialTitles, sofiaDadosAluno, userData, displayLabel (+17 more)

### Community 11 - "StudyActivity"
Cohesion: 0.16
Nodes (17): TrashIcon(), ActivityBlockProps, ActivityFormDraft, ActivityFormModalProps, DayGridViewProps, MonthGridViewProps, StudyPlannerViewProps, WeekGridViewProps (+9 more)

### Community 12 - "AppShellChrome.tsx"
Cohesion: 0.21
Nodes (9): AppShellChrome(), AppShellChromeProps, Header(), HeaderProps, initialsFromName(), PageContainer(), PageContainerProps, MENU_ITEMS (+1 more)

### Community 14 - "Next.js Framework"
Cohesion: 0.67
Nodes (3): create-next-app Bootstrap, Next.js Framework, Vercel Deployment

### Community 23 - "date-formatters.ts"
Cohesion: 0.14
Nodes (19): AssessmentAction(), AssessmentActionProps, AssessmentCard(), AssessmentCardProps, AssessmentStatus(), CompletedTestSummary(), AttendanceProgress(), DateParts (+11 more)

### Community 24 - "LessonView.tsx"
Cohesion: 0.13
Nodes (21): LearningPathLessonPage(), LearningPathPage(), ClockIcon(), TerminalIcon(), LessonMarkdown(), LessonMarkdownProps, renderInline(), LessonView() (+13 more)

### Community 26 - "n8n do Vitru"
Cohesion: 0.29
Nodes (6): Limites deste ambiente, n8n do Vitru, Operação, Preparação, Serviços, Workflows

### Community 28 - "server.js"
Cohesion: 0.11
Nodes (19): config, ASSISTANT_SYSTEM_PROMPT, handleWebSocketClient(), app, __dirname, server, webWss, generateReply() (+11 more)

### Community 30 - "usuario-ficticio-agendamento-pendente/manifest.json"
Cohesion: 0.07
Nodes (27): cohortBaseUserId, datasets, currentSemester, disciplines, financialTitles, sofiaDadosAluno, studyActivities, userData (+19 more)

### Community 31 - "usuario-ficticio-atividades-acumuladas/manifest.json"
Cohesion: 0.07
Nodes (27): cohortBaseUserId, datasets, currentSemester, disciplines, financialTitles, sofiaDadosAluno, studyActivities, userData (+19 more)

### Community 32 - "usuario-ficticio-conflito-horarios/manifest.json"
Cohesion: 0.07
Nodes (27): cohortBaseUserId, datasets, currentSemester, disciplines, financialTitles, sofiaDadosAluno, studyActivities, userData (+19 more)

### Community 33 - "usuario-ficticio-prazo-urgente/manifest.json"
Cohesion: 0.07
Nodes (27): cohortBaseUserId, datasets, currentSemester, disciplines, financialTitles, sofiaDadosAluno, studyActivities, userData (+19 more)

### Community 34 - "usuario-ficticio-prova-liberada/manifest.json"
Cohesion: 0.07
Nodes (27): cohortBaseUserId, datasets, currentSemester, disciplines, financialTitles, sofiaDadosAluno, studyActivities, userData (+19 more)

### Community 35 - "usuario-ficticio-sem-horario-livre/manifest.json"
Cohesion: 0.07
Nodes (27): cohortBaseUserId, datasets, currentSemester, disciplines, financialTitles, sofiaDadosAluno, studyActivities, userData (+19 more)

### Community 36 - "calendar-selectors.ts"
Cohesion: 0.13
Nodes (17): CalendarDay(), CalendarDayProps, CalendarGridProps, EMPTY_DISABLED_KEYS, CalendarMonthNavigation(), CalendarMonthNavigationProps, EventsPanel(), EventsPanelProps (+9 more)

### Community 37 - "agendamento/page.tsx"
Cohesion: 0.06
Nodes (60): ExamSchedulePage(), CalendarGrid(), CityComparisonNotice(), ClassmatesSection(), ClassmatesSectionProps, initials(), StudentConnectionCard(), ExamDateCalendar() (+52 more)

### Community 38 - "index.tsx"
Cohesion: 0.10
Nodes (20): DisciplineMoreInfo(), DisciplineMoreInfoProps, INFO_ITEMS, InfoItem, BarChartIcon(), BookOpenIcon(), CalculatorIcon(), ChatBubbleIcon() (+12 more)

### Community 39 - "vitru-voice/package.json"
Cohesion: 0.09
Nodes (24): BaseTransport, dotenv, express, RunnerArguments, dependencies, dotenv, express, ws (+16 more)

### Community 40 - "VoiceAssistantWindow.tsx"
Cohesion: 0.13
Nodes (15): SuggestionStatus, SuggestionCardProps, announceConfirmedPlan(), VitruLogo(), VitruLogoProps, VitruLogoState, CalendarPlanResponse, CallState (+7 more)

### Community 41 - "MediatorRequestForm.tsx"
Cohesion: 0.18
Nodes (8): BriefcaseIcon(), CheckCircleIcon(), InfoIcon(), UserIcon(), MediatorDisciplineOption, MediatorRequestForm(), MediatorRequestFormProps, MOTIVOS

### Community 42 - "read-json-file.ts"
Cohesion: 0.17
Nodes (11): GET(), normalizePhone(), WhatsAppIdentity, WhatsAppIdentityFile, DataInvalidError, DataNotFoundError, loadUserIndex(), readUserJsonFile() (+3 more)

### Community 43 - "AssistantPanel.tsx"
Cohesion: 0.14
Nodes (20): SurfaceResolutionResult, SendIcon(), AssistantPanel(), AssistantPanelProps, ChatApiResponse, ChatMessage, DisplayedAction, isAssistantAction() (+12 more)

### Community 44 - "LearningPathView.tsx"
Cohesion: 0.15
Nodes (18): TrilhaEditorProps, ChevronDownIcon(), LayersIcon(), LockIcon(), TargetIcon(), LearningPathView(), LearningPathViewProps, useLearningPathProgress() (+10 more)

### Community 46 - "build-student-context.ts"
Cohesion: 0.25
Nodes (15): StudyCalendarPage(), loadAllSubjectAssessments(), loadAllSubjectCalendarEvents(), loadSimulationDate(), loadStudyActivities(), loadWorkSchedule(), loadSofiaDadosAluno(), loadUserManifest() (+7 more)

### Community 48 - "chat/route.ts"
Cohesion: 0.15
Nodes (17): DEFAULT_GREETING, handleSurfaceChat(), invalid(), isSurfaceFocus(), POST(), resolveCalendarMessage(), resolveTrilhaMessage(), SurfaceChatBody (+9 more)

### Community 49 - "db-verify-fidelity.ts"
Cohesion: 0.16
Nodes (16): closeDb(), Connection, createConnection(), DatabaseDriver, getDb(), globalForDb, pgliteLocation(), requireEnv() (+8 more)

### Community 50 - "academic.ts"
Cohesion: 0.11
Nodes (17): academic, assessments, attendances, calendarEvents, classmates, datasets, disciplines, examScheduleOptions (+9 more)

### Community 51 - "StudyPlannerView.tsx"
Cohesion: 0.23
Nodes (14): DayGridView(), MonthGridView(), StudyPlannerView(), WeekGridView(), VITRU_PLAN_CONFIRMED_EVENT, findFreeSlots(), FreeSlot, getActivitiesForDate() (+6 more)

### Community 52 - "vitru.ts"
Cohesion: 0.11
Nodes (17): students, appSettings, conversationMessages, conversations, interactions, memories, studentProfiles, studyActivities (+9 more)

### Community 53 - "date-utils.ts"
Cohesion: 0.23
Nodes (15): ActivityFormModal(), addDays(), buildWeekDays(), formatDurationLabel(), formatMinutesLabel(), formatWeekdayFullLabel(), getWeekdayIndex(), pad2() (+7 more)

### Community 54 - "assessment-plan.ts"
Cohesion: 0.24
Nodes (12): AssessmentWithSubject, toIsoDateKey(), AssessmentPlan, ASSIGNMENT_STEPS, buildNextAssessmentPlan(), daysBetween(), EXAM_STEPS, isAssignmentAssessment() (+4 more)

### Community 55 - "conversation-store.ts"
Cohesion: 0.23
Nodes (14): appendMessage(), ConversationMessage, ConversationSession, ConversationStore, getRecentHistory(), isAlive(), loadStore(), pendingWrite (+6 more)

### Community 56 - "dependencies"
Cohesion: 0.13
Nodes (15): @aws-sdk/client-bedrock-runtime, @aws-sdk/client-rds-data, drizzle-orm, @electric-sql/pglite, next, dependencies, @aws-sdk/client-bedrock-runtime, @aws-sdk/client-rds-data (+7 more)

### Community 57 - "learning-path.ts"
Cohesion: 0.18
Nodes (11): PlayCircleIcon(), LessonVideos(), fail(), saveLearningPath(), SaveLearningPathResult, VALID_KINDS, writeUserJsonFile(), LearningPathFaqEntry (+3 more)

### Community 58 - "seed-from-fixtures.ts"
Cohesion: 0.25
Nodes (12): Database, CurrentSemesterRaw, counted(), Counters, listDirs(), listFiles(), main(), NON_SUBJECT_DIRS (+4 more)

### Community 59 - "TrilhaEditor.tsx"
Cohesion: 0.27
Nodes (8): fieldClass(), LessonEditor(), newLesson(), newSection(), SectionEditor(), TrilhaEditor(), slugify(), uniqueSlug()

### Community 60 - "WeekGridView.tsx"
Cohesion: 0.29
Nodes (9): ActivityBlock(), buildHourRows(), computeBlockStyle(), GRID_END_HOUR, GRID_START_HOUR, ROW_HEIGHT_PX, TimeGridColumn(), TimeGridColumnProps (+1 more)

### Community 61 - "scripts"
Cohesion: 0.15
Nodes (13): scripts, build, db:generate, db:migrate, db:reset, db:seed, db:status, db:studio (+5 more)

### Community 62 - "confirm/route.ts"
Cohesion: 0.23
Nodes (8): ConfirmationBody, invalid(), POST(), pendingWrites, saveStudyActivities(), SaveStudyActivitiesResult, USER_DATA_ROOT, writeForUser()

### Community 63 - "Voice AI com Pipecat"
Cohesion: 0.22
Nodes (8): Componentes, Configuração, Estado atual, Estrutura principal, Executar, Instalação, Latência, Voice AI com Pipecat

### Community 64 - "user-selectors.ts"
Cohesion: 0.36
Nodes (5): SemesterHeader(), displaySemesterLabel(), SofiaParticipationDerived, SofiaDadosAlunoData, SofiaDadosAlunoRaw

### Community 65 - "CalendarToolbar.tsx"
Cohesion: 0.38
Nodes (5): PlusIcon(), CalendarToolbar(), CalendarToolbarProps, VIEW_MODE_OPTIONS, StudyPlannerViewMode

### Community 66 - "load-classmates.ts"
Cohesion: 0.43
Nodes (4): loadClassmates(), readSharedJsonFileOptional(), SHARED_DATA_ROOT, ClassmateRecordRaw

### Community 67 - "RecordedClassesModal.tsx"
Cohesion: 0.60
Nodes (3): RecordedClassesModal(), RecordingItem(), RecordingRaw

### Community 68 - "FinancialTitleRaw"
Cohesion: 0.60
Nodes (3): RecoverySection(), RecoverySectionProps, FinancialTitleRaw

### Community 69 - "package.json"
Cohesion: 0.50
Nodes (3): name, private, version

## Knowledge Gaps
- **484 isolated node(s):** `{ generateMock }`, `SurfaceChatBody`, `DEFAULT_GREETING`, `SurfaceResolutionOutcome`, `ConfirmationBody` (+479 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **20 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `resolveActiveUserId()` connect `load-subject-data.ts` to `agendamento/page.tsx`, `read-json-file.ts`, `build-student-context.ts`, `chat/route.ts`, `confirm/route.ts`?**
  _High betweenness centrality (0.028) - this node is a cross-community bridge._
- **Why does `StudyActivity` connect `StudyActivity` to `build-student-context.ts`, `StudyPlannerView.tsx`, `date-utils.ts`, `assessment-plan.ts`, `seed-from-fixtures.ts`, `WeekGridView.tsx`, `confirm/route.ts`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **Why does `loadDisciplines()` connect `load-subject-data.ts` to `agendamento/page.tsx`, `build-student-context.ts`?**
  _High betweenness centrality (0.011) - this node is a cross-community bridge._
- **What connects `{ generateMock }`, `SurfaceChatBody`, `DEFAULT_GREETING` to the rest of the system?**
  _484 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `load-subject-data.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08399452804377565 - nodes in this community are weakly interconnected._
- **Should `Graphify Skill (/graphify Pipeline)` be split into smaller, more focused modules?**
  _Cohesion score 0.05429864253393665 - nodes in this community are weakly interconnected._
- **Should `Decisões fundamentais do Vitru` be split into smaller, more focused modules?**
  _Cohesion score 0.13333333333333333 - nodes in this community are weakly interconnected._