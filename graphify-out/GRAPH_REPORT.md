# Graph Report - uniasselvi-clone  (2026-08-13)

## Corpus Check
- 423 files · ~5,009,180 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1488 nodes · 3271 edges · 90 communities (76 shown, 14 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 27 edges (avg confidence: 0.75)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `129a5d22`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- StudyActivity
- getDb
- AssistantPanel.tsx
- exam-schedule-selectors.ts
- ExamScheduleView.tsx
- Graphify Skill (/graphify Pipeline)
- trilha-resolution.ts
- Ambiente local n8n (Docker Compose)
- server.js
- index.tsx
- compilerOptions
- chat/route.ts
- vitru-voice/package.json
- LearningPathView.tsx
- client.ts
- TrilhaEditor.tsx
- academic.ts
- vitru.ts
- student-profile.ts
- devDependencies
- TestRunner.tsx
- LessonView.tsx
- memories.ts
- usuario-ficticio-agendamento-pendente/manifest.json
- dependencies
- db-helpers.ts
- seed-from-fixtures.ts
- VitruSemanticSnapshot
- scripts
- MediatorRequestForm.tsx
- db-verify-fidelity.ts
- user-selectors.ts
- CalendarToolbar.tsx
- surface-visits.ts
- usuario-ficticio-atividades-acumuladas/manifest.json
- FinancialTitleRaw
- package.json
- VoiceAssistantWindow.tsx
- Next.js App (create-next-app)
- Pipeline de voz (WebRTC → VAD → Whisper → Ollama → Kokoro → WebRTC)
- usuario-ficticio-conflito-horarios/manifest.json
- eslint.config.mjs
- eslint-config-next
- next.config.ts
- usuario-ficticio-prazo-urgente/manifest.json
- @types/pg
- @types/react-dom
- vitest
- postcss.config.mjs
- LGPD
- usuario-ficticio-prova-liberada/manifest.json
- voice-ai-pipecat
- usuario-ficticio-sem-horario-livre/manifest.json
- usuario-ficticio-baixa-frequencia/manifest.json
- usuario-ficticio-calouro/manifest.json
- usuario-ficticio-em-dia/manifest.json
- StudyPlannerView.tsx
- assessment-plan.ts
- joao-pedro-lopes-zamonelo/manifest.json
- bot.py
- WeekGridView.tsx
- build-student-context.ts
- group-related-students.ts
- ThinkingTextFilter
- DisciplineCard.tsx
- load-user-index.ts
- semantic-snapshot.ts
- browser-context.ts
- debug-store.ts
- SemanticSnapshotProvider.tsx
- SuggestionCard.tsx
- page-context.ts
- golden_set.py
- dependencies
- call_guard_reason
- confirm/route.ts
- calendar-logic.ts
- action-protocol.ts
- VoiceTimingProcessor
- generate.ts
- PcmProcessor
- db-migrate.ts
- eslint
- active-user-cookie.ts
- @testing-library/react

## God Nodes (most connected - your core abstractions)
1. `getDb()` - 65 edges
2. `findStudentBySlug()` - 34 edges
3. `resolveActiveUserId()` - 34 edges
4. `Graphify Skill (/graphify Pipeline)` - 29 edges
5. `loadDisciplines()` - 28 edges
6. `StudyActivity` - 27 edges
7. `buildVitruStudentContext()` - 26 edges
8. `requireStudentBySlug()` - 23 edges
9. `toIsoDateKey()` - 23 edges
10. `formatDateBr()` - 22 edges

## Surprising Connections (you probably didn't know these)
- `Next.js Breaking-Changes Notice` --semantically_similar_to--> `Honesty Rules`  [INFERRED] [semantically similar]
  AGENTS.md → .claude/skills/graphify/SKILL.md
- `postgres service (root docker-compose)` --semantically_similar_to--> `postgres service (n8n compose)`  [INFERRED] [semantically similar]
  docker-compose.yml → vitru/n8n/compose.yaml
- `RootLayout()` --calls--> `resolveActiveUserId()`  [EXTRACTED]
  app/layout.tsx → lib/data/resolve-active-user.ts
- `ExamDateCalendarProps` --references--> `ExamSession`  [EXTRACTED]
  components/exam-schedule/ExamDateCalendar.tsx → lib/types/derived/index.ts
- `DayGridViewProps` --references--> `StudyActivity`  [EXTRACTED]
  components/study-planner/DayGridView.tsx → lib/types/study-activity.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Graphify Optional Export Targets** — _claude_skills_graphify_references_exports_wiki_export, _claude_skills_graphify_references_exports_neo4j_export, _claude_skills_graphify_references_exports_falkordb_export, _claude_skills_graphify_references_exports_svg_graphml_export, _claude_skills_graphify_references_exports_mcp_server [EXTRACTED 1.00]
- **Query/Path/Explain Feedback Loop via save-result** — _claude_skills_graphify_references_query_graphify_query, _claude_skills_graphify_references_query_graphify_path, _claude_skills_graphify_references_query_graphify_explain, _claude_skills_graphify_references_query_save_result, _claude_skills_graphify_references_query_reflect_lessons [EXTRACTED 1.00]
- **Local voice pipeline (WebRTC → Silero VAD → Whisper → Ollama → Kokoro → WebRTC)** — vitru_vitru_voice_readme_silero_vad, vitru_vitru_voice_readme_whisper, vitru_vitru_voice_readme_ollama, vitru_vitru_voice_readme_kokoro, vitru_vitru_voice_readme_pipecat [EXTRACTED 1.00]
- **Graphify Full Pipeline Steps** — _claude_skills_graphify_skill_graphify_skill, _claude_skills_graphify_skill_step_0_github_clone, _claude_skills_graphify_skill_step_1_ensure_installed, _claude_skills_graphify_skill_step_2_detect_files, _claude_skills_graphify_skill_step_2_5_video_audio, _claude_skills_graphify_skill_step_3_extract, _claude_skills_graphify_skill_step_4_build_cluster, _claude_skills_graphify_skill_step_4_5_health_check, _claude_skills_graphify_skill_step_5_label_communities, _claude_skills_graphify_skill_step_6_obsidian_html, _claude_skills_graphify_skill_step_9_manifest_cleanup [INFERRED 0.85]
- **Amazon Bedrock integration path for Vitru text generation** — vitru_docs_fundamental_decisions_bedrock, vitru_docs_fundamental_decisions_mvp_services, vitru_n8n_workflows_readme_bedrock_credential, vitru_n8n_workflows_readme_vitru_router [INFERRED 0.85]

## Communities (90 total, 14 thin omitted)

### Community 0 - "StudyActivity"
Cohesion: 0.18
Nodes (16): ActivityBlock(), ActivityBlockProps, activity, ActivityFormDraft, ActivityFormModalProps, StudyPlannerViewProps, AssistantResponse, SubjectOption (+8 more)

### Community 1 - "getDb"
Cohesion: 0.09
Nodes (60): StudyCalendarPage(), CampusVitruPage(), MediatorRequestPage(), AssessmentsPage(), ExamSchedulePage(), AnswerTestPage(), DisciplinePage(), AttendanceLogPage() (+52 more)

### Community 2 - "AssistantPanel.tsx"
Cohesion: 0.14
Nodes (21): SurfaceResolutionResult, POST(), SendIcon(), SparklesIcon(), AssistantPanel(), AssistantPanelProps, ChatApiResponse, ChatMessage (+13 more)

### Community 3 - "exam-schedule-selectors.ts"
Cohesion: 0.05
Nodes (59): AssessmentAction(), AssessmentActionProps, AssessmentCard(), AssessmentCardProps, AssessmentStatus(), CompletedTestSummary(), CalendarDay(), CalendarDayProps (+51 more)

### Community 4 - "ExamScheduleView.tsx"
Cohesion: 0.08
Nodes (49): POST(), CityComparisonNotice(), buildAddressLine(), buildMapQuery(), ExamLocationCard(), ExamLocationCardProps, ExamScheduleSituationLabel(), ExamScheduleSituationLabelProps (+41 more)

### Community 5 - "Graphify Skill (/graphify Pipeline)"
Cohesion: 0.05
Nodes (52): Graphify Skill Trigger (/graphify), /graphify add <url>, --watch Background Watcher, FalkorDB Export (--falkordb/--falkordb-push), MCP Stdio Server (--mcp), Neo4j Export (--neo4j/--neo4j-push), SVG/GraphML Export, Token Reduction Benchmark (+44 more)

### Community 6 - "trilha-resolution.ts"
Cohesion: 0.10
Nodes (35): NAMED_ENTITIES, stripHtml(), consumeInboxEvent(), deleteInboxEvent(), getInboxEvent(), InboxEvent, InboxEventStore, loadStore() (+27 more)

### Community 7 - "Ambiente local n8n (Docker Compose)"
Cohesion: 0.05
Nodes (40): PGlite as default dev/test Postgres driver, postgres service (root docker-compose), Orçamento AWS US$20/mês; execução local no MVP, AWS CDK, Amazon Bedrock, Uso do CPF na verificação/recuperação, Política de exposição de dados sensíveis no WhatsApp, Serviços planejados — Evolução (+32 more)

### Community 8 - "server.js"
Cohesion: 0.11
Nodes (19): config, ASSISTANT_SYSTEM_PROMPT, handleWebSocketClient(), app, __dirname, server, webWss, generateReply() (+11 more)

### Community 9 - "index.tsx"
Cohesion: 0.10
Nodes (20): DisciplineMoreInfo(), DisciplineMoreInfoProps, INFO_ITEMS, InfoItem, BarChartIcon(), BookOpenIcon(), CalculatorIcon(), CalendarIcon() (+12 more)

### Community 10 - "compilerOptions"
Cohesion: 0.07
Nodes (28): dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+20 more)

