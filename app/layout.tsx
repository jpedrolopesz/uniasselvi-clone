import type { Metadata } from "next";
import { VoiceAssistantWindow } from "@/components/vitru/VoiceAssistantWindow";
import { resolveActiveUserId } from "@/lib/data/resolve-active-user";
import "./globals.css";

export const metadata: Metadata = {
  title: "AVA Simulado — UNIASSELVI",
  description: "Ambiente Virtual de Aprendizagem simulado com dados locais.",
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
        <VoiceAssistantWindow activeUserId={activeUserId} />
      </body>
    </html>
  );
}
