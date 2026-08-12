# Graph Report - .  (2026-08-10)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 1104 nodes · 2295 edges · 46 communities (35 shown, 11 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 15 edges (avg confidence: 0.79)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `41ac3f12`
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
- StudyPlannerView.tsx
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
- formatDateBr
- TrilhaEditor.tsx
- n8n do Vitru
- infra/README.md
- DisciplineCard.tsx
- Workflows versionados
- usuario-ficticio-agendamento-pendente/manifest.json
- usuario-ficticio-atividades-acumuladas/manifest.json
- usuario-ficticio-conflito-horarios/manifest.json
- usuario-ficticio-prazo-urgente/manifest.json
- usuario-ficticio-prova-liberada/manifest.json
- usuario-ficticio-sem-horario-livre/manifest.json
- calendar-selectors.ts
- ExamScheduleView.tsx
- DisciplineMoreInfo.tsx
- index.tsx
- MediatorRequestForm.tsx
- read-json-file.ts
- chat/route.ts
- build-student-context.ts

## God Nodes (most connected - your core abstractions)
1. `resolveActiveUserId()` - 36 edges
2. `Graphify Skill (/graphify Pipeline)` - 29 edges
3. `loadDisciplines()` - 28 edges
4. `buildVitruStudentContext()` - 26 edges
5. `StudyActivity` - 23 edges
6. `formatDateBr()` - 22 edges
7. `readUserJsonFileOptional()` - 21 edges
8. `toIsoDateKey()` - 21 edges
9. `findDisciplineByCode()` - 21 edges
10. `AppShell()` - 16 edges

## Surprising Connections (you probably didn't know these)
- `Next.js Breaking-Changes Notice` --semantically_similar_to--> `Honesty Rules`  [INFERRED] [semantically similar]
  AGENTS.md → .claude/skills/graphify/SKILL.md
- `resolveTrilhaMessage()` --calls--> `loadSubjectLearningPath()`  [EXTRACTED]
  app/api/v1/vitru/chat/route.ts → lib/data/load-subject-data.ts
- `resolveTrilhaMessage()` --calls--> `resolveLocally()`  [EXTRACTED]
  app/api/v1/vitru/chat/route.ts → lib/vitru/trilha-resolution.ts
- `resolveCalendarMessage()` --calls--> `buildVitruStudentContext()`  [EXTRACTED]
  app/api/v1/vitru/chat/route.ts → lib/vitru/build-student-context.ts
- `handleSurfaceChat()` --calls--> `loadUserIndex()`  [EXTRACTED]
  app/api/v1/vitru/chat/route.ts → lib/data/load-user-index.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Graphify Full Pipeline Steps** — _claude_skills_graphify_skill_graphify_skill, _claude_skills_graphify_skill_step_0_github_clone, _claude_skills_graphify_skill_step_1_ensure_installed, _claude_skills_graphify_skill_step_2_detect_files, _claude_skills_graphify_skill_step_2_5_video_audio, _claude_skills_graphify_skill_step_3_extract, _claude_skills_graphify_skill_step_4_build_cluster, _claude_skills_graphify_skill_step_4_5_health_check, _claude_skills_graphify_skill_step_5_label_communities, _claude_skills_graphify_skill_step_6_obsidian_html, _claude_skills_graphify_skill_step_9_manifest_cleanup [INFERRED 0.85]
- **Graphify Optional Export Targets** — _claude_skills_graphify_references_exports_wiki_export, _claude_skills_graphify_references_exports_neo4j_export, _claude_skills_graphify_references_exports_falkordb_export, _claude_skills_graphify_references_exports_svg_graphml_export, _claude_skills_graphify_references_exports_mcp_server [EXTRACTED 1.00]
- **Query/Path/Explain Feedback Loop via save-result** — _claude_skills_graphify_references_query_graphify_query, _claude_skills_graphify_references_query_graphify_path, _claude_skills_graphify_references_query_graphify_explain, _claude_skills_graphify_references_query_save_result, _claude_skills_graphify_references_query_reflect_lessons [EXTRACTED 1.00]

## Communities (46 total, 11 thin omitted)

### Community 0 - "load-subject-data.ts"
Cohesion: 0.08
Nodes (58): CampusVitruPage(), ChatIaPage(), SubjectCalendarPage(), MediatorRequestPage(), AssessmentsPage(), ExamSchedulePage(), DisciplinePage(), AttendanceLogPage() (+50 more)

### Community 1 - "Graphify Skill (/graphify Pipeline)"
Cohesion: 0.05
Nodes (52): Graphify Skill Trigger (/graphify), /graphify add <url>, --watch Background Watcher, FalkorDB Export (--falkordb/--falkordb-push), MCP Stdio Server (--mcp), Neo4j Export (--neo4j/--neo4j-push), SVG/GraphML Export, Token Reduction Benchmark (+44 more)

### Community 2 - "Decisões fundamentais do Vitru"
Cohesion: 0.13
Nodes (13): AWS, Ações que exigem confirmação, Dados no WhatsApp, Decisões fundamentais do Vitru, Evolução, Identidade e canais, Identificação e confirmação, MVP (+5 more)

### Community 3 - "devDependencies"
Cohesion: 0.05
Nodes (41): @aws-sdk/client-bedrock-runtime, eslint, eslint-config-next, jsdom, next, dependencies, @aws-sdk/client-bedrock-runtime, next (+33 more)

### Community 4 - "trilha-resolution.ts"
Cohesion: 0.09
Nodes (39): AnswerTestPage(), isEnvelopedTestContent(), loadSubjectTestContent(), NAMED_ENTITIES, stripHtml(), consumeInboxEvent(), deleteInboxEvent(), getInboxEvent() (+31 more)

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

