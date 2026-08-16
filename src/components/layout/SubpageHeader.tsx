import Link from "next/link";

interface SubpageHeaderProps {
  title: string;
  /** Omitidos em páginas que não pertencem a uma disciplina específica (ex.: Calendário de Estudos). */
  disciplineName?: string;
  disciplineCode?: string;
  backHref: string;
}

export function SubpageHeader({
  title,
  disciplineName,
  disciplineCode,
  backHref,
}: SubpageHeaderProps) {
  return (
    <div data-vitru-id="page-header" role="region" aria-label={`Cabeçalho: ${title}`} className="mb-6 flex flex-col gap-2">
      <Link
        data-vitru-id="page-back"
        href={backHref}
        className="w-fit text-sm font-medium text-text-secondary transition hover:text-text-primary"
      >
        ‹ Voltar
      </Link>
      <h1 className="text-xl font-bold uppercase tracking-tight text-text-primary">
        {title}
        {disciplineName && (
          <>
            {" "}
            <span className="text-text-secondary">|</span> {disciplineName}
            {disciplineCode && ` (${disciplineCode})`}
          </>
        )}
      </h1>
    </div>
  );
}
