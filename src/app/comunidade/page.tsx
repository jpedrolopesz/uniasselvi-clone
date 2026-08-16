import { resolveActiveUserId } from "@/lib/data/resolve-active-user";
import { loadUserData } from "@/lib/data/load-user-data";
import { AppShell } from "@/components/layout/AppShell";
import { NewCommunity } from "./NewCommunity";

export default async function NewCommunityPage({
  searchParams,
}: {
  searchParams: Promise<{ u?: string | string[]; presentation?: string | string[] }>;
}) {
  const { u, presentation } = await searchParams;
  const activeUserId = await resolveActiveUserId(u);
  const user = await loadUserData(activeUserId);
  const isEmbeddedPresentation = (Array.isArray(presentation) ? presentation[0] : presentation) === "1";

  return (
    <AppShell activeUserId={activeUserId} fullBleed withSidebar={!isEmbeddedPresentation}>
      <NewCommunity
        user={{
          firstName: user?.first_name || user?.full_name?.split(" ")[0] || "Lucas",
          fullName: user?.full_name || "Lucas Martins",
          course: user?.course_name || "Ciência da Computação",
        }}
      />
    </AppShell>
  );
}
