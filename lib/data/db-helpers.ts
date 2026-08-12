/**
 * Utilitários internos usados pelos loaders em lib/data/ para resolver o
 * aluno pelo slug e checar presença de dataset. Não é uma API pública —
 * nada fora de lib/data/ e lib/learning-path/ deveria importar daqui.
 */
import { and, eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import * as s from "@/lib/db/schema";
import { STUDENT_LEVEL } from "@/lib/db/schema/academic";

export type StudentRow = typeof s.students.$inferSelect;

/** `null` quando o slug não corresponde a nenhum aluno — mesmo resultado que um `readUserJsonFileOptional` batendo em diretório inexistente. */
export async function findStudentBySlug(slug: string): Promise<StudentRow | null> {
  const db = await getDb();
  const [row] = await db.select().from(s.students).where(eq(s.students.slug, slug)).limit(1);
  return row ?? null;
}

export async function requireStudentBySlug(slug: string): Promise<StudentRow> {
  const student = await findStudentBySlug(slug);
  if (!student) throw new Error(`Aluno não encontrado: "${slug}".`);
  return student;
}

/**
 * Existência de um dataset — a distinção entre "arquivo ausente" (`null`) e
 * "arquivo presente e vazio" (`[]`) que os loaders originais preservavam.
 * Ver academic.datasets em lib/db/schema/academic.ts para o porquê.
 */
export async function hasDataset(
  studentId: string,
  kind: string,
  subjectCode: string = STUDENT_LEVEL
): Promise<boolean> {
  const db = await getDb();
  const [row] = await db
    .select({ id: s.datasets.id })
    .from(s.datasets)
    .where(
      and(
        eq(s.datasets.studentId, studentId),
        eq(s.datasets.subjectCode, subjectCode),
        eq(s.datasets.kind, kind)
      )
    )
    .limit(1);
  return Boolean(row);
}
