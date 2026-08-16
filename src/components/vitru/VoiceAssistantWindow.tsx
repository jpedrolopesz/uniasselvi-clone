"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, type SVGProps } from "react";
import { LoaderCircle, MessageCircle, Send } from "lucide-react";
import { VitruLogo, type VitruLogoState } from "@/components/vitru/VitruLogo";
import type { AssistantSuggestion } from "@/lib/study-planner/ai-assistant";
import { announcePlanPreviews } from "@/components/vitru/planner-events";
import {
  closeVitruTarget,
  highlightVitruTarget,
  stableContextHash,
  VITRU_ASSISTANT_ROOT_ATTRIBUTE,
} from "@/components/vitru/browser-context";
import { resolveVitruPage } from "@/lib/vitru/page-context";
import { useSemanticSnapshot } from "@/components/vitru/SemanticSnapshotProvider";
import { redactSemanticSnapshot } from "@/lib/vitru/snapshot-redaction";
import { resolveTarget } from "@/lib/vitru/resolve-target";
import { appendVitruDebug } from "@/lib/vitru/debug-store";
import { decideBrowserAction, type BrowserAction } from "@/lib/vitru/browser-action-decision";
import { snapshotContainsFocus, withConversationFocus, type VitruFocus } from "@/lib/vitru/conversation-focus";
import { connectNovaSonicVoice, type NovaSonicConnection } from "@/lib/vitru/nova-sonic-connection";
import { arrivalMessage, buildPageArrivalSummary } from "@/lib/vitru/page-arrival-summary";
import type { DisclosureLevel } from "@/lib/vitru/disclosure";
import type { VitruVoiceSession, VoiceSurface } from "@/lib/vitru/voice-session-contract";
import { VITRU_OPEN_ASSISTANT_EVENT } from "@/components/vitru/assistant-events";
import { buildVitruInstructions, buildVitruTools, translateToolCall } from "@/lib/vitru/realtime-protocol";
import {
  pageContextMessage,
  sessionConfigMessage,
  toolResultMessage,
  type VoiceClientMessage,
} from "@/lib/vitru/voice-relay-protocol";

export type { BrowserAction } from "@/lib/vitru/browser-action-decision";

type ConversationState = "active" | "pending" | "alert";
type CallState = "idle" | "connecting" | "in-call" | "error";
type AssistantMode = "voice" | "text";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
}

const VOICE_SERVICE_URL =
  process.env.NEXT_PUBLIC_VITRU_VOICE_URL?.replace(/\/$/, "") ?? "ws://localhost:8765";
const VITRU_DEBUG = process.env.NEXT_PUBLIC_VITRU_DEBUG === "1";

interface VoiceAssistantWindowProps {
  activeUserId: string;
  /** Test hook: exposes the existing effectful executor without changing production flow. */
  onActionExecutorReady?: (execute: (action: BrowserAction) => void) => void;
}

interface CalendarPlanResponse {
  reply?: string;
  actions?: Array<{ type?: string; suggestions?: AssistantSuggestion[] }>;
}

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

