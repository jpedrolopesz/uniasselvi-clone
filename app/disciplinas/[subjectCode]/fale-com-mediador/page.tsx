import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { SubpageHeader } from "@/components/layout/SubpageHeader";
import { MediatorRequestForm } from "@/components/mediador/MediatorRequestForm";
import type { MediatorDisciplineOption } from "@/components/mediador/MediatorRequestForm";
import { resolveActiveUserId } from "@/lib/data/resolve-active-user";
import { loadDisciplines, loadUserData } from "@/lib/data/load-user-data";
import { findDisciplineByCode, sortDisciplinesByProgress } from "@/lib/selectors/discipline-selectors";

export default async function MediatorRequestPage({
  params,
  searchParams,
}: {
  params: Promise<{ subjectCode: string }>;
  searchParams: Promise<{ u?: string | string[] }>;
}) {
  const { subjectCode } = await params;
  const { u } = await searchParams;
  const activeUserId = await resolveActiveUserId(u);

  const [disciplines, userData] = await Promise.all([
    loadDisciplines(activeUserId),
    loadUserData(activeUserId),
  ]);

  const discipline = disciplines ? findDisciplineByCode(disciplines, subjectCode) : undefined;
  if (!discipline) notFound();

  const disciplineOptions: MediatorDisciplineOption[] = sortDisciplinesByProgress(disciplines ?? []).map(
    (d) => ({
      code: d.code,
      description: d.description,
      mediatorLabel:
        typeof d.mediator === "object" && d.mediator
          ? `${d.mediator.person_name} (${d.mediator.specialization_code})`
          : null,
    })
  );

  return (
    <AppShell activeUserId={activeUserId}>
      <SubpageHeader
        title="Novo Atendimento"
        disciplineName="Atendimento Mediador"
        backHref={`/disciplinas/${subjectCode}`}
      />

      <MediatorRequestForm
        studentName={userData?.full_name ?? "-"}
        statusDescription={userData?.status_description ?? "-"}
        courseName={userData?.course_name ?? "-"}
        disciplines={disciplineOptions}
        initialSubjectCode={subjectCode}
        backHref={`/disciplinas/${subjectCode}`}
      />
    </AppShell>
  );
}
