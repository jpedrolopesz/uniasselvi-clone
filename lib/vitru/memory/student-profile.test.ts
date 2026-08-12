import { randomUUID } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createTestStudent, deleteTestStudent } from "@/lib/db/test-helpers";
import { getStudentProfile, updateStudentProfile } from "@/lib/vitru/memory/student-profile";

let userId: string;

beforeEach(async () => {
  userId = `user-${randomUUID()}`;
  await createTestStudent(userId);
});

afterEach(async () => {
  await deleteTestStudent(userId);
});

describe("getStudentProfile", () => {
  it("devolve null quando o aluno nunca declarou nada", async () => {
    await expect(getStudentProfile(userId)).resolves.toBeNull();
  });
});

describe("updateStudentProfile", () => {
  it("cria o perfil na primeira atualização", async () => {
    await updateStudentProfile(userId, { sessionMinutes: 45 });
    const profile = await getStudentProfile(userId);
    expect(profile?.sessionMinutes).toBe(45);
    expect(profile?.preferredWindows).toEqual([]);
  });

  it("uma atualização parcial não apaga campos já preenchidos por outra", async () => {
    await updateStudentProfile(userId, {
      sessionMinutes: 45,
      preferredWindows: [{ weekday: 2, start: "19:00", end: "21:00" }],
    });
    await updateStudentProfile(userId, {
      workScheduleOverride: { label: "Turno da tarde", startTime: "13:00", endTime: "18:00", weekdays: [1, 2, 3, 4, 5] },
    });

    const profile = await getStudentProfile(userId);
    expect(profile?.sessionMinutes).toBe(45);
    expect(profile?.preferredWindows).toEqual([{ weekday: 2, start: "19:00", end: "21:00" }]);
    expect(profile?.workScheduleOverride).toMatchObject({ startTime: "13:00" });
  });
});
