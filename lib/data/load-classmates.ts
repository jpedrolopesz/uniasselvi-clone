import { asc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import * as s from "@/lib/db/schema";
import type { ClassmateRecordRaw } from "@/lib/types/raw/classmates";

/**
 * Só deve ser chamado a partir de um Server Component/Server Action que já
 * validou que `classId` é a turma do usuário ativo (ver
 * lib/exam-schedule/group-related-students.ts) — o registro completo
 * (incluindo cidade) nunca deve ser repassado ao cliente sem passar por
 * `groupRelatedStudents`, que reduz para `PublicStudentConnection`.
 *
 * Simplificação assumida: diferente dos loaders por aluno, não há aqui uma
 * tabela de presença equivalente a `academic.datasets` — uma turma sem
 * nenhum colega semeado é indistinguível de uma turma inexistente, e ambas
 * retornam `null`. Nenhum fixture ou teste hoje depende de "turma existe,
 * mas está vazia"; se isso vier a importar, adicionar presença por
 * `classCode` do mesmo jeito que já existe por aluno.
 */
export async function loadClassmates(classId: string): Promise<ClassmateRecordRaw[] | null> {
  const db = await getDb();
  const rows = await db
    .select()
    .from(s.classmates)
    .where(eq(s.classmates.classCode, classId))
    .orderBy(asc(s.classmates.ordinal));
  if (rows.length === 0) return null;
  return rows.map((row) => row.payload);
}
