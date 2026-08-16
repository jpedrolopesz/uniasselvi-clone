import type { ReactNode } from "react";
import { AppShellChrome } from "@/components/layout/AppShellChrome";
import { loadUserData } from "@/lib/data/load-user-data";
import type { VitruSemanticSnapshot } from "@/lib/vitru/semantic-snapshot";

interface AppShellProps {
  activeUserId: string;
  children: ReactNode;
  /** Modo imersivo (ex.: leitor da trilha): ocupa a altura da viewport, esconde a TabBar e deixa o conteúdo controlar sua própria rolagem. */
  fullBleed?: boolean;
  /** Exibe a navegação global como sidebar no desktop e barra inferior no mobile. */
  withSidebar?: boolean;
  vitruSnapshot?: VitruSemanticSnapshot | null;
}

/**
 * Composição de layout compartilhada por todas as páginas. Recebe o usuário
 * ativo já resolvido pela página (ver lib/data/resolve-active-user.ts) para
 * que o parâmetro `?u=` funcione mesmo na primeira renderização — layouts do
 * App Router não recebem searchParams.
 */
export async function AppShell({
  activeUserId,
  children,
  fullBleed = false,
  withSidebar = true,
  vitruSnapshot,
}: AppShellProps) {
  const userData = await loadUserData(activeUserId);

  return (
    <AppShellChrome
      activeUserId={activeUserId}
      fullName={userData?.full_name ?? "Aluno"}
      courseName={userData?.course_name ?? "-"}
      subscriptionCode={userData?.subscription_code ?? "-"}
      fullBleed={fullBleed}
      withSidebar={withSidebar}
      vitruSnapshot={vitruSnapshot}
    >
      {children}
    </AppShellChrome>
  );
}
