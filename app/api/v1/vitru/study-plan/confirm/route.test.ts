import { describe, expect, it } from "vitest";
import { POST } from "@/app/api/v1/vitru/study-plan/confirm/route";

function request(body: unknown) {
  return new Request("http://localhost/api/v1/vitru/study-plan/confirm", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/v1/vitru/study-plan/confirm", () => {
  it("exige a ação de confirmação", async () => {
    const response = await POST(request({}));
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: { code: "INVALID_REQUEST" },
    });
  });

  it("rejeita aluno inexistente", async () => {
    const response = await POST(
      request({
        action: "CREATE_STUDY_PLAN",
        userId: "aluno-inexistente",
        suggestionIds: ["plan-1"],
      })
    );
    expect(response.status).toBe(404);
  });

  it("rejeita sugestões que não pertencem mais ao plano atual", async () => {
    const response = await POST(
      request({
        action: "CREATE_STUDY_PLAN",
        userId: "usuario-ficticio-prazo-urgente",
        suggestionIds: ["sugestao-adulterada"],
      })
    );
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body).toMatchObject({
      ok: false,
      error: {
        code: "PLAN_CHANGED",
        invalidSuggestionIds: ["sugestao-adulterada"],
      },
    });
  });
});
