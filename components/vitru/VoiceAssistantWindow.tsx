"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type SVGProps } from "react";
import { VitruLogo, type VitruLogoState } from "@/components/vitru/VitruLogo";
import { SuggestionCard } from "@/components/study-planner/SuggestionCard";
import type { SuggestionStatus } from "@/components/study-planner/chat-types";
import type { AssistantSuggestion } from "@/lib/study-planner/ai-assistant";
import { announceConfirmedPlan } from "@/components/vitru/planner-events";

type ConversationState = "active" | "pending" | "alert";
type CallState = "idle" | "connecting" | "in-call" | "error";

const VOICE_SERVICE_URL =
  process.env.NEXT_PUBLIC_VITRU_VOICE_URL?.replace(/\/$/, "") ?? "http://localhost:3001";

interface VoiceAssistantWindowProps {
  activeUserId: string;
}

interface CalendarPlanResponse {
  reply?: string;
  actions?: Array<{ type?: string; suggestions?: AssistantSuggestion[] }>;
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

export function VoiceAssistantWindow({ activeUserId }: VoiceAssistantWindowProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(true);
  const [conversationState] = useState<ConversationState>("active");
  const [callState, setCallState] = useState<CallState>("idle");
  const [isMuted, setIsMuted] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [callError, setCallError] = useState<string | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const requestedCalendarPlanRef = useRef<string | null>(null);
  const [calendarReply, setCalendarReply] = useState<string | null>(null);
  const [calendarSuggestions, setCalendarSuggestions] = useState<AssistantSuggestion[]>([]);
  const [isPlanning, setIsPlanning] = useState(false);
  const [suggestionStatus, setSuggestionStatus] = useState<Record<string, SuggestionStatus>>({});
  const isCalendarMode = pathname === "/calendario-de-estudos";

  useEffect(() => {
    if (callState !== "in-call") return;
    const interval = window.setInterval(() => setElapsedSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(interval);
  }, [callState]);

  const releaseCall = useCallback(() => {
    peerConnectionRef.current?.close();
    peerConnectionRef.current = null;
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    localStreamRef.current = null;
    if (remoteAudioRef.current) remoteAudioRef.current.srcObject = null;
  }, []);

  useEffect(() => releaseCall, [releaseCall]);

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

  if (isAssessmentRunner(pathname)) return null;

  if (!isOpen) {
    return (
      <button
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
          request_data: isCalendarMode
            ? {
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
              }
            : { surface: "portal", userId: activeUserId },
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

  const respondToSuggestion = async (suggestion: AssistantSuggestion, accepted: boolean) => {
    if (!accepted) {
      setSuggestionStatus((current) => ({ ...current, [suggestion.id]: "rejected" }));
      return;
    }

    setSuggestionStatus((current) => ({ ...current, [suggestion.id]: "saving" }));
    try {
      const response = await fetch("/api/v1/vitru/study-plan/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CREATE_STUDY_PLAN",
          userId: activeUserId,
          suggestionIds: [suggestion.id],
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error("Falha ao confirmar horário.");
      const persisted = result.data.created[0] ?? { ...suggestion, source: "ai" as const };
      setSuggestionStatus((current) => ({ ...current, [suggestion.id]: "accepted" }));
      announceConfirmedPlan(persisted);
    } catch {
      setSuggestionStatus((current) => ({ ...current, [suggestion.id]: "error" }));
    }
  };

  return (
    <aside
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
              {isCalendarMode ? "Planejamento acadêmico" : "Assistente inteligente"} • {content.title}
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

        {isCalendarMode && calendarSuggestions.length > 0 && (
          <div className="mt-4 min-h-0 flex-1 space-y-2 overflow-y-auto border-t border-white/[.07] pt-4 pr-1">
            <div className="sticky top-0 z-10 -mx-1 bg-[#171717] px-1 pb-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#aeb6e0]">
                Horários sugeridos
              </p>
              <p className="mt-1 text-xs leading-relaxed text-text-secondary">
                Confirme individualmente os horários que deseja adicionar ao calendário.
              </p>
            </div>
            {calendarSuggestions.map((suggestion) => (
              <SuggestionCard
                key={suggestion.id}
                suggestion={suggestion}
                status={suggestionStatus[suggestion.id] ?? "pending"}
                onAccept={() => void respondToSuggestion(suggestion, true)}
                onReject={() => void respondToSuggestion(suggestion, false)}
              />
            ))}
          </div>
        )}

        {isCalendarMode && calendarSuggestions.length === 0 && (
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
    </aside>
  );
}
