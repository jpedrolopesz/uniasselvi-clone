import { AppShell } from "@/components/layout/AppShell";
import { resolveActiveUserId } from "@/lib/data/resolve-active-user";
import { RiskScoreDashboard } from "@/components/risk-score/RiskScoreDashboard";

export default async function RiscoPage({
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
          <h1 className="text-2xl font-bold text-text-primary">Score de Engajamento</h1>
          <p className="text-text-secondary mt-1">
            Acompanhe seu nível de engajamento e veja como melhorar.
          </p>
        </div>
        <RiskScoreDashboard studentId={activeUserId} />
      </div>
    </AppShell>
  );
}
