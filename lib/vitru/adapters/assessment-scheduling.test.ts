import { describe, expect, it } from "vitest";
import type { ExamSession } from "@/lib/types/derived";
import { buildAssessmentSchedulingSnapshot } from "@/lib/vitru/adapters/assessment-scheduling";

const sessions: ExamSession[] = [
  {
    id: "morning",
    isoDate: "2026-08-20",
    displayDate: "20/08/2026",
    startTime: "09:00",
    location: { id: "polo", name: "Polo Centro", address: null, city: "Indaial", state: "SC" },
    availableSlots: 7,
  },
  {
    id: "evening",
    isoDate: "2026-08-21",
    displayDate: "21/08/2026",
    startTime: "19:00",
    location: { id: "polo", name: "Polo Centro", address: null, city: "Indaial", state: "SC" },
    availableSlots: 2,
  },
];

const snapshot = buildAssessmentSchedulingSnapshot(
  { code: "GTI03", name: "Modelagem de Processos" },
  "AV1",
  "Avaliação Virtual 1",
  sessions,
);

describe("buildAssessmentSchedulingSnapshot", () => {
  it("publica somente o destino pai seguro", () => {
    expect(snapshot.destinations).toEqual([{
      id: "assessments",
      name: "Notas e avaliações",
      href: "/disciplinas/GTI03/notas-avaliacoes",
    }]);
  });

  it("publica um horário e uma ação por ExamSession", () => {
    const section = snapshot.sections.find(({ name }) => name === "Horários disponíveis");
    expect(section?.items).toHaveLength(sessions.length);
    expect(section?.items).toEqual([
      expect.objectContaining({ status: "7 vagas", actionIds: ["schedule-option:morning:select"] }),
      expect.objectContaining({ status: "2 vagas", actionIds: ["schedule-option:evening:select"] }),
    ]);
  });

  it("não publica ações órfãs", () => {
    const referenced = new Set(snapshot.sections.flatMap((section) => section.items.flatMap((item) => item.actionIds)));
    expect(snapshot.actions.every((action) => referenced.has(action.id))).toBe(true);
  });
});
