import { resolveVitruPage, type VitruPageId } from "@/lib/vitru/page-context";
import type { VitruDestination } from "@/lib/vitru/semantic-snapshot";
import { scoreOverlap } from "@/lib/vitru/trilha-resolution";

export function isCurrentPageRequest(utterance: string, currentPageName: string): boolean {
  return scoreOverlap(utterance, currentPageName) >= 0.5;
}

/** Destinos seguros para a tela atual. A própria tela nunca é uma opção. */
export function destinationsForPage<T extends VitruDestination>(
  currentPageId: VitruPageId,
  destinations: readonly T[]
): T[] {
  return destinations.filter((destination) => {
    const pathname = new URL(destination.href, "https://vitru.local").pathname;
    return resolveVitruPage(pathname).id !== currentPageId;
  });
}
