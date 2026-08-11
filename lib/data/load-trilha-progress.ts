import { readUserJsonFileOptional } from "@/lib/data/read-json-file";

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
  const record = await readUserJsonFileOptional<TrilhaProgressRecord>(
    userId,
    "subjects",
    subjectCode,
    "trilha-progress.json"
  );
  return record ?? EMPTY_PROGRESS;
}
