import type { VitruPageId } from "@/lib/vitru/page-context";
import type { VitruSemanticSnapshot } from "@/lib/vitru/semantic-snapshot";
import { buildDisciplineSnapshot, type DisciplineSnapshotInput } from "@/lib/vitru/adapters/discipline";
import { buildAssessmentsSnapshot, type AssessmentsSnapshotInput } from "@/lib/vitru/adapters/assessments";
import { buildStudyCalendarSnapshot, type StudyCalendarSnapshotInput } from "@/lib/vitru/adapters/study-calendar";

type AdapterInput = DisciplineSnapshotInput | AssessmentsSnapshotInput | StudyCalendarSnapshotInput;
type Adapter = (input: never) => VitruSemanticSnapshot;

const ADAPTERS: Partial<Record<VitruPageId, Adapter>> = {
  discipline: buildDisciplineSnapshot as Adapter,
  assessments: buildAssessmentsSnapshot as Adapter,
  "study-calendar": buildStudyCalendarSnapshot as Adapter,
};

export function buildSemanticSnapshot(pageId: "discipline", input: DisciplineSnapshotInput): VitruSemanticSnapshot;
export function buildSemanticSnapshot(pageId: "assessments", input: AssessmentsSnapshotInput): VitruSemanticSnapshot;
export function buildSemanticSnapshot(pageId: "study-calendar", input: StudyCalendarSnapshotInput): VitruSemanticSnapshot;
export function buildSemanticSnapshot(pageId: VitruPageId, input: AdapterInput): VitruSemanticSnapshot | null;
export function buildSemanticSnapshot(pageId: VitruPageId, input: AdapterInput): VitruSemanticSnapshot | null {
  const adapter = ADAPTERS[pageId];
  return adapter ? adapter(input as never) : null;
}
