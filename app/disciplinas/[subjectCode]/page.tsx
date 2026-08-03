import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { EmptyState } from "@/components/layout/EmptyState";
import { RecordedClassesModal } from "@/components/recordings/RecordedClassesModal";
import { resolveActiveUserId } from "@/lib/data/resolve-active-user";
import { loadDisciplines } from "@/lib/data/load-user-data";
import { loadSubjectRecordings } from "@/lib/data/load-subject-data";
import { findDisciplineByCode } from "@/lib/selectors/discipline-selectors";
import { formatDateBr } from "@/lib/formatters/date-formatters";

export default async function DisciplinePage({
  params,
  searchParams,
}: {
  params: Promise<{ subjectCode: string }>;
  searchParams: Promise<{ u?: string | string[] }>;
}) {
  const { subjectCode } = await params;
  const { u } = await searchParams;
  const activeUserId = await resolveActiveUserId(u);

  const [disciplines, recordings] = await Promise.all([
    loadDisciplines(activeUserId),
    loadSubjectRecordings(activeUserId, subjectCode),
  ]);

  const discipline = disciplines ? findDisciplineByCode(disciplines, subjectCode) : undefined;

  return (
    <AppShell activeUserId={activeUserId}>
      <Link
        href="/"
        className="mb-6 inline-block w-fit text-sm font-medium text-text-secondary transition hover:text-white"
      >
        ‹ Voltar
      </Link>

      {!discipline ? (
        <EmptyState message={`Disciplina "${subjectCode}" não encontrada para este usuário.`} />
      ) : (
        <div className="flex flex-col gap-6">
          <div>
            <span className="rounded bg-black/40 px-2 py-0.5 text-xs font-semibold text-brand-yellow">
              {discipline.code}
            </span>
            <h1 className="mt-2 text-2xl font-bold text-white">{discipline.description}</h1>
            <p className="mt-1 text-sm text-text-secondary">
              {discipline.offer_type_description} · {formatDateBr(discipline.begin_date)} a{" "}
              {formatDateBr(discipline.end_date)}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={`/disciplinas/${discipline.code}/calendario`}
              className="rounded-full bg-bg-card px-4 py-2 text-sm font-medium text-white transition hover:bg-bg-card-hover"
            >
              Calendário
            </Link>
            <Link
              href={`/disciplinas/${discipline.code}/notas-avaliacoes`}
              className="rounded-full bg-bg-card px-4 py-2 text-sm font-medium text-white transition hover:bg-bg-card-hover"
            >
              Notas e Avaliações
            </Link>
            <Link
              href={`/disciplinas/${discipline.code}/frequencia`}
              className="rounded-full bg-bg-card px-4 py-2 text-sm font-medium text-white transition hover:bg-bg-card-hover"
            >
              Calendário de Frequência
            </Link>
            <RecordedClassesModal recordings={recordings} />
          </div>
        </div>
      )}
    </AppShell>
  );
}
