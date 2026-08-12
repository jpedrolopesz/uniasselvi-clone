"use server";

import { and, asc, eq, notInArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db/client";
import * as s from "@/lib/db/schema";
import { requireStudentBySlug } from "@/lib/data/db-helpers";

const ID_PATTERN = /^[a-zA-Z0-9_-]+$/;
const EXCERPT_MAX_LENGTH = 120;
const MAX_MARKS_PER_SUBJECT = 200;

function assertValidId(value: string, label: string): void {
  if (!ID_PATTERN.test(value)) {
    throw new Error(`${label} inválido.`);
  }
}

/**
 * O aluno marcando a própria lição como concluída, ou marcando um trecho —
 * é a interface do aluno persistindo o próprio dado, não o Vitru agindo em
 * seu nome. Não é um novo caminho de escrita do pipeline de chat.
 */
export async function markLessonCompleted(
  userId: string,
  subjectCode: string,
  lessonId: string
): Promise<void> {
  assertValidId(userId, "userId");
  assertValidId(subjectCode, "subjectCode");
  if (!lessonId.trim()) throw new Error("lessonId é obrigatório.");

  const student = await requireStudentBySlug(userId);
  const db = await getDb();
  await db
    .insert(s.trilhaCompletions)
    .values({ studentId: student.id, subjectCode, lessonId })
    .onConflictDoNothing();

  revalidatePath(`/disciplinas/${subjectCode}/trilha-de-aprendizagem`);
  revalidatePath(`/disciplinas/${subjectCode}/trilha-de-aprendizagem/${lessonId}`);
}

export async function markParagraph(
  userId: string,
  subjectCode: string,
  lessonId: string,
  paragraphId: string,
  excerpt: string
): Promise<void> {
  assertValidId(userId, "userId");
  assertValidId(subjectCode, "subjectCode");
  if (!lessonId.trim() || !paragraphId.trim()) {
    throw new Error("lessonId e paragraphId são obrigatórios.");
  }
  const trimmedExcerpt = excerpt.trim().slice(0, EXCERPT_MAX_LENGTH);

  const student = await requireStudentBySlug(userId);
  const db = await getDb();
  const markedAt = new Date();

  await db
    .insert(s.trilhaMarks)
    .values({ studentId: student.id, subjectCode, lessonId, paragraphId, excerpt: trimmedExcerpt, markedAt })
    .onConflictDoUpdate({
      target: [s.trilhaMarks.studentId, s.trilhaMarks.subjectCode, s.trilhaMarks.lessonId, s.trilhaMarks.paragraphId],
      set: { excerpt: trimmedExcerpt, markedAt },
    });

  // Mesmo teto do arquivo local: mantém só as MAX_MARKS_PER_SUBJECT
  // marcações mais recentes por (aluno, disciplina).
  const all = await db
    .select({ id: s.trilhaMarks.id })
    .from(s.trilhaMarks)
    .where(and(eq(s.trilhaMarks.studentId, student.id), eq(s.trilhaMarks.subjectCode, subjectCode)))
    .orderBy(asc(s.trilhaMarks.markedAt));
  if (all.length > MAX_MARKS_PER_SUBJECT) {
    const keepIds = all.slice(all.length - MAX_MARKS_PER_SUBJECT).map((row) => row.id);
    await db
      .delete(s.trilhaMarks)
      .where(
        and(
          eq(s.trilhaMarks.studentId, student.id),
          eq(s.trilhaMarks.subjectCode, subjectCode),
          notInArray(s.trilhaMarks.id, keepIds)
        )
      );
  }

  revalidatePath(`/disciplinas/${subjectCode}/trilha-de-aprendizagem/${lessonId}`);
}
