import { AppShell } from "@/components/layout/AppShell";
import { CommunityFeed } from "@/components/community/CommunityFeed";
import { resolveActiveUserId } from "@/lib/data/resolve-active-user";

export default async function ComunidadePage({
  searchParams,
}: {
  searchParams: Promise<{ u?: string | string[] }>;
}) {
  const { u } = await searchParams;
  const activeUserId = await resolveActiveUserId(u);

  return (
    <AppShell activeUserId={activeUserId}>
      <h1 className="mb-1 text-xl font-bold uppercase tracking-tight text-white">Comunidade</h1>
      <p className="mb-6 text-sm text-text-secondary">
        Dúvidas, materiais e discussões das suas disciplinas.
      </p>
      <CommunityFeed />
    </AppShell>
  );
}
