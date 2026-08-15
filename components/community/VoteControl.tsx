"use client";

import { useState } from "react";
import { ArrowDownIcon, ArrowUpIcon } from "@/components/icons";
import { formatCompact } from "@/lib/community/format";

type Vote = 1 | 0 | -1;

/**
 * Coluna de votos no estilo Reddit. O voto só existe em estado local: não há
 * backend de comunidade ainda (ver lib/community/mock-feed.ts), então a
 * contagem volta ao valor original a cada recarga.
 */
export function VoteControl({ score }: { score: number }) {
  const [vote, setVote] = useState<Vote>(0);

  // Alternar o mesmo botão desfaz o voto, como no Reddit.
  const toggle = (next: Exclude<Vote, 0>) => setVote((cur) => (cur === next ? 0 : next));

  return (
    <div className="flex shrink-0 flex-col items-center gap-0.5">
      <button
        type="button"
        onClick={() => toggle(1)}
        aria-label="Votar a favor"
        aria-pressed={vote === 1}
        className={`rounded p-1 transition hover:bg-bg-card-hover ${
          vote === 1 ? "text-brand-yellow" : "text-text-secondary hover:text-white"
        }`}
      >
        <ArrowUpIcon className="h-5 w-5" aria-hidden="true" />
      </button>

      <span
        className={`min-w-8 text-center text-xs font-bold tabular-nums ${
          vote === 1 ? "text-brand-yellow" : vote === -1 ? "text-sky-400" : "text-white"
        }`}
      >
        {formatCompact(score + vote)}
      </span>

      <button
        type="button"
        onClick={() => toggle(-1)}
        aria-label="Votar contra"
        aria-pressed={vote === -1}
        className={`rounded p-1 transition hover:bg-bg-card-hover ${
          vote === -1 ? "text-sky-400" : "text-text-secondary hover:text-white"
        }`}
      >
        <ArrowDownIcon className="h-5 w-5" aria-hidden="true" />
      </button>
    </div>
  );
}
