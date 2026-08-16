"use client";

import { UsersIcon } from "@/components/icons";
import { formatCompact } from "@/lib/community/format";
import { COMMUNITIES } from "@/lib/community/mock-feed";

interface CommunitySidebarProps {
  activeSlug: string | null;
  onSelect: (slug: string | null) => void;
}

/**
 * Coluna lateral com as comunidades do aluno, uma por disciplina matriculada.
 * Some abaixo de xl — no mobile o feed ocupa a largura toda, e a barra de
 * navegação inferior já é o meio de circulação.
 */
export function CommunitySidebar({ activeSlug, onSelect }: CommunitySidebarProps) {
  return (
    <aside className="hidden w-72 shrink-0 flex-col gap-4 xl:flex" aria-label="Suas comunidades">
      <div className="rounded-xl border border-border-subtle bg-bg-card p-4">
        <h2 className="text-xs font-bold uppercase tracking-wide text-text-secondary">
          Suas comunidades
        </h2>

        <ul className="mt-3 flex flex-col gap-1">
          <li>
            <button
              type="button"
              onClick={() => onSelect(null)}
              aria-pressed={activeSlug === null}
              className={`w-full rounded-lg px-2 py-2 text-left text-sm font-medium transition ${
                activeSlug === null
                  ? "bg-bg-card-hover text-brand-yellow"
                  : "text-text-secondary hover:bg-bg-card-hover hover:text-white"
              }`}
            >
              Todas as comunidades
            </button>
          </li>

          {COMMUNITIES.map((community) => {
            const active = activeSlug === community.slug;
            return (
              <li key={community.slug}>
                <button
                  type="button"
                  onClick={() => onSelect(community.slug)}
                  aria-pressed={active}
                  className={`w-full rounded-lg px-2 py-2 text-left transition ${
                    active ? "bg-bg-card-hover" : "hover:bg-bg-card-hover"
                  }`}
                >
                  <span
                    className={`block truncate text-sm font-medium ${
                      active ? "text-brand-yellow" : "text-white"
                    }`}
                  >
                    r/{community.slug}
                  </span>
                  <span className="mt-0.5 flex items-center gap-1.5 text-xs text-text-secondary">
                    <UsersIcon className="h-3.5 w-3.5" aria-hidden="true" />
                    {formatCompact(community.members)} membros
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="rounded-xl border border-border-subtle bg-bg-card p-4">
        <h2 className="text-xs font-bold uppercase tracking-wide text-text-secondary">
          Sobre a comunidade
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-text-secondary">
          Cada disciplina em que você está matriculado tem um espaço para dúvidas, materiais e
          discussões com os colegas de turma — mais as comunidades abertas a todos os cursos, como
          empregabilidade e empreendedorismo.
        </p>
      </div>
    </aside>
  );
}
