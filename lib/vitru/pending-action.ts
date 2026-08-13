import type { VitruPageId } from "@/lib/vitru/page-context";

export interface PendingAction {
  id: string;
  kind: string;
  argsHash: string;
  expiresAt: number;
  consumed: boolean;
  surface: VitruPageId;
}

export type PendingActionResult = { ok: true; pending: PendingAction } | { ok: false; reason: "missing" | "expired" | "consumed" | "surface" | "arguments" };

export function hashPendingArgs(args: unknown): string {
  const text = JSON.stringify(args, Object.keys(args as object).sort());
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) hash = Math.imul(hash ^ text.charCodeAt(index), 16777619);
  return (hash >>> 0).toString(16).padStart(8, "0");
}

export function createPendingAction(kind: string, args: unknown, surface: VitruPageId, now = Date.now(), id = crypto.randomUUID()): PendingAction {
  return { id, kind, argsHash: hashPendingArgs(args), expiresAt: now + 90_000, consumed: false, surface };
}

export function consumePendingAction(pending: PendingAction | null, args: unknown, surface: VitruPageId, now = Date.now()): PendingActionResult {
  if (!pending) return { ok: false, reason: "missing" };
  if (pending.consumed) return { ok: false, reason: "consumed" };
  if (now > pending.expiresAt) return { ok: false, reason: "expired" };
  if (pending.surface !== surface) return { ok: false, reason: "surface" };
  if (pending.argsHash !== hashPendingArgs(args)) return { ok: false, reason: "arguments" };
  pending.consumed = true;
  return { ok: true, pending };
}

/** Caminho único usado por `confirmar`: autoriza e só então alcança a escrita. */
export function executePendingWrite(
  pending: PendingAction | null,
  args: unknown,
  surface: VitruPageId,
  write: (authorization: PendingAction) => boolean,
  now = Date.now()
): PendingActionResult {
  const authorization = consumePendingAction(pending, args, surface, now);
  if (!authorization.ok) return authorization;
  return write(authorization.pending) ? authorization : { ok: false, reason: "arguments" };
}
