import { resolveActiveUserId } from "@/lib/data/resolve-active-user";
import { loadDisciplines, loadUserData } from "@/lib/data/load-user-data";
import { sortDisciplinesByProgress } from "@/lib/selectors/discipline-selectors";
import { AppShell } from "@/components/layout/AppShell";
import { CampusVirtualClient } from "./CampusVirtualClient";

export default async function CampusVitruNovoPage({
  searchParams,
}: {
  searchParams: Promise<{ u?: string | string[]; presentation?: string | string[] }>;
}) {
  const { u, presentation } = await searchParams;
  const activeUserId = await resolveActiveUserId(u);
  const isEmbeddedPresentation = (Array.isArray(presentation) ? presentation[0] : presentation) === "1";
  const [user, disciplinesRaw] = await Promise.all([
    loadUserData(activeUserId),
    loadDisciplines(activeUserId),
  ]);

  const disciplines = sortDisciplinesByProgress(disciplinesRaw ?? []).map((discipline) => {
    const mediator = typeof discipline.mediator === "object" ? discipline.mediator : null;
    const regent = typeof discipline.regent === "object" ? discipline.regent : null;
    return {
      code: discipline.code,
      name: discipline.description,
      schedule: discipline.agroupment_period || discipline.desc_week_day || "Online",
      instructor: mediator?.person_name || regent?.person_name || "Equipe acadêmica",
      current: discipline.current_subject,
    };
  });

  return (
    <AppShell activeUserId={activeUserId} fullBleed withSidebar={!isEmbeddedPresentation}>
      <CampusVirtualClient
        activeUserId={activeUserId}
        user={{
          firstName: user?.first_name || user?.full_name?.split(" ")[0] || "Aluno",
          fullName: user?.full_name || "Aluno",
          courseName: user?.course_name || "Graduação",
        }}
        disciplines={disciplines}
      />
    </AppShell>
  );
}
