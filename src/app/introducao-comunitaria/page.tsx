import { resolveActiveUserId } from "@/lib/data/resolve-active-user";
import { AppShell } from "@/components/layout/AppShell";
import { CommunityIntroduction } from "./CommunityIntroduction";

export default async function CommunityIntroductionPage({
  searchParams,
}: {
  searchParams: Promise<{ u?: string | string[] }>;
}) {
  const { u } = await searchParams;
  const activeUserId = await resolveActiveUserId(u);

  return (
    <AppShell activeUserId={activeUserId} fullBleed withSidebar>
      <CommunityIntroduction activeUserId={activeUserId} />
    </AppShell>
  );
}
