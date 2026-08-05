import type {
  LearningPathLessonRaw,
  LearningPathRaw,
  LearningPathSectionRaw,
} from "@/lib/types/raw/learning-path";

export type LessonStatus = "completed" | "current" | "locked";

export interface LessonWithStatus extends LearningPathLessonRaw {
  sectionId: string;
  sectionTitle: string;
  status: LessonStatus;
}

export interface SectionWithProgress {
  id: string;
  title: string;
  summary: string;
  lessons: LessonWithStatus[];
  completedCount: number;
  totalCount: number;
  totalMinutes: number;
  totalPoints: number;
}

function flattenLessons(sections: LearningPathSectionRaw[]) {
  return sections.flatMap((section) =>
    section.lessons.map((lesson) => ({
      ...lesson,
      sectionId: section.id,
      sectionTitle: section.title,
    }))
  );
}

/** Marca exatamente uma lição como "current" (a primeira não concluída); as seguintes ficam "locked". */
export function buildLessonStatuses(
  path: LearningPathRaw,
  completedIds: ReadonlySet<string>
): LessonWithStatus[] {
  let foundCurrent = false;
  return flattenLessons(path.sections).map((lesson) => {
    if (completedIds.has(lesson.id)) {
      return { ...lesson, status: "completed" as const };
    }
    if (!foundCurrent) {
      foundCurrent = true;
      return { ...lesson, status: "current" as const };
    }
    return { ...lesson, status: "locked" as const };
  });
}

export function groupSectionsWithProgress(
  path: LearningPathRaw,
  completedIds: ReadonlySet<string>
): SectionWithProgress[] {
  const statuses = buildLessonStatuses(path, completedIds);
  const bySection = new Map<string, LessonWithStatus[]>();
  for (const lesson of statuses) {
    const list = bySection.get(lesson.sectionId) ?? [];
    list.push(lesson);
    bySection.set(lesson.sectionId, list);
  }

  return path.sections.map((section) => {
    const lessons = bySection.get(section.id) ?? [];
    return {
      id: section.id,
      title: section.title,
      summary: section.summary,
      lessons,
      completedCount: lessons.filter((l) => l.status === "completed").length,
      totalCount: lessons.length,
      totalMinutes: lessons.reduce((sum, l) => sum + l.duration_min, 0),
      totalPoints: lessons.reduce((sum, l) => sum + l.points, 0),
    };
  });
}

export function getOverallProgress(sections: SectionWithProgress[]): {
  completed: number;
  total: number;
  percent: number;
} {
  const completed = sections.reduce((sum, s) => sum + s.completedCount, 0);
  const total = sections.reduce((sum, s) => sum + s.totalCount, 0);
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
  return { completed, total, percent };
}

/** Primeira lição "current"; se a trilha inteira estiver concluída, retorna a última. */
export function findCurrentLesson(
  statuses: LessonWithStatus[]
): LessonWithStatus | undefined {
  return statuses.find((l) => l.status === "current") ?? statuses.at(-1);
}

/** Primeiro parágrafo (não-título) do conteúdo, sem marcação — usado como resumo para o chat da Sofia. */
export function getLessonSummary(content: string): string {
  const blocks = content.trim().split(/\n\n+/);
  const paragraph = blocks.find((block) => !block.startsWith("## ")) ?? blocks[0] ?? "";
  return paragraph.replace(/\*\*/g, "");
}

export function findLessonNavigation(
  path: LearningPathRaw,
  completedIds: ReadonlySet<string>,
  lessonId: string
): {
  lesson: LessonWithStatus | undefined;
  index: number;
  prev: LessonWithStatus | undefined;
  next: LessonWithStatus | undefined;
  total: number;
} {
  const statuses = buildLessonStatuses(path, completedIds);
  const index = statuses.findIndex((l) => l.id === lessonId);
  return {
    lesson: index === -1 ? undefined : statuses[index],
    index,
    prev: index > 0 ? statuses[index - 1] : undefined,
    next: index !== -1 && index < statuses.length - 1 ? statuses[index + 1] : undefined,
    total: statuses.length,
  };
}
