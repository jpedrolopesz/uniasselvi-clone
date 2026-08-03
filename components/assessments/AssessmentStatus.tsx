import { formatWeight } from "@/lib/formatters/number-formatters";
import type { AssessmentUiState } from "@/lib/types/derived";

export function AssessmentStatus({
  weight,
  uiState,
}: {
  weight: string;
  uiState: AssessmentUiState;
}) {
  return (
    <div className="grid grid-cols-3 gap-2 text-center">
      <div className="rounded-md bg-bg-app p-2">
        <p className="text-[10px] uppercase text-text-secondary">Nota</p>
        <p className="text-sm font-semibold text-white">{uiState.gradeDisplay}</p>
      </div>
      <div className="rounded-md bg-bg-app p-2">
        <p className="text-[10px] uppercase text-text-secondary">Peso</p>
        <p className="text-sm font-semibold text-white">{formatWeight(weight)}</p>
      </div>
      <div className="rounded-md bg-bg-app p-2">
        <p className="text-[10px] uppercase text-text-secondary">Publicado</p>
        <p className="text-sm font-semibold text-white">{uiState.publishedDisplay}</p>
      </div>
    </div>
  );
}
