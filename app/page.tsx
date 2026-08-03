import { AppShell } from "@/components/layout/AppShell";
import { SemesterHeader } from "@/components/home/SemesterHeader";
import { AcademicShortcuts } from "@/components/home/AcademicShortcuts";
import { DisciplineCarousel } from "@/components/home/DisciplineCarousel";
import { JourneyShortcuts } from "@/components/home/JourneyShortcuts";
import { RecoverySection } from "@/components/home/RecoverySection";
import { resolveActiveUserId } from "@/lib/data/resolve-active-user";
import { loadCurrentSemester, loadDisciplines, loadFinancialTitles } from "@/lib/data/load-user-data";
import { sortDisciplinesByProgress } from "@/lib/selectors/discipline-selectors";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ u?: string | string[] }>;
}) {
  const { u } = await searchParams;
  const activeUserId = await resolveActiveUserId(u);

  const [currentSemester, disciplinesRaw, financialTitles] = await Promise.all([
    loadCurrentSemester(activeUserId),
    loadDisciplines(activeUserId),
    loadFinancialTitles(activeUserId),
  ]);

  const disciplines = sortDisciplinesByProgress(disciplinesRaw ?? []);
  const primarySubject =
    disciplines.find((discipline) => discipline.current_subject === true) ?? disciplines[0];

  return (
    <AppShell activeUserId={activeUserId}>
      <div className="flex flex-col gap-8">
        <SemesterHeader semesterValue={currentSemester?.value ?? null} />
        <AcademicShortcuts primarySubjectCode={primarySubject?.code ?? null} />
        <DisciplineCarousel disciplines={disciplines} />
        <JourneyShortcuts />
        <RecoverySection financialTitles={financialTitles} />
      </div>
    </AppShell>
  );
}
