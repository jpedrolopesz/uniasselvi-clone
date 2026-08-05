# Graph Report - uniasselvi-clone  (2026-08-04)

## Corpus Check
- 120 files · ~30,001 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 401 nodes · 733 edges · 26 communities (17 shown, 9 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 2 edges (avg confidence: 0.7)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `c0c1f4fd`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [subjectCode]/page.tsx
- Graphify Skill Docs
- Attendance & Calendar Components
- Package Dependencies
- date-formatters.ts
- TypeScript Config
- Test Runner Components
- User Switcher & Data Loading
- User Data Manifest (Joao Pedro)
- User Data Manifest (Baixa Frequencia)
- User Data Manifest (Em Dia)
- user-selectors.ts
- Header Component
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
- RecoverySection.tsx
- AcademicShortcuts.tsx
- DisciplineCard.tsx

## God Nodes (most connected - your core abstractions)
1. `Graphify Skill (/graphify Pipeline)` - 29 edges
2. `compilerOptions` - 16 edges
3. `formatDateBr()` - 15 edges
4. `readUserJsonFileOptional()` - 14 edges
5. `resolveActiveUserId()` - 14 edges
6. `loadDisciplines()` - 12 edges
7. `AppShell()` - 10 edges
8. `toIsoDateKey()` - 10 edges
9. `findDisciplineByCode()` - 9 edges
10. `HomePage()` - 8 edges

## Surprising Connections (you probably didn't know these)
- `Next.js Breaking-Changes Notice` --semantically_similar_to--> `Honesty Rules`  [INFERRED] [semantically similar]
  AGENTS.md → .claude/skills/graphify/SKILL.md
- `AssessmentActionProps` --references--> `AssessmentUiState`  [EXTRACTED]
  components/assessments/AssessmentAction.tsx → lib/types/derived/index.ts
- `AssessmentCardProps` --references--> `AssessmentRaw`  [EXTRACTED]
  components/assessments/AssessmentCard.tsx → lib/types/raw/assessments.ts
- `MeetingsPanel()` --calls--> `formatDateBr()`  [EXTRACTED]
  components/attendance/MeetingsPanel.tsx → lib/formatters/date-formatters.ts
- `EventsPanelProps` --references--> `CalendarEventRaw`  [EXTRACTED]
  components/calendar/EventsPanel.tsx → lib/types/raw/calendar-events.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Graphify Full Pipeline Steps** — _claude_skills_graphify_skill_graphify_skill, _claude_skills_graphify_skill_step_0_github_clone, _claude_skills_graphify_skill_step_1_ensure_installed, _claude_skills_graphify_skill_step_2_detect_files, _claude_skills_graphify_skill_step_2_5_video_audio, _claude_skills_graphify_skill_step_3_extract, _claude_skills_graphify_skill_step_4_build_cluster, _claude_skills_graphify_skill_step_4_5_health_check, _claude_skills_graphify_skill_step_5_label_communities, _claude_skills_graphify_skill_step_6_obsidian_html, _claude_skills_graphify_skill_step_9_manifest_cleanup [INFERRED 0.85]
- **Graphify Optional Export Targets** — _claude_skills_graphify_references_exports_wiki_export, _claude_skills_graphify_references_exports_neo4j_export, _claude_skills_graphify_references_exports_falkordb_export, _claude_skills_graphify_references_exports_svg_graphml_export, _claude_skills_graphify_references_exports_mcp_server [EXTRACTED 1.00]
- **Query/Path/Explain Feedback Loop via save-result** — _claude_skills_graphify_references_query_graphify_query, _claude_skills_graphify_references_query_graphify_path, _claude_skills_graphify_references_query_graphify_explain, _claude_skills_graphify_references_query_save_result, _claude_skills_graphify_references_query_reflect_lessons [EXTRACTED 1.00]

## Communities (26 total, 9 thin omitted)

### Community 0 - "[subjectCode]/page.tsx"
Cohesion: 0.11
Nodes (37): SubjectCalendarPage(), AttendancePage(), AssessmentsPage(), AnswerTestPage(), HomePage(), AttendanceProgress(), JOURNEY_SHORTCUTS, JourneyShortcuts() (+29 more)

### Community 1 - "Graphify Skill Docs"
Cohesion: 0.05
Nodes (52): Graphify Skill Trigger (/graphify), /graphify add <url>, --watch Background Watcher, FalkorDB Export (--falkordb/--falkordb-push), MCP Stdio Server (--mcp), Neo4j Export (--neo4j/--neo4j-push), SVG/GraphML Export, Token Reduction Benchmark (+44 more)

### Community 2 - "Attendance & Calendar Components"
Cohesion: 0.11
Nodes (28): AttendanceCalendar(), MeetingsPanel(), MeetingsPanelProps, CalendarDay(), CalendarDayProps, CalendarGrid(), CalendarGridProps, CalendarMonthNavigation() (+20 more)

### Community 3 - "Package Dependencies"
Cohesion: 0.06
Nodes (32): eslint, eslint-config-next, next, dependencies, next, react, react-dom, devDependencies (+24 more)

### Community 4 - "date-formatters.ts"
Cohesion: 0.11
Nodes (23): AssessmentAction(), AssessmentActionProps, AssessmentCard(), AssessmentCardProps, AssessmentStatus(), CompletedTestSummary(), RecordedClassesModal(), RecordingItem() (+15 more)

### Community 5 - "TypeScript Config"
Cohesion: 0.07
Nodes (28): dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+20 more)

