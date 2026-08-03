import type { ReactNode } from "react";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { PageContainer } from "@/components/layout/PageContainer";
import { UserSwitcher } from "@/components/dev/UserSwitcher";
import { loadUserData } from "@/lib/data/load-user-data";
import { loadUserIndex } from "@/lib/data/load-user-index";

interface AppShellProps {
  activeUserId: string;
  children: ReactNode;
}

/**
 * Composição de layout compartilhada por todas as páginas. Recebe o usuário
 * ativo já resolvido pela página (ver lib/data/resolve-active-user.ts) para
 * que o parâmetro `?u=` funcione mesmo na primeira renderização — layouts do
 * App Router não recebem searchParams.
 */
export async function AppShell({ activeUserId, children }: AppShellProps) {
  const [userData, userIndex] = await Promise.all([
    loadUserData(activeUserId),
    loadUserIndex(),
  ]);

  return (
    <div className="flex min-h-screen flex-col">
      <Header
        fullName={userData?.full_name ?? "Aluno"}
        courseName={userData?.course_name ?? "-"}
        subscriptionCode={userData?.subscription_code ?? "-"}
      />
      <div className="flex flex-1">
        <Sidebar />
        <PageContainer>{children}</PageContainer>
      </div>
      {process.env.NODE_ENV === "development" && (
        <UserSwitcher users={userIndex.users} activeUserId={activeUserId} />
      )}
    </div>
  );
}
