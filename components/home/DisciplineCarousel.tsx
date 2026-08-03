"use client";

import { useRef } from "react";
import type { DisciplineRaw } from "@/lib/types/raw/disciplines";
import { DisciplineCard } from "@/components/home/DisciplineCard";

export function DisciplineCarousel({ disciplines }: { disciplines: DisciplineRaw[] }) {
  const scrollerRef = useRef<HTMLDivElement>(null);

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
    <div className="relative">
      <div
        ref={scrollerRef}
        className="flex gap-4 overflow-x-auto scroll-smooth pb-2 [scrollbar-width:thin]"
      >
        {disciplines.map((discipline) => (
          <DisciplineCard key={discipline.code} discipline={discipline} />
        ))}
      </div>
      {disciplines.length > 3 && (
        <div className="mt-2 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => scrollBy(-280)}
            aria-label="Rolar para a esquerda"
            className="rounded-full bg-bg-card px-3 py-1 text-sm text-white hover:bg-bg-card-hover"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => scrollBy(280)}
            aria-label="Rolar para a direita"
            className="rounded-full bg-bg-card px-3 py-1 text-sm text-white hover:bg-bg-card-hover"
          >
            ›
          </button>
        </div>
      )}
    </div>
  );
}
