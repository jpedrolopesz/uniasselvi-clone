import { describe, expect, it } from "vitest";
import type { AssessmentRaw } from "@/lib/types/raw/assessments";
import type { DisciplineRaw } from "@/lib/types/raw/disciplines";
import type { ExamSession } from "@/lib/types/derived";
import { buildAssessmentSchedulingSnapshot } from "@/lib/vitru/adapters/assessment-scheduling";
import { buildAssessmentsSnapshot } from "@/lib/vitru/adapters/assessments";
import { buildDisciplineSnapshot } from "@/lib/vitru/adapters/discipline";
import { buildStudyCalendarSnapshot } from "@/lib/vitru/adapters/study-calendar";
import { assertSnapshotVocabulary } from "@/lib/vitru/snapshot-invariants";

const subject = { code: "GTI03", name: "Modelagem de Processos" };
const assessment = {
  code: "AV1", description: "Avaliação Virtual 1", begin_date: "2026-08-01", end_date: "2026-08-20",
  weight: "2,0", need_schedule: true, has_schedule: false, show_button: true, can_answer: false,
} as AssessmentRaw;
const discipline = {
  code: subject.code, description: subject.name, begin_date: "2026-08-01", end_date: "2026-12-01",
  current_subject: true,
} as DisciplineRaw;
const session: ExamSession = {
  id: "morning", isoDate: "2026-08-20", displayDate: "20/08/2026", startTime: "09:00",
  location: { id: "polo", name: "Polo Centro", address: null, city: "Indaial", state: "SC" }, availableSlots: 7,
};

describe("assertSnapshotVocabulary", () => {
  it.each([
    ["assessments", buildAssessmentsSnapshot({ subject, assessments: [assessment] })],
    ["discipline", buildDisciplineSnapshot({ discipline, assessments: [assessment], recordings: [] })],
    ["assessment-scheduling", buildAssessmentSchedulingSnapshot(subject, "AV1", assessment.description, [session])],
    ["study-calendar", buildStudyCalendarSnapshot({
      activities: [{ id: "study-1", title: "Revisão", category: "estudo", subjectCode: subject.code, subjectName: subject.name, date: "2026-08-13", startTime: "09:00", endTime: "10:00", notes: "", source: "manual" }],
      selectedIsoDate: "2026-08-13", view: "month", now: "2026-08-13T12:00:00-03:00",
    })],
  ])("aceita o snapshot real de %s", (_name, snapshot) => {
    expect(() => assertSnapshotVocabulary(snapshot)).not.toThrow();
  });
});