### Community 11 - "chat/route.ts"
Cohesion: 0.19
Nodes (15): DEFAULT_GREETING, handleSurfaceChat(), invalid(), isSurfaceFocus(), POST(), resolveTrilhaMessage(), SurfaceChatBody, SurfaceResolutionOutcome (+7 more)

### Community 12 - "vitru-voice/package.json"
Cohesion: 0.20
Nodes (9): description, main, name, scripts, dev, start, start:legacy, type (+1 more)

### Community 13 - "LearningPathView.tsx"
Cohesion: 0.16
Nodes (17): ChevronDownIcon(), LayersIcon(), LockIcon(), TargetIcon(), LearningPathView(), LessonView(), useLearningPathProgress(), buildLessonStatuses() (+9 more)

### Community 14 - "client.ts"
Cohesion: 0.36
Nodes (7): Connection, createConnection(), DatabaseDriver, globalForDb, pgliteLocation(), requireEnv(), resolveDriver()

### Community 15 - "TrilhaEditor.tsx"
Cohesion: 0.13
Nodes (20): fieldClass(), LessonEditor(), newLesson(), newSection(), SectionEditor(), TrilhaEditor(), TrilhaEditorProps, TrashIcon() (+12 more)

### Community 16 - "academic.ts"
Cohesion: 0.12
Nodes (15): academic, assessments, attendances, calendarEvents, classmates, datasets, disciplines, examScheduleOptions (+7 more)

