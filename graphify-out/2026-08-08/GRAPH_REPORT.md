# Graph Report - uniasselvi-clone  (2026-08-08)

## Corpus Check
- 311 files · ~4,473,710 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 995 nodes · 2086 edges · 41 communities (30 shown, 11 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 18 edges (avg confidence: 0.77)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `ba47dd20`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- load-subject-data.ts
- Graphify Skill Docs
- Decisões fundamentais do Vitru
- devDependencies
- agendamento/page.tsx
- TypeScript Config
- TestRunner.tsx
- build-student-context.ts
- User Data Manifest (Joao Pedro)
- usuario-ficticio-baixa-frequencia/manifest.json
- usuario-ficticio-em-dia/manifest.json
- StudyPlannerView.tsx
- AppShellChrome.tsx
- Root Layout
- Project README
- ESLint Config
- Next.js Config
- PostCSS Config
- File Icon
- Globe Icon
- Next.js Icon
- Vercel Icon
- Window Icon
- ExamScheduleView.tsx
- TrilhaEditor.tsx
- n8n do Vitru
- infra/README.md
- LessonChat.tsx
- Workflows versionados
- usuario-ficticio-agendamento-pendente/manifest.json
- usuario-ficticio-atividades-acumuladas/manifest.json
- usuario-ficticio-conflito-horarios/manifest.json
- usuario-ficticio-prazo-urgente/manifest.json
- usuario-ficticio-prova-liberada/manifest.json
- usuario-ficticio-sem-horario-livre/manifest.json
- index.tsx
- LearningPathView.tsx
- use-learning-path-progress.ts
- LessonView.tsx
- CalendarToolbar.tsx

## God Nodes (most connected - your core abstractions)
1. `resolveActiveUserId()` - 30 edges
2. `Graphify Skill (/graphify Pipeline)` - 29 edges
3. `buildVitruStudentContext()` - 28 edges
4. `loadDisciplines()` - 26 edges
5. `StudyActivity` - 24 edges
6. `formatDateBr()` - 22 edges
7. `toIsoDateKey()` - 21 edges
8. `readUserJsonFileOptional()` - 19 edges
9. `findDisciplineByCode()` - 19 edges
10. `addDays()` - 19 edges

## Surprising Connections (you probably didn't know these)
- `Next.js Breaking-Changes Notice` --semantically_similar_to--> `Honesty Rules`  [INFERRED] [semantically similar]
  AGENTS.md → .claude/skills/graphify/SKILL.md
- `StudyCalendarPage()` --calls--> `loadDisciplines()`  [EXTRACTED]
  app/calendario-de-estudos/page.tsx → lib/data/load-user-data.ts
- `StudyCalendarPage()` --calls--> `resolveActiveUserId()`  [EXTRACTED]
  app/calendario-de-estudos/page.tsx → lib/data/resolve-active-user.ts
- `StudyCalendarPage()` --calls--> `findDisciplineByCode()`  [EXTRACTED]
  app/calendario-de-estudos/page.tsx → lib/selectors/discipline-selectors.ts
- `StudyCalendarPage()` --calls--> `addDays()`  [EXTRACTED]
  app/calendario-de-estudos/page.tsx → lib/study-planner/date-utils.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Graphify Full Pipeline Steps** — _claude_skills_graphify_skill_graphify_skill, _claude_skills_graphify_skill_step_0_github_clone, _claude_skills_graphify_skill_step_1_ensure_installed, _claude_skills_graphify_skill_step_2_detect_files, _claude_skills_graphify_skill_step_2_5_video_audio, _claude_skills_graphify_skill_step_3_extract, _claude_skills_graphify_skill_step_4_build_cluster, _claude_skills_graphify_skill_step_4_5_health_check, _claude_skills_graphify_skill_step_5_label_communities, _claude_skills_graphify_skill_step_6_obsidian_html, _claude_skills_graphify_skill_step_9_manifest_cleanup [INFERRED 0.85]
- **Graphify Optional Export Targets** — _claude_skills_graphify_references_exports_wiki_export, _claude_skills_graphify_references_exports_neo4j_export, _claude_skills_graphify_references_exports_falkordb_export, _claude_skills_graphify_references_exports_svg_graphml_export, _claude_skills_graphify_references_exports_mcp_server [EXTRACTED 1.00]
- **Query/Path/Explain Feedback Loop via save-result** — _claude_skills_graphify_references_query_graphify_query, _claude_skills_graphify_references_query_graphify_path, _claude_skills_graphify_references_query_graphify_explain, _claude_skills_graphify_references_query_save_result, _claude_skills_graphify_references_query_reflect_lessons [EXTRACTED 1.00]

## Communities (41 total, 11 thin omitted)

### Community 0 - "load-subject-data.ts"
Cohesion: 0.06
Nodes (69): CampusVitruPage(), ChatIaPage(), SubjectCalendarPage(), AssessmentsPage(), AnswerTestPage(), DisciplinePage(), AttendanceLogPage(), LearningPathLessonPage() (+61 more)

### Community 1 - "Graphify Skill Docs"
Cohesion: 0.05
Nodes (52): Graphify Skill Trigger (/graphify), /graphify add <url>, --watch Background Watcher, FalkorDB Export (--falkordb/--falkordb-push), MCP Stdio Server (--mcp), Neo4j Export (--neo4j/--neo4j-push), SVG/GraphML Export, Token Reduction Benchmark (+44 more)

### Community 2 - "Decisões fundamentais do Vitru"
Cohesion: 0.13
Nodes (13): AWS, Ações que exigem confirmação, Dados no WhatsApp, Decisões fundamentais do Vitru, Evolução, Identidade e canais, Identificação e confirmação, MVP (+5 more)

### Community 3 - "devDependencies"
Cohesion: 0.06
Nodes (35): eslint, eslint-config-next, next, dependencies, next, react, react-dom, devDependencies (+27 more)

### Community 4 - "agendamento/page.tsx"
Cohesion: 0.06
Nodes (57): ExamSchedulePage(), AssessmentAction(), AssessmentActionProps, AssessmentCard(), AssessmentCardProps, AssessmentStatus(), CompletedTestSummary(), CalendarDay() (+49 more)

### Community 5 - "TypeScript Config"
Cohesion: 0.07
Nodes (28): dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+20 more)

