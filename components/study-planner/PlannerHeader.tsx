import Link from "next/link";
import { SparklesIcon } from "@/components/icons";

interface PlannerHeaderProps {
  onOpenAssistant: () => void;
}

export function PlannerHeader({ onOpenAssistant }: PlannerHeaderProps) {
  return (
    <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-border-subtle px-6 py-4">
      <div className="flex flex-col gap-1">
        <Link href="/" className="w-fit text-sm font-medium text-text-secondary transition hover:text-white">
          ‹ Voltar
        </Link>
        <h1 className="text-xl font-bold uppercase tracking-tight text-white">Calendário de Estudos</h1>
      </div>

      <button
        type="button"
        onClick={onOpenAssistant}
        className="flex items-center gap-2 rounded-full bg-bg-card px-4 py-2 text-sm font-medium text-white transition hover:bg-bg-card-hover lg:hidden"
      >
        <SparklesIcon className="h-4 w-4 text-brand-yellow" />
        Assistente Sofia
      </button>
    </div>
  );
}
