import { NextResponse } from "next/server";
import { hashPendingArgs, type PendingAction } from "@/lib/vitru/pending-action";
import { saveScheduleOverride } from "@/lib/exam-schedule/schedule-repository";

export async function POST(request: Request) {
  const body = await request.json() as { userId?: string; subjectCode?: string; testCode?: string; scheduleOptionId?: string; operation?: "schedule" | "cancel"; authorization?: PendingAction };
  const { userId, subjectCode, testCode, operation, authorization } = body;
  if (!userId || !subjectCode || !testCode || !operation || !authorization?.consumed || authorization.surface !== "assessment-scheduling") {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 403 });
  }
  const args = operation === "schedule"
    ? { subjectCode, testCode, scheduleOptionId: body.scheduleOptionId }
    : { subjectCode, testCode, operation: "cancel" };
  if (authorization.argsHash !== hashPendingArgs(args) || (operation === "schedule" && !body.scheduleOptionId)) {
    return NextResponse.json({ ok: false, error: "args_mismatch" }, { status: 403 });
  }
  const override = await saveScheduleOverride(userId, subjectCode, testCode,
    operation === "schedule" ? { kind: "scheduled", scheduleOptionId: body.scheduleOptionId! } : { kind: "cancelled" });
  return NextResponse.json({ ok: true, override });
}