### Community 11 - "StudyPlannerView.tsx"
Cohesion: 0.07
Nodes (67): PlusIcon(), TrashIcon(), ActivityBlock(), ActivityBlockProps, ActivityFormDraft, ActivityFormModal(), ActivityFormModalProps, CalendarToolbar() (+59 more)

### Community 12 - "AppShellChrome.tsx"
Cohesion: 0.21
Nodes (9): AppShellChrome(), AppShellChromeProps, Header(), HeaderProps, initialsFromName(), PageContainer(), PageContainerProps, MENU_ITEMS (+1 more)

### Community 14 - "Next.js Framework"
Cohesion: 0.67
Nodes (3): create-next-app Bootstrap, Next.js Framework, Vercel Deployment

### Community 23 - "formatDateBr"
Cohesion: 0.13
Nodes (19): AssessmentAction(), AssessmentActionProps, AssessmentCard(), AssessmentStatus(), CompletedTestSummary(), AttendanceProgress(), RecordedClassesModal(), RecordingItem() (+11 more)

### Community 24 - "TrilhaEditor.tsx"
Cohesion: 0.05
Nodes (55): fieldClass(), LessonEditor(), newLesson(), newSection(), SectionEditor(), TrilhaEditor(), TrilhaEditorProps, ChevronDownIcon() (+47 more)

### Community 26 - "n8n do Vitru"
Cohesion: 0.29
Nodes (6): Limites deste ambiente, n8n do Vitru, Operação, Preparação, Serviços, Workflows

### Community 28 - "DisciplineCard.tsx"
Cohesion: 0.21
Nodes (12): DisciplineCard(), DisciplineCardProps, DisciplineCarousel(), DisciplineCarouselProps, BookOpenIcon(), CalendarIcon(), ChevronLeftIcon(), DISCIPLINE_STATUS_LABELS (+4 more)

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
Nodes (19): CalendarDay(), CalendarDayProps, CalendarGrid(), CalendarGridProps, EMPTY_DISABLED_KEYS, CalendarMonthNavigation(), CalendarMonthNavigationProps, EventsPanel() (+11 more)

### Community 37 - "ExamScheduleView.tsx"
Cohesion: 0.06
Nodes (53): CityComparisonNotice(), ClassmatesSection(), ClassmatesSectionProps, initials(), StudentConnectionCard(), ExamDateCalendar(), ExamDateCalendarProps, buildAddressLine() (+45 more)

### Community 38 - "DisciplineMoreInfo.tsx"
Cohesion: 0.14
Nodes (13): DisciplineMoreInfo(), DisciplineMoreInfoProps, INFO_ITEMS, InfoItem, BarChartIcon(), CalculatorIcon(), ChatBubbleIcon(), FileTextIcon() (+5 more)

### Community 39 - "index.tsx"
Cohesion: 0.19
Nodes (6): GraduationCapIcon(), HomeIcon(), SparklesIcon(), BottomNavBar(), isTabActive(), TABS

### Community 41 - "MediatorRequestForm.tsx"
Cohesion: 0.18
Nodes (8): BriefcaseIcon(), CheckCircleIcon(), InfoIcon(), UserIcon(), MediatorDisciplineOption, MediatorRequestForm(), MediatorRequestFormProps, MOTIVOS

### Community 42 - "read-json-file.ts"
Cohesion: 0.07
Nodes (26): GET(), normalizePhone(), WhatsAppIdentity, WhatsAppIdentityFile, ConfirmationBody, invalid(), POST(), UserSwitcher() (+18 more)

### Community 43 - "chat/route.ts"
Cohesion: 0.06
Nodes (51): DEFAULT_GREETING, handleSurfaceChat(), invalid(), isSurfaceFocus(), POST(), resolveCalendarMessage(), resolveTrilhaMessage(), SurfaceChatBody (+43 more)

### Community 46 - "build-student-context.ts"
Cohesion: 0.09
Nodes (34): StudyCalendarPage(), AssessmentCardProps, SemesterHeader(), AssessmentWithSubject, loadAllSubjectAssessments(), loadAllSubjectCalendarEvents(), loadSimulationDate(), loadStudyActivities() (+26 more)

## Knowledge Gaps
- **408 isolated node(s):** `{ generateMock }`, `SurfaceChatBody`, `DEFAULT_GREETING`, `SurfaceResolutionOutcome`, `WhatsAppIdentity` (+403 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **11 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `resolveActiveUserId()` connect `load-subject-data.ts` to `read-json-file.ts`, `chat/route.ts`, `trilha-resolution.ts`, `build-student-context.ts`?**
  _High betweenness centrality (0.022) - this node is a cross-community bridge._
- **Why does `formatDateBr()` connect `formatDateBr` to `load-subject-data.ts`, `StudyPlannerView.tsx`, `calendar-selectors.ts`, `ExamScheduleView.tsx`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **Why does `StudyActivity` connect `StudyPlannerView.tsx` to `read-json-file.ts`, `build-student-context.ts`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **What connects `{ generateMock }`, `SurfaceChatBody`, `DEFAULT_GREETING` to the rest of the system?**
  _408 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `load-subject-data.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08164794007490636 - nodes in this community are weakly interconnected._
- **Should `Graphify Skill (/graphify Pipeline)` be split into smaller, more focused modules?**
  _Cohesion score 0.05429864253393665 - nodes in this community are weakly interconnected._
- **Should `Decisões fundamentais do Vitru` be split into smaller, more focused modules?**
  _Cohesion score 0.13333333333333333 - nodes in this community are weakly interconnected._