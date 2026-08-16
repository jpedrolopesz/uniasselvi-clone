import { AppShell } from "@/components/layout/AppShell";
import { EmptyState } from "@/components/layout/EmptyState";
import { LessonView } from "@/components/learning-path/LessonView";
import { resolveActiveUserId } from "@/lib/data/resolve-active-user";
import { loadDisciplines } from "@/lib/data/load-user-data";
import { loadSubjectLearningPath } from "@/lib/data/load-subject-data";
import { loadTrilhaProgress } from "@/lib/data/load-trilha-progress";
import { findDisciplineByCode } from "@/lib/selectors/discipline-selectors";
import { ensureWrongAnswerNudge } from "@/lib/vitru/wrong-answer-nudge";

export default async function LearningPathLessonPage({
  params,
  searchParams,
}: {
  params: Promise<{ subjectCode: string; lessonCode: string }>;
  searchParams: Promise<{ u?: string | string[]; entryEventId?: string | string[] }>;
}) {
  const { subjectCode, lessonCode } = await params;
  const { u, entryEventId } = await searchParams;
  const activeUserId = await resolveActiveUserId(u);

  const [disciplines, learningPath, progress] = await Promise.all([
    loadDisciplines(activeUserId),
    loadSubjectLearningPath(activeUserId, subjectCode),
    loadTrilhaProgress(activeUserId, subjectCode),
  ]);

  const discipline = disciplines ? findDisciplineByCode(disciplines, subjectCode) : undefined;

  const urlEntryEventId = Array.isArray(entryEventId) ? entryEventId[0] : entryEventId;
  // URL sempre tem prioridade (espaço para outros produtores futuros); só calcula o aviso de questão errada quando nada foi passado explicitamente.
  const currentLesson = learningPath
    ? learningPath.sections.flatMap((section) => section.lessons).find((lesson) => lesson.id === lessonCode)
    : undefined;
  const resolvedEntryEventId =
    urlEntryEventId ??
    (currentLesson
      ? ((await ensureWrongAnswerNudge(activeUserId, subjectCode, lessonCode, currentLesson.content)) ?? undefined)
      : undefined);

  return (
    <AppShell activeUserId={activeUserId} fullBleed>
      {learningPath === null ? (
        <div className="p-6">
          <EmptyState message="A trilha de aprendizagem ainda não está disponível para esta disciplina." />
        </div>
      ) : (
        <LessonView
          path={learningPath}
          subjectCode={subjectCode}
          lessonId={lessonCode}
          disciplineName={discipline?.description ?? subjectCode}
          userId={activeUserId}
          completedLessonIds={progress.completedLessonIds}
          marks={progress.marks}
          entryEventId={resolvedEntryEventId}
        />
      )}
    </AppShell>
  );
}
