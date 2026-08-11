import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { Surface } from "@/lib/vitru/surfaces";

export interface ConversationMessage {
  role: "user" | "assistant";
  text: string;
  at: string;
}

interface ConversationSession {
  conversationId: string;
  key: string;
  messages: ConversationMessage[];
  updatedAt: string;
}

interface ConversationStore {
  /** Por conversationId. */
  sessions: Record<string, ConversationSession>;
  /** `userId:surface:objectId` -> conversationId — a chave de verdade da sessão (spec §9). */
  byKey: Record<string, string>;
}

const STORE_PATH = path.join(
  process.cwd(),
  ".vitru",
  "conversation-sessions.local.json"
);

export const SESSION_TTL_MS = 24 * 60 * 60 * 1000;
const HISTORY_LIMIT = 6;
const STORED_HISTORY_CAP = 40;

let pendingWrite: Promise<unknown> = Promise.resolve();

function sessionKey(userId: string, surface: Surface, objectId: string): string {
  return `${userId}:${surface}:${objectId}`;
}

async function loadStore(): Promise<ConversationStore> {
  try {
    return JSON.parse(await readFile(STORE_PATH, "utf8")) as ConversationStore;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return { sessions: {}, byKey: {} };
    }
    throw error;
  }
}

async function writeStore(store: ConversationStore) {
  const directory = path.dirname(STORE_PATH);
  const temporary = path.join(directory, `.conversation-sessions-${randomUUID()}.tmp`);
  await mkdir(directory, { recursive: true });
  await writeFile(temporary, `${JSON.stringify(store, null, 2)}\n`);
  await rename(temporary, STORE_PATH);
}

function queueWrite(change: (store: ConversationStore) => void) {
  const next = pendingWrite.then(async () => {
    const store = await loadStore();
    change(store);
    await writeStore(store);
  });
  pendingWrite = next.catch(() => undefined);
  return next;
}

function isAlive(session: ConversationSession, now: number): boolean {
  return now - Date.parse(session.updatedAt) < SESSION_TTL_MS;
}

/**
 * A chave de verdade é userId+surface+objectId (spec §9), não o
 * conversationId que o cliente eventualmente enviar — reload de página
 * resolve para a mesma sessão sem depender de nada persistido no cliente.
 * Sessão inexistente ou expirada (24h de inatividade) gera uma nova.
 */
export async function resolveConversationId(
  userId: string,
  surface: Surface,
  objectId: string
): Promise<string> {
  await pendingWrite;
  const store = await loadStore();
  const key = sessionKey(userId, surface, objectId);
  const existingId = store.byKey[key];
  const existing = existingId ? store.sessions[existingId] : undefined;
  if (existing && isAlive(existing, Date.now())) {
    return existing.conversationId;
  }

  const conversationId = `conv-${randomUUID()}`;
  await queueWrite((store) => {
    store.sessions[conversationId] = {
      conversationId,
      key,
      messages: [],
      updatedAt: new Date().toISOString(),
    };
    store.byKey[key] = conversationId;
  });
  return conversationId;
}

/** Sessão desconhecida (conversationId nunca resolvido) é um no-op silencioso — quem chama sempre resolve antes de anexar. */
export function appendMessage(
  conversationId: string,
  message: Omit<ConversationMessage, "at">
): Promise<void> {
  return queueWrite((store) => {
    const session = store.sessions[conversationId];
    if (!session) return;
    session.messages.push({ ...message, at: new Date().toISOString() });
    if (session.messages.length > STORED_HISTORY_CAP) {
      session.messages = session.messages.slice(-STORED_HISTORY_CAP);
    }
    session.updatedAt = new Date().toISOString();
  });
}

/** Últimas 6 mensagens, para enviar ao modelo (spec §9). */
export async function getRecentHistory(conversationId: string): Promise<ConversationMessage[]> {
  await pendingWrite;
  const store = await loadStore();
  const session = store.sessions[conversationId];
  return session ? session.messages.slice(-HISTORY_LIMIT) : [];
}
