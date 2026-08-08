# Graph Report - uniasselvi-clone  (2026-08-05)

## Corpus Check
- 181 files · ~533,939 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 694 nodes · 1546 edges · 30 communities (19 shown, 11 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 18 edges (avg confidence: 0.77)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `e820c465`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- agendamento/page.tsx
- Graphify Skill Docs
- Decisões fundamentais do Vitru
- devDependencies
- exam-schedule-selectors.ts
- TypeScript Config
- TestRunner.tsx
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
- discipline-selectors.ts
- workflows/README.md

## God Nodes (most connected - your core abstractions)
1. `Graphify Skill (/graphify Pipeline)` - 29 edges
2. `resolveActiveUserId()` - 22 edges
3. `formatDateBr()` - 22 edges
4. `loadDisciplines()` - 20 edges
5. `StudyActivity` - 20 edges
6. `findDisciplineByCode()` - 17 edges
7. `compilerOptions` - 16 edges
8. `readUserJsonFileOptional()` - 15 edges
9. `toIsoDateKey()` - 15 edges
10. `getAssistantResponse()` - 15 edges

## Surprising Connections (you probably didn't know these)
- `Next.js Breaking-Changes Notice` --semantically_similar_to--> `Honesty Rules`  [INFERRED] [semantically similar]
  AGENTS.md → .claude/skills/graphify/SKILL.md
- `StudyCalendarPage()` --calls--> `buildSeedActivities()`  [EXTRACTED]
  app/calendario-de-estudos/page.tsx → lib/study-planner/seed-activities.ts
- `ExamSchedulePage()` --calls--> `loadClassmates()`  [EXTRACTED]
  app/disciplinas/[subjectCode]/notas-avaliacoes/[testCode]/agendamento/page.tsx → lib/data/load-classmates.ts
- `ExamSchedulePage()` --calls--> `groupRelatedStudents()`  [EXTRACTED]
  app/disciplinas/[subjectCode]/notas-avaliacoes/[testCode]/agendamento/page.tsx → lib/exam-schedule/group-related-students.ts
- `ExamSchedulePage()` --calls--> `buildScheduledSession()`  [EXTRACTED]
  app/disciplinas/[subjectCode]/notas-avaliacoes/[testCode]/agendamento/page.tsx → lib/selectors/exam-schedule-selectors.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Graphify Full Pipeline Steps** — _claude_skills_graphify_skill_graphify_skill, _claude_skills_graphify_skill_step_0_github_clone, _claude_skills_graphify_skill_step_1_ensure_installed, _claude_skills_graphify_skill_step_2_detect_files, _claude_skills_graphify_skill_step_2_5_video_audio, _claude_skills_graphify_skill_step_3_extract, _claude_skills_graphify_skill_step_4_build_cluster, _claude_skills_graphify_skill_step_4_5_health_check, _claude_skills_graphify_skill_step_5_label_communities, _claude_skills_graphify_skill_step_6_obsidian_html, _claude_skills_graphify_skill_step_9_manifest_cleanup [INFERRED 0.85]
- **Graphify Optional Export Targets** — _claude_skills_graphify_references_exports_wiki_export, _claude_skills_graphify_references_exports_neo4j_export, _claude_skills_graphify_references_exports_falkordb_export, _claude_skills_graphify_references_exports_svg_graphml_export, _claude_skills_graphify_references_exports_mcp_server [EXTRACTED 1.00]
- **Query/Path/Explain Feedback Loop via save-result** — _claude_skills_graphify_references_query_graphify_query, _claude_skills_graphify_references_query_graphify_path, _claude_skills_graphify_references_query_graphify_explain, _claude_skills_graphify_references_query_save_result, _claude_skills_graphify_references_query_reflect_lessons [EXTRACTED 1.00]

## Communities (30 total, 11 thin omitted)

### Community 0 - "agendamento/page.tsx"
Cohesion: 0.13
Nodes (39): StudyCalendarPage(), SubjectCalendarPage(), AssessmentsPage(), ExamSchedulePage(), AnswerTestPage(), DisciplinePage(), AttendanceLogPage(), LearningPathLessonPage() (+31 more)

### Community 1 - "Graphify Skill Docs"
Cohesion: 0.05
Nodes (52): Graphify Skill Trigger (/graphify), /graphify add <url>, --watch Background Watcher, FalkorDB Export (--falkordb/--falkordb-push), MCP Stdio Server (--mcp), Neo4j Export (--neo4j/--neo4j-push), SVG/GraphML Export, Token Reduction Benchmark (+44 more)

### Community 2 - "Decisões fundamentais do Vitru"
Cohesion: 0.13
Nodes (13): AWS, Ações que exigem confirmação, Dados no WhatsApp, Decisões fundamentais do Vitru, Evolução, Identidade e canais, Identificação e confirmação, MVP (+5 more)

### Community 3 - "devDependencies"
Cohesion: 0.06
Nodes (35): eslint, eslint-config-next, next, dependencies, next, react, react-dom, devDependencies (+27 more)

### Community 4 - "exam-schedule-selectors.ts"
Cohesion: 0.06
Nodes (55): AssessmentAction(), AssessmentActionProps, AssessmentCard(), AssessmentCardProps, AssessmentStatus(), CompletedTestSummary(), AttendanceProgress(), CalendarDay() (+47 more)

### Community 5 - "TypeScript Config"
Cohesion: 0.07
Nodes (28): dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+20 more)

