import { and, asc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import * as s from "@/lib/db/schema";
import { findStudentBySlug } from "@/lib/data/db-helpers";

export interface TrilhaMarkRecord {
  lessonId: string;
  paragraphId: string;
  excerpt: string;
  markedAt: string;
}

export interface TrilhaProgressRecord {
  completedLessonIds: string[];
  marks: TrilhaMarkRecord[];
}

const EMPTY_PROGRESS: TrilhaProgressRecord = { completedLessonIds: [], marks: [] };

/** Progresso e marcações da trilha vivem no servidor (ver lib/learning-path/trilha-progress-actions.ts para a escrita) — nunca em localStorage, para que buildTrilhaContext() possa lê-los com segurança. */
export async function loadTrilhaProgress(
  userId: string,
  subjectCode: string
): Promise<TrilhaProgressRecord> {
  const student = await findStudentBySlug(userId);
  if (!student) return EMPTY_PROGRESS;

  const db = await getDb();
  const [completions, marks] = await Promise.all([
    db
      .select()
      .from(s.trilhaCompletions)
      .where(
        and(
          eq(s.trilhaCompletions.studentId, student.id),
          eq(s.trilhaCompletions.subjectCode, subjectCode)
        )
      )
      .orderBy(asc(s.trilhaCompletions.completedAt)),
    db
      .select()
      .from(s.trilhaMarks)
      .where(and(eq(s.trilhaMarks.studentId, student.id), eq(s.trilhaMarks.subjectCode, subjectCode)))
      .orderBy(asc(s.trilhaMarks.markedAt)),
  ]);

  return {
    completedLessonIds: completions.map((row) => row.lessonId),
    marks: marks.map((row) => ({
      lessonId: row.lessonId,
      paragraphId: row.paragraphId,
      excerpt: row.excerpt,
      markedAt: row.markedAt.toISOString(),
    })),
  };
}
