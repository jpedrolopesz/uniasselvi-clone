import Link from "next/link";
import Image from "next/image";
import type { DisciplineRaw } from "@/lib/types/raw/disciplines";
import {
  DISCIPLINE_STATUS_LABELS,
  formatWeekdayLabel,
  getDisciplineHeroImageSrc,
  getDisciplineStatus,
} from "@/lib/selectors/discipline-selectors";
import { BookOpenIcon, CalendarIcon, ClockIcon } from "@/components/icons";

interface DisciplineCardProps {
  discipline: DisciplineRaw;
  activeUserId: string;
  todayIsoDate: string;
}

export function DisciplineCard({ discipline, activeUserId, todayIsoDate }: DisciplineCardProps) {
  const heroImageSrc = getDisciplineHeroImageSrc(activeUserId, discipline.code);
  const status = getDisciplineStatus(discipline, todayIsoDate);

  return (
    <Link
      data-tour-id="discipline-card"
      href={`/disciplinas/${discipline.code}`}
      className="group flex w-80 shrink-0 flex-col overflow-hidden rounded-2xl bg-bg-card transition hover:bg-bg-card-hover"
    >
      <div className="relative aspect-4/3 w-full shrink-0 overflow-hidden">
        {heroImageSrc ? (
          <Image
            src={heroImageSrc}
            alt={discipline.description}
            fill
            sizes="320px"
            className="object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-yellow/20 via-black to-bg-card">
            <BookOpenIcon className="h-14 w-14 text-brand-yellow/50" aria-hidden="true" />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <span className="w-fit rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-text-secondary">
          {DISCIPLINE_STATUS_LABELS[status]}
        </span>

        <h3 className="line-clamp-2 text-lg font-bold leading-snug text-white">
          {discipline.description}
        </h3>

        <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-secondary">
          {discipline.agroupment_period && (
            <span className="inline-flex items-center gap-1.5">
              <ClockIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
              {discipline.agroupment_period}
            </span>
          )}
          {discipline.desc_week_day && (
            <span className="inline-flex items-center gap-1.5">
              <CalendarIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
              {formatWeekdayLabel(discipline.desc_week_day)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
