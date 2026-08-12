import { asc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import * as s from "@/lib/db/schema";
import { findStudentBySlug, hasDataset } from "@/lib/data/db-helpers";
import type { UserDataRaw } from "@/lib/types/raw/user-data";
import type { CurrentSemesterRaw } from "@/lib/types/raw/current-semester";
import type { SofiaDadosAlunoRaw } from "@/lib/types/raw/sofia-dados-aluno";
import type { DisciplineRaw } from "@/lib/types/raw/disciplines";
import type { FinancialTitleRaw } from "@/lib/types/raw/financial-titles";

export async function loadUserData(userId: string): Promise<UserDataRaw | null> {
  const student = await findStudentBySlug(userId);
  return student?.userData ?? null;
}

export async function loadCurrentSemester(
  userId: string
): Promise<CurrentSemesterRaw | null> {
  const student = await findStudentBySlug(userId);
  if (!student || student.currentSemester === null) return null;
  return { value: student.currentSemester };
}

export async function loadSofiaDadosAluno(
  userId: string
): Promise<SofiaDadosAlunoRaw | null> {
  const student = await findStudentBySlug(userId);
  return student?.sofia ?? null;
}

export async function loadDisciplines(
  userId: string
): Promise<DisciplineRaw[] | null> {
  const student = await findStudentBySlug(userId);
  if (!student) return null;
  if (!(await hasDataset(student.id, "disciplines"))) return null;

  const db = await getDb();
  const rows = await db
    .select()
    .from(s.disciplines)
    .where(eq(s.disciplines.studentId, student.id))
    .orderBy(asc(s.disciplines.ordinal));
  return rows.map((row) => row.payload);
}

export async function loadFinancialTitles(
  userId: string
): Promise<FinancialTitleRaw[] | null> {
  const student = await findStudentBySlug(userId);
  if (!student) return null;
  if (!(await hasDataset(student.id, "financial-titles"))) return null;

  const db = await getDb();
  const rows = await db
    .select()
    .from(s.financialTitles)
    .where(eq(s.financialTitles.studentId, student.id))
    .orderBy(asc(s.financialTitles.ordinal));
  return rows.map((row) => row.payload);
}
