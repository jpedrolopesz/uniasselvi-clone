"use client";

import { useEffect, useRef, useState } from "react";
import { SendIcon, SparklesIcon } from "@/components/icons";
import { SuggestionCard } from "@/components/study-planner/SuggestionCard";
import type { ChatMessage } from "@/components/study-planner/chat-types";
import {
  QUICK_PROMPTS,
  type AssistantSuggestion,
} from "@/lib/study-planner/ai-assistant";

interface AssistantPanelProps {
  userId: string;
  onAcceptSuggestion: (suggestion: AssistantSuggestion) => Promise<void>;
  isExpanded?: boolean;
  onToggleExpanded?: () => void;
  /** Presente apenas na versão em drawer (mobile), para exibir o botão de fechar. */
  onClose?: () => void;
}

let messageIdCounter = 0;
function nextMessageId(): number {
  messageIdCounter += 1;
  return messageIdCounter;
}

export function AssistantPanel({
  userId,
  onAcceptSuggestion,
  isExpanded = false,
  onToggleExpanded,
  onClose,
}: AssistantPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: nextMessageId(),
      role: "assistant",
      text: "Oi! Eu sou o Vitru · Calendário. Posso analisar suas avaliações abertas, seus prazos e sua rotina para sugerir um plano. Nada será adicionado sem sua confirmação.",
    },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const conversationId = useRef<string | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || typing) return;

    setMessages((current) => [...current, { id: nextMessageId(), role: "user", text: trimmed }]);
    setInput("");
    setTyping(true);
    conversationId.current ??= `portal-calendar-${userId}-${Date.now()}`;

    try {
      const response = await fetch("/api/v1/vitru/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel: "portal",
          agent: "study_planner",
          userId,
          conversationId: conversationId.current,
          message: trimmed,
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error("Falha ao consultar o Vitru.");

      setMessages((current) => [
        ...current,
        {
          id: nextMessageId(),
          role: "assistant",
          text: result.data.replyText,
          suggestions:
            result.data.suggestions?.length > 0
              ? result.data.suggestions.map((suggestion: AssistantSuggestion) => ({
                  suggestion,
                  status: "pending" as const,
                }))
              : undefined,
        },
      ]);
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

  async function respondToSuggestion(
    messageId: number,
    suggestionId: string,
    accepted: boolean
  ) {
    const message = messages.find((item) => item.id === messageId);
    const found = message?.suggestions?.find(
      (item) => item.suggestion.id === suggestionId
    );
    if (!found) return;

    if (!accepted) {
      setMessages((current) =>
        current.map((item) =>
          item.id === messageId && item.suggestions
            ? {
                ...item,
                suggestions: item.suggestions.map((suggestion) =>
                  suggestion.suggestion.id === suggestionId
                    ? { ...suggestion, status: "rejected" as const }
                    : suggestion
                ),
              }
            : item
        )
      );
      return;
    }

    setMessages((current) =>
      current.map((message) => {
        if (message.id !== messageId || !message.suggestions) return message;
        return {
          ...message,
          suggestions: message.suggestions.map((item) =>
            item.suggestion.id === suggestionId
              ? { ...item, status: "saving" as const }
              : item
          ),
        };
      })
    );

    try {
      await onAcceptSuggestion(found.suggestion);
      setMessages((current) =>
        current.map((item) =>
          item.id === messageId && item.suggestions
            ? {
                ...item,
                suggestions: item.suggestions.map((suggestion) =>
                  suggestion.suggestion.id === suggestionId
                    ? { ...suggestion, status: "accepted" as const }
                    : suggestion
                ),
              }
            : item
        )
      );
    } catch {
      setMessages((current) =>
        current.map((item) =>
          item.id === messageId && item.suggestions
            ? {
                ...item,
                suggestions: item.suggestions.map((suggestion) =>
                  suggestion.suggestion.id === suggestionId
                    ? { ...suggestion, status: "error" as const }
                    : suggestion
                ),
              }
            : item
        )
      );
    }
  }

  return (
    <div className="flex h-full flex-col rounded-2xl bg-bg-card">
      <div className="flex items-center gap-3 border-b border-border-subtle p-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-yellow/15">
          <SparklesIcon className="h-4.5 w-4.5 text-brand-yellow" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-white">Vitru · Calendário</p>
          <p className="text-xs text-text-secondary">Planejamento acadêmico · demonstração</p>
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
              {message.suggestions && (
                <div className="mt-3 flex flex-col gap-2">
                  {message.suggestions.map(({ suggestion, status }) => (
                    <SuggestionCard
                      key={suggestion.id}
                      suggestion={suggestion}
                      status={status}
                      onAccept={() => void respondToSuggestion(message.id, suggestion.id, true)}
                      onReject={() => void respondToSuggestion(message.id, suggestion.id, false)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {typing && (
          <div className="max-w-[60%] rounded-2xl bg-black/30 px-3.5 py-2.5 text-sm text-text-secondary/60">
            Vitru está digitando…
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2 border-t border-border-subtle p-3">
        {QUICK_PROMPTS.map((prompt) => (
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