### Community 6 - "TestRunner.tsx"
Cohesion: 0.18
Nodes (12): TestInfoCard(), TestQuestionCard(), TestQuestionCardProps, TestRunner(), TestStepper(), TestStepperProps, TestToolbar(), TestToolbarProps (+4 more)

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
Cohesion: 0.06
Nodes (81): CheckCircleIcon(), PlusIcon(), ActivityBlock(), ActivityBlockProps, ActivityFormDraft, ActivityFormModal(), ActivityFormModalProps, AssistantPanel() (+73 more)

### Community 12 - "AppShellChrome.tsx"
Cohesion: 0.24
Nodes (8): AppShellChrome(), AppShellChromeProps, Header(), HeaderProps, initialsFromName(), PageContainer(), PageContainerProps, Sidebar()

### Community 14 - "Project README"
Cohesion: 0.67
Nodes (3): create-next-app Bootstrap, Next.js Framework, Vercel Deployment

### Community 23 - "ExamScheduleView.tsx"
Cohesion: 0.07
Nodes (43): CityComparisonNotice(), ClassmatesSection(), ClassmatesSectionProps, initials(), StudentConnectionCard(), ExamDateCalendarProps, buildAddressLine(), buildMapQuery() (+35 more)

### Community 24 - "index.tsx"
Cohesion: 0.06
Nodes (59): BookOpenIcon(), BriefcaseIcon(), CalendarIcon(), ChevronDownIcon(), ChevronRightIcon(), ClockIcon(), FileTextIcon(), GiftIcon() (+51 more)

### Community 26 - "n8n do Vitru"
Cohesion: 0.29
Nodes (6): Limites deste ambiente, n8n do Vitru, Operação, Preparação, Serviços, Workflows

### Community 28 - "discipline-selectors.ts"
Cohesion: 0.08
Nodes (30): HomePage(), AcademicShortcuts(), AcademicShortcutsProps, STATIC_SHORTCUTS, DisciplineCard(), DisciplineCardProps, DisciplineCarousel(), DisciplineCarouselProps (+22 more)

## Knowledge Gaps
- **186 isolated node(s):** `metadata`, `TestStepperProps`, `TestToolbarProps`, `CalendarDayProps`, `CalendarGridProps` (+181 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **11 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `formatDateBr()` connect `exam-schedule-selectors.ts` to `agendamento/page.tsx`, `StudyPlannerView.tsx`?**
  _High betweenness centrality (0.029) - this node is a cross-community bridge._
- **Why does `EmptyState()` connect `agendamento/page.tsx` to `ExamScheduleView.tsx`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **Why does `StudyActivity` connect `StudyPlannerView.tsx` to `exam-schedule-selectors.ts`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **What connects `metadata`, `TestStepperProps`, `TestToolbarProps` to the rest of the system?**
  _186 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `agendamento/page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.12542372881355932 - nodes in this community are weakly interconnected._
- **Should `Graphify Skill Docs` be split into smaller, more focused modules?**
  _Cohesion score 0.05429864253393665 - nodes in this community are weakly interconnected._
- **Should `Decisões fundamentais do Vitru` be split into smaller, more focused modules?**
  _Cohesion score 0.13333333333333333 - nodes in this community are weakly interconnected._