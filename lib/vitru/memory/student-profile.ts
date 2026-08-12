import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import * as s from "@/lib/db/schema";
import { findStudentBySlug, requireStudentBySlug } from "@/lib/data/db-helpers";
import type { WorkScheduleRaw } from "@/lib/types/raw/work-schedule";

export interface PreferredWindow {
  weekday: number;
  start: string;
  end: string;
}

export interface StudentProfile {
  workScheduleOverride: WorkScheduleRaw | null;
  preferredWindows: PreferredWindow[];
  sessionMinutes: number | null;
  updatedAt: string;
}

/** `null` quando o aluno nunca declarou nada — ausência de linha é "nada a lembrar", não um perfil zerado. */
export async function getStudentProfile(userId: string): Promise<StudentProfile | null> {
  const student = await findStudentBySlug(userId);
  if (!student) return null;

  const db = await getDb();
  const [row] = await db
    .select()
    .from(s.studentProfiles)
    .where(eq(s.studentProfiles.studentId, student.id))
    .limit(1);
  if (!row) return null;

  return {
    workScheduleOverride: row.workScheduleOverride,
    preferredWindows: row.preferredWindows,
    sessionMinutes: row.sessionMinutes,
    updatedAt: row.updatedAt.toISOString(),
  };
}

export interface StudentProfileUpdate {
  workScheduleOverride?: WorkScheduleRaw | null;
  preferredWindows?: PreferredWindow[];
  sessionMinutes?: number | null;
}

/**
 * Upsert parcial: só sobrescreve os campos informados em `update`, mesmo
 * quando já existe uma linha com os demais campos preenchidos. É o caminho
 * por onde o aluno corrige algo que a Fase 5 já tinha inferido — ex.: "na
 * verdade agora eu trabalho até mais tarde" sobrescreve só
 * `workScheduleOverride`, sem mexer nas janelas preferidas já registradas.
 */
export async function updateStudentProfile(
  userId: string,
  update: StudentProfileUpdate
): Promise<void> {
  const student = await requireStudentBySlug(userId);
  const db = await getDb();
  const now = new Date();

  await db
    .insert(s.studentProfiles)
    .values({
      studentId: student.id,
      workScheduleOverride: update.workScheduleOverride ?? null,
      preferredWindows: update.preferredWindows ?? [],
      sessionMinutes: update.sessionMinutes ?? null,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: s.studentProfiles.studentId,
      set: {
        ...(update.workScheduleOverride !== undefined && {
          workScheduleOverride: update.workScheduleOverride,
        }),
        ...(update.preferredWindows !== undefined && {
          preferredWindows: update.preferredWindows,
        }),
        ...(update.sessionMinutes !== undefined && { sessionMinutes: update.sessionMinutes }),
        updatedAt: now,
      },
    });
}
