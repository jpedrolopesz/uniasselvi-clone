import type { TestInfoRaw } from "@/lib/types/raw/test-content";
import { formatDateTimeBr } from "@/lib/formatters/date-formatters";
import { formatWeight } from "@/lib/formatters/number-formatters";

/**
 * Estado exibido quando a avaliação já foi respondida (`completed: "S"`).
 * Também é usado quando o arquivo já traz `questions` com gabarito
 * completo (resposta do aluno, acerto/erro) — os dados existem, mas a tela
 * de revisão detalhada (mostrar cada questão com certo/errado) ainda não
 * foi construída, por decisão explícita de adiar esse escopo.
 */
export function CompletedTestSummary({ info }: { info: TestInfoRaw }) {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold uppercase tracking-tight text-white">
        Responder Avaliação
      </h1>

      <div className="rounded-xl bg-bg-card p-5">
        <p className="text-sm font-semibold text-white">{info.description}</p>
        <p className="text-xs text-text-secondary">
          {info.subject_name} ({info.subject_code})
        </p>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-md bg-bg-app p-3 text-center">
            <p className="text-[10px] uppercase text-text-secondary">Prova</p>
            <p className="text-sm font-semibold text-white">{info.test_code}</p>
          </div>
          <div className="rounded-md bg-bg-app p-3 text-center">
            <p className="text-[10px] uppercase text-text-secondary">Peso</p>
            <p className="text-sm font-semibold text-white">{formatWeight(info.weigth)}</p>
          </div>
          <div className="rounded-md bg-bg-app p-3 text-center">
            <p className="text-[10px] uppercase text-text-secondary">Status</p>
            <p className="text-sm font-semibold text-accent-green">Concluída</p>
          </div>
          {info.updated_at && (
            <div className="rounded-md bg-bg-app p-3 text-center">
              <p className="text-[10px] uppercase text-text-secondary">Respondida em</p>
              <p className="text-sm font-semibold text-white">{formatDateTimeBr(info.updated_at)}</p>
            </div>
          )}
        </div>

        <p className="mt-4 text-sm text-text-secondary">
          Esta avaliação já foi respondida. A revisão questão a questão ainda não está disponível
          nesta tela.
        </p>
      </div>
    </div>
  );
}
