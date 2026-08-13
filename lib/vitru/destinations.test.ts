import { describe, expect, it } from "vitest";
import { destinationsForPage, isCurrentPageRequest } from "@/lib/vitru/destinations";
import type { VitruPageId } from "@/lib/vitru/page-context";

describe("destinationsForPage", () => {
  it.each<[VitruPageId, string]>([
    ["discipline", "/disciplinas/GTI03"],
    ["assessments", "/disciplinas/GTI03/notas-avaliacoes"],
    ["assessment-scheduling", "/disciplinas/GTI03/notas-avaliacoes/AV1/agendamento"],
    ["study-calendar", "/calendario-de-estudos"],
  ])("remove navegação para a própria rota adaptada %s", (pageId, href) => {
    const result = destinationsForPage(pageId, [
      { id: "self", name: "Atual", href },
      { id: "home", name: "Início", href: "/" },
    ]);
    expect(result.map(({ id }) => id)).not.toContain("self");
  });
});

it("reconhece pedido da página atual sem confundir outra página", () => {
  expect(isCurrentPageRequest("Abra o calendário de estudos", "Calendário de Estudos")).toBe(true);
  expect(isCurrentPageRequest("Abra o calendário de estudos", "Disciplina")).toBe(false);
});
