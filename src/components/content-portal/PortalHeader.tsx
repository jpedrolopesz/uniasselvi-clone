import Link from "next/link";

interface PortalHeaderProps {
  title: string;
  backHref?: string;
  activeUserId: string;
}

/** Chrome enxuto do Portal do Responsável — não reaproveita o AppShell do aluno (tabs/menu não fazem sentido aqui). */
export function PortalHeader({ title, backHref, activeUserId }: PortalHeaderProps) {
  return (
    <header className="border-b border-border-subtle bg-bg-card">
      <div className="mx-auto flex max-w-4xl flex-col gap-2 px-4 py-5 sm:px-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-yellow">
              Portal do Responsável
            </p>
            <h1 className="text-xl font-bold text-white">{title}</h1>
          </div>
          <span className="shrink-0 rounded-full bg-black/30 px-3 py-1 text-xs text-text-secondary">
            Editando como <span className="text-white">{activeUserId}</span>
          </span>
        </div>
        {backHref && (
          <Link href={backHref} className="w-fit text-sm font-medium text-text-secondary transition hover:text-white">
            ‹ Voltar
          </Link>
        )}
      </div>
    </header>
  );
}
