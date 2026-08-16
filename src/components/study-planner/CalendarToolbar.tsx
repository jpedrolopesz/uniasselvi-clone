import { PlusIcon } from "@/components/icons";
import type { StudyPlannerViewMode } from "@/components/study-planner/view-mode";

interface CalendarToolbarProps {
  viewMode: StudyPlannerViewMode;
  onChangeViewMode: (mode: StudyPlannerViewMode) => void;
  periodLabel: string;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onCreateActivity: () => void;
}

const VIEW_MODE_OPTIONS: { mode: StudyPlannerViewMode; label: string }[] = [
  { mode: "day", label: "Dia" },
  { mode: "week", label: "Semana" },
  { mode: "month", label: "Mês" },
];

export function CalendarToolbar({
  viewMode,
  onChangeViewMode,
  periodLabel,
  onPrev,
  onNext,
  onToday,
  onCreateActivity,
}: CalendarToolbarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle p-4">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onPrev}
            aria-label="Período anterior"
            className="rounded-full px-2.5 py-1 text-lg text-white hover:bg-bg-card-hover"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={onNext}
            aria-label="Próximo período"
            className="rounded-full px-2.5 py-1 text-lg text-white hover:bg-bg-card-hover"
          >
            ›
          </button>
        </div>
        <span className="text-sm font-semibold text-white capitalize">{periodLabel}</span>
        <button
          type="button"
          onClick={onToday}
          className="rounded-full border border-border-subtle px-3 py-1 text-xs font-medium text-text-secondary transition hover:bg-bg-card-hover hover:text-white"
        >
          Hoje
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div role="tablist" aria-label="Modo de visualização" className="flex rounded-full bg-bg-app p-1">
          {VIEW_MODE_OPTIONS.map((option) => (
            <button
              key={option.mode}
              type="button"
              role="tab"
              aria-selected={viewMode === option.mode}
              onClick={() => onChangeViewMode(option.mode)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                viewMode === option.mode
                  ? "bg-brand-yellow text-black"
                  : "text-text-secondary hover:text-white"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={onCreateActivity}
          className="flex items-center gap-1.5 rounded-full bg-brand-yellow px-4 py-1.5 text-xs font-semibold text-black transition hover:bg-brand-yellow-dark"
        >
          <PlusIcon className="h-3.5 w-3.5" />
          Nova atividade
        </button>
      </div>
    </div>
  );
}
