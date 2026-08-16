import type { TestInfoRaw } from "@/lib/types/raw/test-content";

/**
 * `Cod.:` da avaliação e `Período para responder` aparecem no print de
 * referência mas não existem nos campos observados em `info` — por isso
 * ficam de fora até existir um campo real para eles (ver conversa: dados
 * ainda não enviados).
 */
export function TestInfoCard({ info }: { info: TestInfoRaw }) {
  return (
    <div className="flex flex-col gap-4 rounded-xl bg-bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-semibold text-white">{info.description}</p>
        <p className="text-xs text-text-secondary">
          {info.subject_name} ({info.subject_code})
        </p>
      </div>

      <div className="flex gap-6">
        <div>
          <p className="text-[10px] uppercase text-text-secondary">Prova</p>
          <p className="text-sm font-semibold text-white">{info.test_code}</p>
        </div>
      </div>
    </div>
  );
}
