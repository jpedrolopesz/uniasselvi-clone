import type { Metadata } from "next";
import { cookies } from "next/headers";
import { VoiceAssistantWindow } from "@/components/vitru/VoiceAssistantWindow";
import { resolveActiveUserId } from "@/lib/data/resolve-active-user";
import { loadDisciplines } from "@/lib/data/load-user-data";
import { SemanticSnapshotProvider } from "@/components/vitru/SemanticSnapshotProvider";
import { ThemeProvider, type AppTheme } from "@/components/layout/ThemeProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "AVA Simulado — UNIASSELVI",
  description: "Ambiente Virtual de Aprendizagem simulado com dados locais.",
};

// O layout depende do usuário ativo e do banco demonstrativo. Impede que o
// Next tente consultar o PGlite durante a geração estática do deploy.
export const dynamic = "force-dynamic";

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
            <VoiceAssistantWindow activeUserId={activeUserId} />
          </SemanticSnapshotProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
