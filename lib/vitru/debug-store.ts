export type DebugEntry = { at: number; kind: "snapshot" | "payload" | "action" | "redaction" | "metric"; data: unknown };
let entries: DebugEntry[] = [];
const listeners = new Set<() => void>();

export function getVitruDebugEntries() { return entries; }
export function subscribeVitruDebug(listener: () => void) { listeners.add(listener); return () => listeners.delete(listener); }

export function appendVitruDebug(entry: Omit<DebugEntry, "at">): void {
  if (typeof window === "undefined") return;
  const previous = [...entries].reverse().find(item => item.kind === entry.kind);
  const data = entry.kind === "snapshot" ? { ...(entry.data as object), differenceSincePreviousBytes: previous ? JSON.stringify(entry.data).length - JSON.stringify(previous.data).length : null } : entry.data;
  entries = [...entries.slice(-199), { ...entry, data, at: Date.now() }];
  listeners.forEach((listener) => listener());
}
