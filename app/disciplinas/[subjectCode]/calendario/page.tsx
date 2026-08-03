import { AppShell } from "@/components/layout/AppShell";
import { SubpageHeader } from "@/components/layout/SubpageHeader";
import { EmptyState } from "@/components/layout/EmptyState";
import { SubjectCalendarView } from "@/components/calendar/SubjectCalendarView";
import { resolveActiveUserId } from "@/lib/data/resolve-active-user";
import { loadDisciplines } from "@/lib/data/load-user-data";
import { loadSubjectCalendarEvents } from "@/lib/data/load-subject-data";
import { findDisciplineByCode } from "@/lib/selectors/discipline-selectors";

export default async function SubjectCalendarPage({
  params,
  searchParams,
}: {
  params: Promise<{ subjectCode: string }>;
  searchParams: Promise<{ u?: string | string[] }>;
}) {
  const { subjectCode } = await params;
  const { u } = await searchParams;
  const activeUserId = await resolveActiveUserId(u);

  const [disciplines, events] = await Promise.all([
    loadDisciplines(activeUserId),
    loadSubjectCalendarEvents(activeUserId, subjectCode),
  ]);

  const discipline = disciplines ? findDisciplineByCode(disciplines, subjectCode) : undefined;

  return (
    <AppShell activeUserId={activeUserId}>
      <SubpageHeader
        title="Calendário"
        disciplineName={discipline?.description ?? subjectCode}
        disciplineCode={subjectCode}
        backHref={`/disciplinas/${subjectCode}`}
      />

      {events === null ? (
        <EmptyState message="Nenhum dado de calendário disponível para esta disciplina." />
      ) : (
        <SubjectCalendarView events={events} />
      )}
    </AppShell>
  );
}