### Community 17 - "vitru.ts"
Cohesion: 0.11
Nodes (17): students, appSettings, conversationMessages, conversations, examScheduleOverrides, interactions, memories, studentProfiles (+9 more)

### Community 18 - "student-profile.ts"
Cohesion: 0.16
Nodes (14): resolveCalendarMessage(), VitruStudentContext, DisclosureLevel, resolveDisclosure(), buildKnownFieldsManifest(), formatWeekdays(), WEEKDAY_LABELS_PT, getStudentProfile() (+6 more)

### Community 19 - "devDependencies"
Cohesion: 0.11
Nodes (19): drizzle-kit, jsdom, devDependencies, drizzle-kit, jsdom, pg, tailwindcss, @tailwindcss/postcss (+11 more)

### Community 20 - "TestRunner.tsx"
Cohesion: 0.18
Nodes (12): TestInfoCard(), TestQuestionCard(), TestQuestionCardProps, TestRunner(), TestStepper(), TestStepperProps, TestToolbar(), TestToolbarProps (+4 more)

### Community 21 - "LessonView.tsx"
Cohesion: 0.18
Nodes (10): PlayCircleIcon(), TerminalIcon(), LessonMarkdown(), LessonMarkdownProps, renderInline(), LessonVideos(), LessonViewProps, EMPTY_PROGRESS (+2 more)

### Community 22 - "memories.ts"
Cohesion: 0.19
Nodes (12): createTestStudent(), deleteTestStudent(), StudyProgram, SESSION_TTL_MS, addMemory(), listActiveMemories(), Memory, MemoryKind (+4 more)

### Community 23 - "usuario-ficticio-agendamento-pendente/manifest.json"
Cohesion: 0.07
Nodes (27): cohortBaseUserId, datasets, currentSemester, disciplines, financialTitles, sofiaDadosAluno, studyActivities, userData (+19 more)

### Community 24 - "dependencies"
Cohesion: 0.13
Nodes (15): @aws-sdk/client-bedrock-runtime, @aws-sdk/client-rds-data, drizzle-orm, @electric-sql/pglite, next, dependencies, @aws-sdk/client-bedrock-runtime, @aws-sdk/client-rds-data (+7 more)