### Community 6 - "TestRunner.tsx"
Cohesion: 0.18
Nodes (12): TestInfoCard(), TestQuestionCard(), TestQuestionCardProps, TestRunner(), TestStepper(), TestStepperProps, TestToolbar(), TestToolbarProps (+4 more)

### Community 7 - "build-student-context.ts"
Cohesion: 0.05
Nodes (56): ChatBody, formatSuggestionOffer(), handlePendingWhatsAppIntent(), invalid(), normalizeIntent(), POST(), VitruUpstreamResponse, GET() (+48 more)

### Community 8 - "User Data Manifest (Joao Pedro)"
Cohesion: 0.10
Nodes (19): datasets, currentSemester, disciplines, financialTitles, sofiaDadosAluno, userData, displayLabel, isFictional (+11 more)

### Community 9 - "usuario-ficticio-baixa-frequencia/manifest.json"
Cohesion: 0.08
Nodes (25): cohortBaseUserId, datasets, currentSemester, disciplines, financialTitles, sofiaDadosAluno, userData, displayLabel (+17 more)

### Community 10 - "usuario-ficticio-em-dia/manifest.json"
Cohesion: 0.08
Nodes (25): cohortBaseUserId, datasets, currentSemester, disciplines, financialTitles, sofiaDadosAluno, userData, displayLabel (+17 more)

### Community 11 - "StudyPlannerView.tsx"
Cohesion: 0.06
Nodes (88): ActivityBlock(), ActivityBlockProps, ActivityFormDraft, ActivityFormModal(), ActivityFormModalProps, AssistantPanel(), AssistantPanelProps, nextMessageId() (+80 more)

