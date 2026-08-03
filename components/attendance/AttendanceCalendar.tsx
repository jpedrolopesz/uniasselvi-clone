"use client";

import { useMemo, useState } from "react";
import { CalendarGrid } from "@/components/calendar/CalendarGrid";
import { CalendarMonthNavigation } from "@/components/calendar/CalendarMonthNavigation";
import { MeetingsPanel } from "@/components/attendance/MeetingsPanel";
import type { AttendancesRaw } from "@/lib/types/raw/attendances";
import {
  getDiaryEntryForDay,
  getMarkedAttendanceDayKeys,
  getMeetingsForDay,
} from "@/lib/selectors/attendance-selectors";
import { MONTH_LABELS_PT } from "@/lib/selectors/calendar-selectors";

export function AttendanceCalendar({ attendances }: { attendances: AttendancesRaw }) {
  const now = new Date();
  const [year, setYear] = useState(now.getUTCFullYear());
  const [month, setMonth] = useState(now.getUTCMonth() + 1);
  const [selectedIsoDate, setSelectedIsoDate] = useState<string | null>(null);

  const markedDayKeys = useMemo(
    () => getMarkedAttendanceDayKeys(attendances.frequency_diary),
    [attendances.frequency_diary]
  );
  const selectedMeetings = useMemo(
    () => (selectedIsoDate ? getMeetingsForDay(attendances.meetings, selectedIsoDate) : []),
    [attendances.meetings, selectedIsoDate]
  );
  const selectedDiaryEntry = useMemo(
    () => (selectedIsoDate ? getDiaryEntryForDay(attendances.frequency_diary, selectedIsoDate) : undefined),
    [attendances.frequency_diary, selectedIsoDate]
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

      <div className="w-full md:w-72">
        <MeetingsPanel
          selectedIsoDate={selectedIsoDate}
          meetings={selectedMeetings}
          diaryEntry={selectedDiaryEntry}
        />
      </div>
    </div>
  );
}
