interface CalendarDayProps {
  day: number;
  isCurrentMonth: boolean;
  isMarked: boolean;
  isSelected: boolean;
  onSelect: () => void;
}

export function CalendarDay({ day, isCurrentMonth, isMarked, isSelected, onSelect }: CalendarDayProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={[
        "relative flex h-10 w-full items-center justify-center rounded-md text-sm transition",
        isCurrentMonth ? "text-white" : "text-text-secondary/40",
        isSelected ? "bg-accent-cyan text-black font-semibold" : "hover:bg-bg-card-hover",
      ].join(" ")}
    >
      {day}
      {isMarked && (
        <span className="absolute bottom-1 h-1.5 w-1.5 rounded-full bg-accent-red" aria-hidden="true" />
      )}
    </button>
  );
}
