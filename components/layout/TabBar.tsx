"use client";

import { usePathname } from "next/navigation";

const MENU_ITEMS = [
  "Semestres",
  "Meu Curso",
  "Estágio, Emprego e Práticas",
  "Biblioteca",
  "Comunicação",
  "Atendimento",
  "Financeiro",
  "Indicação Premiada",
  "Indica que Vai",
  "Emissão de Documentos",
  "Extensão",
];

/**
 * Navegação secundária horizontal (ex.: Semestres, Meu Curso...). Nenhum
 * endpoint foi identificado para essas seções ainda, então nenhuma navegação
 * real é criada (ver spec, seção 7) — os itens ficam desabilitados.
 * Só aparece na Home — nas páginas internas o Header sozinho já basta.
 */
export function TabBar() {
  const pathname = usePathname();
  if (pathname !== "/") return null;

  return (
    <div className="flex shrink-0 justify-start px-6 pt-4 pb-2">
      <nav
        className="flex max-w-full items-center gap-1 overflow-x-auto scrollbar-none rounded-full border border-border-subtle bg-bg-card p-1.5"
        aria-label="Navegação secundária"
      >
        {MENU_ITEMS.map((label) => (
          <button
            key={label}
            type="button"
            disabled
            title="Disponível em breve"
            className="shrink-0 cursor-not-allowed whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium text-text-secondary/80 transition hover:bg-bg-card-hover hover:text-white"
          >
            {label}
          </button>
        ))}
      </nav>
    </div>
  );
}
