# Graph Report - uniasselvi-clone  (2026-08-08)

## Corpus Check
- 325 files · ~4,481,543 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1101 nodes · 2360 edges · 48 communities (37 shown, 11 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 15 edges (avg confidence: 0.79)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `41ac3f12`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- load-subject-data.ts
- Graphify Skill Docs
- Decisões fundamentais do Vitru
- devDependencies
- trilha-resolution.ts
- TypeScript Config
- TestRunner.tsx
- chat/route.ts
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
- read-json-file.ts
- TrilhaEditor.tsx
- n8n do Vitru
- infra/README.md
- AssistantPanel.tsx
- Workflows versionados
- usuario-ficticio-agendamento-pendente/manifest.json
- usuario-ficticio-atividades-acumuladas/manifest.json
- usuario-ficticio-conflito-horarios/manifest.json
- usuario-ficticio-prazo-urgente/manifest.json
- usuario-ficticio-prova-liberada/manifest.json
- usuario-ficticio-sem-horario-livre/manifest.json
- exam-schedule-selectors.ts
- ExamScheduleView.tsx
- index.tsx
- loadUserIndex
- DisciplineCard.tsx
- MediatorRequestForm.tsx
- confirm/route.ts
- BottomNavBar.tsx
- CalendarToolbar.tsx
- build-student-context.ts

## God Nodes (most connected - your core abstractions)
1. `resolveActiveUserId()` - 36 edges
2. `buildVitruStudentContext()` - 30 edges
3. `loadDisciplines()` - 29 edges
4. `Graphify Skill (/graphify Pipeline)` - 29 edges
5. `StudyActivity` - 24 edges
6. `findDisciplineByCode()` - 23 edges
7. `formatDateBr()` - 22 edges
8. `readUserJsonFileOptional()` - 21 edges
9. `toIsoDateKey()` - 21 edges
10. `addDays()` - 19 edges

## Surprising Connections (you probably didn't know these)
- `Next.js Breaking-Changes Notice` --semantically_similar_to--> `Honesty Rules`  [INFERRED] [semantically similar]
  AGENTS.md → .claude/skills/graphify/SKILL.md
- `ExamDateCalendarProps` --references--> `ExamSession`  [EXTRACTED]
  components/exam-schedule/ExamDateCalendar.tsx → lib/types/derived/index.ts
- `handleLegacyChat()` --calls--> `loadUserIndex()`  [EXTRACTED]
  app/api/v1/vitru/chat/route.ts → lib/data/load-user-index.ts
- `handleLegacyChat()` --calls--> `buildVitruStudentContext()`  [EXTRACTED]
  app/api/v1/vitru/chat/route.ts → lib/vitru/build-student-context.ts
- `resolveTrilhaMessage()` --calls--> `resolveLocally()`  [EXTRACTED]
  app/api/v1/vitru/chat/route.ts → lib/vitru/trilha-resolution.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Graphify Full Pipeline Steps** — _claude_skills_graphify_skill_graphify_skill, _claude_skills_graphify_skill_step_0_github_clone, _claude_skills_graphify_skill_step_1_ensure_installed, _claude_skills_graphify_skill_step_2_detect_files, _claude_skills_graphify_skill_step_2_5_video_audio, _claude_skills_graphify_skill_step_3_extract, _claude_skills_graphify_skill_step_4_build_cluster, _claude_skills_graphify_skill_step_4_5_health_check, _claude_skills_graphify_skill_step_5_label_communities, _claude_skills_graphify_skill_step_6_obsidian_html, _claude_skills_graphify_skill_step_9_manifest_cleanup [INFERRED 0.85]
- **Graphify Optional Export Targets** — _claude_skills_graphify_references_exports_wiki_export, _claude_skills_graphify_references_exports_neo4j_export, _claude_skills_graphify_references_exports_falkordb_export, _claude_skills_graphify_references_exports_svg_graphml_export, _claude_skills_graphify_references_exports_mcp_server [EXTRACTED 1.00]
- **Query/Path/Explain Feedback Loop via save-result** — _claude_skills_graphify_references_query_graphify_query, _claude_skills_graphify_references_query_graphify_path, _claude_skills_graphify_references_query_graphify_explain, _claude_skills_graphify_references_query_save_result, _claude_skills_graphify_references_query_reflect_lessons [EXTRACTED 1.00]

## Communities (48 total, 11 thin omitted)

### Community 0 - "load-subject-data.ts"
Cohesion: 0.07
Nodes (67): resolveTrilhaMessage(), CampusVitruPage(), ChatIaPage(), SubjectCalendarPage(), MediatorRequestPage(), AssessmentsPage(), ExamSchedulePage(), AnswerTestPage() (+59 more)

### Community 1 - "Graphify Skill Docs"
Cohesion: 0.05
Nodes (52): Graphify Skill Trigger (/graphify), /graphify add <url>, --watch Background Watcher, FalkorDB Export (--falkordb/--falkordb-push), MCP Stdio Server (--mcp), Neo4j Export (--neo4j/--neo4j-push), SVG/GraphML Export, Token Reduction Benchmark (+44 more)

### Community 2 - "Decisões fundamentais do Vitru"
Cohesion: 0.13
Nodes (13): AWS, Ações que exigem confirmação, Dados no WhatsApp, Decisões fundamentais do Vitru, Evolução, Identidade e canais, Identificação e confirmação, MVP (+5 more)

### Community 3 - "devDependencies"
Cohesion: 0.05
Nodes (39): eslint, eslint-config-next, jsdom, next, dependencies, next, react, react-dom (+31 more)

### Community 4 - "trilha-resolution.ts"
Cohesion: 0.20
Nodes (19): ContentMatch, FaqMatch, HIT_THRESHOLD, lessonParagraphs(), LOW_SIGNAL_FLOOR, matchContent(), matchFaq(), matchOutOfScope() (+11 more)

### Community 5 - "TypeScript Config"
Cohesion: 0.07
Nodes (28): dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+20 more)

