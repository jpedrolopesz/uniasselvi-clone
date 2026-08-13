import { AppShell } from "@/components/layout/AppShell";
import { SubpageHeader } from "@/components/layout/SubpageHeader";
import { EmptyState } from "@/components/layout/EmptyState";
import { AssessmentCard } from "@/components/assessments/AssessmentCard";
import { resolveActiveUserId } from "@/lib/data/resolve-active-user";
import { loadDisciplines } from "@/lib/data/load-user-data";
import { loadSubjectAssessments } from "@/lib/data/load-subject-data";
import { findDisciplineByCode } from "@/lib/selectors/discipline-selectors";
import { buildSemanticSnapshot } from "@/lib/vitru/adapters";

export default async function AssessmentsPage({
  params,
  searchParams,
}: {
  params: Promise<{ subjectCode: string }>;
  searchParams: Promise<{ u?: string | string[] }>;
}) {
  const { subjectCode } = await params;
  const { u } = await searchParams;
  const activeUserId = await resolveActiveUserId(u);

  const [disciplines, assessments] = await Promise.all([
    loadDisciplines(activeUserId),
    loadSubjectAssessments(activeUserId, subjectCode),
  ]);

  const discipline = disciplines ? findDisciplineByCode(disciplines, subjectCode) : undefined;
  const vitruSnapshot = buildSemanticSnapshot("assessments", {
    subject: { code: subjectCode, name: discipline?.description ?? subjectCode },
    assessments,
  });

  return (
    <AppShell activeUserId={activeUserId} vitruSnapshot={vitruSnapshot}>
      <SubpageHeader
        title="Notas e Avaliações"
        disciplineName={discipline?.description ?? subjectCode}
        disciplineCode={subjectCode}
        backHref={`/disciplinas/${subjectCode}`}
      />

      {assessments === null && (
        <EmptyState message="Nenhum dado de avaliações disponível para esta disciplina." />
      )}

      {assessments !== null && assessments.length === 0 && (
        <EmptyState message="Nenhuma avaliação encontrada para esta disciplina." />
      )}

      {assessments !== null && assessments.length > 0 && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {assessments.map((assessment) => (
              <AssessmentCard key={assessment.code} assessment={assessment} subjectCode={subjectCode} />
            ))}
          </div>

          <button
            type="button"
            disabled
            title="Disponível apenas quando houver notas publicadas"
            className="w-fit self-center rounded-full bg-bg-card px-5 py-2 text-sm font-semibold text-text-secondary/70 disabled:cursor-not-allowed"
          >
            Visualizar média
          </button>
        </div>
      )}
    </AppShell>
  );
}
