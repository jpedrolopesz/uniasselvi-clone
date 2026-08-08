import Link from "next/link";
import { PortalHeader } from "@/components/content-portal/PortalHeader";
import { EmptyState } from "@/components/layout/EmptyState";
import { ChevronRightIcon } from "@/components/icons";
import { resolveActiveUserId } from "@/lib/data/resolve-active-user";
import { loadDisciplines } from "@/lib/data/load-user-data";
import { sortDisciplinesByProgress } from "@/lib/selectors/discipline-selectors";

export default async function PortalResponsavelPage({
  searchParams,
}: {
  searchParams: Promise<{ u?: string | string[] }>;
}) {
  const { u } = await searchParams;
  const activeUserId = await resolveActiveUserId(u);
  const disciplines = await loadDisciplines(activeUserId);
  const sorted = disciplines ? sortDisciplinesByProgress(disciplines) : [];

  return (
    <div className="min-h-dvh bg-bg-app">
      <PortalHeader title="Disciplinas" activeUserId={activeUserId} />

      <main className="mx-auto flex max-w-4xl flex-col gap-4 px-4 py-6 sm:px-6">
        <p className="text-sm text-text-secondary">
          Escolha uma disciplina para criar ou editar o conteúdo da trilha de aprendizagem. O
          conteúdo é salvo para o usuário ativo listado no topo — troque o usuário pelo seletor de
          desenvolvimento se precisar editar outra base de dados.
        </p>

        {sorted.length === 0 ? (
          <EmptyState message="Nenhuma disciplina encontrada para este usuário." />
        ) : (
          <div className="flex flex-col gap-2">
            {sorted.map((discipline) => (
              <Link
                key={discipline.code}
                href={`/portal-responsavel/${discipline.code}/trilha-de-aprendizagem`}
                className="flex items-center justify-between gap-4 rounded-2xl bg-bg-card p-4 transition hover:bg-bg-card-hover"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold text-white">{discipline.description}</p>
                  <p className="text-xs text-text-secondary">{discipline.code}</p>
                </div>
                <ChevronRightIcon className="h-4 w-4 shrink-0 text-text-secondary" />
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