### Community 25 - "db-helpers.ts"
Cohesion: 0.16
Nodes (18): requireStudentBySlug(), StudentRow, saveStudyActivities(), SaveStudyActivitiesResult, StudyActivityRow, STUDENT_LEVEL, assertValidId(), markLessonCompleted() (+10 more)

### Community 26 - "seed-from-fixtures.ts"
Cohesion: 0.20
Nodes (14): Database, CurrentSemesterRaw, PoleInfo, UserDataRaw, counted(), Counters, listDirs(), listFiles() (+6 more)

### Community 27 - "VitruSemanticSnapshot"
Cohesion: 0.15
Nodes (14): AppShellProps, AppShellChrome(), AppShellChromeProps, Header(), HeaderProps, initialsFromName(), PageContainer(), PageContainerProps (+6 more)

### Community 28 - "scripts"
Cohesion: 0.15
Nodes (13): scripts, build, db:generate, db:migrate, db:reset, db:seed, db:status, db:studio (+5 more)

### Community 29 - "MediatorRequestForm.tsx"
Cohesion: 0.18
Nodes (8): BriefcaseIcon(), CheckCircleIcon(), InfoIcon(), UserIcon(), MediatorDisciplineOption, MediatorRequestForm(), MediatorRequestFormProps, MOTIVOS

### Community 30 - "db-verify-fidelity.ts"
Cohesion: 0.19
Nodes (9): closeDb(), WorkScheduleRaw, StudentProfileUpdate, main(), TableRow, canonical(), check(), main() (+1 more)

### Community 31 - "user-selectors.ts"
Cohesion: 0.36
Nodes (5): SemesterHeader(), displaySemesterLabel(), SofiaParticipationDerived, SofiaDadosAlunoData, SofiaDadosAlunoRaw

### Community 32 - "CalendarToolbar.tsx"
Cohesion: 0.38
Nodes (5): PlusIcon(), CalendarToolbar(), CalendarToolbarProps, VIEW_MODE_OPTIONS, StudyPlannerViewMode

### Community 33 - "surface-visits.ts"
Cohesion: 0.52
Nodes (5): getSurfaceVisit(), markSurfaceOnboarded(), recordSurfaceVisit(), SurfaceVisit, toSurfaceVisit()

### Community 34 - "usuario-ficticio-atividades-acumuladas/manifest.json"
Cohesion: 0.07
Nodes (27): cohortBaseUserId, datasets, currentSemester, disciplines, financialTitles, sofiaDadosAluno, studyActivities, userData (+19 more)

### Community 35 - "FinancialTitleRaw"
Cohesion: 0.60
Nodes (3): RecoverySection(), RecoverySectionProps, FinancialTitleRaw

### Community 36 - "package.json"
Cohesion: 0.50
Nodes (3): name, private, version

### Community 37 - "VoiceAssistantWindow.tsx"
Cohesion: 0.10
Nodes (19): metadata, RootLayout(), stableContextHash(), VITRU_ASSISTANT_ROOT_ATTRIBUTE, PARTICLES, VitruLogo(), VitruLogoProps, VitruLogoState (+11 more)

### Community 38 - "Next.js App (create-next-app)"
Cohesion: 0.67
Nodes (3): Next.js App (create-next-app), Vercel Deployment, Portal integrations follow Next.js conventions (app/, components/, lib/)

### Community 39 - "Pipeline de voz (WebRTC → VAD → Whisper → Ollama → Kokoro → WebRTC)"
Cohesion: 0.67
Nodes (3): Implementação Node anterior (fallback, src/), Pipecat, Pipeline de voz (WebRTC → VAD → Whisper → Ollama → Kokoro → WebRTC)

### Community 40 - "usuario-ficticio-conflito-horarios/manifest.json"
Cohesion: 0.07
Nodes (27): cohortBaseUserId, datasets, currentSemester, disciplines, financialTitles, sofiaDadosAluno, studyActivities, userData (+19 more)

### Community 44 - "usuario-ficticio-prazo-urgente/manifest.json"
Cohesion: 0.07
Nodes (27): cohortBaseUserId, datasets, currentSemester, disciplines, financialTitles, sofiaDadosAluno, studyActivities, userData (+19 more)

### Community 52 - "usuario-ficticio-prova-liberada/manifest.json"
Cohesion: 0.07
Nodes (27): cohortBaseUserId, datasets, currentSemester, disciplines, financialTitles, sofiaDadosAluno, studyActivities, userData (+19 more)

