import { loadUserIndex } from "@/lib/data/load-user-index";
import { resolveActiveUserId } from "@/lib/data/resolve-active-user";
import { saveStudyActivities } from "@/lib/data/save-study-activities";
import { buildVitruStudentContext } from "@/lib/vitru/build-student-context";
import type { StudyActivity } from "@/lib/types/study-activity";

interface ConfirmationBody {
  action?: unknown;
  userId?: unknown;
  suggestionIds?: unknown;
}

function invalid(message: string) {
  return Response.json(
    { ok: false, error: { code: "INVALID_REQUEST", message } },
    { status: 400 }
  );
}

export async function POST(request: Request) {
  let body: ConfirmationBody;
  try {
    body = (await request.json()) as ConfirmationBody;
  } catch {
    return invalid("O corpo deve ser um JSON válido.");
  }

  if (body.action !== "CREATE_STUDY_PLAN") {
    return invalid("A ação deve ser CREATE_STUDY_PLAN.");
  }
  if (body.userId !== undefined && (typeof body.userId !== "string" || !body.userId.trim())) {
    return invalid("userId é inválido.");
  }
  if (
    !Array.isArray(body.suggestionIds) ||
    body.suggestionIds.length === 0 ||
    body.suggestionIds.length > 20 ||
    body.suggestionIds.some((id) => typeof id !== "string" || !id)
  ) {
    return invalid("suggestionIds deve conter entre 1 e 20 identificadores.");
  }

  // AssistantPanel (surface trilha/calendário) não recebe userId como prop — quando omitido, resolve pelo cookie de usuário ativo usado no restante do portal.
  const userId =
    typeof body.userId === "string" && body.userId.trim()
      ? body.userId.trim()
      : await resolveActiveUserId(undefined);
  const suggestionIds = [...new Set(body.suggestionIds as string[])];
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

  const context = await buildVitruStudentContext(userId);
  const plan = context.suggestedPlan;
  if (!plan) {
    return Response.json(
      {
        ok: false,
        error: {
          code: "PLAN_NOT_AVAILABLE",
          message: "Não existe um plano válido para confirmar.",
        },
      },
      { status: 409 }
    );
  }

  const suggestionsById = new Map(
    plan.suggestions.map((suggestion) => [suggestion.id, suggestion])
  );
  const invalidIds = suggestionIds.filter((id) => !suggestionsById.has(id));
  if (invalidIds.length > 0) {
    return Response.json(
      {
        ok: false,
        error: {
          code: "PLAN_CHANGED",
          message: "O plano foi alterado. Consulte novamente antes de confirmar.",
          invalidSuggestionIds: invalidIds,
        },
      },
      { status: 409 }
    );
  }

  const activities: StudyActivity[] = suggestionIds.map((id) => ({
    ...suggestionsById.get(id)!,
    source: "ai" as const,
  }));
  const result = await saveStudyActivities(userId, activities);

  return Response.json(
    {
      ok: true,
      data: {
        userId,
        assessmentCode: plan.assessmentCode,
        created: result.created,
        alreadyConfirmed: result.existing.map((activity) => activity.id),
      },
      meta: { version: "v1", storage: "local-simulation" },
    },
    {
      status: result.created.length > 0 ? 201 : 200,
      headers: { "Cache-Control": "no-store" },
    }
  );
}
