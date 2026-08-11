"use server";

import { mkdir, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { readUserJsonFileOptional } from "@/lib/data/read-json-file";
import type { TrilhaProgressRecord } from "@/lib/data/load-trilha-progress";

const USER_DATA_ROOT = path.join(process.cwd(), "public", "data", "user");
const ID_PATTERN = /^[a-zA-Z0-9_-]+$/;
const EXCERPT_MAX_LENGTH = 120;
const MAX_MARKS_PER_SUBJECT = 200;

const pendingWrites = new Map<string, Promise<unknown>>();

function assertValidId(value: string, label: string): void {
  if (!ID_PATTERN.test(value)) {
    throw new Error(`${label} inválido.`);
  }
}

async function writeProgress(
  userId: string,
  subjectCode: string,
  change: (record: TrilhaProgressRecord) => void
): Promise<void> {
  const current = (await readUserJsonFileOptional<TrilhaProgressRecord>(
    userId,
    "subjects",
    subjectCode,
    "trilha-progress.json"
  )) ?? { completedLessonIds: [], marks: [] };

  change(current);

  const directory = path.join(USER_DATA_ROOT, userId, "subjects", subjectCode);
  const target = path.join(directory, "trilha-progress.json");
  const temporary = path.join(directory, `.trilha-progress-${randomUUID()}.tmp`);
  await mkdir(directory, { recursive: true });
  await writeFile(temporary, `${JSON.stringify(current, null, 2)}\n`);
  await rename(temporary, target);
}

/** Serializa gravações por aluno+disciplina (mesmo padrão de lib/data/save-study-activities.ts). */
function queueWrite(
  userId: string,
  subjectCode: string,
  change: (record: TrilhaProgressRecord) => void
): Promise<void> {
  const key = `${userId}:${subjectCode}`;
  const previous = pendingWrites.get(key) ?? Promise.resolve();
  const next = previous.then(() => writeProgress(userId, subjectCode, change));
  pendingWrites.set(key, next);
  const cleanup = () => {
    if (pendingWrites.get(key) === next) pendingWrites.delete(key);
  };
  void next.then(cleanup, cleanup);
  return next;
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

  await queueWrite(userId, subjectCode, (record) => {
    if (!record.completedLessonIds.includes(lessonId)) {
      record.completedLessonIds.push(lessonId);
    }
  });

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

  await queueWrite(userId, subjectCode, (record) => {
    record.marks = record.marks.filter(
      (mark) => !(mark.lessonId === lessonId && mark.paragraphId === paragraphId)
    );
    record.marks.push({
      lessonId,
      paragraphId,
      excerpt: trimmedExcerpt,
      markedAt: new Date().toISOString(),
    });
    if (record.marks.length > MAX_MARKS_PER_SUBJECT) {
      record.marks = record.marks.slice(record.marks.length - MAX_MARKS_PER_SUBJECT);
    }
  });

  revalidatePath(`/disciplinas/${subjectCode}/trilha-de-aprendizagem/${lessonId}`);
}
