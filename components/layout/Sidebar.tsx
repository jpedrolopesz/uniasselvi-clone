import type { SVGProps } from "react";
import {
  BookOpenIcon,
  BriefcaseIcon,
  CalendarIcon,
  ChevronRightIcon,
  FileTextIcon,
  GiftIcon,
  GlobeIcon,
  HeadsetIcon,
  LibraryIcon,
  MegaphoneIcon,
  MessageIcon,
  WalletIcon,
} from "@/components/icons";

/**
 * Itens puramente visuais — nenhum endpoint foi identificado para essas
 * seções ainda, então nenhuma navegação real é criada (ver spec, seção 7).
 */
const MENU_ITEMS: { label: string; icon: (props: SVGProps<SVGSVGElement>) => React.JSX.Element }[] = [
  { label: "Semestres", icon: CalendarIcon },
  { label: "Meu Curso", icon: BookOpenIcon },
  { label: "Estágio, Emprego e Práticas", icon: BriefcaseIcon },
  { label: "Biblioteca", icon: LibraryIcon },
  { label: "Comunicação", icon: MessageIcon },
  { label: "Atendimento", icon: HeadsetIcon },
  { label: "Financeiro", icon: WalletIcon },
  { label: "Indicação Premiada", icon: GiftIcon },
  { label: "Indica que Vai", icon: MegaphoneIcon },
  { label: "Emissão de Documentos", icon: FileTextIcon },
  { label: "Extensão", icon: GlobeIcon },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isCollapsed: boolean;
  onToggleCollapsed: () => void;
}

export function Sidebar({ isOpen, onClose, isCollapsed, onToggleCollapsed }: SidebarProps) {
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
        className={`fixed inset-y-0 left-0 z-40 flex w-64 shrink-0 flex-col gap-1 overflow-y-auto overflow-x-hidden bg-bg-sidebar p-4 shadow-xl transition-transform duration-200 ease-in-out md:static md:z-auto md:translate-x-0 md:shadow-none md:transition-[width,padding] ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } ${isCollapsed ? "md:w-20 md:px-2" : "md:w-56"}`}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar menu"
          className="mb-2 self-end text-text-secondary/80 transition hover:text-white md:hidden"
        >
          ✕
        </button>

        <button
          type="button"
          onClick={onToggleCollapsed}
          aria-label={isCollapsed ? "Expandir menu" : "Recolher menu"}
          aria-pressed={isCollapsed}
          title={isCollapsed ? "Expandir menu" : "Recolher menu"}
          className={`mb-2 hidden shrink-0 items-center gap-2 rounded-md border border-border-subtle px-3 py-2 text-sm font-medium text-text-secondary/80 transition hover:bg-bg-card-hover hover:text-white md:flex ${
            isCollapsed ? "justify-center" : ""
          }`}
        >
          <ChevronRightIcon className={`h-4 w-4 shrink-0 transition-transform ${isCollapsed ? "" : "rotate-180"}`} />
          <span className={isCollapsed ? "hidden" : ""}>Recolher menu</span>
        </button>

        {MENU_ITEMS.map(({ label, icon: Icon }) => (
          <button
            key={label}
            type="button"
            disabled
            title={isCollapsed ? label : "Disponível em breve"}
            className={`flex items-center gap-3 rounded-md px-3 py-2 text-left text-sm text-text-secondary/80 transition disabled:cursor-not-allowed hover:not-disabled:bg-bg-card-hover hover:not-disabled:text-white ${
              isCollapsed ? "md:justify-center md:px-2" : ""
            }`}
          >
            <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
            <span className={isCollapsed ? "md:hidden" : ""}>{label}</span>
          </button>
        ))}
      </nav>
    </>
  );
}
