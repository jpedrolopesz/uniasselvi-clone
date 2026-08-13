import type { StudyActivity } from "@/lib/types/study-activity";
import { ActivityBlock } from "@/components/study-planner/ActivityBlock";
import { buildHourRows, computeBlockStyle, ROW_HEIGHT_PX } from "@/components/study-planner/hour-grid";

interface TimeGridColumnProps {
  activities: StudyActivity[];
  onCreateAt: (hour: number) => void;
  onSelectActivity: (activity: StudyActivity) => void;
  onReviewPreview: (activity: StudyActivity) => void;
}

/** Uma coluna de dia com linhas por hora (visões Dia/Semana). Clicar numa linha vazia cria uma atividade naquele horário; clicar num bloco existente o edita. */
export function TimeGridColumn({ activities, onCreateAt, onSelectActivity, onReviewPreview }: TimeGridColumnProps) {
  const rows = buildHourRows();

  return (
    <div className="relative border-l border-border-subtle" style={{ height: rows.length * ROW_HEIGHT_PX }}>
      {rows.map((hour) => (
        <button
          key={hour}
          type="button"
          onClick={() => onCreateAt(hour)}
          aria-label={`Criar atividade às ${String(hour).padStart(2, "0")}:00`}
          className="absolute inset-x-0 border-b border-border-subtle/60 text-left transition hover:bg-bg-card-hover/50"
          style={{ top: (hour - rows[0]) * ROW_HEIGHT_PX, height: ROW_HEIGHT_PX }}
        />
      ))}

      {activities.map((activity) => (
        <ActivityBlock
          key={activity.id}
          activity={activity}
          style={computeBlockStyle(activity.startTime, activity.endTime)}
          onSelect={() => onSelectActivity(activity)}
          onReviewPreview={() => onReviewPreview(activity)}
        />
      ))}
    </div>
  );
}
