/**
 * Converte RealtimeTool[] (formato function-flat de lib/vitru/realtime-protocol.ts)
 * para o toolConfiguration da Nova Sonic. Usado só pelo relay
 * (server/nova-sonic-relay.ts) — nunca roda no browser.
 *
 * O toolConfiguration é fixado no promptStart, uma vez por chamada; não há
 * confirmação de que a Nova Sonic aceite atualização de tools no meio da
 * sessão a cada navegação de página. Por isso o enum de destination_id é
 * solto para string livre aqui — decideBrowserAction (lib/vitru/browser-action-decision.ts)
 * já resolve/valida o destino contra o snapshot real, independente do que o
 * modelo mandar, então soltar o enum não abre brecha de navegação para um
 * destino inválido; só perde um pouco de steering, compensado pela lista de
 * destinos continuar no texto do page_context.
 */
import type { RealtimeTool } from "@/lib/vitru/realtime-protocol";

export interface NovaSonicToolSpec {
  toolSpec: {
    name: string;
    description: string;
    inputSchema: { json: string };
  };
}

function looseSchema(tool: RealtimeTool): Record<string, unknown> {
  const properties = Object.fromEntries(
    Object.entries(tool.parameters.properties).map(([key, value]) => {
      if (
        key === "destination_id" &&
        value &&
        typeof value === "object" &&
        "enum" in (value as Record<string, unknown>)
      ) {
        return [key, { type: "string" }];
      }
      return [key, value];
    })
  );
  return { type: "object", properties, required: tool.parameters.required, additionalProperties: false };
}

export function buildNovaSonicToolConfiguration(tools: RealtimeTool[]): {
  tools: NovaSonicToolSpec[];
  toolChoice: { auto: Record<string, never> };
} {
  return {
    tools: tools.map((tool) => ({
      toolSpec: {
        name: tool.name,
        description: tool.description,
        inputSchema: { json: JSON.stringify(looseSchema(tool)) },
      },
    })),
    toolChoice: { auto: {} },
  };
}
