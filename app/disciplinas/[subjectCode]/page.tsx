import Link from "next/link";
import Image from "next/image";
import { AppShell } from "@/components/layout/AppShell";
import { EmptyState } from "@/components/layout/EmptyState";
import { RecordedClassesModal } from "@/components/recordings/RecordedClassesModal";
import { DisciplineMoreInfo } from "@/components/discipline/DisciplineMoreInfo";
import { resolveActiveUserId } from "@/lib/data/resolve-active-user";
import { loadDisciplines, loadUserData } from "@/lib/data/load-user-data";
import {
  loadSubjectAssessments,
  loadSubjectAttendances,
  loadSubjectRecordings,
} from "@/lib/data/load-subject-data";
import { findDisciplineByCode, getDisciplineHeroImageSrc } from "@/lib/selectors/discipline-selectors";
import { formatDateBr } from "@/lib/formatters/date-formatters";
import { formatPercent } from "@/lib/formatters/number-formatters";
import {
  BookOpenIcon,
  CalendarIcon,
  ChevronRightIcon,
  ClockIcon,
  PlayCircleIcon,
  TargetIcon,
} from "@/components/icons";
import { buildSemanticSnapshot } from "@/lib/vitru/adapters";

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

  const [disciplines, userData, recordings, assessments, attendances] = await Promise.all([
    loadDisciplines(activeUserId),
    loadUserData(activeUserId),
    loadSubjectRecordings(activeUserId, subjectCode),
    loadSubjectAssessments(activeUserId, subjectCode),
    loadSubjectAttendances(activeUserId, subjectCode),
  ]);

  const discipline = disciplines ? findDisciplineByCode(disciplines, subjectCode) : undefined;

  if (!discipline) {
    return (
      <AppShell activeUserId={activeUserId}>
        <Link
          href="/"
          className="mb-6 inline-block w-fit text-sm font-medium text-text-secondary transition hover:text-white"
        >
          ‹ Voltar
        </Link>
        <EmptyState message={`Disciplina "${subjectCode}" não encontrada para este usuário.`} />
      </AppShell>
    );
  }

  const frequency = attendances?.frequency;
  const schedule = discipline.desc_week_day || discipline.meet_type;
  const heroImageSrc = getDisciplineHeroImageSrc(activeUserId, discipline.code);
  const instructor =
    (typeof discipline.mediator === "object" && discipline.mediator?.person_name) ||
    (typeof discipline.regent === "object" && discipline.regent?.person_name) ||
    undefined;
  const vitruSnapshot = buildSemanticSnapshot("discipline", {
    discipline,
    recordings,
    assessments,
    frequency,
  });

  return (
    <AppShell activeUserId={activeUserId} vitruSnapshot={vitruSnapshot}>
      <div className="flex flex-col gap-6">
        <nav
          aria-label="Breadcrumb"
          className="flex w-fit flex-wrap items-center gap-1.5 rounded-full border border-border-subtle bg-bg-card px-4 py-2 text-sm"
        >
          <Link href="/" className="text-text-secondary transition hover:text-white">
            Disciplinas
          </Link>
          <ChevronRightIcon className="h-3.5 w-3.5 text-text-secondary" />
          <span className="text-text-secondary">{userData?.course_name ?? "Curso"}</span>
          <ChevronRightIcon className="h-3.5 w-3.5 text-text-secondary" />
          <span className="font-semibold text-white">{discipline.description}</span>
        </nav>

        <div data-vitru-id={`discipline:${discipline.code}`} className="grid gap-10 rounded-3xl bg-bg-card p-6 md:p-10 lg:grid-cols-[1.4fr_1fr] lg:items-center">
          <div className="flex flex-col gap-5">
            <div className="flex flex-wrap items-center gap-2">
              
              <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-black/40 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand-yellow">
                <BookOpenIcon className="h-3.5 w-3.5" />
                {discipline.offer_type_description}
              </span>
             
              {discipline.current_subject === true && (
                <span className="rounded-full bg-accent-green/20 px-3 py-1 text-xs font-semibold uppercase text-accent-green">
                  Em andamento
                </span>
              )}
            </div>

            <h1 className="text-3xl font-bold leading-tight text-white md:text-5xl">
              {discipline.description}
            </h1>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-text-secondary">
              <span className="inline-flex items-center gap-1.5">
                <PlayCircleIcon className="h-4 w-4" />
                {recordings?.length ?? 0} aulas gravadas
              </span>
              <span className="text-border-subtle">•</span>
              <span className="inline-flex items-center gap-1.5">
                <TargetIcon className="h-4 w-4" />
                {assessments?.length ?? 0} avaliações
              </span>
              {schedule && (
                <>
                  <span className="text-border-subtle">•</span>
                  <span className="inline-flex items-center gap-1.5">
                    <ClockIcon className="h-4 w-4" />
                    {schedule}
                  </span>
                </>
              )}
            </div>

            <p className="max-w-2xl text-sm leading-relaxed text-text-secondary">
              Disciplina {discipline.code}
              {instructor ? `, conduzida por ${instructor}` : ""}. Vigência de{" "}
              {formatDateBr(discipline.begin_date)} a {formatDateBr(discipline.end_date)}
              {discipline.class ? ` — turma ${discipline.class}` : ""}.
            </p>

            {discipline.class && (
              <span className="inline-flex w-fit items-center gap-1.5 rounded-lg border border-border-subtle bg-black/30 px-3 py-1.5 text-xs font-medium text-text-secondary">
                <TargetIcon className="h-3.5 w-3.5" />
                Turma {discipline.class}
              </span>
            )}

            <div className="mt-1 flex flex-wrap items-center gap-3">
              
              <Link
                data-vitru-id={`discipline:${discipline.code}:learning-path`}
                href={`/disciplinas/${discipline.code}/trilha-de-aprendizagem`}
                className="rounded-full border border-border-subtle px-6 py-3 text-sm font-semibold text-white transition hover:bg-yellow-300/75"
              >
                Trilha de aprendizagem
              </Link>
            <Link
            data-vitru-id={`discipline:${discipline.code}:assessments`}
            href={`/disciplinas/${discipline.code}/notas-avaliacoes`}
            className="rounded-full border border-border-subtle bg-bg-card px-5 py-2.5 text-sm font-medium text-white transition hover:bg-bg-yellow-hover"
          >
            Notas e avaliações
          </Link>

              <RecordedClassesModal recordings={recordings} subjectCode={discipline.code} />

               <Link
            data-vitru-id={`discipline:${discipline.code}:attendance`}
            href={`/disciplinas/${discipline.code}/registro-de-frequencia`}
            className="rounded-full border border-border-subtle bg-bg-card px-5 py-2.5 text-sm font-medium text-white transition hover:bg-bg-card-hover"
          >
            Registro de Frequência
          </Link>

              <Link
                data-vitru-id={`discipline:${discipline.code}:study-calendar`}
                href={`/calendario-de-estudos?subjectCode=${discipline.code}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-border-subtle bg-bg-card px-5 py-2.5 text-sm font-medium text-white transition hover:bg-bg-card-hover"
              >
                <CalendarIcon className="h-4 w-4" />
                Calendário de Estudos
              </Link>
            </div>

            {frequency !== undefined && (
              <div className="mt-1 max-w-md">
                <div className="flex items-center gap-3 text-xs text-text-secondary">
                  <span className="font-semibold text-white">{formatPercent(frequency)}</span>
                  <div className="h-1.5 w-full rounded-full bg-black/40">
                    <div
                      className="h-1.5 rounded-full bg-brand-yellow"
                      style={{ width: `${Math.min(100, Math.max(0, frequency))}%` }}
                    />
                  </div>
                </div>
                <span className="mt-1 block text-xs text-text-secondary">Frequência</span>
              </div>
            )}
          </div>

          <div className="relative hidden aspect-[3/3] items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-brand-yellow/15 via-black to-bg-card lg:flex">
            {heroImageSrc ? (
              <Image
                src={heroImageSrc}
                alt={discipline.description}
                fill
                className="object-fill"
                priority
              />
            ) : (
              <>
                <span className="text-7xl font-black tracking-tight text-brand-yellow/25">
                  {discipline.code}
                </span>
                <BookOpenIcon className="absolute h-20 w-20 text-brand-yellow/60" />
              </>
            )}
          </div>
        </div>

        <DisciplineMoreInfo subjectCode={discipline.code} />
      </div>
    </AppShell>
  );
}
