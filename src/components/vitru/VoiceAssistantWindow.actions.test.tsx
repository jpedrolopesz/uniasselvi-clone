import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { VoiceAssistantWindow, type BrowserAction } from "@/components/vitru/VoiceAssistantWindow";
import { VITRU_OPEN_ASSISTANT_EVENT } from "@/components/vitru/assistant-events";
import { SemanticSnapshotProvider } from "@/components/vitru/SemanticSnapshotProvider";
import type { VitruSemanticSnapshot } from "@/lib/vitru/semantic-snapshot";

const router = { push: vi.fn(), back: vi.fn(), forward: vi.fn() };
let pathname = "/disciplinas/GTI03/notas-avaliacoes";
const highlight = vi.fn<(target: string) => boolean>(() => true);
const close = vi.fn<(target: string) => boolean>(() => true);
const debug = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => pathname,
  useRouter: () => router,
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("@/components/vitru/browser-context", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/components/vitru/browser-context")>();
  return { ...actual, highlightVitruTarget: (target: string) => highlight(target), closeVitruTarget: (target: string) => close(target) };
});
vi.mock("@/lib/vitru/debug-store", () => ({ appendVitruDebug: (...args: unknown[]) => debug(...args) }));

function snapshot(overrides: Partial<VitruSemanticSnapshot> = {}): VitruSemanticSnapshot {
  return {
    version: 1, status: "ready",
    page: { id: "assessments", name: "Notas e Avaliações" },
    state: { now: "2026-08-13T12:00:00-03:00", timezone: "America/Sao_Paulo", focus: null, temporal: { view: null, visibleStart: "2026-08-13", visibleEnd: "2026-08-13" }, filters: {}, permissions: [] },
    sections: [{ id: "assessments", name: "Avaliações", items: [{ id: "assessment:AV1", name: "Avaliação Virtual 1", actionIds: ["assessment:AV1:show"] }] }],
    actions: [{ id: "assessment:AV1:show", label: "Mostrar Avaliação Virtual 1", kind: "read" }],
    destinations: [
      { id: "discipline", name: "Disciplina", href: "/disciplinas/GTI03" },
      { id: "learning-path", name: "Trilha de aprendizagem", href: "/disciplinas/GTI03/trilha-de-aprendizagem" },
    ],
    ...overrides,
  };
}

function setup(value = snapshot()) {
  let execute!: (action: BrowserAction) => void;
  render(<SemanticSnapshotProvider snapshot={value}><VoiceAssistantWindow activeUserId="student" onActionExecutorReady={(fn) => { execute = fn; }} /></SemanticSnapshotProvider>);
  act(() => window.dispatchEvent(new Event(VITRU_OPEN_ASSISTANT_EVENT)));
  return (action: BrowserAction) => act(() => execute(action));
}

