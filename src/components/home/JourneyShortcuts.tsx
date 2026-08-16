import Link from "next/link";

const JOURNEY_SHORTCUTS = [
  "Conheça o EAD UNIASSELVI",
  "Evolução neste semestre",
  "Guia do Estudante",
  "Minha Jornada",
  "Mapa da Jornada",
];

export function JourneyShortcuts() {
  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-text-secondary">
        Jornada do Aluno
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Link
          href="/boas-vindas"
          className="flex h-20 items-center justify-center rounded-lg border border-brand-yellow/30 bg-brand-yellow/10 p-3 text-center text-xs font-bold text-brand-yellow transition hover:bg-brand-yellow/20"
        >
          Boas-vindas ao novo AVA
        </Link>
        {JOURNEY_SHORTCUTS.map((label) => (
          <button
            key={label}
            type="button"
            disabled
            title="Disponível em breve"
            className="flex h-20 items-center justify-center rounded-lg bg-bg-card p-3 text-center text-xs font-medium text-text-secondary/80 disabled:cursor-not-allowed"
          >
            {label}
          </button>
        ))}
      </div>
    </section>
  );
}
