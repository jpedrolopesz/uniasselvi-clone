import { formatPercent } from "@/lib/formatters/number-formatters";

export function AttendanceProgress({ frequency }: { frequency: number }) {
  const clamped = Math.min(100, Math.max(0, frequency));

  return (
    <div className="rounded-lg bg-bg-card p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-white">Presencialidade</span>
        <span className="text-sm font-semibold text-white">{formatPercent(frequency)} Concluído</span>
      </div>
      <div className="mt-2 h-2 w-full rounded-full bg-black/40">
        <div className="h-2 rounded-full bg-brand-yellow" style={{ width: `${clamped}%` }} />
      </div>
    </div>
  );
}
