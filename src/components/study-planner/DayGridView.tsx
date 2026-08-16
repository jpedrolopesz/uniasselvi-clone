import type { StudyActivity } from "@/lib/types/study-activity";
import { TimeGutter } from "@/components/study-planner/TimeGutter";
import { TimeGridColumn } from "@/components/study-planner/TimeGridColumn";
import { getActivitiesForDate } from "@/lib/study-planner/calendar-logic";
import { minutesToTime } from "@/lib/study-planner/date-utils";

interface DayGridViewProps {
  isoDate: string;
  activities: StudyActivity[];
  onCreateAt: (isoDate: string, startTime: string) => void;
  onSelectActivity: (activity: StudyActivity) => void;
  onReviewPreview: (activity: StudyActivity) => void;
}

export function DayGridView({ isoDate, activities, onCreateAt, onSelectActivity, onReviewPreview }: DayGridViewProps) {
  const dayActivities = getActivitiesForDate(activities, isoDate);

  return (
    <div className="flex overflow-y-auto p-4">
      <TimeGutter />
      <div className="flex-1">
        <TimeGridColumn
          activities={dayActivities}
          onCreateAt={(hour) => onCreateAt(isoDate, minutesToTime(hour * 60))}
          onSelectActivity={onSelectActivity}
          onReviewPreview={onReviewPreview}
        />
      </div>
    </div>
  );
}
