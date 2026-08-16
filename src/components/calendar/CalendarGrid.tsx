import { CalendarDay } from "@/components/calendar/CalendarDay";
import { buildMonthGrid, WEEKDAY_LABELS_PT } from "@/lib/selectors/calendar-selectors";

interface CalendarGridProps {
  year: number;
  month: number;
  markedDayKeys: Set<string>;
  selectedIsoDate: string | null;
  onSelectDay: (isoDate: string) => void;
  /** Dias sem opção de agendamento (fora da janela, no passado ou lotados) — desabilitados, nunca selecionáveis. */
  disabledDayKeys?: Set<string>;
  dayAriaLabel?: (isoDate: string, day: number, isDisabled: boolean) => string;
}

const EMPTY_DISABLED_KEYS: Set<string> = new Set();

export function CalendarGrid({
  year,
  month,
  markedDayKeys,
  selectedIsoDate,
  onSelectDay,
  disabledDayKeys = EMPTY_DISABLED_KEYS,
  dayAriaLabel,
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
        {cells.map((cell) => {
          const isDisabled = disabledDayKeys.has(cell.isoDate);
          return (
            <CalendarDay
              key={cell.isoDate}
              day={cell.day}
              isCurrentMonth={cell.isCurrentMonth}
              isMarked={markedDayKeys.has(cell.isoDate)}
              isSelected={cell.isoDate === selectedIsoDate}
              isDisabled={isDisabled}
              ariaLabel={dayAriaLabel?.(cell.isoDate, cell.day, isDisabled)}
              onSelect={() => {
                if (!isDisabled) onSelectDay(cell.isoDate);
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
