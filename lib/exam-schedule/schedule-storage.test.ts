import { beforeEach, describe, expect, it } from "vitest";
import { cancelScheduleInStorage, confirmScheduleInStorage, getStoredScheduleOverride, resetScheduleStorageForTests } from "@/lib/exam-schedule/schedule-storage";
import { createPendingAction, hashPendingArgs } from "@/lib/vitru/pending-action";

const scheduleArgs = { subjectCode: "GTI03", testCode: "AV1", scheduleOptionId: "option-1" };
const cancelArgs = { subjectCode: "GTI03", testCode: "AV1", operation: "cancel" };
const consumed = (args: object, surface: "assessment-scheduling" | "assessments" = "assessment-scheduling") => ({
  ...createPendingAction("test", args, surface, 0, crypto.randomUUID()), consumed: true,
});

describe("fronteira direta de persistência do agendamento", () => {
  beforeEach(resetScheduleStorageForTests);

  it("autorização ausente não grava", () => {
    expect(confirmScheduleInStorage("GTI03", "AV1", "option-1", null)).toBe(false);
    expect(cancelScheduleInStorage("GTI03", "AV1", undefined)).toBe(false);
    expect(getStoredScheduleOverride("GTI03", "AV1")).toBeNull();
  });

  it("consumed diferente de true não grava", () => {
    expect(confirmScheduleInStorage("GTI03", "AV1", "option-1", createPendingAction("schedule", scheduleArgs, "assessment-scheduling"))).toBe(false);
    expect(cancelScheduleInStorage("GTI03", "AV1", createPendingAction("cancel", cancelArgs, "assessment-scheduling"))).toBe(false);
    expect(getStoredScheduleOverride("GTI03", "AV1")).toBeNull();
  });

  it("superfície diferente não grava", () => {
    expect(confirmScheduleInStorage("GTI03", "AV1", "option-1", consumed(scheduleArgs, "assessments"))).toBe(false);
    expect(cancelScheduleInStorage("GTI03", "AV1", consumed(cancelArgs, "assessments"))).toBe(false);
    expect(getStoredScheduleOverride("GTI03", "AV1")).toBeNull();
  });

  it("argsHash divergente não grava", () => {
    const scheduleAuth = { ...consumed(scheduleArgs), argsHash: hashPendingArgs({ ...scheduleArgs, scheduleOptionId: "tampered" }) };
    const cancelAuth = { ...consumed(cancelArgs), argsHash: hashPendingArgs({ ...cancelArgs, operation: "schedule" }) };
    expect(confirmScheduleInStorage("GTI03", "AV1", "option-1", scheduleAuth)).toBe(false);
    expect(cancelScheduleInStorage("GTI03", "AV1", cancelAuth)).toBe(false);
    expect(getStoredScheduleOverride("GTI03", "AV1")).toBeNull();
  });

  it("autorização válida grava exatamente uma vez", () => {
    const scheduleAuth = consumed(scheduleArgs);
    expect(confirmScheduleInStorage("GTI03", "AV1", "option-1", scheduleAuth)).toBe(true);
    expect(confirmScheduleInStorage("GTI03", "AV1", "option-1", scheduleAuth)).toBe(false);
    expect(getStoredScheduleOverride("GTI03", "AV1")).toMatchObject({ kind: "scheduled", scheduleOptionId: "option-1" });

    const cancelAuth = consumed(cancelArgs);
    expect(cancelScheduleInStorage("GTI03", "AV1", cancelAuth)).toBe(true);
    expect(cancelScheduleInStorage("GTI03", "AV1", cancelAuth)).toBe(false);
    expect(getStoredScheduleOverride("GTI03", "AV1")).toMatchObject({ kind: "cancelled" });
  });
});
