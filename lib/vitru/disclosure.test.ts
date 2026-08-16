import { describe, expect, it } from "vitest";
import { resolveDisclosure } from "@/lib/vitru/disclosure";
import { redactSemanticSnapshot } from "@/lib/vitru/snapshot-redaction";
import { defaultSnapshotState } from "@/lib/vitru/semantic-snapshot";

describe("resolveDisclosure", () => {
  it("primeira visita (1) é first_visit", () => {
    expect(resolveDisclosure(1)).toBe("first_visit");
  });

  it("visitas 2 a 4 são returning", () => {
    expect(resolveDisclosure(2)).toBe("returning");
    expect(resolveDisclosure(3)).toBe("returning");
    expect(resolveDisclosure(4)).toBe("returning");
  });

  it("visita 5 em diante é frequent", () => {
    expect(resolveDisclosure(5)).toBe("frequent");
    expect(resolveDisclosure(40)).toBe("frequent");
  });
});

describe("redactSemanticSnapshot", () => {
  it("mantém fatos acadêmicos autorizados e remove campos desconhecidos", () => {
    const result = redactSemanticSnapshot({
      version: 1,
      status: "ready",
      page: { id: "assessments", name: "Avaliações" },
      state: defaultSnapshotState("2026-08-13T12:00:00-03:00"),
      sections: [{ id: "assessments", name: "Avaliações", items: [{
        id: "assessment:GTI03:AV1",
        name: "AV1",
        referenceCodes: ["AV1"],
        facts: { nota: "8,5", cpf: "000.000.000-00", email: "aluno@example.com" },
        actionIds: [],
      }] }],
      actions: [],
      destinations: [],
    });

    expect(result.snapshot.sections[0].items[0].facts).toEqual({ nota: "8,5" });
    expect(result.snapshot.sections[0].items[0]).not.toHaveProperty("referenceCodes");
    expect(result.removedFields).toEqual(["cpf", "email"]);
  });
});
