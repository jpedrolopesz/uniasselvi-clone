import { describe, expect, it } from "vitest";
import { coerceShowToScheduleSelection } from "@/lib/vitru/schedule-action-routing";

describe("coerceShowToScheduleSelection", () => {
  const action = { id: "voice-1", referencia: "opção da manhã" };

  it("roteia show de opção pelo mesmo comando select_option e preserva a referência", () => {
    expect(coerceShowToScheduleSelection("assessment-scheduling", { actionId: "schedule-option:morning:select", ambiguous: false }, action)).toEqual({
      id: "voice-1", type: "select_option", referencia: "opção da manhã",
    });
  });

  it("faz a mesma coerção somente para uma opção fechada do calendário", () => {
    expect(coerceShowToScheduleSelection("study-calendar", { actionId: "study-slot:2026-08-18:07:00:select" }, action))
      .toEqual({ id: "voice-1", type: "select_option", referencia: "opção da manhã" });
  });

  it("não coage resolução ambígua, outra tela ou outro tipo de ação", () => {
    expect(coerceShowToScheduleSelection("assessment-scheduling", { actionId: "schedule-option:morning:select", ambiguous: true }, action)).toBeNull();
    expect(coerceShowToScheduleSelection("assessments", { actionId: "schedule-option:morning:select" }, action)).toBeNull();
    expect(coerceShowToScheduleSelection("assessment-scheduling", { actionId: "assessment:AV1:details" }, action)).toBeNull();
  });
});
