import { randomUUID } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createTestStudent, deleteTestStudent } from "@/lib/db/test-helpers";
import { getSurfaceVisit, markSurfaceOnboarded, recordSurfaceVisit } from "@/lib/vitru/memory/surface-visits";

let userId: string;

beforeEach(async () => {
  userId = `user-${randomUUID()}`;
  await createTestStudent(userId);
});

afterEach(async () => {
  await deleteTestStudent(userId);
});

describe("recordSurfaceVisit", () => {
  it("primeira visita começa em 1", async () => {
    const visit = await recordSurfaceVisit(userId, "calendario");
    expect(visit.visitCount).toBe(1);
    expect(visit.onboardedAt).toBeNull();
  });

  it("visitas repetidas incrementam o contador", async () => {
    await recordSurfaceVisit(userId, "calendario");
    await recordSurfaceVisit(userId, "calendario");
    const third = await recordSurfaceVisit(userId, "calendario");
    expect(third.visitCount).toBe(3);
  });

  it("superfícies diferentes têm contadores independentes", async () => {
    await recordSurfaceVisit(userId, "calendario");
    await recordSurfaceVisit(userId, "calendario");
    const trilha = await recordSurfaceVisit(userId, "trilha");
    expect(trilha.visitCount).toBe(1);
  });
});

describe("getSurfaceVisit", () => {
  it("devolve null quando o aluno nunca visitou a superfície", async () => {
    await expect(getSurfaceVisit(userId, "calendario")).resolves.toBeNull();
  });

  it("reflete o estado sem contar uma nova visita", async () => {
    await recordSurfaceVisit(userId, "calendario");
    await recordSurfaceVisit(userId, "calendario");
    const read1 = await getSurfaceVisit(userId, "calendario");
    const read2 = await getSurfaceVisit(userId, "calendario");
    expect(read1?.visitCount).toBe(2);
    expect(read2?.visitCount).toBe(2);
  });
});

describe("markSurfaceOnboarded", () => {
  it("marca onboardedAt sem alterar o contador de visitas", async () => {
    await recordSurfaceVisit(userId, "calendario");
    await markSurfaceOnboarded(userId, "calendario");
    const visit = await getSurfaceVisit(userId, "calendario");
    expect(visit?.onboardedAt).toBeTruthy();
    expect(visit?.visitCount).toBe(1);
  });
});
