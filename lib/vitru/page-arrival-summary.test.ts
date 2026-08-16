import { describe, expect, it } from "vitest";
import { buildPageArrivalSummary } from "@/lib/vitru/page-arrival-summary";
import type { VitruSemanticSnapshot } from "@/lib/vitru/semantic-snapshot";

const base = (pageId: "assessments" | "study-calendar", items: VitruSemanticSnapshot["sections"][number]["items"]): VitruSemanticSnapshot => ({
  version: 1, status: "ready", page: { id: pageId, name: pageId },
  state: { now: "2026-08-13T12:00:00-03:00", timezone: "America/Sao_Paulo", focus: null, temporal: { view: null, visibleStart: "2026-08-13", visibleEnd: "2026-08-31" }, filters: {}, permissions: [] },
  sections: [{ id: pageId === "assessments" ? "discipline:x:assessments" : "calendar:visible-activities", name: "Itens", items }], actions: [], destinations: [],
});

describe("buildPageArrivalSummary", () => {
  it("amarra as contagens de avaliações aos itens do snapshot sem listar nomes", () => {
    const snapshot = base("assessments", [
      { id: "a1", name: "AV1", status: "Concluída", actionIds: [] },
      { id: "a2", name: "AV2", status: "Concluída", actionIds: [] },
      { id: "a3", name: "AV3", status: "Concluída", actionIds: [] },
      { id: "a4", name: "AV4", status: "Responder on-line", actionIds: [] },
    ]);
    const result = buildPageArrivalSummary(snapshot);
    expect(result).toMatchObject({ total: 4, counts: { completed: 3, pending: 1 } });
    expect(result?.message).toBe("Você tem quatro avaliações. Três concluídas e uma pendente. Qual delas você quer consultar?");
    expect(result?.message).not.toContain("AV1");
  });

  it("resume o calendário por contagens derivadas das duas seções", () => {
    const snapshot = base("study-calendar", [{ id: "event-1", name: "Evento", actionIds: [] }]);
    snapshot.sections.push({ id: "calendar:study-options", name: "Livres", items: [{ id: "slot-1", name: "Horário", actionIds: [] }, { id: "slot-2", name: "Horário", actionIds: [] }] });
    expect(buildPageArrivalSummary(snapshot)).toMatchObject({ total: 3, counts: { activities: 1, availableSlots: 2 } });
  });

  it("não inventa resumo para página sem implementação específica", () => {
    expect(buildPageArrivalSummary({ ...base("assessments", []), page: { id: "discipline", name: "Disciplina" } })).toBeNull();
  });
});
