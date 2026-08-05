import type { ReactNode } from "react";

interface PageContainerProps {
  children: ReactNode;
  /** Modo imersivo (ex.: leitor da trilha): sem padding, sem scroll próprio — quem renderiza dentro controla sua própria rolagem. */
  fullBleed?: boolean;
}

export function PageContainer({ children, fullBleed = false }: PageContainerProps) {
  if (fullBleed) {
    return <main className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</main>;
  }
  return <main className="flex-1 overflow-y-auto p-6 md:p-8">{children}</main>;
}
