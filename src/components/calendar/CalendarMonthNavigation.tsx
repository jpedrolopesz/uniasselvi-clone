interface CalendarMonthNavigationProps {
  label: string;
  onPrev: () => void;
  onNext: () => void;
}

export function CalendarMonthNavigation({ label, onPrev, onNext }: CalendarMonthNavigationProps) {
  return (
    <div className="flex items-center justify-between">
      <button
        type="button"
        onClick={onPrev}
        aria-label="Mês anterior"
        className="rounded-full px-3 py-1 text-lg text-white hover:bg-bg-card-hover"
      >
        ‹
      </button>
      <span className="text-sm font-semibold text-white">{label}</span>
      <button
        type="button"
        onClick={onNext}
        aria-label="Próximo mês"
        className="rounded-full px-3 py-1 text-lg text-white hover:bg-bg-card-hover"
      >
        ›
      </button>
    </div>
  );
}
