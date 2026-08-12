/**
 * Aluno descartável para testes que escrevem de verdade no banco.
 *
 * Diferente do antigo armazenamento em arquivo, memória, conversas e
 * interações têm FK real para academic.students — não é uma escolha
 * arbitrária, é o ponto central deste trabalho (memória pertence a um aluno
 * de verdade, chaveada por identidade, não a uma string solta). Use quando
 * o teste precisa de um aluno para satisfazer a FK, mas não se importa com
 * o conteúdo acadêmico dele.
 */
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import * as s from "@/lib/db/schema";

export async function createTestStudent(slug: string): Promise<void> {
  const db = await getDb();
  await db.insert(s.students).values({ slug, displayLabel: slug });
}

/** Cascata remove tudo que depende do aluno (conversas, memórias, trilha, etc.). */
export async function deleteTestStudent(slug: string): Promise<void> {
  const db = await getDb();
  await db.delete(s.students).where(eq(s.students.slug, slug));
}
