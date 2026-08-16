import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { deriveAssessmentUiState } from "@/lib/selectors/assessment-selectors";
import type { AssessmentRaw } from "@/lib/types/raw/assessments";
import type { DisciplineRaw } from "@/lib/types/raw/disciplines";
import type { ExamSession } from "@/lib/types/derived";
import type { StudyActivity } from "@/lib/types/study-activity";
import { buildAssessmentSchedulingSnapshot } from "@/lib/vitru/adapters/assessment-scheduling";
import { buildAssessmentsSnapshot } from "@/lib/vitru/adapters/assessments";
import { buildDisciplineSnapshot } from "@/lib/vitru/adapters/discipline";
import { buildStudyCalendarSnapshot } from "@/lib/vitru/adapters/study-calendar";
import { assertSnapshotVocabulary } from "@/lib/vitru/snapshot-invariants";
import type { VitruSemanticSnapshot } from "@/lib/vitru/semantic-snapshot";

const NOW = "2026-08-13T12:00:00-03:00";
const subject = { code: "GTI03", name: "Modelagem e Gestão de Processos de Negócios" };
const globalDisciplines = [
  { id: "GTI03", name: subject.name, href: "/disciplinas/GTI03" },
  { id: "RH01", name: "Gestão de Pessoas", href: "/disciplinas/RH01" },
];

function assessment(code: string, description: string, overrides: Partial<AssessmentRaw>): AssessmentRaw {
  return {
    code, description, begin_date: "2026-08-01", end_date: "2026-08-31", weight: "2,0",
    need_schedule: false, has_schedule: false, show_button: false, can_answer: false,
    ...overrides,
  } as AssessmentRaw;
}

const assessments: AssessmentRaw[] = [
  assessment("AV1", "Avaliação Virtual 1", { grade: "8,5", need_schedule: true, show_button: true }),
  assessment("AV2", "Avaliação Virtual 2", { begin_date: "2026-08-21", end_date: "2026-09-10", show_button: true, can_answer: true }),
  assessment("AV3", "Avaliação Final", { weight: "6,0" }),
  assessment("AV4", "Avaliação Discursiva Individual", { need_schedule: true, show_button: true }),
];

const discipline = {
  code: subject.code,
  description: subject.name,
  begin_date: "2026-08-01",
  end_date: "2026-12-18",
  current_subject: true,
  situation: "Cursando",
} as DisciplineRaw;

const sessions: ExamSession[] = [
  { id: "morning", isoDate: "2026-08-20", displayDate: "20/08/2026", startTime: "09:00", endTime: "11:00", location: { id: "polo-centro", name: "Polo Centro", address: null, city: "Indaial", state: "SC" }, availableSlots: 7 },
  { id: "evening", isoDate: "2026-08-20", displayDate: "20/08/2026", startTime: "19:00", endTime: "21:00", location: { id: "polo-centro", name: "Polo Centro", address: null, city: "Indaial", state: "SC" }, availableSlots: 3 },
];

const activities: StudyActivity[] = Array.from({ length: 10 }, (_, index) => ({
  id: `study-${index + 1}`,
  title: `Sessão de estudo ${index + 1}`,
  category: "estudo",
  subjectCode: subject.code,
  subjectName: subject.name,
  date: `2026-08-${String(14 + index).padStart(2, "0")}`,
  startTime: `${String(8 + index % 5).padStart(2, "0")}:00`,
  endTime: `${String(9 + index % 5).padStart(2, "0")}:00`,
  notes: "",
  source: "seed",
}));

function freezeAdapterClock(snapshot: VitruSemanticSnapshot): VitruSemanticSnapshot {
  // Os três adapters usam defaultSnapshotState(new Date()); só o relógio é congelado no fixture.
  return { ...snapshot, state: { ...snapshot.state, now: NOW, temporal: { ...snapshot.state.temporal, visibleStart: "2026-08-13", visibleEnd: "2026-08-13" } } };
}

const adapterSnapshots = {
  assessments: freezeAdapterClock(buildAssessmentsSnapshot({ subject, assessments })),
  discipline: freezeAdapterClock(buildDisciplineSnapshot({ discipline, recordings: [], assessments })),
  "assessment-scheduling": freezeAdapterClock(buildAssessmentSchedulingSnapshot(subject, "AV1", "Avaliação Virtual 1", sessions)),
  "study-calendar": buildStudyCalendarSnapshot({
    activities, selectedIsoDate: "2026-08-13", view: "month", now: NOW,
    // No produto estas opções vêm de buildVitruStudentContext, que consulta o banco.
    availableStudySlots: [
      { date: "2026-08-18", startTime: "07:00", endTime: "08:00" },
      { date: "2026-08-18", startTime: "18:00", endTime: "19:00" },
    ],
  }),
};

const expectedAssessmentStates = [
  { code: "AV1", grade: "8,5", actionKind: "agendar-prova" },
  { code: "AV2", endDate: "2026-09-10", actionKind: "responder-online" },
  { code: "AV3", description: "Avaliação Final", weight: "6,0", actionKind: "indisponivel" },
  { code: "AV4", description: "Avaliação Discursiva Individual", actionKind: "agendar-prova" },
];

for (const expected of expectedAssessmentStates) {
  const raw = assessments.find(({ code }) => code === expected.code);
  if (!raw) throw new Error(`Missing assessment ${expected.code}`);
  const derived = deriveAssessmentUiState(raw);
  if (derived.actionKind !== expected.actionKind) throw new Error(`${expected.code} derived ${derived.actionKind}, expected ${expected.actionKind}`);
  if (expected.grade && derived.gradeDisplay !== expected.grade) throw new Error(`${expected.code} grade diverged`);
  if (expected.endDate && raw.end_date !== expected.endDate) throw new Error(`${expected.code} end date diverged`);
  if (expected.description && raw.description !== expected.description) throw new Error(`${expected.code} description diverged`);
  if (expected.weight && raw.weight !== expected.weight) throw new Error(`${expected.code} weight diverged`);
}

if (adapterSnapshots.assessments.actions.some(({ id }) => id.includes("AV3"))) throw new Error("AV3 must not expose an action");
if (adapterSnapshots["study-calendar"].sections[0].items.length !== 10) throw new Error("Calendar must expose exactly 10 visible activities");
for (const snapshot of Object.values(adapterSnapshots)) assertSnapshotVocabulary(snapshot);
for (const snapshot of Object.values(adapterSnapshots)) {
  const destinations = new Map([...snapshot.destinations, ...globalDisciplines].map(destination => [destination.href, destination]));
  snapshot.destinations = [...destinations.values()];
}

// Representa o snapshot local do portal; a visão do modelo é redigida pelo harness.
const fixtures = adapterSnapshots;
const outputPath = resolve(process.cwd(), "vitru/fixtures/portal-snapshots.json");
mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(fixtures, null, 2)}\n`);
console.log(`Wrote ${outputPath}`);
