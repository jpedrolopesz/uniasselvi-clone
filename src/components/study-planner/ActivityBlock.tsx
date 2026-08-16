import type { CSSProperties } from "react";
import type { StudyActivity } from "@/lib/types/study-activity";
import { CATEGORY_META } from "@/lib/study-planner/category-meta";

interface ActivityBlockProps {
  activity: StudyActivity;
  style: CSSProperties;
  onSelect: () => void;
  onReviewPreview?: () => void;
}

export function ActivityBlock({ activity, style, onSelect, onReviewPreview }: ActivityBlockProps) {
  const meta = CATEGORY_META[activity.category];
  const isPreview = activity.confirmationStatus !== undefined;

  return (
    <div
      data-vitru-id={`calendar-activity:${activity.id}:show`}
      role={isPreview ? "group" : "button"}
      tabIndex={isPreview ? undefined : 0}
      onClick={isPreview ? undefined : onSelect}
      onKeyDown={isPreview ? undefined : (event) => {
        if (event.key === "Enter" || event.key === " ") onSelect();
      }}
      aria-label={isPreview ? `${activity.title}, aguardando confirmação` : undefined}
      style={{ ...style, minHeight: isPreview ? 32 : undefined }}
      className={`absolute inset-x-0.5 overflow-hidden rounded-md border px-2 py-1 text-left text-xs leading-tight transition ${isPreview ? "cursor-default border-dashed border-brand-yellow bg-brand-yellow/10 text-brand-yellow shadow-[inset_0_0_0_1px_rgba(244,198,75,.15)]" : `hover:brightness-110 ${meta.blockClassName}`}`}
    >
      {isPreview && (
        <div className="mb-1 flex items-center gap-1.5">
          {activity.confirmationStatus !== "saving" && (
            <button type="button" onClick={onReviewPreview} className="shrink-0 rounded bg-brand-yellow px-1.5 py-0.5 text-[9px] font-bold text-black shadow">
              Revisar
            </button>
          )}
          <span className="truncate text-[10px] font-semibold">
            {activity.startTime}–{activity.endTime}
          </span>
        </div>
      )}
      <p className="truncate font-semibold">{activity.title}</p>
      <p className="truncate text-[11px] opacity-80">
        {!isPreview && `${activity.startTime}–${activity.endTime}`}
        {activity.subjectName ? `${!isPreview ? " · " : ""}${activity.subjectName}` : ""}
      </p>
      {isPreview ? (
        <div className="mt-1">
          <p className="truncate text-[10px] font-semibold">
            {activity.confirmationStatus === "saving" ? "Adicionando…" : activity.confirmationStatus === "error" ? "Não foi possível adicionar" : "◷ Aguardando confirmação"}
          </p>
        </div>
      ) : activity.source === "ai" && (
        <p className="mt-0.5 truncate text-[10px] font-semibold opacity-90">
          ✨ Criado pelo Vitru
        </p>
      )}
    </div>
  );
}
