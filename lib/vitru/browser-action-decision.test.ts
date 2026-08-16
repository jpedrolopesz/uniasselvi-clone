import { describe, expect, it } from "vitest";
import { decideBrowserAction } from "@/lib/vitru/browser-action-decision";
import type { VitruSemanticSnapshot } from "@/lib/vitru/semantic-snapshot";

const page = { id: "assessments" as const, name: "Notas e Avaliações" };
const snapshot: VitruSemanticSnapshot = {
  version: 1, status: "ready", page,
  state: { now: "2026-08-13T12:00:00-03:00", timezone: "America/Sao_Paulo", focus: null, temporal: { view: null, visibleStart: "2026-08-13", visibleEnd: "2026-08-13" }, filters: {}, permissions: [] },
  sections: [{ id: "s", name: "Avaliações", items: [{ id: "AV1", name: "Avaliação Virtual 1", actionIds: ["AV1:show"] }] }],
  actions: [{ id: "AV1:show", label: "Mostrar Avaliação Virtual 1", kind: "read" }],
  destinations: [{ id: "learning-path", name: "Trilha de aprendizagem", href: "/disciplinas/GTI03/trilha-de-aprendizagem" }],
};

describe("decideBrowserAction union", () => {
  it("returns respond with all already-here data requested by the effect", () => {
    expect(decideBrowserAction({ id: "1", type: "navigate", destination_id: "assessments", utterance: "abra minhas avaliações" }, snapshot, page)).toEqual({ type: "respond", ok: true, message: "Você já está nesta página.", alreadyHere: true });
  });

  it("returns navigate with href", () => {
    expect(decideBrowserAction({ id: "2", type: "navigate", destination_id: "learning-path" }, snapshot, page)).toMatchObject({ type: "navigate", href: "/disciplinas/GTI03/trilha-de-aprendizagem" });
  });

  it("never navigates to a free invented discipline slug", () => {
    expect(decideBrowserAction({ id: "slug", type: "navigate", href: "/disciplinas/modelagem-e-gestao-de-processos-de-negocios" }, snapshot, page))
      .toMatchObject({ type: "respond", ok: false });
  });

  it("returns history without touching router", () => {
    expect(decideBrowserAction({ id: "3", type: "go_back" }, snapshot, page)).toEqual({ type: "history", direction: "back" });
  });

  it("returns highlight with target and both effect outcomes", () => {
    expect(decideBrowserAction({ id: "4", type: "show", referencia: "Avaliação Virtual 1" }, snapshot, page)).toEqual({
      type: "highlight", target: "id:AV1:show",
      resolvedFocus: { type: "conversation_entity", id: "AV1" },
      success: { ok: true, message: "Ação localizada e destacada." },
      failure: { ok: false, message: "A ação existe, mas não está visível nesta página." },
    });
  });

  it("returns close with effect messages", () => {
    expect(decideBrowserAction({ id: "5", type: "close", target: "modal" }, snapshot, page)).toEqual({ type: "close", target: "modal", success: "Interface fechada.", failure: "Não encontrei um controle de fechar seguro nesse componente." });
  });

  it("returns schedule with coerced action and debug metadata", () => {
    const scheduling: VitruSemanticSnapshot = { ...snapshot, page: { id: "assessment-scheduling", name: "Agendamento" }, sections: [{ id: "options", name: "Opções", items: [{ id: "morning", name: "09:00", actionIds: ["schedule-option:morning:select"] }] }], actions: [{ id: "schedule-option:morning:select", label: "Selecionar 09:00", kind: "read" }] };
    expect(decideBrowserAction({ id: "6", type: "show", referencia: "09:00" }, scheduling, scheduling.page)).toMatchObject({ type: "schedule", action: { id: "6", type: "select_option", referencia: "09:00" }, debug: { data: { show_coerced_to_select: 1 } } });
  });

  it("accepts the closed scheduling tools on the study calendar", () => {
    const calendar = { ...snapshot, page: { id: "study-calendar" as const, name: "Calendário de Estudos" } };
    expect(decideBrowserAction({ id: "calendar-list", type: "list_options" }, calendar, calendar.page))
      .toEqual({ type: "schedule", action: { id: "calendar-list", type: "list_options" } });
  });

  it("coerces show only after resolving a closed study-calendar option", () => {
    const calendar = { ...snapshot, page: { id: "study-calendar" as const, name: "Calendário de Estudos" }, sections: [{ id: "slots", name: "Horários", items: [{ id: "study-slot:2026-08-18:07:00", name: "18/08 às 07:00", actionIds: ["study-slot:2026-08-18:07:00:select"] }] }], actions: [{ id: "study-slot:2026-08-18:07:00:select", label: "Selecionar", kind: "read" as const }] };
    expect(decideBrowserAction({ id: "calendar-show", type: "show", referencia: "study-slot:2026-08-18:07:00:select" }, calendar, calendar.page))
      .toMatchObject({ type: "schedule", action: { type: "select_option" } });
  });

  it("blocks anaphoric navigation without a current focus", () => {
    expect(decideBrowserAction({ id: "7", type: "navigate", destination_id: "learning-path", utterance: "abra essa" }, snapshot, page)).toMatchObject({ type: "respond", ok: true, details: { anaphora_without_focus: 1 } });
  });

  it("repairs anaphoric navigation to the single safe focused action", () => {
    const focused = { ...snapshot, state: { ...snapshot.state, focus: { type: "conversation_entity", id: "AV1" } } };
    expect(decideBrowserAction({ id: "8", type: "navigate", destination_id: "learning-path", utterance: "agenda essa" }, focused, page)).toMatchObject({ type: "highlight", target: "id:AV1:show", resolvedFocus: { id: "AV1" } });
  });

  it("coerces redundant clarification only to a unique read-only highlight", () => {
    expect(decideBrowserAction({ id: "9", type: "clarify", pergunta: "Você quer a Avaliação Virtual 1?" }, snapshot, page)).toMatchObject({ type: "highlight", target: "id:AV1:show", resolvedFocus: { id: "AV1" } });
  });
});
