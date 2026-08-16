import type { CalendarEventRaw } from "@/lib/types/raw/calendar-events";
import { formatDateBr } from "@/lib/formatters/date-formatters";
import { formatHourMinute } from "@/lib/formatters/time-formatters";

interface EventsPanelProps {
  selectedIsoDate: string | null;
  events: CalendarEventRaw[];
}

export function EventsPanel({ selectedIsoDate, events }: EventsPanelProps) {
  if (!selectedIsoDate) {
    return (
      <p className="rounded-lg bg-bg-card p-4 text-sm text-text-secondary">
        Selecione uma data para ver os eventos.
      </p>
    );
  }

  if (events.length === 0) {
    return (
      <div className="rounded-lg bg-bg-card p-4">
        <p className="text-sm font-semibold text-white">{formatDateBr(selectedIsoDate)}</p>
        <p className="mt-1 text-sm text-text-secondary">Não há eventos neste dia.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg bg-bg-card p-4">
      <p className="text-sm font-semibold text-white">{formatDateBr(selectedIsoDate)}</p>
      {events.map((event) => (
        <div key={event.code} className="rounded-md bg-bg-app p-3">
          <p className="text-sm text-white">{event.description}</p>
          <p className="mt-1 text-xs text-text-secondary">
            {formatHourMinute(event.begin_hour)} — {formatHourMinute(event.end_hour)}
          </p>
        </div>
      ))}
    </div>
  );
}