### Community 6 - "Test Runner Components"
Cohesion: 0.18
Nodes (12): TestInfoCard(), TestQuestionCard(), TestQuestionCardProps, TestRunner(), TestStepper(), TestStepperProps, TestToolbar(), TestToolbarProps (+4 more)

### Community 7 - "User Switcher & Data Loading"
Cohesion: 0.16
Nodes (11): UserSwitcher(), UserSwitcherProps, ACTIVE_USER_COOKIE, DataInvalidError, DataNotFoundError, loadUserManifest(), readUserJsonFile(), USER_DATA_ROOT (+3 more)

### Community 8 - "User Data Manifest (Joao Pedro)"
Cohesion: 0.10
Nodes (19): datasets, currentSemester, disciplines, financialTitles, sofiaDadosAluno, userData, displayLabel, isFictional (+11 more)

### Community 9 - "User Data Manifest (Baixa Frequencia)"
Cohesion: 0.10
Nodes (19): datasets, currentSemester, disciplines, financialTitles, sofiaDadosAluno, userData, displayLabel, isFictional (+11 more)

### Community 10 - "User Data Manifest (Em Dia)"
Cohesion: 0.10
Nodes (19): datasets, currentSemester, disciplines, financialTitles, sofiaDadosAluno, userData, displayLabel, isFictional (+11 more)

### Community 11 - "user-selectors.ts"
Cohesion: 0.36
Nodes (4): SemesterHeader(), displaySemesterLabel(), SofiaDadosAlunoData, SofiaDadosAlunoRaw

### Community 12 - "Header Component"
Cohesion: 0.67
Nodes (3): Header(), HeaderProps, initialsFromName()

### Community 14 - "Project README"
Cohesion: 0.67
Nodes (3): create-next-app Bootstrap, Next.js Framework, Vercel Deployment

### Community 23 - "RecoverySection.tsx"
Cohesion: 0.60
Nodes (3): RecoverySection(), RecoverySectionProps, FinancialTitleRaw

### Community 24 - "AcademicShortcuts.tsx"
Cohesion: 0.50
Nodes (3): AcademicShortcuts(), AcademicShortcutsProps, STATIC_SHORTCUTS

### Community 25 - "DisciplineCard.tsx"
Cohesion: 0.22
Nodes (12): DisciplineCard(), DisciplineStats, gradientForCode(), THUMBNAIL_GRADIENTS, DisciplineCarousel(), BookOpenIcon(), ChevronRightIcon(), ClockIcon() (+4 more)

## Knowledge Gaps
- **140 isolated node(s):** `metadata`, `TestStepperProps`, `TestToolbarProps`, `CalendarDayProps`, `CalendarGridProps` (+135 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `formatDateBr()` connect `date-formatters.ts` to `[subjectCode]/page.tsx`, `Attendance & Calendar Components`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **What connects `metadata`, `TestStepperProps`, `TestToolbarProps` to the rest of the system?**
  _140 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `[subjectCode]/page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.10987726475745178 - nodes in this community are weakly interconnected._
- **Should `Graphify Skill Docs` be split into smaller, more focused modules?**
  _Cohesion score 0.05429864253393665 - nodes in this community are weakly interconnected._
- **Should `Attendance & Calendar Components` be split into smaller, more focused modules?**
  _Cohesion score 0.11219512195121951 - nodes in this community are weakly interconnected._
- **Should `Package Dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.06060606060606061 - nodes in this community are weakly interconnected._
- **Should `date-formatters.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.11428571428571428 - nodes in this community are weakly interconnected._