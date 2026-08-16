import { resolveDisclosure } from "@/lib/vitru/disclosure";
import { recordSurfaceVisit } from "@/lib/vitru/memory/surface-visits";
type VoiceArrivalSurface = "assessments" | "calendario";

const ALLOWED = new Set<VoiceArrivalSurface>(["assessments", "calendario"]);

export async function POST(request: Request) {
  const body = await request.json() as { userId?: string; surface?: VoiceArrivalSurface };
  if (!body.userId || !body.surface || !ALLOWED.has(body.surface)) {
    return Response.json({ ok: false, message: "Superfície inválida." }, { status: 400 });
  }
  const visit = await recordSurfaceVisit(body.userId, body.surface);
  return Response.json({ ok: true, visitCount: visit.visitCount, disclosure: resolveDisclosure(visit.visitCount) });
}
