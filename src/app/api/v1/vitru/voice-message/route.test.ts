import { beforeEach, describe, expect, it, vi } from "vitest";

const { appendMock, resolveConversationMock, resolveUserMock } = vi.hoisted(() => ({
  appendMock: vi.fn(),
  resolveConversationMock: vi.fn(),
  resolveUserMock: vi.fn(),
}));

vi.mock("@/lib/data/resolve-active-user", () => ({ resolveActiveUserId: resolveUserMock }));
vi.mock("@/lib/vitru/conversation-store", () => ({
  appendMessage: appendMock,
  resolveConversationId: resolveConversationMock,
}));

import { POST } from "@/app/api/v1/vitru/voice-message/route";

function request(body: unknown) {
  return new Request("http://localhost/api/v1/vitru/voice-message", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  resolveUserMock.mockReset().mockResolvedValue("aluno-ativo");
  resolveConversationMock.mockReset().mockResolvedValue("conv-segura");
  appendMock.mockReset().mockResolvedValue(undefined);
});

describe("POST /api/v1/vitru/voice-message", () => {
  it("persiste pela identidade ativa e pela chave da superfície", async () => {
    const response = await POST(request({
      surface: "portal",
      objectId: "discipline:/disciplinas/MAT24",
      conversationId: "conv-de-outro-aluno",
      role: "user",
      text: "  Quando fecha a AV1?  ",
    }));

    expect(response.status).toBe(200);
    expect(resolveConversationMock).toHaveBeenCalledWith(
      "aluno-ativo",
      "portal",
      "discipline:/disciplinas/MAT24",
    );
    expect(appendMock).toHaveBeenCalledWith("conv-segura", {
      role: "user",
      text: "Quando fecha a AV1?",
    });
  });

  it("recusa texto vazio e não grava", async () => {
    const response = await POST(request({ surface: "portal", objectId: "home:/", role: "assistant", text: " " }));
    expect(response.status).toBe(400);
    expect(appendMock).not.toHaveBeenCalled();
  });
});
