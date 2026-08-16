import { describe, expect, it } from "vitest";
import { buildVitruInstructions, buildVitruTools, translateToolCall } from "@/lib/vitru/realtime-protocol";

describe("buildVitruTools", () => {
  it("restringe navigate_to ao enum de destinos do snapshot", () => {
    const tools = buildVitruTools({ page: { id: "discipline" }, destinations: [{ id: "GTI03" }, { id: "RH01" }] });
    const navigate = tools.find((entry) => entry.name === "navigate_to");
    expect(navigate?.parameters.properties.destination_id).toEqual({
      type: "string",
      enum: ["GTI03", "RH01"],
    });
  });

  it("só expõe as tools de agendamento na tela de agendamento", () => {
    const names = (id: string) => buildVitruTools({ page: { id }, destinations: [] }).map((entry) => entry.name);
    expect(names("assessment-scheduling")).toEqual(
      expect.arrayContaining(["listar_opcoes", "selecionar_opcao", "confirmar"])
    );
    expect(names("discipline")).not.toContain("confirmar");
  });

  it("sobrevive a um snapshot ausente sem inventar destinos", () => {
    const navigate = buildVitruTools(null).find((entry) => entry.name === "navigate_to");
    expect(navigate?.parameters.properties.destination_id).toEqual({ type: "string", enum: [] });
  });
});

describe("buildVitruInstructions", () => {
  it("mantém a identidade e o contrato semântico no portal", () => {
    const instructions = buildVitruInstructions({ surface: "portal" });
    expect(instructions).toContain("Você é Vitru");
    expect(instructions).toContain("CONTRATO SEMÂNTICO");
    expect(instructions).not.toContain("CONTEXTO ESTÁVEL DO PLANEJAMENTO");
  });

  it("anexa as sugestões do calendário e limita a 20", () => {
    const suggestions = Array.from({ length: 25 }, (_, index) => ({
      title: `Estudo ${index}`,
      subjectName: "MAT24",
      date: "2026-08-20",
      startTime: "19:00",
      endTime: "20:00",
    })) as Parameters<typeof buildVitruInstructions>[0]["suggestions"];

    const instructions = buildVitruInstructions({ surface: "calendario", suggestions });
    expect(instructions).toContain("CONTEXTO ESTÁVEL DO PLANEJAMENTO");
    expect(instructions).toContain("Estudo 19");
    expect(instructions).not.toContain("Estudo 20");
  });
});

describe("translateToolCall", () => {
  it("mapeia as tools do portal para BrowserAction", () => {
    expect(translateToolCall("show", { referencia: "a prova" }, "a1")).toEqual({
      kind: "action",
      action: { id: "a1", type: "show", referencia: "a prova" },
    });
    expect(translateToolCall("confirmar", {}, "a2")).toEqual({
      kind: "action",
      action: { id: "a2", type: "confirm_write" },
    });
  });

  it("carrega a fala do aluno no navigate para o portal poder recusar enum errado", () => {
    const result = translateToolCall("navigate_to", { destination_id: "RH01" }, "a3", "abre gestão de pessoas");
    expect(result).toEqual({
      kind: "action",
      action: { id: "a3", type: "navigate", destination_id: "RH01", utterance: "abre gestão de pessoas" },
    });
  });

  it("trata responder_sem_acao como resposta, não como ação", () => {
    const result = translateToolCall("responder_sem_acao", {}, "a4");
    expect(result.kind).toBe("no_action");
  });

  it("recusa tool desconhecida sem lançar", () => {
    const result = translateToolCall("apagar_banco", {}, "a5");
    expect(result).toEqual({ kind: "unknown_tool", result: { ok: false, message: "Ferramenta desconhecida." } });
  });
});
