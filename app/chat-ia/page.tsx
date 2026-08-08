import { AppShell } from "@/components/layout/AppShell";
import { EmptyState } from "@/components/layout/EmptyState";
import { resolveActiveUserId } from "@/lib/data/resolve-active-user";

export default async function ChatIaPage({
  searchParams,
}: {
  searchParams: Promise<{ u?: string | string[] }>;
}) {
  const { u } = await searchParams;
  const activeUserId = await resolveActiveUserId(u);

  return (
    <AppShell activeUserId={activeUserId}>
      <h1 className="mb-6 text-xl font-bold uppercase tracking-tight text-white">Chat IA</h1>
      <EmptyState message="Em breve." />
    </AppShell>
  );
}