describe("executeBrowserAction characterization", () => {
  beforeEach(() => { cleanup(); pathname = "/disciplinas/GTI03/notas-avaliacoes"; vi.clearAllMocks(); highlight.mockReturnValue(true); close.mockReturnValue(true); });

  it("stays closed until the sidebar trigger is clicked", () => {
    render(<SemanticSnapshotProvider snapshot={snapshot()}><VoiceAssistantWindow activeUserId="student" /></SemanticSnapshotProvider>);
    expect(screen.queryByRole("complementary", { name: "Assistente virtual por voz e texto" })).toBeNull();
    act(() => window.dispatchEvent(new Event(VITRU_OPEN_ASSISTANT_EVENT)));
    expect(screen.getByRole("complementary", { name: "Assistente virtual por voz e texto" })).toBeDefined();
  });

  it("offers voice and text conversation modes", () => {
    setup();
    expect(screen.getByRole("button", { name: "Voz" }).getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(screen.getByRole("button", { name: "Mensagem" }));
    expect(screen.getByRole("button", { name: "Mensagem" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("textbox", { name: "Mensagem para o Vitru" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Enviar mensagem" })).toBeDefined();
  });

  it("returns already_here when an invalid enum utterance matches the current page", () => {
    const execute = setup(); execute({ id: "1", type: "navigate", destination_id: "assessments", utterance: "abra minhas avaliações" });
    expect(screen.getByText("Você já está nesta página.")).toBeDefined(); expect(router.push).not.toHaveBeenCalled();
  });

  it("uses catalog href for a valid destination_id", () => {
    const execute = setup(); execute({ id: "2", type: "navigate", destination_id: "learning-path", utterance: "qualquer fala" });
    expect(router.push).toHaveBeenCalledWith("/disciplinas/GTI03/trilha-de-aprendizagem");
  });

  it("repairs an invalid enum from clear speech", () => {
    const execute = setup(); execute({ id: "3", type: "navigate", destination_id: "wrong", utterance: "quero ver a trilha" });
    expect(router.push).toHaveBeenCalledWith("/disciplinas/GTI03/trilha-de-aprendizagem");
  });

  it("asks which destination when invalid enum speech is ambiguous", () => {
    const value = snapshot({ destinations: [{ id: "a", name: "Avaliação Virtual 1", href: "/a" }, { id: "b", name: "Avaliação Virtual 2", href: "/b" }] });
    const execute = setup(value); execute({ id: "4", type: "navigate", destination_id: "wrong", utterance: "abra a avaliação virtual" });
    expect(screen.getByText("Encontrei mais de uma página possível. Qual delas você quer abrir?")).toBeDefined();
  });

  it("keeps the final same-href already_here guard", () => {
    const value = snapshot({ destinations: [{ id: "alias", name: "Minhas avaliações", href: "/disciplinas/GTI03/notas-avaliacoes" }] });
    const execute = setup(value); execute({ id: "5", type: "navigate", destination_id: "alias" });
    expect(screen.getByText("Você já está nesta página.")).toBeDefined(); expect(router.push).not.toHaveBeenCalled();
  });

  it("highlights a resolved show target", async () => {
    vi.useFakeTimers();
    try {
      const execute = setup(); execute({ id: "6", type: "show", referencia: "Avaliação Virtual 1" });
      await act(async () => { vi.advanceTimersByTime(1000); });
      expect(highlight).toHaveBeenCalledWith("id:assessment:AV1:show"); expect(screen.getByText("Ação localizada e destacada.")).toBeDefined();
      expect(debug.mock.calls.some(([entry]) => {
        const value = entry as { kind?: string; data?: { context?: { snapshot?: VitruSemanticSnapshot } } };
        return value.kind === "snapshot" && value.data?.context?.snapshot?.state.focus?.id === "assessment:AV1";
      })).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it("asks which show target when resolution is ambiguous", () => {
    const value = snapshot({ actions: [{ id: "a", label: "Mostrar Avaliação Virtual 1", kind: "read" }, { id: "b", label: "Mostrar Avaliação Virtual 2", kind: "read" }], sections: [] });
    const execute = setup(value); execute({ id: "7", type: "show", referencia: "mostrar avaliação virtual" });
    expect(screen.getByText("Encontrei mais de uma opção. Qual delas você quer?")).toBeDefined();
  });

  it("navigates unresolved show to assessments when available", () => {
    const value = snapshot({ actions: [], sections: [], destinations: [{ id: "assessments", name: "Notas e avaliações", href: "/disciplinas/GTI03/notas-avaliacoes" }] });
    pathname = "/disciplinas/GTI03"; const execute = setup(value); execute({ id: "8", type: "show", referencia: "AV1" });
    expect(router.push).toHaveBeenCalledWith("/disciplinas/GTI03/notas-avaliacoes");
  });

  it("coerces a scheduling option show to select_option", () => {
    pathname = "/disciplinas/GTI03/notas-avaliacoes/AV1/agendamento";
    const value = snapshot({ page: { id: "assessment-scheduling", name: "Agendamento" }, sections: [{ id: "options", name: "Opções", items: [{ id: "morning", name: "20/08/2026 09:00", actionIds: ["schedule-option:morning:select"] }] }], actions: [{ id: "schedule-option:morning:select", label: "Selecionar 20/08/2026 09:00", kind: "read" }] });
    const received: unknown[] = []; window.addEventListener("vitru-schedule-command", (event) => received.push((event as CustomEvent).detail), { once: true });
    const execute = setup(value); execute({ id: "9", type: "show", referencia: "opção da manhã 09:00" });
    expect(received).toEqual([{ id: "9", type: "select_option", referencia: "opção da manhã 09:00" }]);
  });

  it("characterizes close ambiguous, resolved and unresolved", () => {
    const ambiguous = snapshot({ actions: [{ id: "a", label: "Fechar Avaliação 1", kind: "read" }, { id: "b", label: "Fechar Avaliação 2", kind: "read" }], sections: [] });
    setup(ambiguous)({ id: "10a", type: "close", referencia: "fechar avaliação" });
    expect(screen.getByText("Encontrei mais de uma interface possível. Qual delas você quer fechar?")).toBeDefined();
  });

  it("closes a resolved target", () => {
    const execute = setup(); execute({ id: "10b", type: "close", referencia: "Avaliação Virtual 1" });
    expect(close).toHaveBeenCalledWith("id:assessment:AV1:show"); expect(screen.getByText("Interface fechada.")).toBeDefined();
  });

  it("reports unresolved close", () => {
    const execute = setup(snapshot({ actions: [], sections: [] })); execute({ id: "10c", type: "close", referencia: "inexistente" });
    expect(screen.getByText("Não encontrei a interface descrita na página atual.")).toBeDefined();
  });

  it("rejects clarify on a page with deterministic scheduling scope", () => {
    pathname = "/disciplinas/GTI03/notas-avaliacoes/AV1/agendamento";
    const execute = setup(snapshot({ page: { id: "assessment-scheduling", name: "Agendamento" } })); execute({ id: "11", type: "clarify", pergunta: "qual atividade?" });
    expect(screen.getByText("Esta tela já é sobre uma avaliação específica. Use listar_opcoes para mostrar os horários.")).toBeDefined();
  });

  it("turns clarify with one resolved read-only action into a highlight", () => {
    const execute = setup(); execute({ id: "12", type: "clarify", pergunta: "Avaliação Virtual 1" });
    expect(highlight).toHaveBeenCalledWith("id:assessment:AV1:show");
    expect(screen.getByText("A referência já estava resolvida; localizei a ação segura correspondente.")).toBeDefined();
  });

  it("allows a genuinely unresolved clarification", () => {
    const execute = setup(); execute({ id: "13", type: "clarify", pergunta: "Qual delas?" });
    expect(screen.getByText("Qual delas?")).toBeDefined();
  });

  it.each(["list_options", "select_option", "confirm_write"] as const)("rejects %s outside scheduling", (type) => {
    const execute = setup();
    execute(type === "select_option" ? { id: type, type, referencia: "manhã" } : { id: type, type });
    expect(screen.getByText("Esta ferramenta só pode ser usada em uma tela de agendamento.")).toBeDefined();
  });
});
