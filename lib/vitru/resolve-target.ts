import type { VitruSemanticSnapshot } from "@/lib/vitru/semantic-snapshot";
import { scoreOverlap } from "@/lib/vitru/trilha-resolution";

export const TARGET_SCORE_THRESHOLD = 0.45;
export const TARGET_AMBIGUITY_MARGIN = 0.15;

export interface TargetResolution {
  actionId: string | null;
  score: number;
  candidates: { actionId: string; score: number }[];
  ambiguous: boolean;
}

/** Resolve linguagem aproximada somente contra o snapshot que a aplicação publicou. */
export function resolveTarget(
  phrase: string,
  snapshot: VitruSemanticSnapshot
): TargetResolution {
  const owners = new Map<string, string[]>();
  for (const section of snapshot.sections) {
    for (const item of section.items) {
      const vocabulary = [item.name, item.status].filter(Boolean).join(" ");
      for (const actionId of item.actionIds) {
        owners.set(actionId, [...(owners.get(actionId) ?? []), vocabulary]);
      }
    }
  }

  const candidates = snapshot.actions
    .map((action) => ({
      actionId: action.id,
      score: scoreOverlap(phrase, [action.label, ...(owners.get(action.id) ?? [])].join(" ")),
    }))
    .sort((a, b) => b.score - a.score || a.actionId.localeCompare(b.actionId))
    .slice(0, 3);
  const best = candidates[0];
  const second = candidates[1];
  const ambiguous = Boolean(
    best &&
      best.score >= TARGET_SCORE_THRESHOLD &&
      second &&
      second.score >= best.score * (1 - TARGET_AMBIGUITY_MARGIN)
  );

  return {
    actionId: best && best.score >= TARGET_SCORE_THRESHOLD && !ambiguous ? best.actionId : null,
    score: best?.score ?? 0,
    candidates,
    ambiguous,
  };
}
