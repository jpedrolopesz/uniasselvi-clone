interface CalendarDayProps {
  day: number;
  isCurrentMonth: boolean;
  isMarked: boolean;
  isSelected: boolean;
  onSelect: () => void;
  /** Dia sem opção de agendamento (fora da janela, no passado ou lotado) — não pode ser selecionado. */
  isDisabled?: boolean;
  ariaLabel?: string;
}

export function CalendarDay({
  day,
  isCurrentMonth,
  isMarked,
  isSelected,
  onSelect,
  isDisabled = false,
  ariaLabel,
}: CalendarDayProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={isDisabled}
      aria-pressed={isSelected}
      aria-disabled={isDisabled}
      aria-label={ariaLabel}
      className={[
        "relative flex h-10 w-full items-center justify-center rounded-md text-sm transition",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-cyan",
        isCurrentMonth ? "text-white" : "text-text-secondary/40",
        isDisabled
          ? "cursor-not-allowed text-text-secondary/30 line-through"
          : isSelected
            ? "bg-accent-cyan text-black font-semibold"
            : "hover:bg-bg-card-hover",
      ].join(" ")}
    >
      {day}
      {isMarked && !isDisabled && (
        <span className="absolute bottom-1 h-1.5 w-1.5 rounded-full bg-accent-red" aria-hidden="true" />
      )}
    </button>
  );
}
