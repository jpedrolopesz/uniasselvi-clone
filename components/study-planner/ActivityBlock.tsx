import type { CSSProperties } from "react";
import type { StudyActivity } from "@/lib/types/study-activity";
import { CATEGORY_META } from "@/lib/study-planner/category-meta";

interface ActivityBlockProps {
  activity: StudyActivity;
  style: CSSProperties;
  onSelect: () => void;
}

export function ActivityBlock({ activity, style, onSelect }: ActivityBlockProps) {
  const meta = CATEGORY_META[activity.category];

  return (
    <button
      type="button"
      onClick={onSelect}
      style={style}
      className={`absolute inset-x-0.5 overflow-hidden rounded-md border px-2 py-1 text-left text-xs leading-tight transition hover:brightness-110 ${meta.blockClassName}`}
    >
      <p className="truncate font-semibold">{activity.title}</p>
      <p className="truncate text-[11px] opacity-80">
        {activity.startTime}–{activity.endTime}
        {activity.subjectName ? ` · ${activity.subjectName}` : ""}
      </p>
      {activity.source === "ai" && (
        <p className="mt-0.5 truncate text-[10px] font-semibold opacity-90">
          ✨ Criado pelo Vitru
        </p>
      )}
    </button>
  );
}
