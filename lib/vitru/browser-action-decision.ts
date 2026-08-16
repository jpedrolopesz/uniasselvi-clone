import { isSafeInternalHref, resolveVitruPage, type VitruPageId } from "@/lib/vitru/page-context";
import type { VitruSemanticSnapshot } from "@/lib/vitru/semantic-snapshot";
import { resolveTarget } from "@/lib/vitru/resolve-target";
import { resolveComparativeDestination } from "@/lib/vitru/destinations";
import { isClarificationUnnecessaryForPage } from "@/lib/vitru/clarify-scope";
import { REFERENCE_CONFIDENCE_THRESHOLD, resolveReference } from "@/lib/vitru/resolve-reference";
import { coerceShowToScheduleSelection } from "@/lib/vitru/schedule-action-routing";
import { actionForFocus, focusForAction, isAnaphoricUtterance, type VitruFocus } from "@/lib/vitru/conversation-focus";

export type BrowserAction =
  | { id: string; type: "navigate"; href: string; utterance?: string }
  | { id: string; type: "navigate"; destination_id: string; utterance?: string }
  | { id: string; type: "go_back" }
  | { id: string; type: "go_forward" }
  | { id: string; type: "highlight"; target: string }
  | { id: string; type: "show"; referencia: string }
  | { id: string; type: "close"; referencia: string }
  | { id: string; type: "close"; target: string }
  | { id: string; type: "list_options" }
  | { id: string; type: "select_option"; referencia: string }
  | { id: string; type: "confirm_write" }
  | { id: string; type: "clarify"; pergunta: string };

export type DebugDecision = { kind: "action" | "metric"; data: Record<string, unknown> };
export type BrowserActionDecision =
  | { type: "respond"; ok: boolean; message: string; alreadyHere?: boolean; details?: Record<string, unknown>; debug?: DebugDecision }
  | { type: "navigate"; href: string; intent?: { type: "show" | "close"; referencia: string }; debug?: DebugDecision }
  | { type: "history"; direction: "back" | "forward" }
  | { type: "highlight"; target: string; success: { ok: boolean; message: string }; failure: { ok: boolean; message: string }; resolvedFocus?: VitruFocus; debug?: DebugDecision }
  | { type: "close"; target: string; success: string; failure: string }
  | { type: "schedule"; action: Extract<BrowserAction, { type: "list_options" | "select_option" | "confirm_write" }>; debug?: DebugDecision };

const contractViolation = (action: Extract<BrowserAction, { type: "navigate" }>, data: Record<string, unknown>): DebugDecision => ({
  kind: "action",
  data: { type: "contract_violation", backend: "bedrock", tool: "navigate_to", value: "destination_id" in action ? action.destination_id : action.href, actionId: action.id, ...data },
});