### Community 6 - "TestRunner.tsx"
Cohesion: 0.18
Nodes (12): TestInfoCard(), TestQuestionCard(), TestQuestionCardProps, TestRunner(), TestStepper(), TestStepperProps, TestToolbar(), TestToolbarProps (+4 more)

### Community 7 - "chat/route.ts"
Cohesion: 0.07
Nodes (53): ChatBody, DEFAULT_GREETING, formatSuggestionOffer(), handleLegacyChat(), handlePendingWhatsAppIntent(), handleSurfaceChat(), invalid(), isSurfaceFocus() (+45 more)

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
Nodes (84): ActivityBlock(), ActivityBlockProps, ActivityFormDraft, ActivityFormModal(), ActivityFormModalProps, SuggestionStatus, DayGridView(), DayGridViewProps (+76 more)

### Community 12 - "AppShellChrome.tsx"
Cohesion: 0.21
Nodes (9): AppShellChrome(), AppShellChromeProps, Header(), HeaderProps, initialsFromName(), PageContainer(), PageContainerProps, MENU_ITEMS (+1 more)

### Community 14 - "Project README"
Cohesion: 0.67
Nodes (3): create-next-app Bootstrap, Next.js Framework, Vercel Deployment

### Community 23 - "read-json-file.ts"
Cohesion: 0.24
Nodes (6): DataInvalidError, DataNotFoundError, loadClassmates(), USER_DATA_ROOT, readSharedJsonFileOptional(), SHARED_DATA_ROOT

### Community 24 - "TrilhaEditor.tsx"
Cohesion: 0.05
Nodes (56): fieldClass(), LessonEditor(), newLesson(), newSection(), SectionEditor(), TrilhaEditor(), TrilhaEditorProps, ChevronDownIcon() (+48 more)

### Community 26 - "n8n do Vitru"
Cohesion: 0.29
Nodes (6): Limites deste ambiente, n8n do Vitru, Operação, Preparação, Serviços, Workflows

### Community 28 - "AssistantPanel.tsx"
Cohesion: 0.13
Nodes (22): SurfaceResolutionResult, SendIcon(), AssistantPanel(), AssistantPanelProps, ChatApiResponse, ChatMessage, DisplayedAction, isAssistantAction() (+14 more)

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

### Community 36 - "exam-schedule-selectors.ts"
Cohesion: 0.06
Nodes (53): AssessmentAction(), AssessmentActionProps, AssessmentCard(), AssessmentCardProps, AssessmentStatus(), CompletedTestSummary(), CalendarDay(), CalendarDayProps (+45 more)

