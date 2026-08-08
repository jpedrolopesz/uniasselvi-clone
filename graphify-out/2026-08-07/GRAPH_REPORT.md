# Graph Report - uniasselvi-clone  (2026-08-06)

## Corpus Check
- 182 files · ~535,184 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 695 nodes · 1524 edges · 34 communities (23 shown, 11 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 18 edges (avg confidence: 0.77)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `ba47dd20`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- agendamento/page.tsx
- Graphify Skill Docs
- Decisões fundamentais do Vitru
- devDependencies
- date-formatters.ts
- TypeScript Config
- AssessmentCard.tsx
- load-user-index.ts
- User Data Manifest (Joao Pedro)
- User Data Manifest (Baixa Frequencia)
- User Data Manifest (Em Dia)
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
- index.tsx
- n8n do Vitru
- infra/README.md
- user-selectors.ts
- Workflows versionados
- exam-schedule-selectors.ts
- ExamSession
- group-related-students.ts
- ExamLocationCard.tsx

## God Nodes (most connected - your core abstractions)
1. `Graphify Skill (/graphify Pipeline)` - 29 edges
2. `resolveActiveUserId()` - 21 edges
3. `StudyActivity` - 20 edges
4. `loadDisciplines()` - 19 edges
5. `formatDateBr()` - 18 edges
6. `findDisciplineByCode()` - 16 edges
7. `compilerOptions` - 16 edges
8. `getAssistantResponse()` - 15 edges
9. `AppShell()` - 13 edges
10. `ExamSession` - 12 edges

## Surprising Connections (you probably didn't know these)
- `Next.js Breaking-Changes Notice` --semantically_similar_to--> `Honesty Rules`  [INFERRED] [semantically similar]
  AGENTS.md → .claude/skills/graphify/SKILL.md
- `ExamSchedulePage()` --calls--> `loadClassmates()`  [EXTRACTED]
  app/disciplinas/[subjectCode]/notas-avaliacoes/[testCode]/agendamento/page.tsx → lib/data/load-classmates.ts
- `ExamSchedulePage()` --calls--> `loadExamScheduleOptions()`  [EXTRACTED]
  app/disciplinas/[subjectCode]/notas-avaliacoes/[testCode]/agendamento/page.tsx → lib/data/load-subject-data.ts
- `ExamSchedulePage()` --calls--> `loadSubjectAssessments()`  [EXTRACTED]
  app/disciplinas/[subjectCode]/notas-avaliacoes/[testCode]/agendamento/page.tsx → lib/data/load-subject-data.ts
- `ExamSchedulePage()` --calls--> `groupRelatedStudents()`  [EXTRACTED]
  app/disciplinas/[subjectCode]/notas-avaliacoes/[testCode]/agendamento/page.tsx → lib/exam-schedule/group-related-students.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Graphify Full Pipeline Steps** — _claude_skills_graphify_skill_graphify_skill, _claude_skills_graphify_skill_step_0_github_clone, _claude_skills_graphify_skill_step_1_ensure_installed, _claude_skills_graphify_skill_step_2_detect_files, _claude_skills_graphify_skill_step_2_5_video_audio, _claude_skills_graphify_skill_step_3_extract, _claude_skills_graphify_skill_step_4_build_cluster, _claude_skills_graphify_skill_step_4_5_health_check, _claude_skills_graphify_skill_step_5_label_communities, _claude_skills_graphify_skill_step_6_obsidian_html, _claude_skills_graphify_skill_step_9_manifest_cleanup [INFERRED 0.85]
- **Graphify Optional Export Targets** — _claude_skills_graphify_references_exports_wiki_export, _claude_skills_graphify_references_exports_neo4j_export, _claude_skills_graphify_references_exports_falkordb_export, _claude_skills_graphify_references_exports_svg_graphml_export, _claude_skills_graphify_references_exports_mcp_server [EXTRACTED 1.00]
- **Query/Path/Explain Feedback Loop via save-result** — _claude_skills_graphify_references_query_graphify_query, _claude_skills_graphify_references_query_graphify_path, _claude_skills_graphify_references_query_graphify_explain, _claude_skills_graphify_references_query_save_result, _claude_skills_graphify_references_query_reflect_lessons [EXTRACTED 1.00]

## Communities (34 total, 11 thin omitted)

### Community 0 - "agendamento/page.tsx"
Cohesion: 0.07
Nodes (62): StudyCalendarPage(), SubjectCalendarPage(), AssessmentsPage(), AnswerTestPage(), DisciplinePage(), AttendanceLogPage(), LearningPathLessonPage(), LearningPathPage() (+54 more)

### Community 1 - "Graphify Skill Docs"
Cohesion: 0.05
Nodes (52): Graphify Skill Trigger (/graphify), /graphify add <url>, --watch Background Watcher, FalkorDB Export (--falkordb/--falkordb-push), MCP Stdio Server (--mcp), Neo4j Export (--neo4j/--neo4j-push), SVG/GraphML Export, Token Reduction Benchmark (+44 more)

### Community 2 - "Decisões fundamentais do Vitru"
Cohesion: 0.13
Nodes (13): AWS, Ações que exigem confirmação, Dados no WhatsApp, Decisões fundamentais do Vitru, Evolução, Identidade e canais, Identificação e confirmação, MVP (+5 more)

### Community 3 - "devDependencies"
Cohesion: 0.06
Nodes (35): eslint, eslint-config-next, next, dependencies, next, react, react-dom, devDependencies (+27 more)

### Community 4 - "date-formatters.ts"
Cohesion: 0.10
Nodes (29): CalendarDay(), CalendarDayProps, CalendarGrid(), CalendarGridProps, EMPTY_DISABLED_KEYS, CalendarMonthNavigation(), CalendarMonthNavigationProps, EventsPanel() (+21 more)

### Community 5 - "TypeScript Config"
Cohesion: 0.07
Nodes (28): dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+20 more)

