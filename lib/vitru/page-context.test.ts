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

  it("reports uncatalogued routes without granting navigation", () => {
    expect(resolveVitruPage("/admin")).toMatchObject({ id: "unknown", capabilities: expect.not.arrayContaining(["navigate"]) });
  });
});

describe("isSafeInternalHref", () => {
  it("allows only catalogued internal routes", () => {
    expect(isSafeInternalHref("/calendario-de-estudos?subjectCode=MAT24")).toBe(true);
    expect(isSafeInternalHref("javascript:alert(1)")).toBe(false);
    expect(isSafeInternalHref("//evil.example")).toBe(false);
    expect(isSafeInternalHref("/admin")).toBe(false);
  });
});
