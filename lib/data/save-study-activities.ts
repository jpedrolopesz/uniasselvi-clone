import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import * as s from "@/lib/db/schema";
import { requireStudentBySlug } from "@/lib/data/db-helpers";
import { rowToStudyActivity } from "@/lib/data/study-activity-row";
import type { StudyActivity } from "@/lib/types/study-activity";
import { STUDENT_LEVEL } from "@/lib/db/schema/academic";

export interface SaveStudyActivitiesResult {
  created: StudyActivity[];
  existing: StudyActivity[];
}

/**
 * Insere atividades novas e devolve separado o que já existia — mesma
 * semântica do arquivo local anterior. O caminho de produção
 * (study-plan/confirm/route.ts) sempre valida o aluno contra
 * `loadUserIndex()` antes de chegar aqui; um slug desconhecido é bug do
 * chamador, não um caso a tratar silenciosamente.
 */
export async function saveStudyActivities(
  userId: string,
  proposed: StudyActivity[]
): Promise<SaveStudyActivitiesResult> {
  const student = await requireStudentBySlug(userId);
  const db = await getDb();

  const current = await db
    .select()
    .from(s.studyActivities)
    .where(eq(s.studyActivities.studentId, student.id));
  const currentByExternalId = new Map(current.map((row) => [row.externalId, rowToStudyActivity(row)]));

  const created = proposed.filter((activity) => !currentByExternalId.has(activity.id));
  const existing = proposed
    .map((activity) => currentByExternalId.get(activity.id))
    .filter((activity): activity is StudyActivity => Boolean(activity));

  if (created.length === 0) return { created, existing };

  await db.insert(s.studyActivities).values(
    created.map((activity) => ({
      studentId: student.id,
      externalId: activity.id,
      title: activity.title,
      category: activity.category,
      subjectCode: activity.subjectCode,
      subjectName: activity.subjectName,
      date: activity.date,
      startTime: activity.startTime,
      endTime: activity.endTime,
      notes: activity.notes,
      source: activity.source,
    }))
  );

  // Um aluno sem study-activities.json no seed nunca ganha a marca de
  // presença em academic.datasets — sem isto, loadStudyActivities
  // continuaria devolvendo null para sempre, mesmo com atividades reais já
  // gravadas aqui em cima (ver academic.datasets no schema: presença é
  // explícita, não inferida pela existência de linhas).
  await db
    .insert(s.datasets)
    .values({ studentId: student.id, subjectCode: STUDENT_LEVEL, kind: "study-activities" })
    .onConflictDoNothing();

  return { created, existing };
}
