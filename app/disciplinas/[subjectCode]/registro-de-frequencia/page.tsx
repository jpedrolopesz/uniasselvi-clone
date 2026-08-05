import { AppShell } from "@/components/layout/AppShell";
import { SubpageHeader } from "@/components/layout/SubpageHeader";
import { EmptyState } from "@/components/layout/EmptyState";
import { AttendanceProgress } from "@/components/attendance/AttendanceProgress";
import { resolveActiveUserId } from "@/lib/data/resolve-active-user";
import { loadDisciplines } from "@/lib/data/load-user-data";
import { loadSubjectAttendances } from "@/lib/data/load-subject-data";
import { findDisciplineByCode } from "@/lib/selectors/discipline-selectors";
import { formatDateBr } from "@/lib/formatters/date-formatters";

export default async function AttendanceLogPage({
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

  const diary = attendances
    ? [...attendances.frequency_diary].sort((a, b) => b.event_date.localeCompare(a.event_date))
    : [];

  return (
    <AppShell activeUserId={activeUserId}>
      <SubpageHeader
        title="Registro de Frequência"
        disciplineName={discipline?.description ?? subjectCode}
        disciplineCode={subjectCode}
        backHref={`/disciplinas/${subjectCode}`}
      />

      {attendances === null ? (
        <EmptyState message="Nenhum dado de frequência disponível para esta disciplina." />
      ) : (
        <div className="flex flex-col gap-4">
          <AttendanceProgress frequency={attendances.frequency} />

          {diary.length === 0 ? (
            <EmptyState message="Nenhum registro de frequência encontrado para esta disciplina." />
          ) : (
            <div className="overflow-hidden rounded-lg bg-bg-card">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border-subtle text-xs uppercase text-text-secondary">
                    <th className="px-4 py-3 font-medium">Data</th>
                    <th className="px-4 py-3 font-medium">Turno</th>
                    <th className="px-4 py-3 font-medium">Situação</th>
                  </tr>
                </thead>
                <tbody>
                  {diary.map((entry) => {
                    const present = entry.attendance === "S";
                    return (
                      <tr key={entry.code} className="border-b border-border-subtle last:border-0">
                        <td className="px-4 py-3 text-white">{formatDateBr(entry.event_date)}</td>
                        <td className="px-4 py-3 text-text-secondary">{entry.turn}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                              present
                                ? "bg-accent-green/20 text-accent-green"
                                : "bg-accent-red/20 text-accent-red"
                            }`}
                          >
                            {present ? "Presente" : "Ausente"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </AppShell>
  );
}