export function decideBrowserAction(
  action: BrowserAction,
  snapshot: VitruSemanticSnapshot | null,
  page: { id: VitruPageId; name: string; pathname?: string }
): BrowserActionDecision {
  const utterance = action.type === "navigate" ? action.utterance ?? "" : action.type === "show" ? action.referencia : "";
  if ((action.type === "navigate" || action.type === "show") && isAnaphoricUtterance(utterance)) {
    const focusedAction = snapshot ? actionForFocus(snapshot) : null;
    if (!focusedAction) return { type: "respond", ok: true, message: "Não tenho uma referência atual para isso. Qual item você quer?", details: { anaphora_without_focus: 1 } };
    return {
      type: "highlight", target: `id:${focusedAction}`,
      success: { ok: true, message: "Ação referenciada localizada e destacada." },
      failure: { ok: false, message: "A referência existe, mas a ação não está visível." },
      resolvedFocus: focusForAction(snapshot!, focusedAction) ?? undefined,
      debug: { kind: "action", data: { type: "anaphora_resolved_from_focus", actionId: action.id, resolvedTarget: focusedAction } },
    };
  }
  if (action.type === "navigate") {
    let href = "destination_id" in action ? snapshot?.destinations.find(destination => destination.id === action.destination_id)?.href : action.href;
    let debug: DebugDecision | undefined;
    if (!href && "destination_id" in action && snapshot) {
      const resolution = resolveComparativeDestination(action.utterance || action.destination_id, page, snapshot.destinations);
      if (resolution.outcome === "already_here") return { type: "respond", ok: true, message: "Você já está nesta página.", alreadyHere: true };
      if (resolution.outcome === "ambiguous") return { type: "respond", ok: false, message: "Encontrei mais de uma página possível. Qual delas você quer abrir?", debug: contractViolation(action, { resolution: "ambiguous" }) };
      if (resolution.outcome === "navigate") {
        href = resolution.destination.href;
        debug = contractViolation(action, { resolvedTarget: resolution.destination.id, resolverScore: resolution.score });
      }
    }
    if (!href) {
      if ("destination_id" in action && snapshot) {
        const resolution = resolveTarget(action.destination_id, snapshot);
        if (resolution.actionId) return {
          type: "highlight", target: `id:${resolution.actionId}`,
          success: { ok: false, message: "A navegação pedida não foi executada; ofereci como alternativa destacar a ação relacionada." },
          failure: { ok: false, message: "Destino desconhecido no snapshot atual." },
          debug: contractViolation(action, { resolvedTarget: resolution.actionId, resolverScore: resolution.score }),
        };
      }
      return { type: "respond", ok: false, message: "Destino desconhecido no snapshot atual." };
    }
    const knownSubjectCodes = new Set((snapshot?.destinations ?? []).flatMap((destination) => {
      const code = resolveVitruPage(new URL(destination.href, "https://vitru.local").pathname).params.subjectCode;
      return code ? [code] : [];
    }));
    if (!isSafeInternalHref(href, knownSubjectCodes)) return { type: "respond", ok: false, message: "Destino recusado: a rota não pertence ao catálogo seguro do Vitru." };
    const targetPathname = new URL(href, "https://vitru.local").pathname;
    if (page.pathname ? targetPathname === page.pathname : resolveVitruPage(targetPathname).id === page.id) return { type: "respond", ok: true, message: "Você já está nesta página.", alreadyHere: true };
    return { type: "navigate", href, debug };
  }
  if (action.type === "go_back" || action.type === "go_forward") return { type: "history", direction: action.type === "go_back" ? "back" : "forward" };
  if (action.type === "highlight") return { type: "highlight", target: action.target, success: { ok: true, message: "Componente localizado e destacado." }, failure: { ok: false, message: "O componente não está visível nesta página." } };
  if (action.type === "show") {
    const resolution = snapshot ? resolveTarget(action.referencia, snapshot) : null;
    if (resolution?.ambiguous) return { type: "respond", ok: false, message: "Encontrei mais de uma opção. Qual delas você quer?" };
    if (resolution?.actionId) {
      const coerced = coerceShowToScheduleSelection(page.id, resolution, action);
      if (coerced) return { type: "schedule", action: coerced, debug: { kind: "metric", data: { show_coerced_to_select: 1, actionId: action.id, resolvedTarget: resolution.actionId, resolverScore: resolution.score } } };
      return { type: "highlight", target: `id:${resolution.actionId}`, success: { ok: true, message: "Ação localizada e destacada." }, failure: { ok: false, message: "A ação existe, mas não está visível nesta página." }, resolvedFocus: focusForAction(snapshot!, resolution.actionId) ?? undefined };
    }
    const assessmentsHref = snapshot?.destinations.find(destination => destination.id === "assessments")?.href;
    const knownSubjectCodes = new Set((snapshot?.destinations ?? []).flatMap((destination) => {
      const code = resolveVitruPage(new URL(destination.href, "https://vitru.local").pathname).params.subjectCode;
      return code ? [code] : [];
    }));
    return assessmentsHref && isSafeInternalHref(assessmentsHref, knownSubjectCodes)
      ? { type: "navigate", href: assessmentsHref, intent: { type: "show", referencia: action.referencia } }
      : { type: "respond", ok: false, message: "Não encontrei uma ação compatível no snapshot atual." };
  }
  if (action.type === "close") {
    if ("target" in action) return { type: "close", target: action.target, success: "Interface fechada.", failure: "Não encontrei um controle de fechar seguro nesse componente." };
    const resolution = snapshot ? resolveTarget(action.referencia, snapshot) : null;
    if (resolution?.ambiguous) return { type: "respond", ok: false, message: "Encontrei mais de uma interface possível. Qual delas você quer fechar?" };
    return resolution?.actionId
      ? { type: "close", target: `id:${resolution.actionId}`, success: "Interface fechada.", failure: "O alvo existe, mas não tem um controle seguro para fechar." }
      : { type: "respond", ok: false, message: "Não encontrei a interface descrita na página atual." };
  }
  if (action.type === "clarify") {
    if (isClarificationUnnecessaryForPage(page.id)) return { type: "respond", ok: false, message: "Esta tela já é sobre uma avaliação específica. Use listar_opcoes para mostrar os horários.", details: { unnecessary_question: 1 }, debug: { kind: "metric", data: { unnecessary_question: 1, question: action.pergunta, resolution: "scheduling_scope" } } };
    const resolution = snapshot ? resolveReference(action.pergunta, snapshot) : null;
    if (resolution && resolution.kind === "entity" && resolution.confidence >= REFERENCE_CONFIDENCE_THRESHOLD && snapshot) {
      const focusedSnapshot = { ...snapshot, state: { ...snapshot.state, focus: { type: "conversation_entity", id: String(resolution.value) } } };
      const resolvedAction = actionForFocus(focusedSnapshot);
      if (resolvedAction) return {
        type: "highlight", target: `id:${resolvedAction}`,
        success: { ok: true, message: "A referência já estava resolvida; localizei a ação segura correspondente." },
        failure: { ok: false, message: "A referência foi resolvida, mas a ação não está visível." },
        resolvedFocus: { type: "conversation_entity", id: String(resolution.value) },
        debug: { kind: "action", data: { type: "clarify_coerced_to_highlight", actionId: action.id, resolution, resolvedTarget: resolvedAction } },
      };
    }
    if (resolution && resolution.kind !== "ambiguous" && resolution.kind !== "unresolved" && resolution.confidence >= REFERENCE_CONFIDENCE_THRESHOLD) return { type: "respond", ok: false, message: "A pergunta é desnecessária: a referência já foi resolvida pelo contexto.", details: { resolution, resolvedEntity: resolution.value, unnecessary_question: 1 }, debug: { kind: "metric", data: { unnecessary_question: 1, question: action.pergunta, resolution } } };
    return { type: "respond", ok: true, message: action.pergunta };
  }
  if (!(["assessment-scheduling", "study-calendar"] as VitruPageId[]).includes(page.id)) return { type: "respond", ok: false, message: "Esta ferramenta só pode ser usada em uma tela de agendamento." };
  return { type: "schedule", action };
}
