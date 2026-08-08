import { describe, expect, it } from "vitest";
import { GET } from "@/app/api/v1/vitru/context/route";

describe("GET /api/v1/vitru/context", () => {
  it("exige userId", async () => {
    const response = await GET(
      new Request("http://localhost/api/v1/vitru/context")
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      error: { code: "INVALID_REQUEST" },
    });
  });

  it("rejeita aluno que não está no catálogo", async () => {
    const response = await GET(
      new Request(
        "http://localhost/api/v1/vitru/context?userId=aluno-inexistente"
      )
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      error: { code: "STUDENT_NOT_FOUND" },
    });
  });

  it("devolve o contexto do aluno sem cache", async () => {
    const response = await GET(
      new Request(
        "http://localhost/api/v1/vitru/context?userId=usuario-ficticio-em-dia"
      )
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(body).toMatchObject({
      ok: true,
      data: { student: { id: "usuario-ficticio-em-dia" } },
      meta: { version: "v1", source: "local-simulation" },
    });
  });
});
