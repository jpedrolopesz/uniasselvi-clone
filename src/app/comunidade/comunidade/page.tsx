import { AppShell } from "@/components/layout/AppShell";
import { resolveActiveUserId } from "@/lib/data/resolve-active-user";
import { CommunityHub } from "@/components/community/CommunityHub";

export default async function ComunidadePage({
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
          <h1 className="text-2xl font-bold text-text-primary">Hub de Comunidade</h1>
          <p className="text-text-secondary mt-1">
            Conecte-se com colegas, participe de grupos e construa sua rede.
          </p>
        </div>
        <CommunityHub studentId={activeUserId} />
      </div>
    </AppShell>
  );
}
