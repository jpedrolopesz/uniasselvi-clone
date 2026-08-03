"use client";

import { useMemo, useState } from "react";
import { CalendarGrid } from "@/components/calendar/CalendarGrid";
import { CalendarMonthNavigation } from "@/components/calendar/CalendarMonthNavigation";
import { EventsPanel } from "@/components/calendar/EventsPanel";
import type { CalendarEventRaw } from "@/lib/types/raw/calendar-events";
import { getEventsForDay, getMarkedDayKeys, MONTH_LABELS_PT } from "@/lib/selectors/calendar-selectors";

export function SubjectCalendarView({ events }: { events: CalendarEventRaw[] }) {
  const now = new Date();
  const [year, setYear] = useState(now.getUTCFullYear());
  const [month, setMonth] = useState(now.getUTCMonth() + 1);
  const [selectedIsoDate, setSelectedIsoDate] = useState<string | null>(null);

  const markedDayKeys = useMemo(() => getMarkedDayKeys(events), [events]);
  const selectedDayEvents = useMemo(
    () => (selectedIsoDate ? getEventsForDay(events, selectedIsoDate) : []),
    [events, selectedIsoDate]
  );

  function goToPrevMonth() {
    if (month === 1) {
      setMonth(12);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  }

  function goToNextMonth() {
    if (month === 12) {
      setMonth(1);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  }

  return (
    <div className="flex flex-col gap-4 md:flex-row">
      <div className="flex-1">
        <CalendarMonthNavigation
          label={`${MONTH_LABELS_PT[month - 1]} ${year}`}
          onPrev={goToPrevMonth}
          onNext={goToNextMonth}
        />
        <div className="mt-3">
          <CalendarGrid
            year={year}
            month={month}
            markedDayKeys={markedDayKeys}
            selectedIsoDate={selectedIsoDate}
            onSelectDay={setSelectedIsoDate}
          />
        </div>
      </div>

      <div className="flex w-full flex-col gap-3 md:w-72">
        <EventsPanel selectedIsoDate={selectedIsoDate} events={selectedDayEvents} />
        <div className="flex items-center justify-between rounded-lg bg-bg-card p-3">
          <span className="text-xs text-text-secondary">Calendário {year}</span>
          <button
            type="button"
            disabled
            title="Disponível em breve"
            className="rounded-full bg-bg-app px-3 py-1 text-xs font-medium text-text-secondary/70 disabled:cursor-not-allowed"
          >
            Baixar calendário
          </button>
        </div>
      </div>
    </div>
  );
}
