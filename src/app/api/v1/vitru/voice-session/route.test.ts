import { beforeEach, describe, expect, it, vi } from "vitest";

const { buildSessionMock, resolveUserMock } = vi.hoisted(() => ({
  buildSessionMock: vi.fn(),
  resolveUserMock: vi.fn(),
}));

vi.mock("@/lib/data/resolve-active-user", () => ({ resolveActiveUserId: resolveUserMock }));
vi.mock("@/lib/data/load-user-index", () => ({
  loadUserIndex: vi.fn().mockResolvedValue({
    defaultUserId: "usuario-ficticio-em-dia",
    users: [{ id: "usuario-ficticio-em-dia" }],
  }),
}));
vi.mock("@/lib/vitru/voice-session-server", () => ({ buildVitruVoiceSession: buildSessionMock }));

import { POST } from "@/app/api/v1/vitru/voice-session/route";

function request(body: unknown) {
  return new Request("http://localhost/api/v1/vitru/voice-session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  resolveUserMock.mockReset().mockResolvedValue("usuario-ficticio-em-dia");
  buildSessionMock.mockReset().mockResolvedValue({ conversationId: "conv-voice" });
});

describe("POST /api/v1/vitru/voice-session", () => {
  it("resolve a identidade no servidor e ignora userId fabricado pelo cliente", async () => {
    const response = await POST(request({
      surface: "portal",
      objectId: "discipline:/disciplinas/MAT24",
      userId: "outro-aluno",
    }));

    expect(response.status).toBe(200);
    expect(buildSessionMock).toHaveBeenCalledWith(
      "usuario-ficticio-em-dia",
      "portal",
      "discipline:/disciplinas/MAT24",
    );
  });

  it("recusa superfície desconhecida", async () => {
    const response = await POST(request({ surface: "admin", objectId: "x" }));
    expect(response.status).toBe(400);
    expect(buildSessionMock).not.toHaveBeenCalled();
  });
});
