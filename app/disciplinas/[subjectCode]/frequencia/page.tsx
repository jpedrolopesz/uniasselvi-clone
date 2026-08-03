import { AppShell } from "@/components/layout/AppShell";
import { SubpageHeader } from "@/components/layout/SubpageHeader";
import { EmptyState } from "@/components/layout/EmptyState";
import { AttendanceCalendar } from "@/components/attendance/AttendanceCalendar";
import { AttendanceProgress } from "@/components/attendance/AttendanceProgress";
import { resolveActiveUserId } from "@/lib/data/resolve-active-user";
import { loadDisciplines } from "@/lib/data/load-user-data";
import { loadSubjectAttendances } from "@/lib/data/load-subject-data";
import { findDisciplineByCode } from "@/lib/selectors/discipline-selectors";

export default async function AttendancePage({
  params,
  searchParams,
}: {
  params: Promise<{ subjectCode: string }>;
  searchParams: Promise<{ u?: string | string[] }>;
}) {
  const { subjectCode } = await params;
  const { u } = await searchParams;
  const activeUserId = await resolveActiveUserId(u);

  const [disciplines, attendances] = await Promise.all([
    loadDisciplines(activeUserId),
    loadSubjectAttendances(activeUserId, subjectCode),
  ]);

  const discipline = disciplines ? findDisciplineByCode(disciplines, subjectCode) : undefined;

  return (
    <AppShell activeUserId={activeUserId}>
      <SubpageHeader
        title="Calendário de Frequência"
        disciplineName={discipline?.description ?? subjectCode}
        disciplineCode={subjectCode}
        backHref={`/disciplinas/${subjectCode}`}
      />

      {attendances === null ? (
        <EmptyState message="Nenhum dado de frequência disponível para esta disciplina." />
      ) : (
        <div className="flex flex-col gap-4">
          <AttendanceProgress frequency={attendances.frequency} />
          <AttendanceCalendar attendances={attendances} />
        </div>
      )}
    </AppShell>
  );
}
