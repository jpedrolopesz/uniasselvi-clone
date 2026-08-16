import { randomUUID } from "node:crypto";
import { and, asc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import * as s from "@/lib/db/schema";
import { requireStudentBySlug } from "@/lib/data/db-helpers";
import type { Surface } from "@/lib/vitru/surfaces";

export type ConversationSurface = Surface | "portal";

export interface ConversationMessage {
  role: "user" | "assistant";
  text: string;
  at: string;
}

export const SESSION_TTL_MS = 24 * 60 * 60 * 1000;
const HISTORY_LIMIT = 6;
const STORED_HISTORY_CAP = 40;
let lastMessageTimestamp = 0;

function nextMessageTimestamp(): Date {
  // PostgreSQL não garante ordem entre linhas com o mesmo created_at. As
  // inserções rápidas do mesmo processo ganham timestamps estritamente
  // crescentes para que o histórico preserve a ordem conversacional.
  lastMessageTimestamp = Math.max(Date.now(), lastMessageTimestamp + 1);
  return new Date(lastMessageTimestamp);
}

function isAlive(updatedAt: Date, now: number): boolean {
  return now - updatedAt.getTime() < SESSION_TTL_MS;
}

/**
 * A chave de verdade é aluno+superfície+objeto (spec §9), não o
 * conversationId que o cliente eventualmente enviar — recarregar a página
 * resolve para a mesma sessão sem depender de nada persistido no cliente.
 * Sessão inexistente ou expirada (24h de inatividade) gera uma nova.
 *
 * Diferente do arquivo local anterior, não há mutex próprio para serializar
 * escritas — o banco resolve concorrência nativamente. Duas chamadas
 * simultâneas para a mesma chave podem ambas tentar criar a sessão; a que
 * perde a corrida do `onConflictDoNothing` simplesmente lê o id que a outra
 * acabou de inserir.
 */
export async function resolveConversationId(
  userId: string,
  surface: ConversationSurface,
  objectId: string
): Promise<string> {
  const student = await requireStudentBySlug(userId);
  const db = await getDb();
  const key = and(
    eq(s.conversations.studentId, student.id),
    eq(s.conversations.surface, surface),
    eq(s.conversations.objectId, objectId)
  );

  const [existing] = await db.select().from(s.conversations).where(key).limit(1);
  if (existing && isAlive(existing.updatedAt, Date.now())) {
    return existing.id;
  }

  // Sessão ausente ou expirada: qualquer linha antiga com esta chave sai
  // (cascata limpa as mensagens dela) para abrir espaço à nova.
  if (existing) {
    await db.delete(s.conversations).where(eq(s.conversations.id, existing.id));
  }

  const now = new Date();
  const [created] = await db
    .insert(s.conversations)
    .values({
      id: `conv-${randomUUID()}`,
      studentId: student.id,
      surface,
      objectId,
      expiresAt: new Date(now.getTime() + SESSION_TTL_MS),
    })
    .onConflictDoNothing({
      target: [s.conversations.studentId, s.conversations.surface, s.conversations.objectId],
    })
    .returning({ id: s.conversations.id });

  if (created) return created.id;

  const [winner] = await db.select({ id: s.conversations.id }).from(s.conversations).where(key).limit(1);
  return winner!.id;
}

/** Sessão desconhecida (conversationId nunca resolvido) é um no-op silencioso — quem chama sempre resolve antes de anexar. */
export async function appendMessage(
  conversationId: string,
  message: Omit<ConversationMessage, "at">
): Promise<void> {
  const db = await getDb();
  const [conversation] = await db
    .select({ id: s.conversations.id })
    .from(s.conversations)
    .where(eq(s.conversations.id, conversationId))
    .limit(1);
  if (!conversation) return;

  await db
    .insert(s.conversationMessages)
    .values({ conversationId, role: message.role, text: message.text, createdAt: nextMessageTimestamp() });
  await db
    .update(s.conversations)
    .set({ updatedAt: new Date() })
    .where(eq(s.conversations.id, conversationId));

  const all = await db
    .select({ id: s.conversationMessages.id })
    .from(s.conversationMessages)
    .where(eq(s.conversationMessages.conversationId, conversationId))
    .orderBy(asc(s.conversationMessages.createdAt));
  if (all.length > STORED_HISTORY_CAP) {
    const overflow = all.slice(0, all.length - STORED_HISTORY_CAP);
    for (const row of overflow) {
      await db.delete(s.conversationMessages).where(eq(s.conversationMessages.id, row.id));
    }
  }
}

/** Últimas 6 mensagens, para enviar ao modelo (spec §9). */
export async function getRecentHistory(conversationId: string): Promise<ConversationMessage[]> {
  const db = await getDb();
  const rows = await db
    .select()
    .from(s.conversationMessages)
    .where(eq(s.conversationMessages.conversationId, conversationId))
    .orderBy(asc(s.conversationMessages.createdAt));

  return rows.slice(-HISTORY_LIMIT).map((row) => ({
    role: row.role as ConversationMessage["role"],
    text: row.text,
    at: row.createdAt.toISOString(),
  }));
}
