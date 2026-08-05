"use client";

import { useEffect, useRef, useState } from "react";
import { SendIcon, SparklesIcon } from "@/components/icons";

interface ChatMessage {
  id: number;
  role: "assistant" | "user";
  text: string;
}

const QUICK_PROMPTS = ["Resumir esta lição", "Como isso cai na prova?", "O que é a Sofia?"];

function buildReply(prompt: string, lessonTitle: string, lessonSummary: string): string {
  const normalized = prompt.trim().toLowerCase();

  if (normalized.includes("resumir")) {
    return lessonSummary;
  }

  if (normalized.includes("prova") || normalized.includes("avaliação")) {
    return `Esse conteúdo de "${lessonTitle}" costuma aparecer nas avaliações descritivas e nas autoatividades da unidade — vale revisar a fórmula ou o passo a passo antes de tentar os exercícios sozinho(a).`;
  }

  if (normalized.includes("sofia") || normalized.includes("quem é você") || normalized.includes("o que você")) {
    return "Eu sou a Sofia, a assistente de estudos da UNIASSELVI. Nesta versão de demonstração, minhas respostas são simuladas — em produção eu conversaria de verdade sobre o conteúdo da sua trilha.";
  }

  return "Essa é uma versão de demonstração da Sofia, então minhas respostas por aqui são simuladas. Experimente um dos atalhos abaixo do chat para ver um exemplo de resposta sobre esta lição.";
}

interface LessonChatProps {
  lessonTitle: string;
  lessonSummary: string;
}

export function LessonChat({ lessonTitle, lessonSummary }: LessonChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 0,
      role: "assistant",
      text: `Oi! Eu sou a Sofia. Estou aqui para te ajudar com "${lessonTitle}". Pergunte algo ou use um dos atalhos abaixo.`,
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

    setMessages((current) => [...current, { id: current.length, role: "user", text: trimmed }]);
    setInput("");
    setTyping(true);

    setTimeout(() => {
      setMessages((current) => [
        ...current,
        { id: current.length, role: "assistant", text: buildReply(trimmed, lessonTitle, lessonSummary) },
      ]);
      setTyping(false);
    }, 500);
  }

  return (
    <div className="flex h-full flex-col rounded-2xl bg-bg-card">
      <div className="flex items-center gap-3 border-b border-border-subtle p-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-yellow/15">
          <SparklesIcon className="h-4.5 w-4.5 text-brand-yellow" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white">Sofia</p>
          <p className="text-xs text-text-secondary">Assistente de estudos · demonstração</p>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`max-w-[90%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
              message.role === "assistant"
                ? "bg-black/30 text-text-secondary"
                : "ml-auto bg-brand-yellow/15 text-white"
            }`}
          >
            {message.text}
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
          placeholder="Pergunte alguma coisa"
          className="flex-1 rounded-full bg-black/30 px-4 py-2.5 text-sm text-white placeholder:text-text-secondary/60 focus:outline-none focus:ring-1 focus:ring-brand-yellow"
        />
        <button
          type="submit"
          disabled={!input.trim()}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-yellow text-black transition hover:bg-brand-yellow-dark disabled:cursor-not-allowed disabled:opacity-40"
        >
          <SendIcon className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
