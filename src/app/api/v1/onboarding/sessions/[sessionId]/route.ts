import {
  getOnboardingSession,
  heartbeatOnboardingParticipant,
  updateOnboardingSession,
} from "@/lib/onboarding/session-store";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: RouteContext<"/api/v1/onboarding/sessions/[sessionId]">) {
  const { sessionId } = await context.params;
  const session = getOnboardingSession(sessionId);
  if (!session) return Response.json({ error: "Sessão não encontrada." }, { status: 404 });
  return Response.json(session, { headers: { "Cache-Control": "no-store" } });
}

export async function PATCH(request: Request, context: RouteContext<"/api/v1/onboarding/sessions/[sessionId]">) {
  const { sessionId } = await context.params;
  const body = (await request.json().catch(() => null)) as {
    hostKey?: unknown;
    status?: unknown;
    currentSceneId?: unknown;
  } | null;
  if (!body || typeof body.hostKey !== "string") {
    return Response.json({ error: "Credencial do professor ausente." }, { status: 401 });
  }
  const status = body.status === "waiting" || body.status === "active" || body.status === "ended"
    ? body.status
    : undefined;
  const currentSceneId = typeof body.currentSceneId === "string" ? body.currentSceneId : undefined;
  const session = updateOnboardingSession(sessionId, body.hostKey, { status, currentSceneId });
  if (!session) return Response.json({ error: "Sessão ou comando inválido." }, { status: 403 });
  return Response.json(session);
}

export async function POST(request: Request, context: RouteContext<"/api/v1/onboarding/sessions/[sessionId]">) {
  const { sessionId } = await context.params;
  const body = (await request.json().catch(() => null)) as {
    participantId?: unknown;
    name?: unknown;
    following?: unknown;
    completedSceneId?: unknown;
  } | null;
  if (!body || typeof body.participantId !== "string" || typeof body.name !== "string") {
    return Response.json({ error: "Participante inválido." }, { status: 400 });
  }
  const session = heartbeatOnboardingParticipant(sessionId, {
    id: body.participantId.slice(0, 120),
    name: body.name,
    following: body.following !== false,
    completedSceneId: typeof body.completedSceneId === "string" ? body.completedSceneId : null,
  });
  if (!session) return Response.json({ error: "Sessão não encontrada." }, { status: 404 });
  return Response.json(session);
}
