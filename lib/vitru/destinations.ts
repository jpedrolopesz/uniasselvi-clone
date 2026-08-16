import { resolveVitruPage, type VitruPageId } from "@/lib/vitru/page-context";
import type { VitruDestination } from "@/lib/vitru/semantic-snapshot";
import { normalizeTokens, scoreOverlap } from "@/lib/vitru/trilha-resolution";
import { isRelativelyAmbiguous, RELATIVE_AMBIGUITY_MARGIN } from "@/lib/vitru/resolution-ambiguity";

const NAVIGATION_INTENT_WORDS = new Set([
  "abra", "abrir", "abre", "mostre", "mostrar", "quero", "ver", "ir",
  "vai", "leva", "levar", "me", "minhas", "meus", "ai",
]);

export const DESTINATION_SCORE_THRESHOLD = 0.45;
export const DESTINATION_AMBIGUITY_MARGIN = RELATIVE_AMBIGUITY_MARGIN;

export function navigationTokens(text: string): string[] {
  return normalizeTokens(text).filter((token) => !NAVIGATION_INTENT_WORDS.has(token));
}

/** Score exclusivo de destino/página; resolveTarget e resolveReference continuam
 * usando scoreOverlap sem esta stoplist, pois seus verbos podem descrever o alvo. */
export function scoreDestinationOverlap(utterance: string, candidate: string): number {
  const utteranceTokens = navigationTokens(utterance);
  if (utteranceTokens.length === 0) return 0;
  const candidateTokens = new Set(navigationTokens(candidate));
  return utteranceTokens.filter((token) => candidateTokens.has(token)).length / utteranceTokens.length;
}

/** Exportado somente para tornar auditável o ganho da stoplist nos testes. */
export function scoreDestinationOverlapBeforeStoplist(utterance: string, candidate: string): number {
  return scoreOverlap(utterance, candidate);
}

/** Destinos seguros para a tela atual. A própria tela nunca é uma opção. */
export function destinationsForPage<T extends VitruDestination>(
  currentPage: VitruPageId | string,
  destinations: readonly T[]
): T[] {
  const currentPathname = currentPage.startsWith("/") ? new URL(currentPage, "https://vitru.local").pathname : null;
  return destinations.filter((destination) => {
    const pathname = new URL(destination.href, "https://vitru.local").pathname;
    return currentPathname ? pathname !== currentPathname : resolveVitruPage(pathname).id !== currentPage;
  });
}

export type ComparativeDestinationResolution<T extends VitruDestination> =
  | { outcome: "already_here"; score: number }
  | { outcome: "navigate"; score: number; destination: T }
  | { outcome: "ambiguous"; score: number }
  | { outcome: "unresolved"; score: number };

/** Uma única disputa inclui a página atual e todos os destinos navegáveis.
 * O limiar antigo de current-page (0,5) e o de destino (0,45) viram um único
 * piso de 0,45; a margem relativa de 15% decide empate para qualquer par. */
export function resolveComparativeDestination<T extends VitruDestination>(
  utterance: string,
  currentPage: { id: VitruPageId; name: string },
  destinations: readonly T[]
): ComparativeDestinationResolution<T> {
  const candidates = [
    { kind: "current" as const, value: currentPage, score: scoreDestinationOverlap(utterance, currentPage.name) },
    ...destinations.map((destination) => ({ kind: "destination" as const, value: destination, score: scoreDestinationOverlap(utterance, destination.name) })),
  ].sort((a, b) => b.score - a.score);
  const best = candidates[0];
  const second = candidates[1];
  if (!best || best.score < DESTINATION_SCORE_THRESHOLD) return { outcome: "unresolved", score: best?.score ?? 0 };
  if (second && isRelativelyAmbiguous(best.score, second.score)) {
    return { outcome: "ambiguous", score: best.score };
  }
  return best.kind === "current"
    ? { outcome: "already_here", score: best.score }
    : { outcome: "navigate", score: best.score, destination: best.value as T };
}
