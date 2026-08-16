import type { FinancialTitleRaw } from "@/lib/types/raw/financial-titles";

interface RecoverySectionProps {
  financialTitles: FinancialTitleRaw[] | null;
}

/**
 * Seção "Recupera Aí". Sem endpoint dedicado identificado na especificação —
 * o único sinal real disponível hoje é a existência de títulos financeiros
 * em aberto (financial-titles.json, campo `paid`). Nenhuma outra informação
 * é inventada aqui.
 */
export function RecoverySection({ financialTitles }: RecoverySectionProps) {
  const openTitles = (financialTitles ?? []).filter((title) => title.paid === "N");

  return (
    <section className="rounded-xl bg-bg-card p-5">
      <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-brand-yellow">
        Recupera Aí
      </h2>
      {openTitles.length > 0 ? (
        <div>
          <p className="text-sm text-white">
            Você tem {openTitles.length}{" "}
            {openTitles.length === 1 ? "pendência financeira em aberto" : "pendências financeiras em aberto"}
            .
          </p>
          <p className="mt-1 text-xs text-text-secondary">
            Regularize seus pagamentos para manter acesso completo às disciplinas.
          </p>
        </div>
      ) : (
        <p className="text-sm text-text-secondary">Nenhuma pendência financeira em aberto no momento.</p>
      )}
    </section>
  );
}
