import Link from "next/link";
import type { DisciplineRaw } from "@/lib/types/raw/disciplines";
import { formatDateBr } from "@/lib/formatters/date-formatters";

export function DisciplineCard({ discipline }: { discipline: DisciplineRaw }) {
  return (
    <Link
      href={`/disciplinas/${discipline.code}`}
      className="flex w-64 shrink-0 flex-col gap-2 rounded-xl bg-bg-card p-4 transition hover:bg-bg-card-hover"
    >
      <div className="flex items-center justify-between">
        <span className="rounded bg-black/40 px-2 py-0.5 text-xs font-semibold text-brand-yellow">
          {discipline.code}
        </span>
        {discipline.current_subject === true && (
          <span className="rounded bg-accent-green/20 px-2 py-0.5 text-[10px] font-semibold uppercase text-accent-green">
            Atual
          </span>
        )}
      </div>

      <h3 className="line-clamp-2 text-sm font-semibold text-white">
        {discipline.description}
      </h3>

      <p className="text-xs text-text-secondary">{discipline.offer_type_description}</p>

      <p className="text-[11px] text-text-secondary">
        {discipline.situation} · {formatDateBr(discipline.begin_date)} a{" "}
        {formatDateBr(discipline.end_date)}
      </p>
    </Link>
  );
}
