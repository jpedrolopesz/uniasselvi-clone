import { describe, expect, it } from "vitest";
import { buildStudyCalendarSnapshot } from "@/lib/vitru/adapters/study-calendar";
import { resolveReference } from "@/lib/vitru/resolve-reference";

const snapshot = buildStudyCalendarSnapshot({ activities: [], selectedIsoDate: "2026-08-13", view: "month", now: "2026-08-13T12:00:00-03:00" });

describe("resolveReference temporal", () => {
  it.each([
    ["dia 13", "2026-08-13", "screen"],
    ["próximo dia 13", "2026-09-13", "app_data"],
    ["amanhã", "2026-08-14", "app_data"],
  ])("resolve %s", (phrase, value, source) => expect(resolveReference(phrase, snapshot)).toMatchObject({ value, source }));
  it("resolve próxima semana", () => expect(resolveReference("próxima semana", snapshot)).toMatchObject({ value: { start: "2026-08-17", end: "2026-08-23" } }));
  it("este evento sem foco é ambíguo", () => expect(resolveReference("este evento", snapshot).kind).toBe("ambiguous"));
  it("dia 45 é ambíguo", () => expect(resolveReference("dia 45", snapshot).kind).toBe("ambiguous"));
});
