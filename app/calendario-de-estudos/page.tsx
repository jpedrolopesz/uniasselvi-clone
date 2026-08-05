import { AppShell } from "@/components/layout/AppShell";
import { SubpageHeader } from "@/components/layout/SubpageHeader";
import { EmptyState } from "@/components/layout/EmptyState";
import { StudyPlannerView } from "@/components/study-planner/StudyPlannerView";
import { resolveActiveUserId } from "@/lib/data/resolve-active-user";
import { loadDisciplines } from "@/lib/data/load-user-data";
import { loadAllSubjectCalendarEvents } from "@/lib/data/load-study-planner-data";
import { buildSeedActivities } from "@/lib/study-planner/seed-activities";
import { findDisciplineByCode } from "@/lib/selectors/discipline-selectors";
import type { SubjectOption } from "@/lib/study-planner/ai-assistant";

export default async function StudyCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ u?: string | string[]; subjectCode?: string | string[] }>;
}) {
  const { u, subjectCode } = await searchParams;
  const activeUserId = await resolveActiveUserId(u);
  const fromSubjectCode = Array.isArray(subjectCode) ? subjectCode[0] : subjectCode;

  const disciplines = await loadDisciplines(activeUserId);

  /** Se a página foi aberta a partir de uma disciplina (ver botão "Calendário de Estudos" em [subjectCode]/page.tsx), "Voltar" deve levar de volta a ela, não sempre para a home. */
  const fromDiscipline =
    fromSubjectCode && disciplines ? findDisciplineByCode(disciplines, fromSubjectCode) : undefined;
  const backHref = fromDiscipline ? `/disciplinas/${fromDiscipline.code}` : "/";

  if (!disciplines) {
    return (
      <AppShell activeUserId={activeUserId}>
        <SubpageHeader title="Calendário de Estudos" backHref={backHref} />
        <EmptyState message="Nenhuma disciplina disponível para montar o calendário de estudos." />
      </AppShell>
    );
  }

  const events = await loadAllSubjectCalendarEvents(activeUserId, disciplines);
  const seedActivities = buildSeedActivities(events);
  const subjects: SubjectOption[] = disciplines.map((discipline) => ({
    code: discipline.code,
    name: discipline.description,
  }));

  return (
    <AppShell activeUserId={activeUserId}>
      <SubpageHeader
        title="Calendário de Estudos"
        disciplineName={fromDiscipline?.description}
        disciplineCode={fromDiscipline?.code}
        backHref={backHref}
      />
      <StudyPlannerView seedActivities={seedActivities} subjects={subjects} />
    </AppShell>
  );
}
