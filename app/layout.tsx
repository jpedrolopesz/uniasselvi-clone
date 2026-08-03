import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AVA Simulado — UNIASSELVI",
  description: "Ambiente Virtual de Aprendizagem simulado com dados locais.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className="flex min-h-full flex-col bg-bg-app text-text-primary">
        {children}
      </body>
    </html>
  );
}
