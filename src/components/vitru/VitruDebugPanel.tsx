"use client";
import { useSyncExternalStore } from "react";
import { getVitruDebugEntries, subscribeVitruDebug, type DebugEntry } from "@/lib/vitru/debug-store";

export function VitruDebugPanel() {
  const entries = useSyncExternalStore(subscribeVitruDebug, getVitruDebugEntries, () => []);
  const column = (title: string, kinds: DebugEntry["kind"][]) => <section className="min-w-0 rounded-xl bg-zinc-900 p-4"><h2 className="mb-3 text-xl font-bold text-yellow-300">{title}</h2><pre className="max-h-[75vh] overflow-auto whitespace-pre-wrap text-xs text-zinc-200">{JSON.stringify(entries.filter(e => kinds.includes(e.kind)), null, 2)}</pre></section>;
  return <main className="min-h-screen bg-black p-6 text-white"><h1 className="mb-1 text-3xl font-bold">O que o Vitru está vendo</h1><p className="mb-6 text-sm text-zinc-400">Atualização ao vivo via armazenamento local desta sessão.</p><div className="grid gap-4 lg:grid-cols-3">{column("Vendo", ["snapshot", "redaction"])}{column("Recebeu", ["payload", "metric"])}{column("Fez", ["action"])}</div></main>;
}
