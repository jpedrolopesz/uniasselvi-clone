import { describe, expect, it } from "vitest";
import { isSafeInternalHref, resolveVitruPage } from "@/lib/vitru/page-context";

describe("resolveVitruPage", () => {
  it("recognizes a dynamic assessment scheduling route", () => {
    expect(resolveVitruPage("/disciplinas/MAT24/notas-avaliacoes/AV1/agendamento")).toMatchObject({
      id: "assessment-scheduling",
      params: { subjectCode: "MAT24", testCode: "AV1" },
    });
  });

  it("matches a lesson before its learning-path parent", () => {
    expect(resolveVitruPage("/disciplinas/ADS/trilha-de-aprendizagem/aula-2").id).toBe("lesson");
  });

  it("recognizes the new student community", () => {
    expect(resolveVitruPage("/comunidade")).toMatchObject({
      id: "community",
      name: "Comunidade do Calouro",
    });
  });

  it("recognizes the guided community introduction", () => {
    expect(resolveVitruPage("/introducao-comunitaria")).toMatchObject({
      id: "community",
      name: "Introdução à Comunidade",
    });
  });

  it("reports uncatalogued routes without granting navigation", () => {
    expect(resolveVitruPage("/admin")).toMatchObject({ id: "unknown", capabilities: expect.not.arrayContaining(["navigate"]) });
  });
});

describe("isSafeInternalHref", () => {
  it("recusa código de disciplina que não pertence ao aluno", () => {
    expect(isSafeInternalHref("/disciplinas/modelagem-e-gestao-de-processos-de-negocios", new Set(["GTI03"]))).toBe(false);
  });

  it("allows only catalogued internal routes", () => {
    expect(isSafeInternalHref("/calendario-de-estudos?subjectCode=MAT24")).toBe(true);
    expect(isSafeInternalHref("/disciplinas/GTI03")).toBe(false);
    expect(isSafeInternalHref("/disciplinas/GTI03", new Set(["GTI03"]))).toBe(true);
    expect(isSafeInternalHref("javascript:alert(1)")).toBe(false);
    expect(isSafeInternalHref("//evil.example")).toBe(false);
    expect(isSafeInternalHref("/admin")).toBe(false);
  });
});
