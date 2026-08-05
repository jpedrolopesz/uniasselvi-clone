"use client";

import { useEffect, useRef, useState } from "react";
import type { DisciplineRaw } from "@/lib/types/raw/disciplines";
import { DisciplineCard } from "@/components/home/DisciplineCard";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/icons";

interface DisciplineCarouselProps {
  disciplines: DisciplineRaw[];
  activeUserId: string;
  todayIsoDate: string;
}

export function DisciplineCarousel({ disciplines, activeUserId, todayIsoDate }: DisciplineCarouselProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  function updateScrollState() {
    const el = scrollerRef.current;
    if (!el) return;
    setCanScrollPrev(el.scrollLeft > 4);
    setCanScrollNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }

  useEffect(() => {
    updateScrollState();
  }, [disciplines]);

  function scrollBy(amount: number) {
    scrollerRef.current?.scrollBy({ left: amount, behavior: "smooth" });
  }

  if (disciplines.length === 0) {
    return (
      <p className="rounded-lg bg-bg-card p-4 text-sm text-text-secondary">
        Nenhuma disciplina encontrada para este usuário.
      </p>
    );
  }

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Minhas Disciplinas</h2>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => scrollBy(-340)}
            disabled={!canScrollPrev}
            aria-label="Rolar para a esquerda"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border-subtle text-white transition hover:bg-bg-card-hover disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
          >
            <ChevronLeftIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => scrollBy(340)}
            disabled={!canScrollNext}
            aria-label="Rolar para a direita"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border-subtle text-white transition hover:bg-bg-card-hover disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
          >
            <ChevronRightIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div
        ref={scrollerRef}
        onScroll={updateScrollState}
        className="flex gap-4 overflow-x-auto scroll-smooth pb-2 [scrollbar-width:thin]"
      >
        {disciplines.map((discipline) => (
          <DisciplineCard
            key={discipline.code}
            discipline={discipline}
            activeUserId={activeUserId}
            todayIsoDate={todayIsoDate}
          />
        ))}
      </div>
    </section>
  );
}
