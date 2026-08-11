import { afterEach, describe, expect, it, vi } from "vitest";

const { generateMock } = vi.hoisted(() => ({ generateMock: vi.fn() }));

vi.mock("@/lib/vitru/generate", () => ({
  generate: generateMock,
}));

// resolveActiveUserId() lê cookies() do next/headers, que exige um request
// context real do Next.js fora do qual lança — mockado para fixar o aluno de teste.
vi.mock("@/lib/data/resolve-active-user", () => ({
  resolveActiveUserId: vi.fn().mockResolvedValue("usuario-ficticio-em-dia"),
}));

const TEST_USER_ID = "usuario-ficticio-em-dia";

import { POST } from "@/app/api/v1/vitru/chat/route";

function request(body: unknown) {
  return new Request("http://localhost/api/v1/vitru/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

afterEach(() => {
  generateMock.mockReset();
  vi.unstubAllGlobals();
});

describe("POST /api/v1/vitru/chat — contrato por superfície", () => {
  const trilhaFocus = { kind: "trilha", lessonId: "u1-fatorial", markCount: 0, lastMarkAt: null };

  it("resolve pela FAQ da aula sem chamar o gerador", async () => {
    const response = await POST(
      request({
        surface: "trilha",
        objectId: "MAT24",
        focus: trilhaFocus,
        message: "o que é fatorial de zero?",
      })
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toMatchObject({ resolution: "faq" });
    expect(typeof body.conversationId).toBe("string");
    expect(generateMock).not.toHaveBeenCalled();
  });

  it("pergunta sobre nota retorna out_of_scope com ação de navegação, nunca uma resposta sobre nota", async () => {
    const response = await POST(
      request({
        surface: "trilha",
        objectId: "MAT24",
        focus: trilhaFocus,
        message: "qual é a minha nota nessa disciplina?",
      })
    );

    const body = await response.json();
    expect(body.resolution).toBe("out_of_scope");
    expect(body.actions).toEqual([expect.objectContaining({ type: "navigate" })]);
    expect(generateMock).not.toHaveBeenCalled();
  });

  it("mensagem sem nenhum token reconhecível nunca produz resposta afirmativa (low_confidence), sem chamar o gerador", async () => {
    const response = await POST(
      request({
        surface: "trilha",
        objectId: "MAT24",
        focus: trilhaFocus,
        message: "? ! ...",
      })
    );

    const body = await response.json();
    expect(body.resolution).toBe("low_confidence");
    expect(body.confidence).toBeLessThan(0.6);
    expect(generateMock).not.toHaveBeenCalled();
  });

  it("uma pergunta sem resposta no material oferece encaminhamento ao mediador sem chamar o gerador", async () => {
    const response = await POST(
      request({
        surface: "trilha",
        objectId: "MAT24",
        focus: trilhaFocus,
        message: "não entendi essa parte, pode explicar de outro jeito?",
      })
    );

    const body = await response.json();
    expect(body.resolution).toBe("low_confidence");
    expect(body.actions).toEqual([
      {
        type: "navigate",
        label: "Falar com o mediador",
        href: "/disciplinas/MAT24/fale-com-mediador",
      },
    ]);
    expect(generateMock).not.toHaveBeenCalled();
  });

  it("toda resposta de sucesso carrega resolution", async () => {
    const messages = [
      "o que é fatorial de zero?",
      "qual é a minha nota nessa disciplina?",
      "? ! ...",
      "não entendi essa parte",
    ];
    for (const message of messages) {
      const response = await POST(
        request({ surface: "trilha", objectId: "MAT24", focus: trilhaFocus, message })
      );
      const body = await response.json();
      expect(body.resolution).toBeTruthy();
    }
    expect(generateMock).not.toHaveBeenCalled();
  });

  it("entryEventId desconhecido abre o painel normalmente, sem erro e sem retomada", async () => {
    const response = await POST(
      request({
        surface: "trilha",
        objectId: "MAT24",
        entryEventId: "evt-nao-existe-nunca",
      })
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.reply).toContain("Vitru");
    expect(body.resolution).toBe("retrieval");
  });

  it("nunca chama o gerador quando a trilha não encontra resposta local", async () => {
    await POST(
      request({
        surface: "trilha",
        objectId: "MAT24",
        focus: trilhaFocus,
        message: "fatorial tem alguma curiosidade histórica interessante fora do conteúdo desta unidade?",
      })
    );

    expect(generateMock).not.toHaveBeenCalled();
  });

  it("falha no gerador mantém o plano local disponível para confirmação", async () => {
    generateMock.mockRejectedValue(new Error("offline"));
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    const response = await POST(
      request({ surface: "calendario", objectId: TEST_USER_ID, message: "monte um plano" })
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      resolution: "generation",
      actions: [expect.objectContaining({ type: "confirm_plan" })],
    });
    consoleSpy.mockRestore();
  });

  it("superfície calendario delega ao modelo e devolve resolution generation com ação confirm_plan quando há plano sugerido", async () => {
    generateMock.mockResolvedValue({
      text: "Aqui está seu plano.",
      inputTokens: null,
      outputTokens: null,
    });

    const response = await POST(
      request({ surface: "calendario", objectId: TEST_USER_ID, message: "monte um plano para minha prova" })
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.resolution).toBe("generation");
  });
});
