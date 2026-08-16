import { describe, expect, it } from "vitest";
import { resolveTarget } from "@/lib/vitru/resolve-target";
import { defaultSnapshotState, type VitruSemanticSnapshot } from "@/lib/vitru/semantic-snapshot";

const snapshot: VitruSemanticSnapshot = {
  version: 1,
  status: "ready",
  page: { id: "assessments", name: "Notas e Avaliações" },
  state: defaultSnapshotState("2026-08-13T12:00:00-03:00"),
  sections: [{
    id: "assessments",
    name: "Avaliações",
    items: [
      { id: "av1", name: "Avaliação Virtual 1", referenceCodes: ["AV1"], status: "Disponível para agendamento", actionIds: ["av1:schedule"] },
      { id: "av2", name: "Avaliação Virtual 2", referenceCodes: ["AV2"], status: "Disponível para responder", actionIds: ["av2:answer"] },
      { id: "av4", name: "Avaliação Discursiva Individual", referenceCodes: ["AV4"], actionIds: ["av4:schedule"] },
      ...Array.from({ length: 7 }, (_, index) => ({
        id: `lesson:${index + 1}`,
        name: `Unidade ${index + 1} de fundamentos de processos`,
        actionIds: [`lesson:${index + 1}:open`],
      })),
    ],
  }],
  actions: [
    { id: "av1:schedule", label: "Agendar prova", kind: "navigate" },
    { id: "av2:answer", label: "Responder on-line", kind: "navigate" },
    { id: "av4:schedule", label: "Agendar avaliação", kind: "navigate" },
    ...Array.from({ length: 7 }, (_, index) => ({
      id: `lesson:${index + 1}:open`,
      label: `Abrir unidade ${index + 1}`,
      kind: "navigate" as const,
    })),
  ],
  destinations: [],
};

describe("resolveTarget", () => {
  it("resolve Onde respondo a AV2 pelo vocabulário da entidade dona", () => {
    expect(resolveTarget("Onde respondo a AV2?", snapshot)).toMatchObject({
      actionId: "av2:answer",
      ambiguous: false,
    });
  });

  it("resolve agendamento da AV1 num fixture com 10 ações", () => {
    expect(snapshot.actions).toHaveLength(10);
    expect(resolveTarget("Mostre onde eu agendo a AV1", snapshot).actionId).toBe("av1:schedule");
  });

  it.each([
    ["AV1", "av1:schedule"], ["AV2", "av2:answer"], ["a AV4", "av4:schedule"],
  ])("preserva resolução de %s pelo código fora de facts", (phrase, actionId) => {
    const result = resolveTarget(phrase, snapshot);
    expect(result).toMatchObject({ actionId, score: 1, ambiguous: false });
  });

  it("não escolhe quando os dois melhores ficam dentro da margem de 15%", () => {
    const ambiguousSnapshot = {
      ...snapshot,
      sections: [{ ...snapshot.sections[0], items: snapshot.sections[0].items.slice(0, 2).map((item) => ({ ...item, name: "Avaliação disponível" })) }],
      actions: [
        { id: "first", label: "Abrir avaliação", kind: "navigate" as const },
        { id: "second", label: "Abrir avaliação", kind: "navigate" as const },
      ],
    };
    const result = resolveTarget("abrir avaliação", ambiguousSnapshot);
    expect(result).toMatchObject({ actionId: null, ambiguous: true });
  });
});
