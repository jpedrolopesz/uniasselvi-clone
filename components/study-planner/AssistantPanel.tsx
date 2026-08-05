"use client";

import { useEffect, useRef, useState } from "react";
import { SendIcon, SparklesIcon } from "@/components/icons";
import { SuggestionCard } from "@/components/study-planner/SuggestionCard";
import type { ChatMessage } from "@/components/study-planner/chat-types";
import {
  getAssistantResponse,
  QUICK_PROMPTS,
  type AssistantSuggestion,
  type SubjectOption,
} from "@/lib/study-planner/ai-assistant";
import type { StudyActivity } from "@/lib/types/study-activity";

interface AssistantPanelProps {
  activities: StudyActivity[];
  subjects: SubjectOption[];
  onAcceptSuggestion: (suggestion: AssistantSuggestion) => void;
  /** Presente apenas na versão em drawer (mobile), para exibir o botão de fechar. */
  onClose?: () => void;
}

let messageIdCounter = 0;
function nextMessageId(): number {
  messageIdCounter += 1;
  return messageIdCounter;
}

export function AssistantPanel({
  activities,
  subjects,
  onAcceptSuggestion,
  onClose,
}: AssistantPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: nextMessageId(),
      role: "assistant",
      text: 'Oi! Eu sou a Sofia. Posso te ajudar a organizar seus horários de estudo e suas aulas. Me conte sua rotina, ou use um dos atalhos abaixo — nesta demonstração minhas respostas são simuladas.',
    },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;

    setMessages((current) => [...current, { id: nextMessageId(), role: "user", text: trimmed }]);
    setInput("");
    setTyping(true);

    setTimeout(() => {
      const response = getAssistantResponse(trimmed, activities, subjects);
      setMessages((current) => [
        ...current,
        {
          id: nextMessageId(),
          role: "assistant",
          text: response.replyText,
          suggestions:
            response.suggestions.length > 0
              ? response.suggestions.map((suggestion) => ({ suggestion, status: "pending" as const }))
              : undefined,
        },
      ]);
      setTyping(false);
    }, 500);
  }

  function respondToSuggestion(messageId: number, suggestionId: string, accepted: boolean) {
    setMessages((current) =>
      current.map((message) => {
        if (message.id !== messageId || !message.suggestions) return message;
        return {
          ...message,
          suggestions: message.suggestions.map((item) =>
            item.suggestion.id === suggestionId
              ? { ...item, status: accepted ? "accepted" : "rejected" }
              : item
          ),
        };
      })
    );

    if (accepted) {
      const message = messages.find((m) => m.id === messageId);
      const found = message?.suggestions?.find((item) => item.suggestion.id === suggestionId);
      if (found) onAcceptSuggestion(found.suggestion);
    }
  }

  return (
    <div className="flex h-full flex-col rounded-2xl bg-bg-card">
      <div className="flex items-center gap-3 border-b border-border-subtle p-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-yellow/15">
          <SparklesIcon className="h-4.5 w-4.5 text-brand-yellow" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-white">Sofia</p>
          <p className="text-xs text-text-secondary">Assistente de estudos · demonstração</p>
        </div>
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
                      onAccept={() => respondToSuggestion(message.id, suggestion.id, true)}
                      onReject={() => respondToSuggestion(message.id, suggestion.id, false)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {typing && (
          <div className="max-w-[60%] rounded-2xl bg-black/30 px-3.5 py-2.5 text-sm text-text-secondary/60">
            Sofia está digitando…
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2 border-t border-border-subtle p-3">
        {QUICK_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => sendMessage(prompt)}
            className="rounded-full border border-border-subtle px-3 py-1.5 text-xs font-medium text-text-secondary transition hover:bg-bg-card-hover hover:text-white"
          >
            {prompt}
          </button>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage(input);
        }}
        className="flex items-center gap-2 border-t border-border-subtle p-3"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Descreva sua rotina ou pergunte algo"
          aria-label="Mensagem para a Sofia"
          className="flex-1 rounded-full bg-black/30 px-4 py-2.5 text-sm text-white placeholder:text-text-secondary/60 focus:outline-none focus:ring-1 focus:ring-brand-yellow"
        />
        <button
          type="submit"
          disabled={!input.trim()}
          aria-label="Enviar mensagem"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-yellow text-black transition hover:bg-brand-yellow-dark disabled:cursor-not-allowed disabled:opacity-40"
        >
          <SendIcon className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
