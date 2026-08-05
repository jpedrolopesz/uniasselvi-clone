import type { AssistantSuggestion } from "@/lib/study-planner/ai-assistant";
import type { SuggestionStatus } from "@/components/study-planner/chat-types";
import { CATEGORY_META } from "@/lib/study-planner/category-meta";
import { formatDurationLabel } from "@/lib/study-planner/date-utils";
import { formatDateBr } from "@/lib/formatters/date-formatters";
import { CheckCircleIcon } from "@/components/icons";

interface SuggestionCardProps {
  suggestion: AssistantSuggestion;
  status: SuggestionStatus;
  onAccept: () => void;
  onReject: () => void;
}

export function SuggestionCard({ suggestion, status, onAccept, onReject }: SuggestionCardProps) {
  const meta = CATEGORY_META[suggestion.category];

  return (
    <div className="rounded-xl border border-border-subtle bg-bg-app p-3.5">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold text-white">{suggestion.title}</p>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${meta.badgeClassName}`}>
          {meta.label}
        </span>
      </div>

      <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-text-secondary">
        <div>
          <dt className="sr-only">Data</dt>
          <dd>{formatDateBr(suggestion.date)}</dd>
        </div>
        <div>
          <dt className="sr-only">Duração</dt>
          <dd>{formatDurationLabel(suggestion.startTime, suggestion.endTime)}</dd>
        </div>
        <div className="col-span-2">
          <dt className="sr-only">Horário</dt>
          <dd>
            {suggestion.startTime} — {suggestion.endTime}
          </dd>
        </div>
      </dl>

      {status === "pending" && (
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={onAccept}
            className="flex-1 rounded-full bg-brand-yellow px-3 py-1.5 text-xs font-semibold text-black transition hover:bg-brand-yellow-dark"
          >
            Adicionar ao calendário
          </button>
          <button
            type="button"
            onClick={onReject}
            className="rounded-full border border-border-subtle px-3 py-1.5 text-xs font-medium text-text-secondary transition hover:bg-bg-card-hover hover:text-white"
          >
            Recusar
          </button>
        </div>
      )}

      {status === "accepted" && (
        <p className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-accent-green">
          <CheckCircleIcon className="h-4 w-4" />
          Adicionada ao calendário
        </p>
      )}

      {status === "rejected" && (
        <p className="mt-3 text-xs text-text-secondary">Sugestão recusada.</p>
      )}
    </div>
  );
}
