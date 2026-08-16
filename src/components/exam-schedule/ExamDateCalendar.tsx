"use client";

import { useMemo, useState } from "react";
import { CalendarGrid } from "@/components/calendar/CalendarGrid";
import { CalendarMonthNavigation } from "@/components/calendar/CalendarMonthNavigation";
import { buildMonthGrid, MONTH_LABELS_PT } from "@/lib/selectors/calendar-selectors";
import { isSessionFull, isSessionInPast, todayIsoDateKey } from "@/lib/selectors/exam-schedule-selectors";
import type { ExamSession } from "@/lib/types/derived";
interface ExamDateCalendarProps {
  sessions: ExamSession[];
  selectedSessionId: string | null;
  onSelectSession: (sessionId: string) => void;
}

export function ExamDateCalendar({ sessions, selectedSessionId, onSelectSession }: ExamDateCalendarProps) {
  const todayIso = todayIsoDateKey();
  const sessionsByDate = useMemo(() => {
    const map = new Map<string, ExamSession[]>();
    for (const session of sessions) {
      if (!session.isoDate) continue;
      const list = map.get(session.isoDate) ?? [];
      list.push(session);
      map.set(session.isoDate, list);
    }
    return map;
  }, [sessions]);

  const firstAvailable = sessions.find((s) => s.isoDate && !isSessionInPast(s, todayIso));
  const initial = firstAvailable?.isoDate ?? todayIso;
  const [year, setYear] = useState(Number(initial.slice(0, 4)));
  const [month, setMonth] = useState(Number(initial.slice(5, 7)));

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

  const { markedDayKeys, disabledDayKeys } = useMemo(() => {
    const marked = new Set<string>();
    const disabled = new Set<string>();
    for (const cell of buildMonthGrid(year, month)) {
      const daySessions = sessionsByDate.get(cell.isoDate) ?? [];
      const hasSelectable = daySessions.some(
        (s) => !isSessionInPast(s, todayIso) && !isSessionFull(s)
      );
      if (daySessions.length > 0) marked.add(cell.isoDate);
      if (!hasSelectable) disabled.add(cell.isoDate);
    }
    return { markedDayKeys: marked, disabledDayKeys: disabled };
  }, [year, month, sessionsByDate, todayIso]);

  const selectedSession = sessions.find((s) => s.id === selectedSessionId) ?? null;

  return (
    <div>
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
          disabledDayKeys={disabledDayKeys}
          selectedIsoDate={selectedSession?.isoDate ?? null}
          dayAriaLabel={(isoDate, day, isDisabled) => {
            const count = sessionsByDate.get(isoDate)?.length ?? 0;
            if (isDisabled) return `Dia ${day}, indisponível para agendamento`;
            return `Dia ${day}, ${count} ${count === 1 ? "horário disponível" : "horários disponíveis"}`;
          }}
          onSelectDay={(isoDate) => {
            const daySessions = sessionsByDate.get(isoDate) ?? [];
            const nextSession = daySessions.find((s) => !isSessionFull(s));
            if (nextSession) onSelectSession(nextSession.id);
          }}
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-secondary" aria-hidden="true">
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-accent-red" /> Data com horário disponível
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-accent-cyan" /> Selecionada
        </span>
        <span className="flex items-center gap-1.5 line-through">Indisponível</span>
      </div>

      <p className="sr-only" role="status">
        {selectedSession
          ? `Data selecionada: ${selectedSession.displayDate}, ${selectedSession.startTime ?? ""}. Revise e confirme abaixo.`
          : "Nenhuma data selecionada ainda."}
      </p>
    </div>
  );
}
