/**
 * Itens puramente visuais — nenhum endpoint foi identificado para essas
 * seções ainda, então nenhuma navegação real é criada (ver spec, seção 7).
 */
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

export function Sidebar() {
  return (
    <nav className="hidden w-56 shrink-0 flex-col gap-1 bg-bg-sidebar p-4 md:flex">
      {MENU_ITEMS.map((item) => (
        <button
          key={item}
          type="button"
          disabled
          title="Disponível em breve"
          className="rounded-md px-3 py-2 text-left text-sm text-text-secondary/80 transition disabled:cursor-not-allowed hover:not-disabled:bg-bg-card-hover hover:not-disabled:text-white"
        >
          {item}
        </button>
      ))}
    </nav>
  );
}
