import type { StudyActivity } from "@/lib/types/study-activity";
import { TimeGutter } from "@/components/study-planner/TimeGutter";
import { TimeGridColumn } from "@/components/study-planner/TimeGridColumn";
import { getActivitiesForDate } from "@/lib/study-planner/calendar-logic";
import { buildWeekDays, minutesToTime } from "@/lib/study-planner/date-utils";

interface WeekGridViewProps {
  isoDate: string;
  activities: StudyActivity[];
  onCreateAt: (isoDate: string, startTime: string) => void;
  onSelectActivity: (activity: StudyActivity) => void;
  onReviewPreview: (activity: StudyActivity) => void;
}

export function WeekGridView({ isoDate, activities, onCreateAt, onSelectActivity, onReviewPreview }: WeekGridViewProps) {
  const days = buildWeekDays(isoDate);

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="flex">
        <div className="w-14 shrink-0" />
        {days.map((day) => (
          <div
            key={day.isoDate}
            className={`flex-1 border-l border-border-subtle p-2 text-center ${
              day.isToday ? "bg-accent-cyan/10" : ""
            }`}
          >
            <p className="text-[11px] uppercase text-text-secondary">{day.weekdayLabel}</p>
            <p className={`text-sm font-semibold ${day.isToday ? "text-accent-cyan" : "text-white"}`}>
              {day.day}
            </p>
          </div>
        ))}
      </div>

      <div className="flex">
        <TimeGutter />
        <div className="grid flex-1 grid-cols-7">
          {days.map((day) => (
            <TimeGridColumn
              key={day.isoDate}
              activities={getActivitiesForDate(activities, day.isoDate)}
              onCreateAt={(hour) => onCreateAt(day.isoDate, minutesToTime(hour * 60))}
              onSelectActivity={onSelectActivity}
              onReviewPreview={onReviewPreview}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
