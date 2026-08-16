/**
 * Contrato mínimo de mensagens de controle entre o browser e o relay Nova
 * Sonic (server/nova-sonic-relay.ts). O áudio viaja como frames binários na
 * mesma conexão WebSocket; este módulo cobre só as mensagens JSON.
 *
 * Mantém a forma de RealtimeServerEvent que VoiceAssistantWindow.tsx já
 * consumia com o protocolo antigo, para minimizar a mudança no componente.
 */
import type { RealtimeTool } from "@/lib/vitru/realtime-protocol";

export const SNAPSHOT_SENTINEL = "[VITRU_PAGE_SNAPSHOT]";

// --- Mensagens cliente → relay ---

export type VoiceClientMessage =
  | { type: "session_config"; instructions: string; tools: RealtimeTool[] }
  | { type: "page_context"; context: unknown }
  | { type: "tool_result"; callId: string; output: unknown };

export function sessionConfigMessage(instructions: string, tools: RealtimeTool[]): VoiceClientMessage {
  return { type: "session_config", instructions, tools };
}

export function pageContextMessage(context: unknown): VoiceClientMessage {
  return { type: "page_context", context };
}

export function toolResultMessage(callId: string, output: unknown): VoiceClientMessage {
  return { type: "tool_result", callId, output };
}

// --- Mensagens relay → cliente ---

export type RealtimeServerEvent =
  | { kind: "session_created" }
  | { kind: "user_transcript"; text: string }
  | { kind: "assistant_transcript"; text: string }
  | { kind: "tool_call"; callId: string; name: string; args: Record<string, unknown> }
  | { kind: "usage"; inputTokens: number; outputTokens: number }
  | { kind: "error"; message: string }
  | { kind: "ignored" };

export function parseServerMessage(raw: unknown): RealtimeServerEvent {
  if (!raw || typeof raw !== "object") return { kind: "ignored" };
  const event = raw as Record<string, unknown>;
  switch (event.type) {
    case "session_created":
      return { kind: "session_created" };
    case "user_transcript":
      return typeof event.text === "string" && event.text.trim() !== ""
        ? { kind: "user_transcript", text: event.text.trim() }
        : { kind: "ignored" };
    case "assistant_transcript":
      return typeof event.text === "string" && event.text.trim() !== ""
        ? { kind: "assistant_transcript", text: event.text.trim() }
        : { kind: "ignored" };
    case "tool_call": {
      const callId = event.callId;
      const name = event.name;
      if (typeof callId !== "string" || typeof name !== "string") return { kind: "ignored" };
      const args = event.args && typeof event.args === "object" ? (event.args as Record<string, unknown>) : {};
      return { kind: "tool_call", callId, name, args };
    }
    case "usage":
      return {
        kind: "usage",
        inputTokens: typeof event.inputTokens === "number" ? event.inputTokens : 0,
        outputTokens: typeof event.outputTokens === "number" ? event.outputTokens : 0,
      };
    case "error":
      return { kind: "error", message: typeof event.message === "string" ? event.message : "O serviço de voz relatou um erro." };
    default:
      return { kind: "ignored" };
  }
}
