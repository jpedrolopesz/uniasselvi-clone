import type { Metadata } from "next";
import { cookies } from "next/headers";
import { AgentforceChat } from "@/components/agentforce/AgentforceChat";
import { resolveActiveUserId } from "@/lib/data/resolve-active-user";
import { loadDisciplines } from "@/lib/data/load-user-data";
import { SemanticSnapshotProvider } from "@/components/vitru/SemanticSnapshotProvider";
import { ThemeProvider, type AppTheme } from "@/components/layout/ThemeProvider";
import "./globals.css";

/** Força todas as páginas a serem dinâmicas (não pre-renderiza no build) */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Vitru AVA — Plataforma Anti-Evasão",
  description: "Ambiente Virtual de Aprendizagem com IA adaptativa e comunidade integrada.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const activeUserId = await resolveActiveUserId(undefined);
  const disciplines = await loadDisciplines(activeUserId);
  const storedTheme = (await cookies()).get("uniasselvi-theme")?.value;
  const theme: AppTheme = storedTheme === "light" ? "light" : "dark";

  return (
    <html lang="pt-BR" className="h-full antialiased" data-theme={theme} suppressHydrationWarning>
      <body className="flex min-h-full flex-col bg-bg-app text-text-primary">
        <ThemeProvider initialTheme={theme}>
          <SemanticSnapshotProvider disciplineDestinations={(disciplines ?? []).map(({ code, description }) => ({
            id: code, name: description, href: `/disciplinas/${code}`,
          }))}>
            {children}
            <AgentforceChat studentId={activeUserId} />
          </SemanticSnapshotProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
