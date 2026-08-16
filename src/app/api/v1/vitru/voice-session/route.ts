import { loadUserIndex } from "@/lib/data/load-user-index";
import { resolveActiveUserId } from "@/lib/data/resolve-active-user";
import type { VoiceSurface } from "@/lib/vitru/voice-session-contract";
import { buildVitruVoiceSession } from "@/lib/vitru/voice-session-server";

interface VoiceSessionBody {
  surface?: unknown;
  objectId?: unknown;
}

function invalid(message: string) {
  return Response.json({ ok: false, error: { code: "INVALID_REQUEST", message } }, { status: 400 });
}

export async function POST(request: Request) {
  let body: VoiceSessionBody;
  try {
    body = (await request.json()) as VoiceSessionBody;
  } catch {
    return invalid("O corpo deve ser um JSON válido.");
  }

  if (body.surface !== "portal" && body.surface !== "calendario") {
    return invalid("surface deve ser portal ou calendario.");
  }
  if (typeof body.objectId !== "string" || !body.objectId.trim() || body.objectId.length > 200) {
    return invalid("objectId é obrigatório e deve conter no máximo 200 caracteres.");
  }

  // A identidade vem do servidor. Nunca aceitamos userId enviado pelo browser.
  const userId = await resolveActiveUserId(undefined);
  const index = await loadUserIndex();
  if (!index.users.some((user) => user.id === userId)) {
    return Response.json(
      { ok: false, error: { code: "STUDENT_NOT_FOUND", message: "Aluno não encontrado." } },
      { status: 404 },
    );
  }

  const session = await buildVitruVoiceSession(
    userId,
    body.surface as VoiceSurface,
    body.objectId.trim(),
  );
  return Response.json({ session }, { headers: { "Cache-Control": "no-store" } });
}