### Community 12 - "AppShellChrome.tsx"
Cohesion: 0.21
Nodes (9): AppShellChrome(), AppShellChromeProps, Header(), HeaderProps, initialsFromName(), PageContainer(), PageContainerProps, MENU_ITEMS (+1 more)

### Community 14 - "Project README"
Cohesion: 0.67
Nodes (3): create-next-app Bootstrap, Next.js Framework, Vercel Deployment

### Community 23 - "ExamScheduleView.tsx"
Cohesion: 0.06
Nodes (48): CityComparisonNotice(), ClassmatesSection(), ClassmatesSectionProps, initials(), StudentConnectionCard(), ExamDateCalendarProps, buildAddressLine(), buildMapQuery() (+40 more)

### Community 24 - "TrilhaEditor.tsx"
Cohesion: 0.12
Nodes (22): fieldClass(), LessonEditor(), newLesson(), newSection(), SectionEditor(), TrilhaEditor(), TrilhaEditorProps, ChevronDownIcon() (+14 more)

### Community 26 - "n8n do Vitru"
Cohesion: 0.29
Nodes (6): Limites deste ambiente, n8n do Vitru, Operação, Preparação, Serviços, Workflows

### Community 28 - "LessonChat.tsx"
Cohesion: 0.29
Nodes (5): SendIcon(), ChatMessage, LessonChat(), LessonChatProps, QUICK_PROMPTS

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

### Community 38 - "index.tsx"
Cohesion: 0.10
Nodes (19): DisciplineMoreInfo(), INFO_ITEMS, InfoItem, BarChartIcon(), BookOpenIcon(), CalculatorIcon(), ChatBubbleIcon(), FileTextIcon() (+11 more)

### Community 42 - "LearningPathView.tsx"
Cohesion: 0.17
Nodes (13): LayersIcon(), LockIcon(), PlayCircleIcon(), TargetIcon(), LearningPathView(), buildLessonStatuses(), findCurrentLesson(), findLessonNavigation() (+5 more)

### Community 43 - "use-learning-path-progress.ts"
Cohesion: 0.33
Nodes (11): subscribeNoop(), useHasHydrated(), useLearningPathProgress(), EMPTY_IDS, getServerCompletedLessonIdsSnapshot(), getStoredCompletedLessonIdsSnapshot(), markLessonCompletedInStorage(), readSnapshot() (+3 more)

### Community 45 - "LessonView.tsx"
Cohesion: 0.23
Nodes (8): CheckCircleIcon(), ClockIcon(), TerminalIcon(), LessonMarkdown(), renderInline(), LessonVideos(), LessonView(), getLessonSummary()

### Community 47 - "CalendarToolbar.tsx"
Cohesion: 0.38
Nodes (5): PlusIcon(), CalendarToolbar(), CalendarToolbarProps, VIEW_MODE_OPTIONS, StudyPlannerViewMode

## Knowledge Gaps
- **358 isolated node(s):** `ChatBody`, `VitruUpstreamResponse`, `WhatsAppIdentity`, `WhatsAppIdentityFile`, `ConfirmationBody` (+353 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **11 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `formatDateBr()` connect `agendamento/page.tsx` to `load-subject-data.ts`, `StudyPlannerView.tsx`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **Why does `resolveActiveUserId()` connect `load-subject-data.ts` to `agendamento/page.tsx`, `build-student-context.ts`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **Why does `StudyActivity` connect `StudyPlannerView.tsx` to `agendamento/page.tsx`, `build-student-context.ts`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **What connects `ChatBody`, `VitruUpstreamResponse`, `WhatsAppIdentity` to the rest of the system?**
  _358 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `load-subject-data.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.059932785660941 - nodes in this community are weakly interconnected._
- **Should `Graphify Skill Docs` be split into smaller, more focused modules?**
  _Cohesion score 0.05429864253393665 - nodes in this community are weakly interconnected._
- **Should `Decisões fundamentais do Vitru` be split into smaller, more focused modules?**
  _Cohesion score 0.13333333333333333 - nodes in this community are weakly interconnected._