import { and, desc, eq, gt, isNull, or } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import * as s from "@/lib/db/schema";
import { requireStudentBySlug } from "@/lib/data/db-helpers";

export type MemoryKind = "preference" | "constraint" | "decision" | "fact";
export type MemorySource = "stated" | "inferred" | "system";

export interface Memory {
  id: string;
  kind: MemoryKind;
  source: MemorySource;
  content: string;
  subjectCode: string | null;
  confidence: number | null;
  validUntil: string | null;
  createdAt: string;
}

export interface NewMemory {
  kind: MemoryKind;
  source: MemorySource;
  content: string;
  subjectCode?: string | null;
  confidence?: number | null;
  validUntil?: string | null;
}

function toMemory(row: typeof s.memories.$inferSelect): Memory {
  return {
    id: row.id,
    kind: row.kind as MemoryKind,
    source: row.source as MemorySource,
    content: row.content,
    subjectCode: row.subjectCode,
    confidence: row.confidence,
    validUntil: row.validUntil ? row.validUntil.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function addMemory(userId: string, memory: NewMemory): Promise<Memory> {
  const student = await requireStudentBySlug(userId);
  const db = await getDb();
  const [row] = await db
    .insert(s.memories)
    .values({
      studentId: student.id,
      kind: memory.kind,
      source: memory.source,
      content: memory.content,
      subjectCode: memory.subjectCode ?? null,
      confidence: memory.confidence ?? null,
      validUntil: memory.validUntil ? new Date(memory.validUntil) : null,
    })
    .returning();
  return toMemory(row);
}

/**
 * Memórias vigentes de um aluno: exclui as já substituídas
 * (`supersededBy` preenchido, ver `supersedeMemory`) e as vencidas
 * (`validUntil` no passado). Ordenadas da mais recente para a mais antiga —
 * é a lista que a Fase 5 injeta no prompt.
 */
export async function listActiveMemories(userId: string, kind?: MemoryKind): Promise<Memory[]> {
  const student = await requireStudentBySlug(userId);
  const db = await getDb();
  const now = new Date();

  const conditions = [
    eq(s.memories.studentId, student.id),
    isNull(s.memories.supersededBy),
    or(isNull(s.memories.validUntil), gt(s.memories.validUntil, now))!,
  ];
  if (kind) conditions.push(eq(s.memories.kind, kind));

  const rows = await db
    .select()
    .from(s.memories)
    .where(and(...conditions))
    .orderBy(desc(s.memories.createdAt));
  return rows.map(toMemory);
}

/**
 * Corrige um fato sem apagar o histórico: grava a versão nova e aponta a
 * antiga para ela via `supersededBy`. `listActiveMemories` passa a ignorar
 * a antiga automaticamente — nada precisa ser deletado.
 */
export async function supersedeMemory(
  userId: string,
  memoryId: string,
  replacement: NewMemory
): Promise<Memory> {
  const created = await addMemory(userId, replacement);
  const db = await getDb();
  await db.update(s.memories).set({ supersededBy: created.id }).where(eq(s.memories.id, memoryId));
  return created;
}
