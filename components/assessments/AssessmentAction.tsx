import Link from "next/link";
import type { AssessmentUiState } from "@/lib/types/derived";

interface AssessmentActionProps {
  uiState: AssessmentUiState;
  /** Rota da prova (ver TestRunner) — só usada quando a ação está habilitada. */
  href?: string;
}

export function AssessmentAction({ uiState, href }: AssessmentActionProps) {
  const className = [
    "w-full rounded-full px-4 py-2 text-center text-sm font-semibold transition",
    uiState.isActionEnabled
      ? "bg-accent-green text-black hover:brightness-110"
      : "cursor-not-allowed bg-bg-app text-text-secondary/60",
  ].join(" ");

  if (uiState.isActionEnabled && href) {
    return (
      <Link href={href} className={className}>
        {uiState.actionLabel}
      </Link>
    );
  }

  return (
    <button
      type="button"
      disabled={!uiState.isActionEnabled}
      title={uiState.isActionEnabled ? undefined : "Indisponível no momento"}
      className={className}
    >
      {uiState.actionLabel}
    </button>
  );
}