### Community 57 - "usuario-ficticio-sem-horario-livre/manifest.json"
Cohesion: 0.07
Nodes (27): cohortBaseUserId, datasets, currentSemester, disciplines, financialTitles, sofiaDadosAluno, studyActivities, userData (+19 more)

### Community 58 - "usuario-ficticio-baixa-frequencia/manifest.json"
Cohesion: 0.08
Nodes (25): cohortBaseUserId, datasets, currentSemester, disciplines, financialTitles, sofiaDadosAluno, userData, displayLabel (+17 more)

### Community 59 - "usuario-ficticio-calouro/manifest.json"
Cohesion: 0.08
Nodes (25): cohortBaseUserId, datasets, currentSemester, disciplines, financialTitles, sofiaDadosAluno, userData, displayLabel (+17 more)

### Community 60 - "usuario-ficticio-em-dia/manifest.json"
Cohesion: 0.08
Nodes (25): cohortBaseUserId, datasets, currentSemester, disciplines, financialTitles, sofiaDadosAluno, userData, displayLabel (+17 more)

### Community 61 - "StudyPlannerView.tsx"
Cohesion: 0.17
Nodes (18): MonthGridView(), MonthGridViewProps, addMonths(), StudyPlannerView(), announcePlanPreviews(), VITRU_PLAN_CONFIRMED_EVENT, VITRU_PLAN_PREVIEW_EVENT, VITRU_PLAN_PREVIEW_REMOVED_EVENT (+10 more)

### Community 62 - "assessment-plan.ts"
Cohesion: 0.21
Nodes (16): AssessmentWithSubject, AssessmentPlan, ASSIGNMENT_STEPS, buildNextAssessmentPlan(), daysBetween(), EXAM_STEPS, isAssignmentAssessment(), pendingOpenAssessments() (+8 more)

### Community 63 - "joao-pedro-lopes-zamonelo/manifest.json"
Cohesion: 0.10
Nodes (19): datasets, currentSemester, disciplines, financialTitles, sofiaDadosAluno, userData, displayLabel, isFictional (+11 more)

### Community 64 - "bot.py"
Cohesion: 0.18
Nodes (13): BaseTransport, RunnerArguments, ToolsSchema, bot(), build_semantic_tools(), prewarm_stt(), Carrega o Whisper MLX antes da primeira fala, evitando pagar o load no turno 1., run_bot() (+5 more)

### Community 65 - "WeekGridView.tsx"
Cohesion: 0.22
Nodes (14): DayGridView(), DayGridViewProps, buildHourRows(), computeBlockStyle(), GRID_END_HOUR, GRID_START_HOUR, ROW_HEIGHT_PX, TimeGridColumn() (+6 more)

### Community 66 - "build-student-context.ts"
Cohesion: 0.22
Nodes (14): loadAllSubjectAssessments(), loadSofiaDadosAluno(), loadUserManifest(), deriveSofiaParticipation(), getActivitiesInRange(), getWeekdayIndex(), startOfWeek(), timeToMinutes() (+6 more)

### Community 67 - "group-related-students.ts"
Cohesion: 0.20
Nodes (11): ClassmatesSection(), ClassmatesSectionProps, initials(), StudentConnectionCard(), CurrentStudentForGrouping, groupRelatedStudents(), RelatedStudentsGroups, baseCurrentStudent (+3 more)

### Community 68 - "ThinkingTextFilter"
Cohesion: 0.20
Nodes (6): Frame, FrameDirection, FrameProcessor, ThinkingFilterProcessor, ThinkingTextFilter, ThinkingTextFilterTest

### Community 69 - "DisciplineCard.tsx"
Cohesion: 0.23
Nodes (11): DisciplineCard(), DisciplineCardProps, DisciplineCarousel(), DisciplineCarouselProps, ChevronLeftIcon(), ClockIcon(), DISCIPLINE_STATUS_LABELS, formatWeekdayLabel() (+3 more)

### Community 70 - "load-user-index.ts"
Cohesion: 0.22
Nodes (9): GET(), normalizePhone(), WhatsAppIdentity, WhatsAppIdentityFile, UserSwitcher(), UserSwitcherProps, UserIndex, UserIndexEntry (+1 more)

### Community 71 - "semantic-snapshot.ts"
Cohesion: 0.18
Nodes (10): resolveTarget(), TARGET_AMBIGUITY_MARGIN, TARGET_SCORE_THRESHOLD, TargetResolution, snapshot, VitruAction, VitruDestination, VitruItem (+2 more)

