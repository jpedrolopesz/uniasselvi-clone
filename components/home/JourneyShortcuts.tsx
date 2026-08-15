import Link from "next/link";

const JOURNEY_SHORTCUTS = [
  { label: "Meu Perfil", href: "/perfil", icon: "👤", active: true },
  { label: "Recomendações de Estudo", href: "/recomendacoes", icon: "📚", active: true },
  { label: "Comunidade", href: "/comunidade", icon: "🤝", active: true },
  { label: "Calendário de Estudos", href: "/calendario-de-estudos", icon: "📅", active: true },
  { label: "Score de Engajamento", href: "/risco", icon: "📊", active: true },
  { label: "Minha Jornada", href: "#", icon: "🗺️", active: false },
];

export function JourneyShortcuts() {
  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-text-secondary">
        Jornada do Aluno
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {JOURNEY_SHORTCUTS.map((item) =>
          item.active ? (
            <Link
              key={item.label}
              href={item.href}
              className="flex h-20 flex-col items-center justify-center gap-1.5 rounded-lg bg-bg-card border border-border-subtle p-3 text-center text-xs font-medium text-text-primary hover:bg-bg-card-hover hover:border-brand-yellow/50 transition"
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </Link>
          ) : (
            <button
              key={item.label}
              type="button"
              disabled
              title="Disponível em breve"
              className="flex h-20 flex-col items-center justify-center gap-1.5 rounded-lg bg-bg-card p-3 text-center text-xs font-medium text-text-secondary/80 disabled:cursor-not-allowed"
            >
              <span className="text-lg opacity-50">{item.icon}</span>
              {item.label}
            </button>
          )
        )}
      </div>
    </section>
  );
}
