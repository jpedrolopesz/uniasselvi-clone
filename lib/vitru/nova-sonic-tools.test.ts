import { describe, expect, it } from "vitest";
import { buildVitruTools } from "@/lib/vitru/realtime-protocol";
import { buildNovaSonicToolConfiguration } from "@/lib/vitru/nova-sonic-tools";

describe("buildNovaSonicToolConfiguration", () => {
  it("converte RealtimeTool[] para toolSpec com schema serializado", () => {
    const tools = buildVitruTools({ page: { id: "discipline" }, destinations: [{ id: "GTI03" }] });
    const config = buildNovaSonicToolConfiguration(tools);

    expect(config.toolChoice).toEqual({ auto: {} });
    const navigate = config.tools.find((entry) => entry.toolSpec.name === "navigate_to");
    expect(navigate?.toolSpec.description).toContain("Abre OUTRA página");
    const schema = JSON.parse(navigate!.toolSpec.inputSchema.json);
    expect(schema.properties.destination_id).toEqual({ type: "string" });
    expect(schema.required).toEqual(["destination_id"]);
  });

  it("solta o enum de destination_id sem alterar as outras propriedades", () => {
    const tools = buildVitruTools({ page: { id: "assessment-scheduling" }, destinations: [] });
    const config = buildNovaSonicToolConfiguration(tools);
    const select = config.tools.find((entry) => entry.toolSpec.name === "selecionar_opcao");
    const schema = JSON.parse(select!.toolSpec.inputSchema.json);
    expect(schema.properties.referencia).toEqual({ type: "string" });
  });

  it("preserva todos os nomes de tool", () => {
    const tools = buildVitruTools(null);
    const config = buildNovaSonicToolConfiguration(tools);
    expect(config.tools.map((entry) => entry.toolSpec.name)).toEqual(tools.map((tool) => tool.name));
  });
});
