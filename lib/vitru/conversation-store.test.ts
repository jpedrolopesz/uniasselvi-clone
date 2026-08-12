import { randomUUID } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  appendMessage,
  getRecentHistory,
  resolveConversationId,
  SESSION_TTL_MS,
} from "@/lib/vitru/conversation-store";
import { createTestStudent, deleteTestStudent } from "@/lib/db/test-helpers";

// resolveConversationId exige um aluno existente (FK de vitru.conversations
// para academic.students) — cada teste usa um aluno descartável próprio.
let userId: string;

beforeEach(async () => {
  userId = `user-${randomUUID()}`;
  await createTestStudent(userId);
});

afterEach(async () => {
  vi.useRealTimers();
  await deleteTestStudent(userId);
});

describe("conversation-store", () => {
  it("resolve o mesmo conversationId para a mesma chave userId+surface+objectId", async () => {
    const first = await resolveConversationId(userId, "trilha", "MAT24");
    const second = await resolveConversationId(userId, "trilha", "MAT24");
    expect(second).toBe(first);
  });

  it("chaves diferentes (surface ou objectId) nunca compartilham conversationId", async () => {
    const trilha = await resolveConversationId(userId, "trilha", "MAT24");
    const calendario = await resolveConversationId(userId, "calendario", userId);
    const outraDisciplina = await resolveConversationId(userId, "trilha", "GTI03");
    expect(calendario).not.toBe(trilha);
    expect(outraDisciplina).not.toBe(trilha);
  });

  it("expira após 24h de inatividade e gera uma nova sessão", async () => {
    const original = await resolveConversationId(userId, "trilha", "MAT24");

    vi.useFakeTimers();
    vi.setSystemTime(Date.now() + SESSION_TTL_MS + 1000);
    const renewed = await resolveConversationId(userId, "trilha", "MAT24");
    vi.useRealTimers();

    expect(renewed).not.toBe(original);
  });

  it("histórico recente é limitado às últimas 6 mensagens", async () => {
    const conversationId = await resolveConversationId(userId, "trilha", "MAT24");

    for (let i = 0; i < 9; i++) {
      await appendMessage(conversationId, { role: i % 2 === 0 ? "user" : "assistant", text: `mensagem ${i}` });
    }

    const history = await getRecentHistory(conversationId);
    expect(history).toHaveLength(6);
    expect(history[0].text).toBe("mensagem 3");
    expect(history[5].text).toBe("mensagem 8");
  });

  it("conversationId desconhecido devolve histórico vazio, sem erro", async () => {
    await expect(getRecentHistory(`conv-${randomUUID()}`)).resolves.toEqual([]);
  });
});
