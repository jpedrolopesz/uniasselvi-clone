"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { SendIcon, SparklesIcon } from "@/components/icons";
import type { AssistantSuggestion } from "@/lib/study-planner/ai-assistant";
import { announcePlanPreviews } from "@/components/vitru/planner-events";
import type { AssistantAction, ActionType, Resolution, Surface, SurfaceFocus } from "@/lib/vitru/surfaces";

interface AssistantPanelProps {
  surface: Surface;
  objectId: string;
  focus?: SurfaceFocus;
  entryEventId?: string;
  isExpanded?: boolean;
  onToggleExpanded?: () => void;
  /** Presente apenas na versão em drawer (mobile), para exibir o botão de fechar. */
  onClose?: () => void;
  /**
   * Fora do contrato da spec (que não prevê callback nenhum) — necessário
   * para a grade do calendário se atualizar depois de uma ação confirm_plan,
   * já que o painel agora executa a confirmação sozinho em vez de delegar a
   * um AssistantSuggestion escolhido pela página.
   */
  onPlanConfirmed?: (activity: AssistantSuggestion & { source: "ai" }) => void;
}

interface DisplayedAction {
  action: AssistantAction;
  key: string;
}

interface ChatMessage {
  id: number;
  role: "assistant" | "user";
  text: string;
  actions?: DisplayedAction[];
}

let messageIdCounter = 0;
function nextMessageId(): number {
  messageIdCounter += 1;
  return messageIdCounter;
}

const KNOWN_ACTION_TYPES: ActionType[] = ["open_lesson", "navigate", "confirm_plan", "dismiss"];

function isAssistantAction(value: unknown): value is AssistantAction {
  if (!value || typeof value !== "object") return false;
  const type = (value as Record<string, unknown>).type;
  return typeof type === "string" && KNOWN_ACTION_TYPES.includes(type as ActionType);
}

const PANEL_COPY: Record<Surface, { title: string; subtitle: string; greeting: string; quickPrompts: string[] }> = {
  trilha: {
    title: "Vitru",
    subtitle: "Assistente da trilha · demonstração",
    greeting:
      "Oi! Sou o Vitru. Pergunte algo sobre o conteúdo desta aula ou peça para rever uma aula anterior.",
    quickPrompts: ["Resumir esta aula", "Rever a aula anterior", "Não entendi essa parte"],
  },
  calendario: {
    title: "Vitru · Calendário",
    subtitle: "Planejamento acadêmico · demonstração",
    greeting:
      "Oi! Eu sou o Vitru · Calendário. Posso analisar suas avaliações abertas, seus prazos e sua rotina para sugerir um plano. Nada será adicionado sem sua confirmação.",
    quickPrompts: [
      "Organizar minha semana",
      "Encontrar horário livre",
      "Planejar uma revisão",
      "Preparar para uma prova",
    ],
  },
};

interface ChatApiResponse {
  conversationId?: string;
  reply?: string;
  resolution?: Resolution;
  actions?: unknown[];
}

