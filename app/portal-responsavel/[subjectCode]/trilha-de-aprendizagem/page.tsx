import { notFound } from "next/navigation";
import { PortalHeader } from "@/components/content-portal/PortalHeader";
import { TrilhaEditor } from "@/components/content-portal/TrilhaEditor";
import { resolveActiveUserId } from "@/lib/data/resolve-active-user";
import { loadDisciplines } from "@/lib/data/load-user-data";
import { loadSubjectLearningPath } from "@/lib/data/load-subject-data";
import { findDisciplineByCode } from "@/lib/selectors/discipline-selectors";
import type { LearningPathRaw } from "@/lib/types/raw/learning-path";

export default async function PortalTrilhaPage({
  params,
  searchParams,
}: {
  params: Promise<{ subjectCode: string }>;
  searchParams: Promise<{ u?: string | string[] }>;
}) {
  const { subjectCode } = await params;
  const { u } = await searchParams;
  const activeUserId = await resolveActiveUserId(u);

  const [disciplines, learningPath] = await Promise.all([
    loadDisciplines(activeUserId),
    loadSubjectLearningPath(activeUserId, subjectCode),
  ]);

  const discipline = disciplines ? findDisciplineByCode(disciplines, subjectCode) : undefined;
  if (!discipline) notFound();

  const initialPath: LearningPathRaw = learningPath ?? {
    subject_code: subjectCode,
    title: discipline.description,
    subtitle: "Trilha de Aprendizagem",
    sections: [],
  };

  return (
    <div className="min-h-dvh bg-bg-app">
      <PortalHeader
        title={`Trilha de Aprendizagem — ${discipline.description}`}
        backHref="/portal-responsavel"
        activeUserId={activeUserId}
      />

      <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
        <TrilhaEditor
          userId={activeUserId}
          subjectCode={subjectCode}
          disciplineName={discipline.description}
          initialPath={initialPath}
        />
      </main>
    </div>
  );
}
