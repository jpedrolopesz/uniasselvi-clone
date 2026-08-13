import { and, eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import * as s from "@/lib/db/schema";
import { findStudentBySlug } from "@/lib/data/db-helpers";

export type ScheduleOverride =
  | { kind: "scheduled"; scheduleOptionId: string; updatedAt?: string }
  | { kind: "cancelled"; updatedAt?: string };

export async function loadScheduleOverride(userId: string, subjectCode: string, testCode: string): Promise<ScheduleOverride | null> {
  const student = await findStudentBySlug(userId);
  if (!student) return null;
  const db = await getDb();
  const [row] = await db.select().from(s.examScheduleOverrides).where(and(
    eq(s.examScheduleOverrides.studentId, student.id),
    eq(s.examScheduleOverrides.subjectCode, subjectCode),
    eq(s.examScheduleOverrides.testCode, testCode),
  )).limit(1);
  if (!row) return null;
  return row.kind === "scheduled" && row.scheduleOptionId
    ? { kind: "scheduled", scheduleOptionId: row.scheduleOptionId, updatedAt: row.updatedAt.toISOString() }
    : { kind: "cancelled", updatedAt: row.updatedAt.toISOString() };
}

export async function saveScheduleOverride(userId: string, subjectCode: string, testCode: string, override: ScheduleOverride): Promise<ScheduleOverride> {
  const student = await findStudentBySlug(userId);
  if (!student) throw new Error("Aluno não encontrado.");
  const db = await getDb();
  await db.insert(s.examScheduleOverrides).values({
    studentId: student.id, subjectCode, testCode, kind: override.kind,
    scheduleOptionId: override.kind === "scheduled" ? override.scheduleOptionId : null,
    updatedAt: new Date(),
  }).onConflictDoUpdate({
    target: [s.examScheduleOverrides.studentId, s.examScheduleOverrides.subjectCode, s.examScheduleOverrides.testCode],
    set: { kind: override.kind, scheduleOptionId: override.kind === "scheduled" ? override.scheduleOptionId : null, updatedAt: new Date() },
  });
  return (await loadScheduleOverride(userId, subjectCode, testCode))!;
}
