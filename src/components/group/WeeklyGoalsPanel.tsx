"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircleIcon, TargetIcon } from "@/components/icons";
import { VETERAN, WEEKLY_GOALS, type WeeklyGoal } from "@/lib/group/mock-group";

/**
 * Metas semanais do grupo. O check só existe em estado local: não há tabela
 * de metas (ver lib/group/mock-group.ts), então a marcação volta ao original
 * a cada recarga.
 */
export function WeeklyGoalsPanel() {
  const [goals, setGoals] = useState<WeeklyGoal[]>(WEEKLY_GOALS);

  const done = goals.filter((g) => g.done).length;
  const pct = Math.round((done / goals.length) * 100);

  const toggle = (id: string) =>
    setGoals((cur) => cur.map((g) => (g.id === id ? { ...g, done: !g.done } : g)));

  return (
    <section
      className="rounded-xl border border-border-subtle bg-bg-card p-4"
      aria-labelledby="metas-semanais"
    >
      <div className="flex items-center gap-2">
        <TargetIcon className="h-5 w-5 shrink-0 text-brand-yellow" aria-hidden="true" />
        <h2 id="metas-semanais" className="text-sm font-bold uppercase tracking-tight text-white">
          Metas semanais do grupo
        </h2>
      </div>

      <p className="mt-1 text-xs text-text-secondary">Propostas por {VETERAN.name}</p>

      <p className="mt-3 flex items-baseline justify-between text-xs text-text-secondary">
        <span>
          <span className="text-base font-bold text-white">{done}</span> de {goals.length}{" "}
          concluídas
        </span>
        <span className="font-semibold tabular-nums text-brand-yellow">{pct}%</span>
      </p>

      <div
        className="mt-2 h-2 overflow-hidden rounded-full bg-bg-app"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Progresso das metas da semana"
      >
        <div
          className="h-full rounded-full bg-brand-yellow transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>

      <ul className="mt-4 flex flex-col gap-1">
        {goals.map((goal) => (
          <li key={goal.id}>
            <div className="flex items-start gap-2 rounded-lg p-2 transition hover:bg-bg-card-hover">
              <button
                type="button"
                onClick={() => toggle(goal.id)}
                aria-pressed={goal.done}
                className={`mt-0.5 shrink-0 rounded-full transition ${
                  goal.done ? "text-brand-yellow" : "text-text-secondary hover:text-white"
                }`}
              >
                {goal.done ? (
                  <CheckCircleIcon className="h-5 w-5" aria-hidden="true" />
                ) : (
                  <span className="block h-5 w-5 rounded-full border-2 border-current" />
                )}
                <span className="sr-only">
                  {goal.done ? "Desmarcar meta" : "Marcar meta como concluída"}: {goal.title}
                </span>
              </button>

              <div className="min-w-0 flex-1">
                <p
                  className={`text-sm font-medium leading-snug ${
                    goal.done ? "text-text-secondary line-through" : "text-white"
                  }`}
                >
                  {goal.title}
                </p>
                <p className="mt-0.5 text-xs text-text-secondary">
                  {goal.detail}
                  {goal.subjectCode && (
                    <>
                      {" • "}
                      <Link
                        href={`/disciplinas/${goal.subjectCode}`}
                        className="underline underline-offset-2 transition hover:text-white"
                      >
                        {goal.subjectCode}
                      </Link>
                    </>
                  )}
                </p>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
