import { and, eq, sql } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import * as s from "@/lib/db/schema";
import { findStudentBySlug, requireStudentBySlug } from "@/lib/data/db-helpers";
import type { Surface } from "@/lib/vitru/surfaces";

export interface SurfaceVisit {
  visitCount: number;
  firstSeenAt: string;
  lastSeenAt: string;
  onboardedAt: string | null;
}

function toSurfaceVisit(row: typeof s.surfaceVisits.$inferSelect): SurfaceVisit {
  return {
    visitCount: row.visitCount,
    firstSeenAt: row.firstSeenAt.toISOString(),
    lastSeenAt: row.lastSeenAt.toISOString(),
    onboardedAt: row.onboardedAt ? row.onboardedAt.toISOString() : null,
  };
}

/**
 * Registra que o aluno abriu esta superfície agora — chamado no caminho de
 * abertura (modo sem mensagem em chat/route.ts), nunca a cada mensagem
 * trocada dentro de uma sessão já aberta.
 *
 * `visitCount` é o que a Fase 5 usa para decidir o quanto explicar:
 * 0 → primeira vez, 1–3 → retornando, 4+ → frequente (ver prompts.ts).
 * Devolve o registro já atualizado para quem chama decidir o nível sem uma
 * segunda consulta.
 */
export async function recordSurfaceVisit(userId: string, surface: Surface): Promise<SurfaceVisit> {
  const student = await requireStudentBySlug(userId);
  const db = await getDb();
  const now = new Date();

  const [row] = await db
    .insert(s.surfaceVisits)
    .values({ studentId: student.id, surface, visitCount: 1, firstSeenAt: now, lastSeenAt: now })
    .onConflictDoUpdate({
      target: [s.surfaceVisits.studentId, s.surfaceVisits.surface],
      set: { visitCount: sql`${s.surfaceVisits.visitCount} + 1`, lastSeenAt: now },
    })
    .returning();

  return toSurfaceVisit(row);
}

/** Leitura sem incrementar — para quem só precisa do nível atual sem contar uma nova visita. */
export async function getSurfaceVisit(userId: string, surface: Surface): Promise<SurfaceVisit | null> {
  const student = await findStudentBySlug(userId);
  if (!student) return null;
  const db = await getDb();
  const [row] = await db
    .select()
    .from(s.surfaceVisits)
    .where(and(eq(s.surfaceVisits.studentId, student.id), eq(s.surfaceVisits.surface, surface)))
    .limit(1);
  return row ? toSurfaceVisit(row) : null;
}

/** Marca que o aluno já passou pela explicação inicial completa desta superfície. */
export async function markSurfaceOnboarded(userId: string, surface: Surface): Promise<void> {
  const student = await requireStudentBySlug(userId);
  const db = await getDb();
  await db
    .update(s.surfaceVisits)
    .set({ onboardedAt: new Date() })
    .where(and(eq(s.surfaceVisits.studentId, student.id), eq(s.surfaceVisits.surface, surface)));
}
