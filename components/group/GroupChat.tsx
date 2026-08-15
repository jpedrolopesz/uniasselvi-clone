"use client";

import { useState, type FormEvent } from "react";
import { SendIcon } from "@/components/icons";
import { GROUP_NAME, MEMBERS, MESSAGES, VETERAN, type GroupMessage } from "@/lib/group/mock-group";

const ME = MEMBERS.find((m) => m.isMe)!;

function memberOf(authorId: string) {
  return MEMBERS.find((m) => m.id === authorId);
}

/**
 * Chat do grupo de estudos. Mensagens enviadas ficam só no estado local —
 * não há backend (ver lib/group/mock-group.ts), então somem ao recarregar.
 */
export function GroupChat() {
  const [messages, setMessages] = useState<GroupMessage[]>(MESSAGES);
  const [draft, setDraft] = useState("");

  const online = MEMBERS.filter((m) => m.online).length;

  function send(event: FormEvent) {
    event.preventDefault();
    const text = draft.trim();
    if (!text) return;

    // Horário só é derivado do relógio aqui, num handler de evento: fazer isso
    // na renderização inicial quebraria a hidratação (servidor ≠ cliente).
    const time = new Date().toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });

    setMessages((cur) => [...cur, { id: `local-${cur.length}`, authorId: ME.id, time, text }]);
    setDraft("");
  }

  return (
    <section className="flex min-w-0 flex-1 flex-col rounded-xl border border-border-subtle bg-bg-card">
      <header className="flex items-center justify-between gap-3 border-b border-border-subtle px-4 py-3">
        <div className="min-w-0">
          <h2 className="truncate text-sm font-bold uppercase tracking-tight text-white">
            {GROUP_NAME}
          </h2>
          <p className="mt-0.5 text-xs text-text-secondary">
            Apadrinhados por{" "}
            <span className="font-semibold text-brand-yellow">{VETERAN.name}</span> •{" "}
            {MEMBERS.length} integrantes • {online} online
          </p>
        </div>
        <div className="flex shrink-0 -space-x-2">
          {MEMBERS.map((member) => (
            <span
              key={member.id}
              title={`${member.name} — ${member.detail}`}
              className={`flex h-8 w-8 items-center justify-center rounded-full border-2 border-bg-card text-[11px] font-bold ${
                member.role === "veterano"
                  ? "bg-brand-yellow text-black"
                  : "bg-bg-card-hover text-text-secondary"
              }`}
            >
              {member.initials}
            </span>
          ))}
        </div>
      </header>

      <div
        className="flex max-h-[55vh] min-h-64 flex-1 flex-col gap-4 overflow-y-auto p-4"
        role="log"
        aria-label="Mensagens do grupo"
      >
        {messages.map((message) => {
          const author = memberOf(message.authorId);
          const mine = author?.isMe ?? false;

          return (
            <div key={message.id} className={`flex gap-2 ${mine ? "flex-row-reverse" : ""}`}>
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-bg-card-hover text-[11px] font-bold text-text-secondary"
                aria-hidden="true"
              >
                {author?.initials ?? "?"}
              </span>

              <div className={`min-w-0 max-w-[80%] ${mine ? "items-end text-right" : ""}`}>
                <p className="mb-1 flex items-center gap-2 text-xs text-text-secondary">
                  {!mine && <span className="font-semibold text-white">{author?.name}</span>}
                  {author?.role === "veterano" && (
                    <span className="rounded-full border border-brand-yellow/40 bg-brand-yellow/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-yellow">
                      Veterano
                    </span>
                  )}
                  <span>{message.time}</span>
                </p>
                <p
                  className={`inline-block whitespace-pre-wrap rounded-2xl px-3 py-2 text-left text-sm leading-relaxed ${
                    mine
                      ? "rounded-tr-sm bg-brand-yellow text-black"
                      : "rounded-tl-sm bg-bg-card-hover text-white"
                  }`}
                >
                  {message.text}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <form onSubmit={send} className="flex items-center gap-2 border-t border-border-subtle p-3">
        <label htmlFor="mensagem" className="sr-only">
          Escreva uma mensagem para o grupo
        </label>
        <input
          id="mensagem"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Pergunte ao grupo ou ao veterano..."
          autoComplete="off"
          className="min-w-0 flex-1 rounded-full border border-border-subtle bg-bg-app px-4 py-2 text-sm text-white placeholder:text-text-secondary/70 focus:border-brand-yellow focus:outline-none"
        />
        <button
          type="submit"
          disabled={draft.trim() === ""}
          className="flex shrink-0 items-center gap-1.5 rounded-full bg-brand-yellow px-4 py-2 text-sm font-semibold text-black transition hover:bg-brand-yellow-dark disabled:cursor-not-allowed disabled:opacity-40"
        >
          <SendIcon className="h-4 w-4" aria-hidden="true" />
          Enviar
        </button>
      </form>
    </section>
  );
}
