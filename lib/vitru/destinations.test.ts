import { describe, expect, it } from "vitest";
import {
  destinationsForPage,
  resolveComparativeDestination,
  scoreDestinationOverlap,
  scoreDestinationOverlapBeforeStoplist,
} from "@/lib/vitru/destinations";
import type { VitruPageId } from "@/lib/vitru/page-context";

const destinations = [
  { id: "discipline", name: "Modelagem e Gestão de Processos de Negócios", href: "/disciplinas/GTI03" },
  { id: "assessments", name: "Notas e avaliações", href: "/disciplinas/GTI03/notas-avaliacoes" },
  { id: "mediator", name: "Fale com o mediador", href: "/disciplinas/GTI03/fale-com-mediador" },
  { id: "learning-path", name: "Trilha de aprendizagem", href: "/disciplinas/GTI03/trilha-de-aprendizagem" },
];

describe("destinationsForPage", () => {
  it("mantém outras disciplinas ao remover somente a rota concreta atual", () => {
    const catalog = [
      { id: "GTI03", name: "Modelagem", href: "/disciplinas/GTI03" },
      { id: "RH01", name: "Gestão de Pessoas", href: "/disciplinas/RH01" },
    ];
    expect(destinationsForPage("/disciplinas/GTI03", catalog).map(({ id }) => id)).toEqual(["RH01"]);
  });
  it.each<[VitruPageId, string]>([
    ["discipline", "/disciplinas/GTI03"],
    ["assessments", "/disciplinas/GTI03/notas-avaliacoes"],
    ["assessment-scheduling", "/disciplinas/GTI03/notas-avaliacoes/AV1/agendamento"],
    ["study-calendar", "/calendario-de-estudos"],
  ])("remove navegação para a própria rota adaptada %s", (pageId, href) => {
    expect(destinationsForPage(pageId, [{ id: "self", name: "Atual", href }, { id: "home", name: "Início", href: "/" }]).map(({ id }) => id)).not.toContain("self");
  });
});

describe("resolveComparativeDestination", () => {
  const disciplines = [
    { id: "GTI03", name: "Modelagem e Gestão de Processos de Negócios", href: "/disciplinas/GTI03" },
    { id: "RH01", name: "Gestão de Pessoas", href: "/disciplinas/RH01" },
  ];

  it("resolve o nome parcial para a disciplina de melhor encaixe", () => {
    expect(resolveComparativeDestination("abra Modelagem e Gestão de Negócios", { id: "home", name: "Início" }, disciplines))
      .toMatchObject({ outcome: "navigate", score: 1, destination: { id: "GTI03" } });
  });

  it("pergunta quando a fala contém somente o token comum", () => {
    expect(resolveComparativeDestination("abra gestão", { id: "home", name: "Início" }, disciplines))
      .toMatchObject({ outcome: "ambiguous", score: 1 });
  });

  it("tolera erro de STT ou palavra extra quando ainda há candidato único", () => {
    expect(resolveComparativeDestination("abra modelage gestão negócios agora", { id: "home", name: "Início" }, disciplines))
      .toMatchObject({ outcome: "navigate", destination: { id: "GTI03" } });
  });

  it("não resolve disciplina fora da matrícula", () => {
    expect(resolveComparativeDestination("abra Direito Constitucional", { id: "home", name: "Início" }, disciplines))
      .toMatchObject({ outcome: "unresolved" });
  });
  it("resolve a mesma fala como already_here na página de avaliações", () => {
    expect(resolveComparativeDestination("abra minhas avaliações", { id: "assessments", name: "Notas e avaliações" }, destinations.filter(d => d.id !== "assessments"))).toMatchObject({ outcome: "already_here", score: 1 });
  });

  it("resolve a mesma fala como navegação na página da disciplina", () => {
    expect(resolveComparativeDestination("abra minhas avaliações", { id: "discipline", name: "Disciplina" }, destinations.filter(d => d.id !== "discipline"))).toMatchObject({ outcome: "navigate", destination: { id: "assessments" } });
  });

  it("resolve quero ver a trilha", () => {
    expect(resolveComparativeDestination("quero ver a trilha", { id: "discipline", name: "Disciplina" }, destinations.filter(d => d.id !== "discipline"))).toMatchObject({ outcome: "navigate", destination: { id: "learning-path" } });
  });

  it("não resolve comando sem objeto", () => {
    expect(resolveComparativeDestination("abre aí", { id: "discipline", name: "Disciplina" }, destinations)).toEqual({ outcome: "unresolved", score: 0 });
  });

  it("usa a fala clara quando o enum do modelo está errado", () => {
    const emittedEnum = "discipline:GTI03:learning-path";
    expect(destinations.find(d => d.id === emittedEnum)).toBeUndefined();
    expect(resolveComparativeDestination("Abra a trilha de aprendizagem.", { id: "discipline", name: "Disciplina" }, destinations.filter(d => d.id !== "discipline"))).toMatchObject({ outcome: "navigate", destination: { id: "learning-path" } });
  });

  it("mantém ambiguidade quando dois candidatos empatam dentro da margem", () => {
    const ambiguous = [{ id: "a", name: "Avaliação Virtual 1", href: "/a" }, { id: "b", name: "Avaliação Virtual 2", href: "/b" }];
    expect(resolveComparativeDestination("Abra a avaliação virtual", { id: "discipline", name: "Disciplina" }, ambiguous).outcome).toBe("ambiguous");
  });

  it("eleva o score auditável de 1/2 para 1", () => {
    // A normalização compartilhada singulariza "minhas" para a stopword
    // "minha" e "avaliações" para "avaliação" antes desta stoplist própria.
    expect(scoreDestinationOverlapBeforeStoplist("abra minhas avaliações", "Notas e avaliações")).toBeCloseTo(1 / 2);
    expect(scoreDestinationOverlap("abra minhas avaliações", "Notas e avaliações")).toBe(1);
  });
});
