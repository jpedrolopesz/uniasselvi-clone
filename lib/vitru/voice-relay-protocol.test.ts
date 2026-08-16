import { describe, expect, it } from "vitest";
import {
  pageContextMessage,
  parseServerMessage,
  sessionConfigMessage,
  toolResultMessage,
} from "@/lib/vitru/voice-relay-protocol";

describe("mensagens cliente → relay", () => {
  it("monta session_config com instructions e tools", () => {
    expect(sessionConfigMessage("instrução", [])).toEqual({ type: "session_config", instructions: "instrução", tools: [] });
  });

  it("monta page_context com o contexto bruto", () => {
    expect(pageContextMessage({ version: 3 })).toEqual({ type: "page_context", context: { version: 3 } });
  });

  it("monta tool_result com o output serializável", () => {
    expect(toolResultMessage("call_1", { ok: true })).toEqual({ type: "tool_result", callId: "call_1", output: { ok: true } });
  });
});

describe("parseServerMessage", () => {
  it("reconhece a abertura de sessão", () => {
    expect(parseServerMessage({ type: "session_created" })).toEqual({ kind: "session_created" });
  });

  it("extrai a tool call com args já em objeto", () => {
    expect(
      parseServerMessage({ type: "tool_call", callId: "call_9", name: "show", args: { referencia: "a prova de matemática" } })
    ).toEqual({ kind: "tool_call", callId: "call_9", name: "show", args: { referencia: "a prova de matemática" } });
  });

  it("usa {} quando a tool call não tem args", () => {
    expect(parseServerMessage({ type: "tool_call", callId: "call_9", name: "go_back" })).toEqual({
      kind: "tool_call",
      callId: "call_9",
      name: "go_back",
      args: {},
    });
  });

  it("lê o consumo de tokens", () => {
    expect(parseServerMessage({ type: "usage", inputTokens: 120, outputTokens: 8 })).toEqual({
      kind: "usage",
      inputTokens: 120,
      outputTokens: 8,
    });
  });

  it("captura transcrições do aluno e da Vitru", () => {
    expect(parseServerMessage({ type: "user_transcript", text: "abre gestão de pessoas" })).toEqual({
      kind: "user_transcript",
      text: "abre gestão de pessoas",
    });
    expect(parseServerMessage({ type: "assistant_transcript", text: "Você tem uma avaliação aberta." })).toEqual({
      kind: "assistant_transcript",
      text: "Você tem uma avaliação aberta.",
    });
  });

  it("ignora transcrição vazia e mensagens não reconhecidas", () => {
    expect(parseServerMessage({ type: "user_transcript", text: "  " }).kind).toBe("ignored");
    expect(parseServerMessage({ type: "unknown_type" }).kind).toBe("ignored");
    expect(parseServerMessage("não é objeto").kind).toBe("ignored");
  });

  it("propaga erros do relay", () => {
    expect(parseServerMessage({ type: "error", message: "todos os slots ocupados" })).toEqual({
      kind: "error",
      message: "todos os slots ocupados",
    });
  });
});
