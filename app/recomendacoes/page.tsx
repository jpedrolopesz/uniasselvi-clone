import { AppShell } from "@/components/layout/AppShell";
import { resolveActiveUserId } from "@/lib/data/resolve-active-user";
import { StudyRecommendations } from "@/components/study-recommender/StudyRecommendations";

export default async function RecomendacoesPage({
  searchParams,
}: {
  searchParams: Promise<{ u?: string | string[] }>;
}) {
  const { u } = await searchParams;
  const activeUserId = await resolveActiveUserId(u);

  return (
    <AppShell activeUserId={activeUserId}>
      <div className="flex flex-col gap-6 py-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Recomendações de Estudo</h1>
          <p className="text-text-secondary mt-1">
            Plano personalizado baseado no seu perfil, prazos e estilo de aprendizagem.
          </p>
        </div>
        <StudyRecommendations studentId={activeUserId} />
      </div>
    </AppShell>
  );
}
