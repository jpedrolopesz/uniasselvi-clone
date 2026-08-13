"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, type SVGProps } from "react";
import { VitruLogo, type VitruLogoState } from "@/components/vitru/VitruLogo";
import type { AssistantSuggestion } from "@/lib/study-planner/ai-assistant";
import { announcePlanPreviews } from "@/components/vitru/planner-events";
import {
  buildBrowserContext,
  closeVitruTarget,
  highlightVitruTarget,
  stableContextHash,
  VITRU_ASSISTANT_ROOT_ATTRIBUTE,
} from "@/components/vitru/browser-context";
import { isSafeInternalHref, resolveVitruPage, VITRU_NAVIGATION_DESTINATIONS } from "@/lib/vitru/page-context";
import { useSemanticSnapshot } from "@/components/vitru/SemanticSnapshotProvider";
import { redactSemanticSnapshot } from "@/lib/vitru/snapshot-redaction";
import { resolveTarget } from "@/lib/vitru/resolve-target";
import { appendVitruDebug } from "@/lib/vitru/debug-store";
import { destinationsForPage, isCurrentPageRequest } from "@/lib/vitru/destinations";
import { REFERENCE_CONFIDENCE_THRESHOLD, resolveReference } from "@/lib/vitru/resolve-reference";

type ConversationState = "active" | "pending" | "alert";
type CallState = "idle" | "connecting" | "in-call" | "error";
type VoiceMode = "cascade" | "sonic";

const VOICE_SERVICE_URL =
  process.env.NEXT_PUBLIC_VITRU_VOICE_URL?.replace(/\/$/, "") ?? "http://localhost:3001";
const VITRU_DEBUG = process.env.NEXT_PUBLIC_VITRU_DEBUG === "1";

interface VoiceAssistantWindowProps {
  activeUserId: string;
}

interface CalendarPlanResponse {
  reply?: string;
  actions?: Array<{ type?: string; suggestions?: AssistantSuggestion[] }>;
}

type BrowserAction =
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

interface PendingNavigation {
  action: BrowserAction;
  intent?: { type: "show" | "close"; referencia: string };
  timeout: number;
}

const STATE_CONTENT: Record<
  ConversationState,
  { label: string; title: string; message: string; hint: string; color: string }
> = {
  active: {
    label: "Ativo",
    title: "Conversa iniciada",
    message: "Olá! Sou seu assistente virtual. Como posso ajudar hoje?",
    hint: "Disponível para conversar",
    color: "bg-accent-green",
  },
  pending: {
    label: "Pendente",
    title: "Conversa pendente",
    message: "Sua conversa ficou pausada. Quando quiser, podemos continuar de onde paramos.",
    hint: "Continuar conversa",
    color: "bg-brand-yellow",
  },
  alert: {
    label: "Alerta",
    title: "Você tem um alerta",
    message: "Há uma atividade próxima do prazo. Posso ajudar você a se organizar.",
    hint: "Ouvir alerta",
    color: "bg-accent-red",
  },
};

function MicrophoneIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M6 11a6 6 0 0 0 12 0M12 17v4M9 21h6" strokeLinecap="round" />
    </svg>
  );
}

function CloseIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
      <path d="m7 7 10 10M17 7 7 17" strokeLinecap="round" />
    </svg>
  );
}

function PhoneIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
      <path d="M6.6 3.5 9 8l-2 1.7a14.6 14.6 0 0 0 7.3 7.3l1.7-2 4.5 2.4-.8 3c-.3 1-1.2 1.6-2.2 1.5C9.3 21 3 14.7 2.1 6.5 2 5.5 2.6 4.6 3.6 4.3l3-.8Z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PhoneOffIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
      <path d="M5 15.5c4.5-3.3 9.5-3.3 14 0M5 15.5l-2 2.7 3 2.3 2.2-2.9M19 15.5l2 2.7-3 2.3-2.2-2.9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function isAssessmentRunner(pathname: string): boolean {
  return /^\/disciplinas\/[^/]+\/notas-avaliacoes\/[^/]+\/?$/.test(pathname);
}

function semanticSnapshotForModel(snapshot: NonNullable<ReturnType<typeof useSemanticSnapshot>>) {
  const filtered = redactSemanticSnapshot(snapshot);
  if (VITRU_DEBUG && filtered.removedFields.length > 0) {
    console.warn(JSON.stringify({ event: "snapshot_fields_removed", fields: filtered.removedFields }));
  }
  appendVitruDebug({ kind: "redaction", data: { removedFields: filtered.removedFields } });
  return {
    ...filtered.snapshot,
    destinations: filtered.snapshot.destinations.map(({ id, name }) => ({ id, name })),
  };
}

