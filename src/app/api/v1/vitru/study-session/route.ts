import { hashPendingArgs, type PendingAction } from "@/lib/vitru/pending-action";
import type { FreeSlot } from "@/lib/study-planner/calendar-logic";
import { createConfirmedVoiceStudySession } from "@/lib/vitru/study-programs";

export async function POST(request: Request) {
  const body = await request.json() as { userId?: string; slot?: FreeSlot; authorization?: PendingAction };
  const { userId, slot, authorization } = body;
  if (!userId || !slot || !authorization?.consumed || authorization.surface !== "study-calendar") {
    return Response.json({ ok: false, message: "Confirmação sem proposta válida." }, { status: 403 });
  }
  const args = { optionId: `study-slot:${slot.date}:${slot.startTime}`, ...slot };
  if (authorization.argsHash !== hashPendingArgs(args)) {
    return Response.json({ ok: false, message: "A opção confirmada não corresponde à proposta." }, { status: 403 });
  }
  const session = await createConfirmedVoiceStudySession(userId, slot);
  if (!session) return Response.json({ ok: false, message: "Esse horário deixou de estar disponível. Consulte as opções novamente." }, { status: 409 });
  return Response.json({ ok: true, message: "Sessão de estudo gravada.", session }, { status: 201 });
}
