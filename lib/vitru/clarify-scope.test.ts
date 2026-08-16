import { describe, expect, it } from "vitest";
import { isClarificationUnnecessaryForPage } from "@/lib/vitru/clarify-scope";

describe("isClarificationUnnecessaryForPage", () => {
  it("marca a tela de agendamento como sem ambiguidade real de item", () => {
    // Reproduz a falha real do Nova Micro: "Quais horários estão
    // disponíveis?" na tela de agendamento (já escopada para uma única
    // avaliação) gerou pedir_esclarecimento perguntando "para qual
    // atividade" — uma pergunta que a própria página já responde.
    expect(isClarificationUnnecessaryForPage("assessment-scheduling")).toBe(true);
  });

  it("permite esclarecimento em páginas com ambiguidade real de item", () => {
    expect(isClarificationUnnecessaryForPage("assessments")).toBe(false);
    expect(isClarificationUnnecessaryForPage("study-calendar")).toBe(false);
    expect(isClarificationUnnecessaryForPage("discipline")).toBe(false);
  });
});
