import type { VitruPageId } from "@/lib/vitru/page-context";

/**
 * Páginas cujo fluxo já está no escopo de um único item (uma avaliação, um
 * agendamento) nunca têm uma ambiguidade real de "qual atividade" — a ação
 * determinística de listar as opções atuais sempre resolve o pedido. Pedir
 * esclarecimento aqui é sempre desnecessário, mesmo que o modelo tente.
 */
const PAGES_WITHOUT_ITEM_AMBIGUITY = new Set<VitruPageId>(["assessment-scheduling"]);

export function isClarificationUnnecessaryForPage(pageId: VitruPageId): boolean {
  return PAGES_WITHOUT_ITEM_AMBIGUITY.has(pageId);
}
