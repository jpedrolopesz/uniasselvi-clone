import type { Metadata } from "next";
import { AgentforceChat } from "@/components/agentforce/AgentforceChat";
import { resolveActiveUserId } from "@/lib/data/resolve-active-user";
import "./globals.css";

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

  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className="flex min-h-full flex-col bg-bg-app text-text-primary">
        {children}
        <AgentforceChat studentId={activeUserId} />
      </body>
    </html>
  );
}
