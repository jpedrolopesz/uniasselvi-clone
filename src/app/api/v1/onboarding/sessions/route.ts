import { createOnboardingSession } from "@/lib/onboarding/session-store";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { professorName?: unknown } | null;
  const professorName = typeof body?.professorName === "string" ? body.professorName : "";
  return Response.json(createOnboardingSession(professorName), { status: 201 });
}
