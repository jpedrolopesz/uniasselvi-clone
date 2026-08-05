import { AppShell } from "@/components/layout/AppShell";
import { EmptyState } from "@/components/layout/EmptyState";
import { LessonView } from "@/components/learning-path/LessonView";
import { resolveActiveUserId } from "@/lib/data/resolve-active-user";
import { loadDisciplines } from "@/lib/data/load-user-data";
import { loadSubjectLearningPath } from "@/lib/data/load-subject-data";
import { findDisciplineByCode } from "@/lib/selectors/discipline-selectors";

export default async function LearningPathLessonPage({
  params,
  searchParams,
}: {
  params: Promise<{ subjectCode: string; lessonCode: string }>;
  searchParams: Promise<{ u?: string | string[] }>;
}) {
  const { subjectCode, lessonCode } = await params;
  const { u } = await searchParams;
  const activeUserId = await resolveActiveUserId(u);

  const [disciplines, learningPath] = await Promise.all([
    loadDisciplines(activeUserId),
    loadSubjectLearningPath(activeUserId, subjectCode),
  ]);

  const discipline = disciplines ? findDisciplineByCode(disciplines, subjectCode) : undefined;

  return (
    <AppShell activeUserId={activeUserId}>
      {learningPath === null ? (
        <EmptyState message="A trilha de aprendizagem ainda não está disponível para esta disciplina." />
      ) : (
        <LessonView
          path={learningPath}
          subjectCode={subjectCode}
          lessonId={lessonCode}
          disciplineName={discipline?.description ?? subjectCode}
        />
      )}
    </AppShell>
  );
}
