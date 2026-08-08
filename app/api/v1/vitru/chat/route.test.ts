import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/v1/vitru/chat/route";

function request(body: unknown) {
  return new Request("http://localhost/api/v1/vitru/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("POST /api/v1/vitru/chat", () => {
  it("valida os dados antes de chamar o n8n", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(request({ channel: "email" }));

    expect(response.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("anexa o plano estruturado à resposta do agente de calendário", async () => {
    const upstreamBody = {
      ok: true,
      data: {
        replyText:
          "Plano detalhado repetindo datas e horários que também aparecem nos cartões.",
        suggestions: [],
        confirmation: null,
      },
    };
    const fetchMock = vi.fn().mockResolvedValue(
      Response.json(upstreamBody, { status: 200 })
    );
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(
      request({
        channel: "portal",
        agent: "study_planner",
        userId: "usuario-ficticio-em-dia",
        conversationId: "portal-test-001",
        message: "Organize meus estudos",
      })
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toMatchObject({
      ok: true,
      data: {
        replyText: expect.stringContaining(
          "Confirme individualmente o que deseja adicionar ao calendário."
        ),
        confirmation: {
          required: true,
          action: "CREATE_STUDY_PLAN",
        },
      },
    });
    expect(body.data.suggestions.length).toBeGreaterThan(0);
    expect(body.data.replyText).not.toContain("Resposta do Vitru");
    expect(body.data.suggestions[0]).toMatchObject({
      id: expect.stringMatching(/^plan-/),
      date: expect.any(String),
      startTime: expect.any(String),
      endTime: expect.any(String),
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:5679/webhook/vitru/v1/chat",
      expect.objectContaining({ method: "POST", cache: "no-store" })
    );
  });

  it("preserva a resposta do agente universal sem anexar plano", async () => {
    const upstreamBody = {
      ok: true,
      data: {
        replyText: "Resposta universal",
        suggestions: [],
        confirmation: null,
      },
    };
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(Response.json(upstreamBody, { status: 200 }))
    );

    const response = await POST(
      request({
        channel: "portal",
        agent: "universal",
        userId: "usuario-ficticio-em-dia",
        conversationId: "portal-test-universal-001",
        message: "Olá",
      })
    );

    await expect(response.json()).resolves.toEqual(upstreamBody);
  });

  it("aceita o canal WhatsApp e o encaminha ao n8n", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      Response.json({
        ok: true,
        data: { replyText: "Resposta curta", suggestions: [], confirmation: null },
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(
      request({
        channel: "whatsapp",
        agent: "universal",
        userId: "usuario-ficticio-prova-liberada",
        conversationId: "whatsapp-test-001",
        message: "Quem é você?",
      })
    );

    expect(response.status).toBe(200);
    expect(JSON.parse(fetchMock.mock.calls[0][1].body as string)).toMatchObject({
      channel: "whatsapp",
    });
  });

  it("devolve erro controlado quando o n8n está indisponível", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    const response = await POST(
      request({
        channel: "portal",
        agent: "study_planner",
        userId: "usuario-ficticio-em-dia",
        conversationId: "portal-test-002",
        message: "Olá",
      })
    );

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({
      error: { code: "AUTOMATION_UNAVAILABLE" },
    });
    consoleSpy.mockRestore();
  });
});
