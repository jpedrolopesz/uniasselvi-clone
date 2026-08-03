import Link from "next/link";

interface SubpageHeaderProps {
  title: string;
  disciplineName: string;
  disciplineCode: string;
  backHref: string;
}

export function SubpageHeader({
  title,
  disciplineName,
  disciplineCode,
  backHref,
}: SubpageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-2">
      <Link
        href={backHref}
        className="w-fit text-sm font-medium text-text-secondary transition hover:text-white"
      >
        ‹ Voltar
      </Link>
      <h1 className="text-xl font-bold uppercase tracking-tight text-white">
        {title} <span className="text-text-secondary">|</span> {disciplineName} ({disciplineCode})
      </h1>
    </div>
  );
}
