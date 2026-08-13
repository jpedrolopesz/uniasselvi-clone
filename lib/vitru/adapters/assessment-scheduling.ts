import type { ExamSession } from "@/lib/types/derived";
import { defaultSnapshotState, type VitruSemanticSnapshot } from "@/lib/vitru/semantic-snapshot";
import { destinationsForPage } from "@/lib/vitru/destinations";

export function buildAssessmentSchedulingSnapshot(subject: { code: string; name: string }, testCode: string, examName: string, sessions: ExamSession[]): VitruSemanticSnapshot {
  return { version: 0, status: "ready", page: { id: "assessment-scheduling", name: "Agendamento de avaliação", subject }, state: defaultSnapshotState(), sections: [{ id: `schedule:${testCode}`, name: "Horários disponíveis", items: sessions.map(session => ({ id: `schedule-option:${session.id}`, name: `${session.displayDate} ${session.startTime ?? ""} ${session.location.name}`, status: `${session.availableSlots ?? "?"} vagas`, actionIds: [`schedule-option:${session.id}:select`] })) }], actions: sessions.map(session => ({ id: `schedule-option:${session.id}:select`, label: `Selecionar ${session.displayDate} ${session.startTime ?? ""}`, kind: "read" })), destinations: destinationsForPage("assessment-scheduling", []) };
}