function compactCurrentSnapshot(snapshot: NonNullable<ReturnType<typeof useSemanticSnapshot>>) {
  const filtered = semanticSnapshotForModel(snapshot);
  return { version: filtered.version, status: filtered.status, page: filtered.page, state: filtered.state };
}

export function VoiceAssistantWindow({ activeUserId }: VoiceAssistantWindowProps) {
  const pathname = usePathname();
  const router = useRouter();
  const semanticSnapshot = useSemanticSnapshot();
  const page = useMemo(() => resolveVitruPage(pathname), [pathname]);
  const [isOpen, setIsOpen] = useState(true);
  const [conversationState] = useState<ConversationState>("active");
  const [callState, setCallState] = useState<CallState>("idle");
  const [isMuted, setIsMuted] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [callError, setCallError] = useState<string | null>(null);
  const [voiceMode, setVoiceMode] = useState<VoiceMode>("cascade");
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const observerTimeoutRef = useRef<number | null>(null);
  const lastContextHashRef = useRef<string | null>(null);
  const lastContextSentAtRef = useRef(0);
  const contextVersionRef = useRef(0);
  const suppressedContextCountRef = useRef(0);
  const publishContextRef = useRef<() => void>(() => undefined);
  const pendingNavigationsRef = useRef(new Map<string, PendingNavigation>());
  const pendingScheduleActionsRef = useRef(new Map<string, BrowserAction>());
  const lastAppliedEventVersionRef = useRef(0);
  const executeBrowserActionRef = useRef<(action: BrowserAction) => void>(() => undefined);
  const semanticSnapshotRef = useRef(semanticSnapshot);
  const requestedCalendarPlanRef = useRef<string | null>(null);
  const [calendarReply, setCalendarReply] = useState<string | null>(null);
  const [calendarSuggestions, setCalendarSuggestions] = useState<AssistantSuggestion[]>([]);
  const [isPlanning, setIsPlanning] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const isCalendarMode = pathname === "/calendario-de-estudos";

  const chooseVoiceMode = (mode: VoiceMode) => {
    setVoiceMode(mode);
  };

  useEffect(() => {
    if (callState !== "in-call") return;
    const interval = window.setInterval(() => setElapsedSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(interval);
  }, [callState]);

  const releaseCall = useCallback(() => {
    dataChannelRef.current?.close();
    dataChannelRef.current = null;
    peerConnectionRef.current?.close();
    peerConnectionRef.current = null;
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    localStreamRef.current = null;
    if (remoteAudioRef.current) remoteAudioRef.current.srcObject = null;
  }, []);

  useEffect(() => releaseCall, [releaseCall]);

  const sendAppMessage = useCallback((message: object) => {
    const channel = dataChannelRef.current;
    if (channel?.readyState === "open") channel.send(JSON.stringify(message));
  }, []);

  const sendActionResult = useCallback((action: BrowserAction, ok: boolean, message: string, details?: Record<string, unknown>) => {
    setActionNotice(message);
    window.setTimeout(() => setActionNotice(null), 5_000);
    const version = contextVersionRef.current;
    lastAppliedEventVersionRef.current = Math.max(lastAppliedEventVersionRef.current, version);
    sendAppMessage({
      type: ok ? "action_completed" : "action_failed",
      actionId: action.id,
      version,
      actionType: action.type,
      ok,
      message,
      ...details,
    });
    appendVitruDebug({ kind: "action", data: { type: ok ? "action_completed" : "action_failed", actionId: action.id, version, ok, message, premature_success: 0, unauthorized_write: 0 } });
  }, [sendAppMessage]);

  const sendActionEvent = useCallback((type: string, actionId: string, version = contextVersionRef.current) => {
    sendAppMessage({ type, actionId, version });
    appendVitruDebug({ kind: "action", data: { type, actionId, version } });
  }, [sendAppMessage]);

  const publishContext = useCallback(() => {
    const contextForHash = semanticSnapshot
      ? { mode: "semantic" as const, snapshot: semanticSnapshotForModel(semanticSnapshot) }
      : { mode: "dom" as const, context: buildBrowserContext(page) };
    const hash = stableContextHash(contextForHash);
    if (hash === lastContextHashRef.current) {
      suppressedContextCountRef.current += 1;
      if (VITRU_DEBUG) {
        console.debug(JSON.stringify({
          event: "page_context_suppressed",
          reason: "identical_hash",
          count: suppressedContextCountRef.current,
        }));
      }
      return;
    }
    const now = performance.now();
    const wait = pendingNavigationsRef.current.size > 0
      ? 0
      : Math.max(0, 750 - (now - lastContextSentAtRef.current));
    if (wait > 0) {
      if (observerTimeoutRef.current !== null) window.clearTimeout(observerTimeoutRef.current);
      observerTimeoutRef.current = window.setTimeout(publishContextRef.current, wait);
      return;
    }
    lastContextHashRef.current = hash;
    lastContextSentAtRef.current = now;
    contextVersionRef.current += 1;
    const context = semanticSnapshot
      ? {
          mode: "semantic" as const,
          snapshot: { ...semanticSnapshotForModel(semanticSnapshot), version: contextVersionRef.current },
        }
      : contextForHash;
    sendAppMessage({ type: "page_context", version: contextVersionRef.current, context });
    appendVitruDebug({ kind: "snapshot", data: { version: contextVersionRef.current, context, approximateTokens: Math.ceil(JSON.stringify(context).length / 4) } });
    if (semanticSnapshot?.status === "ready") {
      const pending = [...pendingNavigationsRef.current.entries()][0];
      sendActionEvent("page_ready", pending?.[0] ?? "page", contextVersionRef.current);
    }
  }, [page, semanticSnapshot, sendActionEvent, sendAppMessage]);

  useEffect(() => {
    publishContextRef.current = publishContext;
    semanticSnapshotRef.current = semanticSnapshot;
  }, [publishContext, semanticSnapshot]);

  useEffect(() => {
    if (callState !== "in-call") return;
    const frame = window.requestAnimationFrame(publishContext);
    const observer = new MutationObserver((mutations) => {
      const hasExternalMutation = mutations.some((mutation) => {
        const target = mutation.target instanceof Element ? mutation.target : mutation.target.parentElement;
        return !target?.closest(`[${VITRU_ASSISTANT_ROOT_ATTRIBUTE}]`);
      });
      if (!hasExternalMutation) return;
      if (observerTimeoutRef.current !== null) window.clearTimeout(observerTimeoutRef.current);
      observerTimeoutRef.current = window.setTimeout(publishContextRef.current, 250);
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["disabled", "aria-disabled", "open"],
    });
    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
      if (observerTimeoutRef.current !== null) window.clearTimeout(observerTimeoutRef.current);
    };
  }, [callState, publishContext]);

  useEffect(() => {
    if (semanticSnapshot?.status !== "ready") return;
    // Publica o snapshot pronto antes de liberar o resultado da ferramenta.
    publishContext();
    for (const [actionId, pending] of pendingNavigationsRef.current) {
      window.clearTimeout(pending.timeout);
      pendingNavigationsRef.current.delete(actionId);
      sendActionEvent("page_ready", actionId, contextVersionRef.current);
      if (pending.intent) {
        const resolution = resolveTarget(pending.intent.referencia, semanticSnapshot);
        if (resolution.ambiguous) {
          sendActionResult(pending.action, false, "Encontrei mais de uma opção. Qual delas você quer?");
          continue;
        }
        if (!resolution.actionId) {
          sendActionResult(pending.action, false, "Não encontrei essa ação na página carregada.");
          continue;
        }
        const ok = pending.intent.type === "show"
          ? highlightVitruTarget(`id:${resolution.actionId}`)
          : closeVitruTarget(`id:${resolution.actionId}`);
        sendActionResult(pending.action, ok, ok ? "Ação localizada após a navegação." : "A ação existe, mas o controle não está disponível.");
      } else {
        sendActionResult(pending.action, true, "Navegação confirmada com os dados da página prontos.");
      }
    }
  }, [publishContext, semanticSnapshot, sendActionEvent, sendActionResult]);

  useEffect(() => () => {
    for (const pending of pendingNavigationsRef.current.values()) window.clearTimeout(pending.timeout);
    pendingNavigationsRef.current.clear();
  }, []);

  useEffect(() => {
    const handleScheduleResult = (event: Event) => {
      const detail = (event as CustomEvent<{ actionId: string; ok: boolean; message: string; resolvedTarget?: string; resolverScore?: number }>).detail;
      const action = pendingScheduleActionsRef.current.get(detail.actionId);
      if (!action) return;
      pendingScheduleActionsRef.current.delete(detail.actionId);
      if (action.type === "confirm_write" && detail.ok) sendActionEvent("page_ready", action.id);
      appendVitruDebug({ kind: "action", data: { type: detail.ok ? "action_completed" : "action_failed", ...detail, premature_success: 0, unauthorized_write: 0 } });
      sendActionResult(action, detail.ok, detail.message);
    };
    window.addEventListener("vitru-schedule-result", handleScheduleResult);
    return () => window.removeEventListener("vitru-schedule-result", handleScheduleResult);
  }, [sendActionEvent, sendActionResult]);

  useEffect(() => {
    if (!isCalendarMode || requestedCalendarPlanRef.current === activeUserId) return;
    requestedCalendarPlanRef.current = activeUserId;
    let cancelled = false;

    const loadPlan = async () => {
      setIsPlanning(true);
      setIsOpen(true);
      setCalendarReply(null);
      setCalendarSuggestions([]);
      try {
        const response = await fetch("/api/v1/vitru/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            surface: "calendario",
            objectId: activeUserId,
            message: "Analise meu calendário e organize minha semana de estudos.",
          }),
        });
        const result = (await response.json()) as CalendarPlanResponse;
        if (!response.ok) throw new Error("Não foi possível analisar o calendário.");
        const suggestions =
          result.actions?.find((action) => action.type === "confirm_plan")?.suggestions ?? [];
        if (!cancelled) {
          setCalendarReply(result.reply ?? "Analisei seu calendário.");
          setCalendarSuggestions(suggestions);
          announcePlanPreviews(suggestions);
        }
      } catch {
        if (!cancelled) {
          setCalendarReply("Não consegui analisar seu calendário agora. Você ainda pode iniciar uma chamada comigo.");
        }
      } finally {
        if (!cancelled) setIsPlanning(false);
      }
    };

    void loadPlan();
    return () => {
      cancelled = true;
    };
  }, [activeUserId, isCalendarMode]);

  function executeBrowserAction(action: BrowserAction) {
    let ok = false;
    let message = "Ação não reconhecida.";
    sendActionEvent("action_started", action.id);

    const beginNavigation = (href: string, intent?: PendingNavigation["intent"]) => {
      contextVersionRef.current += 1;
      sendActionEvent("page_loading", action.id, contextVersionRef.current);
      const timeout = window.setTimeout(() => {
        pendingNavigationsRef.current.delete(action.id);
        sendActionResult(action, false, "A nova página não ficou pronta a tempo.");
      }, 5_000);
      pendingNavigationsRef.current.set(action.id, { action, intent, timeout });
      setActionNotice("Navegação iniciada. Aguardando os dados da nova página.");
      router.push(href);
    };

    if (action.type === "navigate") {
      if (action.utterance && isCurrentPageRequest(action.utterance, page.name)) {
        const snapshot = semanticSnapshotRef.current;
        sendActionResult(action, true, "Você já está nesta página.", {
          status: "already_here",
          snapshot: snapshot ? compactCurrentSnapshot(snapshot) : { page, state: buildBrowserContext(page).state },
        });
        return;
      }
      const href = "destination_id" in action
        ? semanticSnapshotRef.current?.destinations.find((destination) => destination.id === action.destination_id)?.href
        : action.href;
      if (!href) {
        if ("destination_id" in action && semanticSnapshotRef.current) {
          const resolution = resolveTarget(action.destination_id, semanticSnapshotRef.current);
          if (resolution.actionId && highlightVitruTarget(`id:${resolution.actionId}`)) {
            appendVitruDebug({ kind: "action", data: { type: "contract_violation", backend: "bedrock", tool: "navigate_to", value: action.destination_id, actionId: action.id, resolvedTarget: resolution.actionId, resolverScore: resolution.score } });
            sendActionResult(action, false, "A navegação pedida não foi executada; ofereci como alternativa destacar a ação relacionada.");
            return;
          }
        }
        sendActionResult(action, false, "Destino desconhecido no snapshot atual.");
        return;
      }
      if (isSafeInternalHref(href)) {
        const destinationPage = resolveVitruPage(new URL(href, window.location.origin).pathname);
        if (destinationPage.id === page.id) {
          const snapshot = semanticSnapshotRef.current;
          sendActionResult(action, true, "Você já está nesta página.", {
            status: "already_here",
            snapshot: snapshot ? compactCurrentSnapshot(snapshot) : { page, state: buildBrowserContext(page).state },
          });
          return;
        }
        beginNavigation(href);
        return;
      }
      message = "Destino recusado: a rota não pertence ao catálogo seguro do Vitru.";
    } else if (action.type === "go_back") {
      contextVersionRef.current += 1;
      sendActionEvent("page_loading", action.id, contextVersionRef.current);
      const timeout = window.setTimeout(() => {
        pendingNavigationsRef.current.delete(action.id);
        sendActionResult(action, false, "A página anterior não ficou pronta a tempo.");
      }, 5_000);
      pendingNavigationsRef.current.set(action.id, { action, timeout });
      router.back();
      return;
    } else if (action.type === "go_forward") {
      contextVersionRef.current += 1;
      sendActionEvent("page_loading", action.id, contextVersionRef.current);
      const timeout = window.setTimeout(() => {
        pendingNavigationsRef.current.delete(action.id);
        sendActionResult(action, false, "A próxima página não ficou pronta a tempo.");
      }, 5_000);
      pendingNavigationsRef.current.set(action.id, { action, timeout });
      router.forward();
      return;
    } else if (action.type === "highlight") {
      ok = highlightVitruTarget(action.target);
      message = ok ? "Componente localizado e destacado." : "O componente não está visível nesta página.";
    } else if (action.type === "show") {
      const snapshot = semanticSnapshotRef.current;
      const resolution = snapshot ? resolveTarget(action.referencia, snapshot) : null;
      if (resolution?.ambiguous) {
        message = "Encontrei mais de uma opção. Qual delas você quer?";
      } else if (resolution?.actionId) {
        ok = highlightVitruTarget(`id:${resolution.actionId}`);
        message = ok ? "Ação localizada e destacada." : "A ação existe, mas não está visível nesta página.";
      } else {
        const assessmentsHref = snapshot?.destinations.find((destination) => destination.id === "assessments")?.href;
        if (assessmentsHref && isSafeInternalHref(assessmentsHref)) {
          beginNavigation(assessmentsHref, { type: "show", referencia: action.referencia });
          return;
        }
        message = "Não encontrei uma ação compatível no snapshot atual.";
      }
    } else if (action.type === "close") {
      if ("referencia" in action) {
        const snapshot = semanticSnapshotRef.current;
        const resolution = snapshot ? resolveTarget(action.referencia, snapshot) : null;
        if (resolution?.ambiguous) {
          message = "Encontrei mais de uma interface possível. Qual delas você quer fechar?";
        } else if (resolution?.actionId) {
          ok = closeVitruTarget(`id:${resolution.actionId}`);
          message = ok ? "Interface fechada." : "O alvo existe, mas não tem um controle seguro para fechar.";
        } else {
          message = "Não encontrei a interface descrita na página atual.";
        }
      } else {
        ok = closeVitruTarget(action.target);
        message = ok ? "Interface fechada." : "Não encontrei um controle de fechar seguro nesse componente.";
      }
    } else if (action.type === "clarify") {
      const snapshot = semanticSnapshotRef.current;
      const resolution = snapshot ? resolveReference(action.pergunta, snapshot) : null;
      if (resolution && resolution.kind !== "ambiguous" && resolution.kind !== "unresolved" && resolution.confidence >= REFERENCE_CONFIDENCE_THRESHOLD) {
        appendVitruDebug({ kind: "metric", data: { unnecessary_question: 1, question: action.pergunta, resolution } });
        sendActionResult(action, false, "A pergunta é desnecessária: a referência já foi resolvida pelo contexto.", { resolution, unnecessary_question: 1 });
        return;
      }
      ok = true;
      message = action.pergunta;
    } else if (["list_options", "select_option", "confirm_write"].includes(action.type)) {
      if (page.id !== "assessment-scheduling") {
        sendActionResult(action, false, "Esta ferramenta só pode ser usada na tela de agendamento.");
        return;
      }
      pendingScheduleActionsRef.current.set(action.id, action);
      window.dispatchEvent(new CustomEvent("vitru-schedule-command", { detail: action }));
      return;
    }

    sendActionResult(action, ok, message);
  }

  useEffect(() => {
    executeBrowserActionRef.current = executeBrowserAction;
  });

  if (isAssessmentRunner(pathname)) return null;

  if (!isOpen) {
    return (
      <button
        {...{ [VITRU_ASSISTANT_ROOT_ATTRIBUTE]: "true" }}
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 left-4 z-40 flex items-center gap-3 rounded-full border border-[#f4c64b]/45 bg-[#141414]/95 p-2 pr-4 text-left shadow-[0_18px_50px_rgba(0,0,0,.55)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-[#f4c64b] md:bottom-24 md:left-8"
        aria-label="Abrir assistente virtual"
      >
        <VitruLogo size="small" state="idle" />
        <span>
          <span className="block text-sm font-semibold text-[#f7d778]">Vitru</span>
          <span className="flex items-center gap-1.5 text-xs text-[#58d9a3]">
            <span className="h-1.5 w-1.5 rounded-full bg-accent-green" /> Disponível
          </span>
        </span>
      </button>
    );
  }

  const content = STATE_CONTENT[conversationState];
  const logoState: VitruLogoState =
    callState === "connecting" ? "thinking" : callState === "in-call" && !isMuted ? "listening" : "idle";
  const callDuration = `${String(Math.floor(elapsedSeconds / 60)).padStart(2, "0")}:${String(
    elapsedSeconds % 60
  ).padStart(2, "0")}`;

  const startCall = async () => {
    lastContextHashRef.current = null;
    lastContextSentAtRef.current = 0;
    contextVersionRef.current = 0;
    lastAppliedEventVersionRef.current = 0;
    suppressedContextCountRef.current = 0;
    setCallError(null);
    setElapsedSeconds(0);
    setIsMuted(false);
    setCallState("connecting");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });
      localStreamRef.current = stream;

      const peerConnection = new RTCPeerConnection();
      peerConnectionRef.current = peerConnection;
      const dataChannel = peerConnection.createDataChannel("vitru-control", { ordered: true });
      dataChannelRef.current = dataChannel;
      dataChannel.onopen = () => {
        publishContextRef.current();
      };
      dataChannel.onmessage = (event) => {
        try {
          const payload = JSON.parse(String(event.data)) as { type?: string; version?: number; action?: BrowserAction; usage?: unknown; payload?: unknown; backend?: string; voice_mode?: VoiceMode; metrics?: Record<string, number> };
          if (payload.type === "voice_metric") {
            appendVitruDebug({ kind: "metric", data: { voice_mode: payload.voice_mode, ...payload.metrics } });
            void fetch("/api/v1/vitru/voice-metrics", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: activeUserId, metrics: { voice_mode: payload.voice_mode ?? voiceMode, ...payload.metrics } }) });
            return;
          }
          if (payload.type === "debug_turn") {
            appendVitruDebug({ kind: "payload", data: { backend: payload.backend, voice_mode: payload.voice_mode, literalPayload: payload.payload, usage: payload.usage } });
            const usage = (payload.usage ?? {}) as Record<string, number>;
            void fetch("/api/v1/vitru/voice-metrics", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: activeUserId, metrics: { voice_mode: payload.voice_mode ?? voiceMode, page_recognized: semanticSnapshotRef.current ? 1 : 0, intent_accuracy: null, tool_correct: null, target_resolved: null, resolver_score: null, ambiguous_asked: 0, contract_violations: 0, prompt_tokens: usage.prompt_tokens ?? 0, output_tokens: usage.output_tokens ?? 0, time_to_first_audio_ms: null, navigation_duration: null, premature_success: 0, unauthorized_write: 0, snapshots_per_minute: contextVersionRef.current / Math.max(1, elapsedSeconds / 60) } }) });
            return;
          }
          if (payload.type === "action_proposed" && payload.action?.id) {
            const version = payload.version ?? 0;
            if (version < lastAppliedEventVersionRef.current) return;
            lastAppliedEventVersionRef.current = version;
            executeBrowserActionRef.current(payload.action);
          }
        } catch {
          setCallError("Recebi um comando inválido do serviço de voz.");
        }
      };
      stream.getAudioTracks().forEach((track) => peerConnection.addTrack(track, stream));

      peerConnection.ontrack = (event) => {
        const [remoteStream] = event.streams;
        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = remoteStream ?? new MediaStream([event.track]);
          void remoteAudioRef.current.play().catch(() => undefined);
        }
      };

      peerConnection.onconnectionstatechange = () => {
        if (peerConnection.connectionState === "connected") {
          setCallState("in-call");
        } else if (["failed", "disconnected", "closed"].includes(peerConnection.connectionState)) {
          releaseCall();
          setCallState("idle");
        }
      };

      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      if (peerConnection.iceGatheringState !== "complete") {
        await new Promise<void>((resolve, reject) => {
          const timeout = window.setTimeout(() => reject(new Error("Tempo de conexão esgotado.")), 10_000);
          peerConnection.addEventListener(
            "icegatheringstatechange",
            () => {
              if (peerConnection.iceGatheringState === "complete") {
                window.clearTimeout(timeout);
                resolve();
              }
            },
            { once: false }
          );
        });
      }

      const response = await fetch(`${VOICE_SERVICE_URL}/api/offer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sdp: peerConnection.localDescription?.sdp,
          type: peerConnection.localDescription?.type,
          request_data: {
                voiceMode,
                ...(semanticSnapshot
                  ? { semanticSnapshot: { mode: "semantic", snapshot: semanticSnapshotForModel(semanticSnapshot) } }
                  : { browserContext: { mode: "dom", context: buildBrowserContext(page) } }),
                navigationDestinations: destinationsForPage(page.id, VITRU_NAVIGATION_DESTINATIONS),
                ...(isCalendarMode ? {
                surface: "calendario",
                userId: activeUserId,
                planningReply: calendarReply,
                suggestions: calendarSuggestions.map(({ title, subjectName, date, startTime, endTime }) => ({
                  title,
                  subjectName,
                  date,
                  startTime,
                  endTime,
                })),
              } : { surface: "portal", userId: activeUserId }),
          },
        }),
      });

      if (!response.ok) throw new Error(`O serviço de voz respondeu com status ${response.status}.`);
      const answer = (await response.json()) as RTCSessionDescriptionInit;
      await peerConnection.setRemoteDescription(answer);
    } catch (error) {
      releaseCall();
      setCallState("error");
      if (error instanceof DOMException && error.name === "NotAllowedError") {
        setCallError("Permita o acesso ao microfone para iniciar a chamada.");
      } else {
        setCallError(
          error instanceof Error
            ? error.message
            : "Não foi possível conectar ao serviço de voz."
        );
      }
    }
  };

  const endCall = () => {
    releaseCall();
    setCallState("idle");
    setElapsedSeconds(0);
    setIsMuted(false);
    setCallError(null);
  };

  const toggleMicrophone = () => {
    const nextMuted = !isMuted;
    localStreamRef.current?.getAudioTracks().forEach((track) => {
      track.enabled = !nextMuted;
    });
    setIsMuted(nextMuted);
  };

  return (
    <aside
      {...{ [VITRU_ASSISTANT_ROOT_ATTRIBUTE]: "true" }}
      className={`fixed bottom-20 left-3 z-40 w-[calc(100vw-1.5rem)] overflow-hidden rounded-[22px] border border-[#f4c64b]/35 bg-[radial-gradient(120%_120%_at_50%_0%,#1e1e1e_0%,#141414_60%,#0d0d0d_100%)] shadow-[0_22px_65px_rgba(0,0,0,.7)] md:bottom-24 md:left-8 ${
        isCalendarMode ? "flex h-[min(75vh,720px)] max-w-[400px] flex-col" : "max-w-[400px]"
      }`}
      aria-label="Assistente virtual por voz"
    >
      <audio ref={remoteAudioRef} autoPlay playsInline className="hidden" />
      <header className="flex shrink-0 items-center justify-between border-b border-white/[.07] px-4 py-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${content.color}`} />
          <div className="min-w-0">
            <h2 className="truncate text-sm font-semibold tracking-wide text-[#f7d778]">VITRU</h2>
            <p className="text-[11px] text-[#7d86b3]">
              {page.name} • {content.title}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          
          <button
            type="button"
            onClick={() => {
              if (callState !== "idle") endCall();
              setIsOpen(false);
            }}
            className={`h-8 w-8 place-items-center rounded-full text-text-secondary transition hover:bg-white/10 hover:text-white ${
              isCalendarMode ? "grid lg:hidden" : "grid"
            }`}
            aria-label="Fechar conversa"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>
      </header>

      <div className={`px-4 pb-4 pt-5 ${isCalendarMode ? "flex min-h-0 flex-1 flex-col" : ""}`}>
        {actionNotice && (
          <p role="status" className="mb-3 rounded-lg border border-brand-yellow/25 bg-brand-yellow/10 px-3 py-2 text-xs text-[#f7d778]">
            {actionNotice}
          </p>
        )}
        {isCalendarMode && (
          <div className="mb-3 flex shrink-0 justify-end">
            <p className="max-w-[82%] rounded-2xl rounded-tr-sm bg-[#f4c64b]/15 px-3.5 py-2.5 text-sm text-white">
              Organize minha semana de estudos.
            </p>
          </div>
        )}
        <div className="flex shrink-0 items-center gap-4">
          <VitruLogo state={logoState} size={isCalendarMode ? "small" : "large"} />
          <div className="min-w-0 flex-1">
            <span className="mb-1.5 inline-flex items-center gap-1.5 text-[11px] font-medium text-text-secondary">
              <span className={`h-1.5 w-1.5 rounded-full ${content.color}`} /> {content.label}
            </span>
            <p className="rounded-2xl rounded-tl-sm border border-white/[.06] bg-white/[.045] px-3.5 py-3 text-sm leading-relaxed text-[#d8dcf2]">
              {isPlanning
                ? "Estou analisando suas avaliações, prazos e horários disponíveis..."
                : isCalendarMode && calendarReply
                  ? calendarReply
                  : content.message}
            </p>
          </div>
        </div>

        {isCalendarMode && (
          <div className="min-h-4 flex-1" />
        )}

        <div className="mt-4 shrink-0 border-t border-white/[.07] pt-4">
          {callState === "idle" || callState === "error" ? (
            <div>
            <fieldset className="mb-3 grid grid-cols-2 gap-2" disabled={callState !== "idle" && callState !== "error"}>
              <legend className="sr-only">Modo de voz</legend>
              {(["cascade", "sonic"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => chooseVoiceMode(mode)}
                  aria-pressed={voiceMode === mode}
                  className={`rounded-lg border px-2 py-2 text-xs font-semibold transition ${voiceMode === mode ? "border-[#f4c64b] bg-[#f4c64b]/15 text-[#f7d778]" : "border-white/10 text-text-secondary hover:border-white/25"}`}
                >
                  {mode === "cascade" ? "Cascata (local)" : "Nova Sonic (Amazon)"}
                </button>
              ))}
            </fieldset>
            <button
              type="button"
              onClick={startCall}
              className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-[#f4c64b] px-4 py-3 text-sm font-semibold text-[#0d0d0d] shadow-[0_8px_28px_rgba(244,198,75,.22)] transition hover:bg-[#f7d778] active:scale-[.98]"
            >
              <PhoneIcon className="h-5 w-5" />
              {callState === "error" ? "Tentar conectar novamente" : "Iniciar chamada com o assistente"}
            </button>
            {callError && (
              <p role="alert" className="mt-2.5 rounded-lg border border-accent-red/25 bg-accent-red/10 px-3 py-2 text-center text-xs text-red-200">
                {callError} Confira se o `vitru-voice` está ativo na porta 3001.
              </p>
            )}
            </div>
          ) : (
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="flex items-center gap-2 text-sm font-semibold text-white">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#58d9a3] opacity-60" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#58d9a3]" />
                  </span>
                  {callState === "connecting" ? "Conectando..." : "Chamada em andamento"}
                </p>
                <p className="mt-1 font-mono text-xs text-text-secondary">
                  {callState === "connecting" ? "Aguarde um momento" : callDuration} · {voiceMode === "sonic" ? "Nova Sonic" : "Cascata"}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-2.5">
                <button
                  type="button"
                  onClick={toggleMicrophone}
                  disabled={callState === "connecting"}
                  className={`grid h-11 w-11 place-items-center rounded-full border transition disabled:cursor-not-allowed disabled:opacity-40 ${
                    isMuted
                      ? "border-brand-yellow bg-brand-yellow text-black"
                      : "border-white/15 bg-white/10 text-white hover:bg-white/15"
                  }`}
                  aria-label={isMuted ? "Ativar microfone" : "Silenciar microfone"}
                >
                  <MicrophoneIcon className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={endCall}
                  className="grid h-11 w-11 place-items-center rounded-full bg-accent-red text-white shadow-[0_8px_20px_rgba(229,72,77,.25)] transition hover:scale-105 active:scale-95"
                  aria-label="Encerrar chamada"
                >
                  <PhoneOffIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}
          <p className="mt-2.5 text-center text-[11px] text-text-secondary">
            {callState === "idle" || callState === "error"
              ? "Conversa por voz em tempo real"
              : isMuted
                ? "Microfone silenciado"
                : "Você pode falar naturalmente com o assistente"}
          </p>
        </div>
      </div>
    </aside>
  );
}
