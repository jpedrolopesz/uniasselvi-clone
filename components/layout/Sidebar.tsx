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

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <nav
        className={`fixed inset-y-0 left-0 z-40 flex w-64 shrink-0 flex-col gap-1 overflow-y-auto bg-bg-sidebar p-4 shadow-xl transition-transform duration-200 ease-in-out md:static md:z-auto md:w-56 md:translate-x-0 md:shadow-none ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar menu"
          className="mb-2 self-end text-text-secondary/80 transition hover:text-white md:hidden"
        >
          ✕
        </button>
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
    </>
  );
}
