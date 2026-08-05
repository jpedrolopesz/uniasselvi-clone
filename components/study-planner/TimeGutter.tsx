import { buildHourRows, ROW_HEIGHT_PX } from "@/components/study-planner/hour-grid";

export function TimeGutter() {
  const rows = buildHourRows();

  return (
    <div className="w-14 shrink-0">
      {rows.map((hour) => (
        <div key={hour} style={{ height: ROW_HEIGHT_PX }} className="relative">
          <span className="absolute -top-2 right-2 text-[11px] text-text-secondary/60">
            {String(hour).padStart(2, "0")}:00
          </span>
        </div>
      ))}
    </div>
  );
}
