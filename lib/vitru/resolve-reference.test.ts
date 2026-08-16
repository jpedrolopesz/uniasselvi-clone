import { describe, expect, it } from "vitest";
import type { AssessmentRaw } from "@/lib/types/raw/assessments";
import { buildAssessmentsSnapshot } from "@/lib/vitru/adapters/assessments";
import { buildStudyCalendarSnapshot } from "@/lib/vitru/adapters/study-calendar";
import { REFERENCE_CONFIDENCE_THRESHOLD, resolveReference } from "@/lib/vitru/resolve-reference";

const snapshot = buildStudyCalendarSnapshot({ activities: [], selectedIsoDate: "2026-08-13", view: "month", now: "2026-08-13T12:00:00-03:00" });
const assessmentsSnapshot = buildAssessmentsSnapshot({
  subject: { code: "GTI03", name: "Modelagem de Processos" },
  assessments: ["AV1", "AV2"].map((code) => ({
    code,
    description: `Avaliação Virtual ${code.slice(2)}`,
    begin_date: "2026-08-01",
    end_date: "2026-08-31",
    weight: "2,0",
    need_schedule: true,
    has_schedule: false,
    show_button: true,
    can_answer: false,
  } as AssessmentRaw)),
});
const focusedSnapshot = buildStudyCalendarSnapshot({
  activities: [{ id: "study-1", title: "Revisão", category: "estudo", subjectCode: null, subjectName: null, date: "2026-08-13", startTime: "09:00", endTime: "10:00", notes: "", source: "manual" }],
  selectedIsoDate: "2026-08-13",
  view: "month",
  now: "2026-08-13T12:00:00-03:00",
  focusId: "study-1",
});

describe("resolveReference regressões de precedência", () => {
  it("mantém ambígua a faixa em que margem relativa suprimiria pergunta legítima", () => {
    const tokens = Array.from({ length: 100 }, (_, index) => `termo${index + 100}`);
    const disputed = {
      ...snapshot,
      sections: [{ id: "disputa", name: "Disputa", items: [
        { id: "best", name: tokens.slice(0, 75).join(" "), actionIds: [] },
        { id: "second", name: tokens.slice(0, 61).join(" "), actionIds: [] },
      ] }],
    };
    const best = 0.75;
    const second = 0.61;
    expect(best - second <= 0.15).toBe(true);
    expect(second >= best * (1 - 0.15)).toBe(false);
    const resolution = resolveReference(tokens.join(" "), disputed);
    expect(resolution).toMatchObject({ kind: "ambiguous", confidence: 0.75 });
    const gateSuppressesQuestion = !["ambiguous", "unresolved"].includes(resolution.kind)
      && resolution.confidence >= REFERENCE_CONFIDENCE_THRESHOLD;
    expect(gateSuppressesQuestion).toBe(false);
  });

  it("não interpreta AV1 como data", () => {
    expect(resolveReference("Qual das avaliações, a AV1?", assessmentsSnapshot)).toMatchObject({
      kind: "entity", value: "assessment:GTI03:AV1",
    });
  });

  it.each(["AV1", "AV2", "a AV1"])("preserva resolução e score máximo de %s pelo vocabulário técnico", (phrase) => {
    expect(resolveReference(phrase, assessmentsSnapshot)).toMatchObject({ kind: "entity", confidence: 1 });
  });

  it("deixa o gate encaminhar uma pergunta realmente ambígua entre AV1 e AV2", () => {
    const resolution = resolveReference("Você quer a AV1 ou a AV2?", assessmentsSnapshot);
    expect(["date", "date_range"]).not.toContain(resolution.kind);
    const gateSuppressesQuestion = !["ambiguous", "unresolved"].includes(resolution.kind)
      && resolution.confidence >= REFERENCE_CONFIDENCE_THRESHOLD;
    expect(gateSuppressesQuestion).toBe(false);
  });

  it("resolve esse evento pelo foco do mesmo modo que este evento", () => {
    expect(resolveReference("esse evento", focusedSnapshot)).toEqual(resolveReference("este evento", focusedSnapshot));
    expect(resolveReference("esse evento", focusedSnapshot)).toMatchObject({ kind: "entity", source: "focus" });
  });
});

describe("resolveReference temporal", () => {
  it.each([
    ["dia 13", "2026-08-13", "screen"],
    ["próximo dia 13", "2026-09-13", "app_data"],
    ["amanhã", "2026-08-14", "app_data"],
  ])("resolve %s", (phrase, value, source) => expect(resolveReference(phrase, snapshot)).toMatchObject({ value, source }));
  it("resolve próxima semana", () => expect(resolveReference("próxima semana", snapshot)).toMatchObject({ value: { start: "2026-08-17", end: "2026-08-23" } }));
  it("este evento sem foco é ambíguo", () => expect(resolveReference("este evento", snapshot).kind).toBe("ambiguous"));
  it("dia 45 é ambíguo", () => expect(resolveReference("dia 45", snapshot).kind).toBe("ambiguous"));

  it.each([
    ["hoje", "2026-08-13", "screen"],
    ["ontem", "2026-08-12", "screen"],
  ])("resolve %s a partir do relógio do snapshot", (phrase, value, source) => {
    expect(resolveReference(phrase, snapshot)).toMatchObject({ kind: "date", value, source });
  });

  it.each(["esta semana", "essa semana"])("resolve %s", (phrase) => {
    expect(resolveReference(phrase, snapshot)).toMatchObject({
      kind: "date_range",
      value: { start: "2026-08-10", end: "2026-08-16" },
      source: "screen",
    });
  });

  it.each(["este mês", "esse mês"])("resolve %s", (phrase) => {
    expect(resolveReference(phrase, snapshot)).toMatchObject({
      kind: "date_range",
      value: { start: "2026-08-01", end: "2026-08-31" },
      source: "screen",
    });
  });

  it("resolve próximo mês", () => {
    expect(resolveReference("próximo mês", snapshot)).toMatchObject({
      kind: "date_range",
      value: { start: "2026-09-01", end: "2026-09-30" },
      source: "app_data",
    });
  });

  it.each(["dia 13", "no dia 13", "para o dia 13"])("aceita o marcador explícito em %s", (phrase) => {
    expect(resolveReference(phrase, snapshot)).toMatchObject({ kind: "date", value: "2026-08-13", confidence: 1 });
  });

  it("usa baixa confiança no fallback numérico sem marcador", () => {
    expect(resolveReference("13", snapshot)).toMatchObject({ kind: "date", value: "2026-08-13", source: "screen", confidence: 0.6 });
  });
});
