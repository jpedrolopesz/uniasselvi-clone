import type { StudyActivity } from "@/lib/types/study-activity";
import { buildMonthGrid, WEEKDAY_LABELS_PT } from "@/lib/selectors/calendar-selectors";
import { getActivitiesForDate } from "@/lib/study-planner/calendar-logic";
import { getTodayIsoDate, parseIsoDate } from "@/lib/study-planner/date-utils";
import { CATEGORY_META } from "@/lib/study-planner/category-meta";

interface MonthGridViewProps {
  isoDate: string;
  activities: StudyActivity[];
  onSelectDay: (isoDate: string) => void;
}

/** Visão mês: cada dia mostra até 3 pontos coloridos indicando as categorias de atividade presentes. Clicar num dia leva para a visão Dia (onde dá para criar/editar por horário). */
export function MonthGridView({ isoDate, activities, onSelectDay }: MonthGridViewProps) {
  const { year, month } = parseIsoDate(isoDate);
  const cells = buildMonthGrid(year, month);
  const today = getTodayIsoDate();

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="mb-1 grid grid-cols-7 gap-1 text-center text-xs text-text-secondary">
        {WEEKDAY_LABELS_PT.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((cell) => {
          const dayActivities = getActivitiesForDate(activities, cell.isoDate);
          const categories = [...new Set(dayActivities.map((activity) => activity.category))].slice(0, 3);

          return (
            <button
              key={cell.isoDate}
              type="button"
              onClick={() => onSelectDay(cell.isoDate)}
              className={[
                "flex h-20 flex-col items-center gap-1 rounded-md p-1.5 text-sm transition hover:bg-bg-card-hover",
                cell.isCurrentMonth ? "text-white" : "text-text-secondary/40",
                cell.isoDate === today ? "ring-1 ring-accent-cyan" : "",
              ].join(" ")}
            >
              <span className="font-medium">{cell.day}</span>
              {categories.length > 0 && (
                <span className="flex items-center gap-1">
                  {categories.map((category) => (
                    <span
                      key={category}
                      className={`h-1.5 w-1.5 rounded-full ${CATEGORY_META[category].dotClassName}`}
                      aria-hidden="true"
                    />
                  ))}
                </span>
              )}
              {dayActivities.length > 0 && (
                <span className="sr-only">{dayActivities.length} atividade(s)</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