export function AssistantPanel({
  surface,
  objectId,
  focus,
  entryEventId,
  isExpanded = false,
  onToggleExpanded,
  onClose,
  onPlanConfirmed,
}: AssistantPanelProps) {
  const router = useRouter();
  const copy = PANEL_COPY[surface];

  const [messages, setMessages] = useState<ChatMessage[]>(
    entryEventId ? [] : [{ id: nextMessageId(), role: "assistant", text: copy.greeting }]
  );
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [dismissedKeys, setDismissedKeys] = useState<Set<string>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  // Mensagem de retomada do inbox (spec §8) — só roda uma vez, ao abrir, e substitui a saudação padrão em vez de se somar a ela.
  useEffect(() => {
    if (!entryEventId) return;
    let cancelled = false;

    (async () => {
      setTyping(true);
      try {
        const response = await fetch("/api/v1/vitru/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ surface, objectId, focus, entryEventId }),
        });
        const result = (await response.json()) as ChatApiResponse;
        if (!cancelled && response.ok && typeof result.reply === "string") {
          setMessages((current) => [...current, { id: nextMessageId(), role: "assistant", text: result.reply! }]);
        } else if (!cancelled) {
          setMessages((current) => [...current, { id: nextMessageId(), role: "assistant", text: copy.greeting }]);
        }
      } catch {
        if (!cancelled) {
          setMessages((current) => [...current, { id: nextMessageId(), role: "assistant", text: copy.greeting }]);
        }
      } finally {
        if (!cancelled) setTyping(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entryEventId]);

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || typing) return;

    setMessages((current) => [...current, { id: nextMessageId(), role: "user", text: trimmed }]);
    setInput("");
    setTyping(true);

    try {
      const response = await fetch("/api/v1/vitru/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ surface, objectId, focus, message: trimmed }),
      });
      const result = (await response.json()) as ChatApiResponse;
      if (!response.ok || typeof result.reply !== "string") {
        throw new Error("Falha ao consultar o Vitru.");
      }

      const messageId = nextMessageId();
      const actions = (result.actions ?? [])
        .filter(isAssistantAction)
        .map((action, index) => ({ action, key: `${messageId}:${index}` }));

      setMessages((current) => [...current, { id: messageId, role: "assistant", text: result.reply!, actions }]);
      const previews = actions.flatMap(({ action }) =>
        action.type === "confirm_plan" && Array.isArray(action.suggestions)
          ? action.suggestions as AssistantSuggestion[]
          : []
      );
      if (previews.length > 0) announcePlanPreviews(previews);
    } catch {
      setMessages((current) => [
        ...current,
        {
          id: nextMessageId(),
          role: "assistant",
          text: "Não consegui falar com o Vitru agora. Tente novamente em alguns instantes.",
        },
      ]);
    } finally {
      setTyping(false);
    }
  }

  function renderAction({ action, key }: DisplayedAction) {
    if (dismissedKeys.has(key)) return null;

    if (action.type === "confirm_plan") {
      return null;
    }

    if (action.type === "open_lesson") {
      const lessonId = typeof action.lessonId === "string" ? action.lessonId : null;
      if (!lessonId) return null;
      return (
        <button
          key={key}
          type="button"
          onClick={() => router.push(`/disciplinas/${objectId}/trilha-de-aprendizagem/${lessonId}`)}
          className="mt-3 w-fit rounded-full bg-brand-yellow px-4 py-2 text-xs font-semibold text-black transition hover:bg-brand-yellow-dark"
        >
          {action.label}
        </button>
      );
    }

    if (action.type === "navigate") {
      const href = typeof action.href === "string" ? action.href : null;
      if (!href) return null;
      return (
        <button
          key={key}
          type="button"
          onClick={() => router.push(href)}
          className="mt-3 w-fit rounded-full border border-border-subtle px-4 py-2 text-xs font-medium text-text-secondary transition hover:bg-bg-card-hover hover:text-white"
        >
          {action.label}
        </button>
      );
    }

    if (action.type === "dismiss") {
      return (
        <button
          key={key}
          type="button"
          onClick={() => setDismissedKeys((current) => new Set(current).add(key))}
          className="mt-3 w-fit text-xs text-text-secondary underline-offset-2 hover:underline"
        >
          {action.label}
        </button>
      );
    }

    return null;
  }

  return (
    <div className="flex h-full flex-col rounded-2xl bg-bg-card">
      <div className="flex items-center gap-3 border-b border-border-subtle p-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-yellow/15">
          <SparklesIcon className="h-4.5 w-4.5 text-brand-yellow" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-white">{copy.title}</p>
          <p className="text-xs text-text-secondary">{copy.subtitle}</p>
        </div>
        {onToggleExpanded && (
          <button
            type="button"
            onClick={onToggleExpanded}
            aria-label={isExpanded ? "Diminuir chat" : "Expandir chat"}
            title={isExpanded ? "Diminuir chat" : "Expandir chat"}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border-subtle text-lg text-text-secondary transition hover:bg-bg-card-hover hover:text-white"
          >
            {isExpanded ? "↤" : "↔"}
          </button>
        )}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar assistente"
            className="text-text-secondary hover:text-white"
          >
            ✕
          </button>
        )}
      </div>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.map((message) => (
          <div key={message.id} className={message.role === "user" ? "flex justify-end" : ""}>
            <div
              className={`max-w-[92%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                message.role === "assistant"
                  ? "bg-black/30 text-text-secondary"
                  : "bg-brand-yellow/15 text-white"
              }`}
            >
              {message.text}
              {message.actions?.map((displayed) => renderAction(displayed))}
            </div>
          </div>
        ))}
        {typing && (
          <div className="max-w-[60%] rounded-2xl bg-black/30 px-3.5 py-2.5 text-sm text-text-secondary/60">
            Vitru está digitando…
          </div>
        )}
      </div>

      {copy.quickPrompts.length > 0 && (
        <div className="flex flex-wrap gap-2 border-t border-border-subtle p-3">
          {copy.quickPrompts.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => void sendMessage(prompt)}
              disabled={typing}
              className="rounded-full border border-border-subtle px-3 py-1.5 text-xs font-medium text-text-secondary transition hover:bg-bg-card-hover hover:text-white"
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void sendMessage(input);
        }}
        className="flex items-center gap-2 border-t border-border-subtle p-3"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Descreva sua rotina ou pergunte algo"
          aria-label="Mensagem para o Vitru"
          className="flex-1 rounded-full bg-black/30 px-4 py-2.5 text-sm text-white placeholder:text-text-secondary/60 focus:outline-none focus:ring-1 focus:ring-brand-yellow"
        />
        <button
          type="submit"
          disabled={!input.trim() || typing}
          aria-label="Enviar mensagem"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-yellow text-black transition hover:bg-brand-yellow-dark disabled:cursor-not-allowed disabled:opacity-40"
        >
          <SendIcon className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
