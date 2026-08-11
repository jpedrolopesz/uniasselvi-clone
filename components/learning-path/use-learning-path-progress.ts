"use client";

import { useMemo } from "react";
import type { LearningPathRaw } from "@/lib/types/raw/learning-path";
import {
  getOverallProgress,
  groupSectionsWithProgress,
} from "@/lib/selectors/learning-path-selectors";

/**
 * Progresso vem do servidor (lib/data/load-trilha-progress.ts), carregado
 * pela página e passado como prop — não mais de localStorage. Este hook só
 * deriva a visão de seções/progresso a partir dele; a escrita
 * (markLessonCompleted, em lib/learning-path/trilha-progress-actions.ts) é
 * chamada diretamente por quem precisa, seguida de router.refresh().
 */
export function useLearningPathProgress(
  path: LearningPathRaw,
  completedLessonIds: readonly string[]
) {
  const completedIds = useMemo(() => new Set(completedLessonIds), [completedLessonIds]);
  const sections = useMemo(() => groupSectionsWithProgress(path, completedIds), [path, completedIds]);
  const overall = useMemo(() => getOverallProgress(sections), [sections]);

  return { sections, overall, completedIds };
}
