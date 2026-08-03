import { CalendarDay } from "@/components/calendar/CalendarDay";
import { buildMonthGrid, WEEKDAY_LABELS_PT } from "@/lib/selectors/calendar-selectors";

interface CalendarGridProps {
  year: number;
  month: number;
  markedDayKeys: Set<string>;
  selectedIsoDate: string | null;
  onSelectDay: (isoDate: string) => void;
}

export function CalendarGrid({
  year,
  month,
  markedDayKeys,
  selectedIsoDate,
  onSelectDay,
}: CalendarGridProps) {
  const cells = buildMonthGrid(year, month);

  return (
    <div className="rounded-lg bg-bg-card p-3">
      <div className="mb-1 grid grid-cols-7 gap-1 text-center text-xs text-text-secondary">
        {WEEKDAY_LABELS_PT.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((cell) => (
          <CalendarDay
            key={cell.isoDate}
            day={cell.day}
            isCurrentMonth={cell.isCurrentMonth}
            isMarked={markedDayKeys.has(cell.isoDate)}
            isSelected={cell.isoDate === selectedIsoDate}
            onSelect={() => onSelectDay(cell.isoDate)}
          />
        ))}
      </div>
    </div>
  );
}