export function VoiceAssistantWindow({ activeUserId, onActionExecutorReady }: VoiceAssistantWindowProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isPresentationEmbed = searchParams.get("presentation") === "1";
  const semanticSnapshot = useSemanticSnapshot();
  const page = useMemo(() => resolveVitruPage(pathname), [pathname]);
  const [isOpen, setIsOpen] = useState(false);
  const [conversationState] = useState<ConversationState>("active");
  const [callState, setCallState] = useState<CallState>("idle");
  const [assistantMode, setAssistantMode] = useState<AssistantMode>("voice");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [textInput, setTextInput] = useState("");
  const [isSendingText, setIsSendingText] = useState(false);
  const [textError, setTextError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [callError, setCallError] = useState<string | null>(null);
  const connectionRef = useRef<NovaSonicConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const observerTimeoutRef = useRef<number | null>(null);
  const lastContextHashRef = useRef<string | null>(null);
  const lastContextSentAtRef = useRef(0);
  const contextVersionRef = useRef(0);
  const suppressedContextCountRef = useRef(0);
  const publishContextRef = useRef<() => void>(() => undefined);
  const pendingNavigationsRef = useRef(new Map<string, PendingNavigation>());
  const pendingScheduleActionsRef = useRef(new Map<string, BrowserAction>());
  /** actionId → call_id da function call que originou a ação. */
  const toolCallIdsRef = useRef(new Map<string, string>());
  const lastUtteranceRef = useRef("");
  const calendarSuggestionsRef = useRef<AssistantSuggestion[]>([]);
  const lastAppliedEventVersionRef = useRef(0);
  const executeBrowserActionRef = useRef<(action: BrowserAction) => void>(() => undefined);
  const semanticSnapshotRef = useRef(semanticSnapshot);
  const conversationFocusRef = useRef<VitruFocus | null>(null);
  const voiceSessionRef = useRef<VitruVoiceSession | null>(null);
  const persistedTranscriptRef = useRef<{ role: "user" | "assistant"; text: string } | null>(null);
  const focusPageRef = useRef(semanticSnapshot?.page.id ?? null);
  const requestedCalendarPlanRef = useRef<string | null>(null);
  const [calendarReply, setCalendarReply] = useState<string | null>(null);
  const [calendarSuggestions, setCalendarSuggestions] = useState<AssistantSuggestion[]>([]);
  const [isPlanning, setIsPlanning] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const isCalendarMode = pathname === "/calendario-de-estudos";
  const voiceSurface: VoiceSurface = isCalendarMode ? "calendario" : "portal";
  const voiceObjectId = `${page.id}:${pathname}`;

  useEffect(() => {
    if (callState !== "in-call") return;
    const interval = window.setInterval(() => setElapsedSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(interval);
  }, [callState]);

  useEffect(() => {
    if (assistantMode !== "text") return;
    const target = messagesEndRef.current;
    if (typeof target?.scrollIntoView === "function") target.scrollIntoView({ behavior: "smooth" });
  }, [assistantMode, chatMessages, isSendingText]);

  const releaseCall = useCallback(() => {
    connectionRef.current?.close();
    connectionRef.current = null;
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    localStreamRef.current = null;
  }, []);

  useEffect(() => releaseCall, [releaseCall]);

  useEffect(() => {
    const openAssistant = () => setIsOpen(true);
    window.addEventListener(VITRU_OPEN_ASSISTANT_EVENT, openAssistant);
    return () => window.removeEventListener(VITRU_OPEN_ASSISTANT_EVENT, openAssistant);
  }, []);

  const sendControl = useCallback((message: VoiceClientMessage) => {
    connectionRef.current?.sendControl(message);
  }, []);

  const sendActionResult = useCallback((action: BrowserAction, ok: boolean, message: string, details?: Record<string, unknown>) => {
    setActionNotice(message);
    window.setTimeout(() => setActionNotice(null), 5_000);
    const version = contextVersionRef.current;
    lastAppliedEventVersionRef.current = Math.max(lastAppliedEventVersionRef.current, version);
    const callId = toolCallIdsRef.current.get(action.id);
    if (callId) {
      toolCallIdsRef.current.delete(action.id);
      sendControl(toolResultMessage(callId, { ok, message, actionType: action.type, ...details }));
    }
    appendVitruDebug({ kind: "action", data: { type: ok ? "action_completed" : "action_failed", actionId: action.id, version, ok, message, premature_success: 0, unauthorized_write: 0 } });
  }, [sendControl]);

  // O protocolo Realtime não tem eventos intermediários de ação: a tool call
  // fica aberta até o function_call_output. Isto vira só rastro de depuração.
  const sendActionEvent = useCallback((type: string, actionId: string, version = contextVersionRef.current) => {
    appendVitruDebug({ kind: "action", data: { type, actionId, version } });
  }, []);

  const buildArrivalResult = useCallback(async (snapshot: NonNullable<typeof semanticSnapshot>) => {
    const summary = buildPageArrivalSummary(snapshot);
    if (!summary) return undefined;
    const surface = snapshot.page.id === "study-calendar" ? "calendario" : snapshot.page.id;
    const response = await fetch("/api/v1/vitru/voice-arrival", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: activeUserId, surface }),
    });
    const result = await response.json() as { disclosure?: DisclosureLevel };
    const disclosure = result.disclosure ?? "frequent";
    return { summary, disclosure, arrivalMessage: arrivalMessage(summary, disclosure) };
  }, [activeUserId]);

  const publishContext = useCallback(() => {
    const effectiveSnapshot = semanticSnapshot ? withConversationFocus(semanticSnapshot, conversationFocusRef.current) : null;
    if (!effectiveSnapshot) return;
    const contextForHash = { mode: "semantic" as const, snapshot: semanticSnapshotForModel(effectiveSnapshot) };
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
    const context = effectiveSnapshot
      ? {
          mode: "semantic" as const,
          snapshot: { ...semanticSnapshotForModel(effectiveSnapshot), version: contextVersionRef.current },
        }
      : contextForHash;
    // As tools ficam fixas na Nova Sonic desde o início da chamada (ver
    // sessionConfigMessage em startCall); aqui só atualizamos o snapshot da
    // página, com a lista de destinos atual no próprio texto.
    sendControl(pageContextMessage({ type: "page_context", version: contextVersionRef.current, context }));
    appendVitruDebug({ kind: "snapshot", data: { version: contextVersionRef.current, context, approximateTokens: Math.ceil(JSON.stringify(context).length / 4) } });
    if (semanticSnapshot?.status === "ready") {
      const pending = [...pendingNavigationsRef.current.entries()][0];
      sendActionEvent("page_ready", pending?.[0] ?? "page", contextVersionRef.current);
    }
  }, [semanticSnapshot, sendActionEvent, sendControl]);

  useEffect(() => {
    calendarSuggestionsRef.current = calendarSuggestions;
  }, [calendarSuggestions]);

  useEffect(() => {
    publishContextRef.current = publishContext;
    if (semanticSnapshot) {
      const pageChanged = focusPageRef.current !== semanticSnapshot.page.id;
      if (pageChanged || semanticSnapshot.state.focus) conversationFocusRef.current = null;
      else if (conversationFocusRef.current && !snapshotContainsFocus(semanticSnapshot, conversationFocusRef.current)) conversationFocusRef.current = null;
      focusPageRef.current = semanticSnapshot.page.id;
      semanticSnapshotRef.current = withConversationFocus(semanticSnapshot, conversationFocusRef.current);
    } else {
      conversationFocusRef.current = null;
      focusPageRef.current = null;
      semanticSnapshotRef.current = null;
    }
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
        void buildArrivalResult(semanticSnapshot).then(arrival => {
          sendActionResult(pending.action, true, arrival?.arrivalMessage ?? "Navegação confirmada com os dados da página prontos.", arrival ? { arrival } : undefined);
        });
      }
    }
  }, [buildArrivalResult, publishContext, semanticSnapshot, sendActionEvent, sendActionResult]);

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
    const decision = decideBrowserAction(action, semanticSnapshotRef.current, page);
    if ("debug" in decision && decision.debug && decision.type !== "highlight") appendVitruDebug(decision.debug);
    if (decision.type === "respond") {
      const details = decision.alreadyHere
        ? { status: "already_here", snapshot: semanticSnapshotRef.current ? compactCurrentSnapshot(semanticSnapshotRef.current) : undefined, ...decision.details }
        : decision.details;
      sendActionResult(action, decision.ok, decision.message, details);
      return;
    }
    if (decision.type === "navigate") {
      beginNavigation(decision.href, decision.intent);
      return;
    }
    if (decision.type === "history") {
      contextVersionRef.current += 1;
      sendActionEvent("page_loading", action.id, contextVersionRef.current);
      const timeout = window.setTimeout(() => {
        pendingNavigationsRef.current.delete(action.id);
        sendActionResult(action, false, decision.direction === "back" ? "A página anterior não ficou pronta a tempo." : "A próxima página não ficou pronta a tempo.");
      }, 5_000);
      pendingNavigationsRef.current.set(action.id, { action, timeout });
      router[decision.direction]();
      return;
    }
    if (decision.type === "highlight") {
      const outcome = highlightVitruTarget(decision.target) ? decision.success : decision.failure;
      if (decision.debug && outcome === decision.success) appendVitruDebug(decision.debug);
      if (outcome === decision.success && decision.resolvedFocus && semanticSnapshotRef.current?.state.focus === null) {
        conversationFocusRef.current = decision.resolvedFocus;
        semanticSnapshotRef.current = withConversationFocus(semanticSnapshotRef.current, decision.resolvedFocus);
        lastContextHashRef.current = null;
        publishContextRef.current();
      }
      sendActionResult(action, outcome.ok, outcome.message);
      return;
    }
    if (decision.type === "close") {
      const ok = closeVitruTarget(decision.target);
      sendActionResult(action, ok, ok ? decision.success : decision.failure);
      return;
    }
    pendingScheduleActionsRef.current.set(action.id, decision.action);
    window.dispatchEvent(new CustomEvent("vitru-schedule-command", { detail: decision.action }));
  }

  useEffect(() => {
    executeBrowserActionRef.current = executeBrowserAction;
    onActionExecutorReady?.(executeBrowserAction);
  });

  if (isAssessmentRunner(pathname) || isPresentationEmbed) return null;

  if (!isOpen) return null;

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
      if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
        throw new Error(
          "O microfone exige uma conexão segura. Abra o portal em http://localhost:3000 neste computador ou use HTTPS ao acessar pela rede."
        );
      }
      const sessionResponse = await fetch("/api/v1/vitru/voice-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ surface: voiceSurface, objectId: voiceObjectId }),
      });
      if (!sessionResponse.ok) {
        throw new Error("Não foi possível carregar os dados acadêmicos da sessão de voz.");
      }
      const sessionPayload = await sessionResponse.json() as { session?: VitruVoiceSession };
      if (!sessionPayload.session) throw new Error("A sessão de voz retornou dados inválidos.");
      voiceSessionRef.current = sessionPayload.session;

      const persistTranscript = (role: "user" | "assistant", text: string) => {
        const normalized = text.trim();
        if (!normalized) return;
        const previous = persistedTranscriptRef.current;
        if (previous?.role === role && previous.text === normalized) return;
        persistedTranscriptRef.current = { role, text: normalized };
        void fetch("/api/v1/vitru/voice-message", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ surface: voiceSurface, objectId: voiceObjectId, role, text: normalized }),
        });
      };

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });
      localStreamRef.current = stream;

      const connection = await connectNovaSonicVoice({
        url: VOICE_SERVICE_URL,
        stream,
        onServerEvent: (serverEvent) => {
          if (serverEvent.kind === "session_created") return;
          if (serverEvent.kind === "user_transcript") {
            lastUtteranceRef.current = serverEvent.text;
            appendVitruDebug({ kind: "payload", data: { transcript: serverEvent.text } });
            persistTranscript("user", serverEvent.text);
            setChatMessages((current) => [...current, { id: crypto.randomUUID(), role: "user", text: serverEvent.text }]);
            return;
          }
          if (serverEvent.kind === "assistant_transcript") {
            appendVitruDebug({ kind: "payload", data: { assistantTranscript: serverEvent.text } });
            persistTranscript("assistant", serverEvent.text);
            setChatMessages((current) => [...current, { id: crypto.randomUUID(), role: "assistant", text: serverEvent.text }]);
            return;
          }
          if (serverEvent.kind === "usage") {
            appendVitruDebug({ kind: "metric", data: { prompt_tokens: serverEvent.inputTokens, output_tokens: serverEvent.outputTokens } });
            void fetch("/api/v1/vitru/voice-metrics", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: activeUserId, metrics: { page_recognized: semanticSnapshotRef.current ? 1 : 0, intent_accuracy: null, tool_correct: null, target_resolved: null, resolver_score: null, ambiguous_asked: 0, contract_violations: 0, prompt_tokens: serverEvent.inputTokens, output_tokens: serverEvent.outputTokens, time_to_first_audio_ms: null, navigation_duration: null, premature_success: 0, unauthorized_write: 0, snapshots_per_minute: contextVersionRef.current / Math.max(1, elapsedSeconds / 60) } }) });
            return;
          }
          if (serverEvent.kind === "error") {
            setCallError(serverEvent.message);
            return;
          }
          if (serverEvent.kind !== "tool_call") return;

          const actionId = crypto.randomUUID();
          const translation = translateToolCall(serverEvent.name, serverEvent.args, actionId, lastUtteranceRef.current);
          appendVitruDebug({ kind: "action", data: { type: "tool_call", tool: serverEvent.name, callId: serverEvent.callId, actionId, args: serverEvent.args } });
          if (translation.kind !== "action") {
            // Sem ação no portal: o resultado volta direto pela mesma tool call.
            sendControl(toolResultMessage(serverEvent.callId, translation.result));
            return;
          }
          toolCallIdsRef.current.set(actionId, serverEvent.callId);
          executeBrowserActionRef.current(translation.action);
        },
        onDisconnect: () => {
          releaseCall();
          setCallState("idle");
        },
      });
      connectionRef.current = connection;

      // Tools fixas por chamada: força o superset (inclui as de agendamento)
      // porque a Nova Sonic não confirma suporte a atualizar toolConfiguration
      // no meio da sessão. O snapshot real (com destinos atuais) segue depois
      // via publishContext/page_context.
      connection.sendControl(
        sessionConfigMessage(
          buildVitruInstructions({
            surface: isCalendarMode ? "calendario" : "portal",
            suggestions: calendarSuggestionsRef.current,
            session: voiceSessionRef.current,
          }),
          buildVitruTools({ page: { id: "assessment-scheduling" }, destinations: [] })
        )
      );
      setCallState("in-call");
      publishContextRef.current();
    } catch (error) {
      releaseCall();
      setCallState("error");
      if (error instanceof DOMException && error.name === "NotAllowedError") {
        setCallError("Permita o acesso ao microfone para iniciar a chamada.");
      } else if (error instanceof DOMException && error.name === "AbortError") {
        setCallError("O serviço de voz não respondeu a tempo.");
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

  const changeMode = (mode: AssistantMode) => {
    if (mode === assistantMode) return;
    if (mode === "text" && callState !== "idle") endCall();
    setAssistantMode(mode);
    setTextError(null);
  };

  const sendTextMessage = async () => {
    const message = textInput.trim();
    if (!message || isSendingText) return;

    setChatMessages((current) => [...current, { id: crypto.randomUUID(), role: "user", text: message }]);
    setTextInput("");
    setTextError(null);
    setIsSendingText(true);

    try {
      const response = await fetch("/api/v1/vitru/voice-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          surface: voiceSurface,
          objectId: voiceObjectId,
          role: "user",
          text: message,
          generateResponse: true,
        }),
      });
      const result = await response.json() as { ok?: boolean; reply?: string; error?: { message?: string } };
      if (!response.ok || !result.ok || !result.reply) {
        throw new Error(result.error?.message ?? "Não foi possível enviar sua mensagem.");
      }
      setChatMessages((current) => [...current, { id: crypto.randomUUID(), role: "assistant", text: result.reply! }]);
    } catch (error) {
      setTextError(error instanceof Error ? error.message : "Não foi possível conversar por texto agora.");
    } finally {
      setIsSendingText(false);
    }
  };

  return (
    <aside
      {...{ [VITRU_ASSISTANT_ROOT_ATTRIBUTE]: "true" }}
      className="fixed bottom-20 left-3 z-40 flex h-[min(76vh,680px)] w-[calc(100vw-1.5rem)] max-w-[420px] flex-col overflow-hidden rounded-[22px] border border-[#f4c64b]/35 bg-[radial-gradient(120%_120%_at_50%_0%,#1e1e1e_0%,#141414_60%,#0d0d0d_100%)] shadow-[0_22px_65px_rgba(0,0,0,.7)] md:bottom-24 md:left-8"
      aria-label="Assistente virtual por voz e texto"
    >
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
            className="grid h-8 w-8 place-items-center rounded-full text-text-secondary transition hover:bg-white/10 hover:text-white"
            aria-label="Fechar conversa"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>
      </header>

      <nav className="mx-4 mt-3 grid shrink-0 grid-cols-2 rounded-xl border border-white/[.07] bg-black/20 p-1" aria-label="Modo de conversa">
        <button type="button" onClick={() => changeMode("voice")} aria-pressed={assistantMode === "voice"} className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition ${assistantMode === "voice" ? "bg-brand-yellow text-black shadow-sm" : "text-text-secondary hover:bg-white/[.06] hover:text-white"}`}>
          <MicrophoneIcon className="h-4 w-4" /> Voz
        </button>
        <button type="button" onClick={() => changeMode("text")} aria-pressed={assistantMode === "text"} className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition ${assistantMode === "text" ? "bg-brand-yellow text-black shadow-sm" : "text-text-secondary hover:bg-white/[.06] hover:text-white"}`}>
          <MessageCircle className="h-4 w-4" /> Mensagem
        </button>
      </nav>

      {assistantMode === "text" ? (
        <div className="flex min-h-0 flex-1 flex-col px-4 pb-4 pt-3">
          {actionNotice && <p role="status" className="mb-3 shrink-0 rounded-lg border border-brand-yellow/25 bg-brand-yellow/10 px-3 py-2 text-xs text-[#f7d778]">{actionNotice}</p>}

          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1" aria-live="polite" aria-label="Histórico da conversa">
            {chatMessages.length === 0 && (
              <div className="flex items-start gap-3 pt-2">
                <VitruLogo state="idle" size="small" />
                <div className="min-w-0 rounded-2xl rounded-tl-sm border border-white/[.07] bg-white/[.05] px-3.5 py-3 text-sm leading-relaxed text-[#d8dcf2]">
                  {isCalendarMode && calendarReply ? calendarReply : content.message}
                  <p className="mt-2 text-[10px] text-text-secondary">Digite sua dúvida abaixo. Eu continuo acompanhando a página que você está acessando.</p>
                </div>
              </div>
            )}
            {chatMessages.map((message) => (
              <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                <p className={`max-w-[84%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${message.role === "user" ? "rounded-tr-sm bg-brand-yellow text-black" : "rounded-tl-sm border border-white/[.07] bg-white/[.06] text-[#d8dcf2]"}`}>{message.text}</p>
              </div>
            ))}
            {isSendingText && (
              <div className="flex justify-start">
                <p className="flex items-center gap-2 rounded-2xl rounded-tl-sm border border-white/[.07] bg-white/[.06] px-3.5 py-2.5 text-xs text-text-secondary"><LoaderCircle className="h-4 w-4 animate-spin text-brand-yellow" /> Vitru está respondendo...</p>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {textError && <p role="alert" className="mt-2 shrink-0 rounded-lg border border-accent-red/25 bg-accent-red/10 px-3 py-2 text-xs text-red-200">{textError}</p>}

          <form className="mt-3 flex shrink-0 items-end gap-2 rounded-2xl border border-white/[.1] bg-white/[.05] p-2 focus-within:border-brand-yellow/50" onSubmit={(event) => { event.preventDefault(); void sendTextMessage(); }}>
            <textarea value={textInput} onChange={(event) => setTextInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void sendTextMessage(); } }} disabled={isSendingText} rows={1} maxLength={4000} placeholder="Digite sua mensagem para o Vitru..." aria-label="Mensagem para o Vitru" className="max-h-28 min-h-10 min-w-0 flex-1 resize-none bg-transparent px-2 py-2.5 text-sm text-white outline-none placeholder:text-text-secondary/70 disabled:opacity-60" />
            <button type="submit" disabled={isSendingText || !textInput.trim()} aria-label="Enviar mensagem" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-yellow text-black transition hover:bg-[#f7d778] disabled:cursor-not-allowed disabled:opacity-40"><Send className="h-4 w-4" /></button>
          </form>
          <p className="mt-1.5 text-center text-[10px] text-text-secondary">Enter para enviar · Shift + Enter para quebrar linha</p>
        </div>
      ) : (
      <div className="flex min-h-0 flex-1 flex-col px-4 pb-4 pt-5">
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
                {callError} Confira se o serviço de voz está ativo em {VOICE_SERVICE_URL}.
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
                  {callState === "connecting" ? "Aguarde um momento" : callDuration}
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
      )}
    </aside>
  );
}