### Community 37 - "ExamScheduleView.tsx"
Cohesion: 0.06
Nodes (47): CityComparisonNotice(), ClassmatesSection(), ClassmatesSectionProps, initials(), StudentConnectionCard(), buildAddressLine(), buildMapQuery(), ExamLocationCard() (+39 more)

### Community 38 - "index.tsx"
Cohesion: 0.14
Nodes (13): DisciplineMoreInfo(), DisciplineMoreInfoProps, INFO_ITEMS, InfoItem, BarChartIcon(), CalculatorIcon(), ChatBubbleIcon(), FileTextIcon() (+5 more)

### Community 39 - "loadUserIndex"
Cohesion: 0.23
Nodes (10): GET(), GET(), normalizePhone(), WhatsAppIdentity, WhatsAppIdentityFile, loadUserIndex(), loadUserManifest(), readUserJsonFile() (+2 more)

### Community 40 - "DisciplineCard.tsx"
Cohesion: 0.21
Nodes (12): DisciplineCard(), DisciplineCardProps, DisciplineCarousel(), DisciplineCarouselProps, BookOpenIcon(), CalendarIcon(), ChevronLeftIcon(), DISCIPLINE_STATUS_LABELS (+4 more)

### Community 41 - "MediatorRequestForm.tsx"
Cohesion: 0.18
Nodes (8): BriefcaseIcon(), CheckCircleIcon(), InfoIcon(), UserIcon(), MediatorDisciplineOption, MediatorRequestForm(), MediatorRequestFormProps, MOTIVOS

### Community 42 - "confirm/route.ts"
Cohesion: 0.24
Nodes (8): ConfirmationBody, invalid(), POST(), pendingWrites, saveStudyActivities(), SaveStudyActivitiesResult, USER_DATA_ROOT, writeForUser()

### Community 43 - "BottomNavBar.tsx"
Cohesion: 0.33
Nodes (6): GraduationCapIcon(), HomeIcon(), SparklesIcon(), BottomNavBar(), isTabActive(), TABS

### Community 44 - "CalendarToolbar.tsx"
Cohesion: 0.38
Nodes (5): PlusIcon(), CalendarToolbar(), CalendarToolbarProps, VIEW_MODE_OPTIONS, StudyPlannerViewMode

### Community 46 - "build-student-context.ts"
Cohesion: 0.19
Nodes (17): StudyCalendarPage(), loadAllSubjectAssessments(), loadAllSubjectCalendarEvents(), loadSimulationDate(), loadStudyActivities(), loadWorkSchedule(), loadSofiaDadosAluno(), deriveSofiaParticipation() (+9 more)

## Knowledge Gaps
- **386 isolated node(s):** `ChatBody`, `VitruUpstreamResponse`, `SurfaceChatBody`, `DEFAULT_GREETING`, `SurfaceResolutionOutcome` (+381 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **11 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `resolveActiveUserId()` connect `load-subject-data.ts` to `confirm/route.ts`, `loadUserIndex`, `build-student-context.ts`, `chat/route.ts`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **Why does `toIsoDateKey()` connect `exam-schedule-selectors.ts` to `load-subject-data.ts`, `DisciplineCard.tsx`, `StudyPlannerView.tsx`, `build-student-context.ts`?**
  _High betweenness centrality (0.010) - this node is a cross-community bridge._
- **Why does `formatDateBr()` connect `exam-schedule-selectors.ts` to `load-subject-data.ts`, `StudyPlannerView.tsx`?**
  _High betweenness centrality (0.009) - this node is a cross-community bridge._
- **What connects `ChatBody`, `VitruUpstreamResponse`, `SurfaceChatBody` to the rest of the system?**
  _386 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `load-subject-data.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.0687245195107746 - nodes in this community are weakly interconnected._
- **Should `Graphify Skill Docs` be split into smaller, more focused modules?**
  _Cohesion score 0.05429864253393665 - nodes in this community are weakly interconnected._
- **Should `Decisões fundamentais do Vitru` be split into smaller, more focused modules?**
  _Cohesion score 0.13333333333333333 - nodes in this community are weakly interconnected._