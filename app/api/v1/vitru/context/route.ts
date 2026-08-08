import { loadUserIndex } from "@/lib/data/load-user-index";
import { buildVitruStudentContext } from "@/lib/vitru/build-student-context";

export async function GET(request: Request) {
  const userId = new URL(request.url).searchParams.get("userId")?.trim();
  if (!userId) {
    return Response.json(
      {
        ok: false,
        error: { code: "INVALID_REQUEST", message: "userId é obrigatório." },
      },
      { status: 400 }
    );
  }

  const index = await loadUserIndex();
  if (!index.users.some((user) => user.id === userId)) {
    return Response.json(
      {
        ok: false,
        error: { code: "STUDENT_NOT_FOUND", message: "Aluno não encontrado." },
      },
      { status: 404 }
    );
  }

  try {
    const context = await buildVitruStudentContext(userId);
    return Response.json(
      {
        ok: true,
        data: context,
        meta: { version: "v1", source: "local-simulation" },
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Falha ao montar contexto do Vitru", error);
    return Response.json(
      {
        ok: false,
        error: {
          code: "CONTEXT_UNAVAILABLE",
          message: "Não foi possível carregar os dados acadêmicos.",
        },
      },
      { status: 500 }
    );
  }
}
