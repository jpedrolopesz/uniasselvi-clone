import Link from "next/link";

interface AcademicShortcutsProps {
  primarySubjectCode: string | null;
}

const STATIC_SHORTCUTS = ["Ajuste de disciplina", "Atividades complementares"];

export function AcademicShortcuts({ primarySubjectCode }: AcademicShortcutsProps) {
  return (
    <div className="flex flex-wrap gap-3">
      {primarySubjectCode ? (
        <>
          <Link
            href={`/disciplinas/${primarySubjectCode}/calendario`}
            className="rounded-full bg-bg-card px-4 py-2 text-sm font-medium text-white transition hover:bg-bg-card-hover"
          >
            Calendário
          </Link>
          <Link
            href={`/disciplinas/${primarySubjectCode}/notas-avaliacoes`}
            className="rounded-full bg-bg-card px-4 py-2 text-sm font-medium text-white transition hover:bg-bg-card-hover"
          >
            Notas
          </Link>
        </>
      ) : null}
      {STATIC_SHORTCUTS.map((label) => (
        <button
          key={label}
          type="button"
          disabled
          title="Disponível em breve"
          className="rounded-full bg-bg-card px-4 py-2 text-sm font-medium text-text-secondary/70 disabled:cursor-not-allowed"
        >
          {label}
        </button>
      ))}
    </div>
  );
}
