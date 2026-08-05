"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import type { LearningPathRaw } from "@/lib/types/raw/learning-path";
import {
  getOverallProgress,
  groupSectionsWithProgress,
} from "@/lib/selectors/learning-path-selectors";
import {
  getServerCompletedLessonIdsSnapshot,
  getStoredCompletedLessonIdsSnapshot,
  markLessonCompletedInStorage,
  subscribeToProgressChanges,
} from "@/lib/learning-path/progress-storage";

const subscribeNoop = () => () => {};

/** True somente após a primeira hidratação no cliente — via useSyncExternalStore, sem setState em efeito. */
function useHasHydrated(): boolean {
  return useSyncExternalStore(subscribeNoop, () => true, () => false);
}

/**
 * Progresso combina o estado semente do JSON (o que já vem "concluído" no
 * dado de demonstração) com o que o aluno concluiu nesta sessão do
 * navegador (localStorage, ver progress-storage.ts). `mounted` só vira
 * true após a hidratação — usado para evitar piscar um estado "bloqueada"
 * incorreto antes do progresso salvo ser lido.
 */
export function useLearningPathProgress(path: LearningPathRaw, subjectCode: string) {
  const mounted = useHasHydrated();

  const seedCompletedIds = useMemo(
    () =>
      path.sections.flatMap((section) =>
        section.lessons.filter((lesson) => lesson.completed).map((lesson) => lesson.id)
      ),
    [path]
  );

  const storedIds = useSyncExternalStore(
    subscribeToProgressChanges,
    () => getStoredCompletedLessonIdsSnapshot(subjectCode),
    getServerCompletedLessonIdsSnapshot
  );

  const completedIds = useMemo(
    () => new Set([...seedCompletedIds, ...storedIds]),
    [seedCompletedIds, storedIds]
  );

  const sections = useMemo(
    () => groupSectionsWithProgress(path, completedIds),
    [path, completedIds]
  );

  const overall = useMemo(() => getOverallProgress(sections), [sections]);

  const markCompleted = useCallback(
    (lessonId: string) => markLessonCompletedInStorage(subjectCode, lessonId),
    [subjectCode]
  );

  return { mounted, completedIds, sections, overall, markCompleted };
}