### Community 72 - "browser-context.ts"
Cohesion: 0.36
Nodes (11): buildBrowserContext(), closeVitruTarget(), collectVisibleComponents(), componentName(), componentRole(), findTarget(), highlightVitruTarget(), isVisible() (+3 more)

### Community 73 - "debug-store.ts"
Cohesion: 0.33
Nodes (6): VitruDebugPanel(), DebugEntry, entries, getVitruDebugEntries(), listeners, subscribeVitruDebug()

### Community 74 - "SemanticSnapshotProvider.tsx"
Cohesion: 0.33
Nodes (8): listeners, publishSnapshot(), SemanticSnapshotProvider(), subscribe(), Page(), PersistentConsumer(), snapshot(), useSemanticSnapshot()

### Community 75 - "SuggestionCard.tsx"
Cohesion: 0.33
Nodes (7): ActivityFormModal(), SuggestionStatus, SuggestionCard(), SuggestionCardProps, CalendarPlanResponse, AssistantSuggestion, formatDurationLabel()

### Community 76 - "page-context.ts"
Cohesion: 0.31
Nodes (7): isSafeInternalHref(), NAVIGATE, PAGE_DEFINITIONS, PageDefinition, READ, resolveVitruPage(), VITRU_NAVIGATION_DESTINATIONS

### Community 77 - "golden_set.py"
Cohesion: 0.39
Nodes (8): build_payload(), main(), normalize_tokens(), percentile(), resolve_reference(), run_bedrock(), run_ollama(), tools()

### Community 78 - "dependencies"
Cohesion: 0.29
Nodes (7): dotenv, express, dependencies, dotenv, express, ws, ws

### Community 79 - "call_guard_reason"
Cohesion: 0.48
Nodes (5): call_guard_reason(), Return the first deterministic limit reached by an active voice call., test_active_call_is_kept_open(), test_idle_guard_closes_after_sixty_seconds(), test_maximum_call_guard_closes_after_ten_minutes()

### Community 80 - "confirm/route.ts"
Cohesion: 0.47
Nodes (3): ConfirmationBody, invalid(), POST()

### Community 81 - "calendar-logic.ts"
Cohesion: 0.40
Nodes (5): FreeSlot, generateActivityId(), hasConflict(), overlaps(), removeActivity()

### Community 82 - "action-protocol.ts"
Cohesion: 0.47
Nodes (4): acceptsEventVersion(), navigationCanComplete(), VitruActionEvent, VitruActionEventType

### Community 83 - "VoiceTimingProcessor"
Cohesion: 0.33
Nodes (4): Frame, FrameDirection, FrameProcessor, VoiceTimingProcessor

### Community 84 - "generate.ts"
Cohesion: 0.50
Nodes (4): client, generate(), GenerateResult, toAlternatingMessages()

## Knowledge Gaps
- **498 isolated node(s):** `{ generateMock }`, `SurfaceChatBody`, `DEFAULT_GREETING`, `SurfaceResolutionOutcome`, `WhatsAppIdentity` (+493 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **14 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `getDb()` connect `getDb` to `surface-visits.ts`, `AssistantPanel.tsx`, `ExamScheduleView.tsx`, `load-user-index.ts`, `chat/route.ts`, `client.ts`, `TrilhaEditor.tsx`, `student-profile.ts`, `LessonView.tsx`, `memories.ts`, `db-helpers.ts`, `seed-from-fixtures.ts`, `db-verify-fidelity.ts`?**
  _High betweenness centrality (0.030) - this node is a cross-community bridge._
- **Why does `resolveActiveUserId()` connect `getDb` to `confirm/route.ts`, `chat/route.ts`, `VoiceAssistantWindow.tsx`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **Why does `AssessmentRaw` connect `exam-schedule-selectors.ts` to `getDb`, `academic.ts`, `db-verify-fidelity.ts`, `seed-from-fixtures.ts`, `assessment-plan.ts`?**
  _High betweenness centrality (0.010) - this node is a cross-community bridge._
- **What connects `{ generateMock }`, `SurfaceChatBody`, `DEFAULT_GREETING` to the rest of the system?**
  _498 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `getDb` be split into smaller, more focused modules?**
  _Cohesion score 0.0932073544433095 - nodes in this community are weakly interconnected._
- **Should `AssistantPanel.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.13538461538461538 - nodes in this community are weakly interconnected._
- **Should `exam-schedule-selectors.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05276907001044932 - nodes in this community are weakly interconnected._