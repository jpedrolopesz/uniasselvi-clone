import { AppShell } from "@/components/layout/AppShell";
import { EmptyState } from "@/components/layout/EmptyState";
import { StudyPlannerView } from "@/components/study-planner/StudyPlannerView";
import { resolveActiveUserId } from "@/lib/data/resolve-active-user";
import { loadDisciplines } from "@/lib/data/load-user-data";
import { loadAllSubjectCalendarEvents } from "@/lib/data/load-study-planner-data";
import { buildSeedActivities } from "@/lib/study-planner/seed-activities";
import type { SubjectOption } from "@/lib/study-planner/ai-assistant";

export default async function StudyCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ u?: string | string[] }>;
}) {
  const { u } = await searchParams;
  const activeUserId = await resolveActiveUserId(u);

  const disciplines = await loadDisciplines(activeUserId);

  if (!disciplines) {
    return (
      <AppShell activeUserId={activeUserId} fullBleed>
        <div className="p-6">
          <EmptyState message="Nenhuma disciplina disponível para montar o calendário de estudos." />
        </div>
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
    <AppShell activeUserId={activeUserId} fullBleed>
      <StudyPlannerView seedActivities={seedActivities} subjects={subjects} />
    </AppShell>
  );
}
