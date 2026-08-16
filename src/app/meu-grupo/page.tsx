import { AppShell } from "@/components/layout/AppShell";
import { GroupChat } from "@/components/group/GroupChat";
import { WeeklyGoalsPanel } from "@/components/group/WeeklyGoalsPanel";
import { resolveActiveUserId } from "@/lib/data/resolve-active-user";

export default async function MeuGrupoPage({
  searchParams,
}: {
  searchParams: Promise<{ u?: string | string[] }>;
}) {
  const { u } = await searchParams;
  const activeUserId = await resolveActiveUserId(u);

  return (
    <AppShell activeUserId={activeUserId}>
      <h1 className="mb-1 text-xl font-bold uppercase tracking-tight text-white">Meu Grupo</h1>
      <p className="mb-6 text-sm text-text-secondary">
        Sua rede de apoio: tire dúvidas sobre a faculdade e sobre o curso com um veterano e com os
        outros calouros apadrinhados.
      </p>

      {/* Metas antes do chat no mobile: é o resumo da semana, e o chat é alto. */}
      <div className="flex flex-col gap-6 xl:flex-row-reverse xl:items-start">
        <aside className="w-full shrink-0 xl:w-80">
          <WeeklyGoalsPanel />
        </aside>
        <GroupChat />
      </div>
    </AppShell>
  );
}
