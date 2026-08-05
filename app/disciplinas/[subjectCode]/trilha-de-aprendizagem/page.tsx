import { AppShell } from "@/components/layout/AppShell";
import { SubpageHeader } from "@/components/layout/SubpageHeader";
import { EmptyState } from "@/components/layout/EmptyState";
import { LearningPathView } from "@/components/learning-path/LearningPathView";
import { resolveActiveUserId } from "@/lib/data/resolve-active-user";
import { loadDisciplines } from "@/lib/data/load-user-data";
import { loadSubjectLearningPath } from "@/lib/data/load-subject-data";
import { findDisciplineByCode } from "@/lib/selectors/discipline-selectors";

export default async function LearningPathPage({
  params,
  searchParams,
}: {
  params: Promise<{ subjectCode: string }>;
  searchParams: Promise<{ u?: string | string[] }>;
}) {
  const { subjectCode } = await params;
  const { u } = await searchParams;
  const activeUserId = await resolveActiveUserId(u);

  const [disciplines, learningPath] = await Promise.all([
    loadDisciplines(activeUserId),
    loadSubjectLearningPath(activeUserId, subjectCode),
  ]);

  const discipline = disciplines ? findDisciplineByCode(disciplines, subjectCode) : undefined;

  return (
    <AppShell activeUserId={activeUserId}>
      <SubpageHeader
        title="Trilha de Aprendizagem"
        disciplineName={discipline?.description ?? subjectCode}
        disciplineCode={subjectCode}
        backHref={`/disciplinas/${subjectCode}`}
      />

      {learningPath === null ? (
        <EmptyState message="A trilha de aprendizagem ainda não está disponível para esta disciplina." />
      ) : (
        <LearningPathView path={learningPath} subjectCode={subjectCode} />
      )}
    </AppShell>
  );
}
