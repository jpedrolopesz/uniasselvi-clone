import type { VitruSemanticSnapshot, VitruSnapshotState } from "@/lib/vitru/semantic-snapshot";
import { normalizeLexical } from "@/lib/vitru/trilha-resolution";

export type VitruFocus = NonNullable<VitruSnapshotState["focus"]>;

export function snapshotContainsFocus(snapshot: VitruSemanticSnapshot, focus: VitruFocus): boolean {
  return snapshot.actions.some(action => action.id === focus.id)
    || snapshot.sections.some(section => section.items.some(item => item.id === focus.id));
}

/** Foco explícito da UI vence; conversa só preenche ausência e nunca ressuscita
 * uma entidade que deixou de existir no snapshot atual. */
export function withConversationFocus(snapshot: VitruSemanticSnapshot, conversationFocus: VitruFocus | null): VitruSemanticSnapshot {
  if (snapshot.state.focus) return snapshot;
  const focus = conversationFocus && snapshotContainsFocus(snapshot, conversationFocus) ? conversationFocus : null;
  return { ...snapshot, state: { ...snapshot.state, focus } };
}

export function focusForAction(snapshot: VitruSemanticSnapshot, actionId: string): VitruFocus | null {
  for (const section of snapshot.sections) {
    const owner = section.items.find(item => item.actionIds.includes(actionId));
    if (owner) return { type: "conversation_entity", id: owner.id };
  }
  return snapshot.actions.some(action => action.id === actionId)
    ? { type: "conversation_action", id: actionId }
    : null;
}

export function actionForFocus(snapshot: VitruSemanticSnapshot): string | null {
  const focus = snapshot.state.focus;
  if (!focus || !snapshotContainsFocus(snapshot, focus)) return null;
  if (snapshot.actions.some(action => action.id === focus.id)) return focus.id;
  const item = snapshot.sections.flatMap(section => section.items).find(candidate => candidate.id === focus.id);
  return item?.actionIds.length === 1 ? item.actionIds[0] : null;
}

export function isAnaphoricUtterance(text: string): boolean {
  const value = normalizeLexical(text);
  // Expressões fechadas evitam tratar "essa semana", "esse mês" ou
  // demonstrativos acompanhados de um substantivo explícito como anáfora.
  return /\b(?:essa|esse)(?:\s+ai)?\b(?!\s+(?:semana|mes|pagina|avaliacao|atividade|evento|item))/u.test(value)
    || /\b[oa]\s+anterior\b/u.test(value)
    || /\b[oa]\s+mesm[oa]\b/u.test(value)
    || /\b[oa]\s+que\s+voce\s+(?:falou|mencionou)(?:\s+antes)?\b/u.test(value);
}