### Community 6 - "AssessmentCard.tsx"
Cohesion: 0.09
Nodes (24): AssessmentAction(), AssessmentActionProps, AssessmentCard(), AssessmentCardProps, AssessmentStatus(), CompletedTestSummary(), TestInfoCard(), TestQuestionCard() (+16 more)

### Community 7 - "load-user-index.ts"
Cohesion: 0.13
Nodes (14): UserSwitcher(), UserSwitcherProps, ACTIVE_USER_COOKIE, DataInvalidError, DataNotFoundError, loadClassmates(), loadUserManifest(), readUserJsonFile() (+6 more)

### Community 8 - "User Data Manifest (Joao Pedro)"
Cohesion: 0.10
Nodes (19): datasets, currentSemester, disciplines, financialTitles, sofiaDadosAluno, userData, displayLabel, isFictional (+11 more)

### Community 9 - "User Data Manifest (Baixa Frequencia)"
Cohesion: 0.10
Nodes (19): datasets, currentSemester, disciplines, financialTitles, sofiaDadosAluno, userData, displayLabel, isFictional (+11 more)

### Community 10 - "User Data Manifest (Em Dia)"
Cohesion: 0.10
Nodes (19): datasets, currentSemester, disciplines, financialTitles, sofiaDadosAluno, userData, displayLabel, isFictional (+11 more)

### Community 11 - "StudyPlannerView.tsx"
Cohesion: 0.07
Nodes (77): CheckCircleIcon(), ActivityBlock(), ActivityBlockProps, ActivityFormDraft, ActivityFormModal(), ActivityFormModalProps, AssistantPanel(), AssistantPanelProps (+69 more)

### Community 12 - "AppShellChrome.tsx"
Cohesion: 0.24
Nodes (8): AppShellChrome(), AppShellChromeProps, Header(), HeaderProps, initialsFromName(), PageContainer(), PageContainerProps, Sidebar()

### Community 14 - "Project README"
Cohesion: 0.67
Nodes (3): create-next-app Bootstrap, Next.js Framework, Vercel Deployment

### Community 23 - "ExamScheduleView.tsx"
Cohesion: 0.17
Nodes (14): CityComparisonNotice(), ClassmatesSection(), ClassmatesSectionProps, initials(), StudentConnectionCard(), ExamScheduleSummary(), ExamScheduleSummaryProps, EMPTY_GROUPS (+6 more)

### Community 24 - "index.tsx"
Cohesion: 0.05
Nodes (64): BookOpenIcon(), BriefcaseIcon(), CalendarIcon(), ChevronDownIcon(), ChevronRightIcon(), ClockIcon(), FileTextIcon(), GiftIcon() (+56 more)

### Community 26 - "n8n do Vitru"
Cohesion: 0.29
Nodes (6): Limites deste ambiente, n8n do Vitru, Operação, Preparação, Serviços, Workflows

### Community 28 - "user-selectors.ts"
Cohesion: 0.31
Nodes (5): SemesterHeader(), displaySemesterLabel(), SofiaParticipationDerived, SofiaDadosAlunoData, SofiaDadosAlunoRaw

### Community 30 - "exam-schedule-selectors.ts"
Cohesion: 0.21
Nodes (15): ExamSchedulePage(), ExamDateCalendar(), buildScheduledSession(), buildSessionsFromOptions(), getSchedulingDeadlineDisplay(), isScheduleDetail(), isSchedulingWindowOpen(), isSessionFull() (+7 more)

### Community 31 - "ExamSession"
Cohesion: 0.22
Nodes (15): ExamDateCalendarProps, ExamScheduleSituationLabel(), ExamScheduleSituationLabelProps, cancelScheduleInStorage(), confirmScheduleInStorage(), getServerScheduleOverrideSnapshot(), getStoredScheduleOverride(), readSnapshot() (+7 more)

### Community 32 - "group-related-students.ts"
Cohesion: 0.26
Nodes (9): ExamScheduleView(), CurrentStudentForGrouping, groupRelatedStudents(), baseCurrentStudent, toPublicConnection(), compareStudentAndExamCity(), isSameCity(), normalizeCityText() (+1 more)

### Community 33 - "ExamLocationCard.tsx"
Cohesion: 0.60
Nodes (5): buildAddressLine(), buildMapQuery(), ExamLocationCard(), ExamLocationCardProps, ExamSessionLocation

## Knowledge Gaps
- **187 isolated node(s):** `AssessmentCardProps`, `CalendarDayProps`, `CalendarGridProps`, `EMPTY_DISABLED_KEYS`, `ExamScheduleHeaderProps` (+182 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **11 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `formatDateBr()` connect `date-formatters.ts` to `agendamento/page.tsx`, `StudyPlannerView.tsx`, `AssessmentCard.tsx`, `exam-schedule-selectors.ts`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **Why does `EmptyState()` connect `agendamento/page.tsx` to `ExamScheduleView.tsx`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **Why does `StudyActivity` connect `StudyPlannerView.tsx` to `date-formatters.ts`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **What connects `AssessmentCardProps`, `CalendarDayProps`, `CalendarGridProps` to the rest of the system?**
  _187 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `agendamento/page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07023411371237458 - nodes in this community are weakly interconnected._
- **Should `Graphify Skill Docs` be split into smaller, more focused modules?**
  _Cohesion score 0.05429864253393665 - nodes in this community are weakly interconnected._
- **Should `Decisões fundamentais do Vitru` be split into smaller, more focused modules?**
  _Cohesion score 0.13333333333333333 - nodes in this community are weakly interconnected._