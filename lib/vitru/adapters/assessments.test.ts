import { describe, expect, it } from "vitest";
import type { AssessmentRaw } from "@/lib/types/raw/assessments";
import { buildAssessmentsSnapshot } from "@/lib/vitru/adapters/assessments";

function assessment(code: string, overrides: Partial<AssessmentRaw> = {}): AssessmentRaw {
  return {
    code,
    description: `Avaliação ${code}`,
    begin_date: "2026-08-01",
    end_date: "2026-08-20",
    weight: "2,0",
    need_schedule: true,
    has_schedule: false,
    show_button: true,
    can_answer: false,
    ...overrides,
  } as AssessmentRaw;
}

describe("buildAssessmentsSnapshot", () => {
  it("achata ações e liga entidades por IDs derivados dos dados", () => {
    const snapshot = buildAssessmentsSnapshot({
      subject: { code: "GTI03", name: "Modelagem de Processos" },
      assessments: [assessment("AV1"), assessment("AV2", { need_schedule: false, can_answer: true })],
    });

    expect(snapshot.actions.map((action) => action.id)).toEqual([
      "assessment:GTI03:AV1:schedule",
      "assessment:GTI03:AV2:answer",
    ]);
    expect(snapshot.sections[0].items[0]).toMatchObject({
      id: "assessment:GTI03:AV1",
      actionIds: ["assessment:GTI03:AV1:schedule"],
    });
    expect(snapshot.destinations.every((destination) => destination.href.startsWith("/"))).toBe(true);
  });

  it("permanece compacto com oito avaliações", () => {
    const snapshot = buildAssessmentsSnapshot({
      subject: { code: "GTI03", name: "Modelagem de Processos" },
      assessments: Array.from({ length: 8 }, (_, index) => assessment(`AV${index + 1}`)),
    });

    expect(JSON.stringify(snapshot).length).toBeLessThan(4_800);
  });
});
