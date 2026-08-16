import { describe, expect, it } from "vitest";
import { isAnaphoricUtterance, withConversationFocus } from "@/lib/vitru/conversation-focus";
import type { VitruSemanticSnapshot } from "@/lib/vitru/semantic-snapshot";

const base: VitruSemanticSnapshot = {
  version: 1, status: "ready", page: { id: "assessments", name: "Avaliações" },
  state: { now: "2026-08-13T12:00:00-03:00", timezone: "America/Sao_Paulo", focus: null, temporal: { view: null, visibleStart: "2026-08-13", visibleEnd: "2026-08-13" }, filters: {}, permissions: [] },
  sections: [{ id: "s", name: "Avaliações", items: [{ id: "AV4", name: "AV4", actionIds: ["AV4:schedule"] }] }],
  actions: [{ id: "AV4:schedule", label: "Agendar AV4", kind: "navigate" }], destinations: [],
};

describe("foco conversacional", () => {
  it("não sobrepõe foco explícito da UI", () => {
    const ui = { ...base, state: { ...base.state, focus: { type: "calendar_activity", id: "ui-selection" } } };
    expect(withConversationFocus(ui, { type: "conversation_entity", id: "AV4" }).state.focus).toEqual({ type: "calendar_activity", id: "ui-selection" });
  });

  it("descarta foco cuja entidade não existe mais", () => {
    expect(withConversationFocus({ ...base, sections: [], actions: [] }, { type: "conversation_entity", id: "AV4" }).state.focus).toBeNull();
  });

  it.each(["agenda essa", "mostre esse aí", "use o anterior", "quero a mesma", "a que você falou antes"])("reconhece %s", phrase => {
    expect(isAnaphoricUtterance(phrase)).toBe(true);
  });

  it.each(["essa semana", "esse mês", "essa avaliação AV4", "abra avaliações", "a página anterior"])("não marca fala explícita %s", phrase => {
    expect(isAnaphoricUtterance(phrase)).toBe(false);
  });
});
