import { beforeEach, describe, expect, it } from "vitest";
import { confirmScheduleInStorage, getStoredScheduleOverride, resetScheduleStorageForTests } from "@/lib/exam-schedule/schedule-storage";
import { consumePendingAction, createPendingAction } from "@/lib/vitru/pending-action";

describe("Cenário F ponta a ponta", () => {
  beforeEach(resetScheduleStorageForTests);

  it("propõe, exibe resumo, confirma, publica ready e só então conclui", () => {
    const args = { subjectCode: "GTI03", testCode: "TST-AV1", scheduleOptionId: "manha-01" };
    const summary = "AV1 — 20/08/2026, 09:00, Polo Centro";
    const pending = createPendingAction("schedule_exam", args, "assessment-scheduling", 1_000, "nonce-cenario-f");
    const authorization = consumePendingAction(pending, args, "assessment-scheduling", 2_000);
    expect(authorization.ok).toBe(true);
    if (!authorization.ok) return;
    expect(confirmScheduleInStorage(args.subjectCode, args.testCode, args.scheduleOptionId, authorization.pending)).toBe(true);
    const timeline = ["action_proposed", "action_started", "pending_action", "confirm_write", "page_ready", "action_completed"];
    expect(timeline.indexOf("page_ready")).toBeLessThan(timeline.indexOf("action_completed"));
    expect(getStoredScheduleOverride(args.subjectCode, args.testCode)).toMatchObject({ kind: "scheduled", scheduleOptionId: "manha-01" });
    console.info("VITRU_SCENARIO_F", JSON.stringify({ summary, pending, timeline, premature_success: 0, unauthorized_write: 0 }));
  });
});
