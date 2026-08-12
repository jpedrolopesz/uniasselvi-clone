import { asc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import * as s from "@/lib/db/schema";
import type { UserIndex, UserManifest } from "@/lib/types/raw/local";
import { findStudentBySlug } from "@/lib/data/db-helpers";

export async function loadUserIndex(): Promise<UserIndex> {
  const db = await getDb();
  const rows = await db
    .select({
      slug: s.students.slug,
      label: s.students.displayLabel,
      isFictional: s.students.isFictional,
      isDefault: s.students.isDefault,
    })
    .from(s.students)
    .orderBy(asc(s.students.createdAt));

  const [defaultSetting] = await db
    .select()
    .from(s.appSettings)
    .where(eq(s.appSettings.key, "defaultUserId"));

  const defaultUserId =
    defaultSetting?.value ?? rows.find((row) => row.isDefault)?.slug ?? rows[0]?.slug;
  if (!defaultUserId) throw new Error("Nenhum aluno cadastrado no banco.");

  return {
    users: rows.map(({ slug, label, isFictional }) => ({ id: slug, label, isFictional })),
    defaultUserId,
  };
}

export async function loadUserManifest(userId: string): Promise<UserManifest> {
  const student = await findStudentBySlug(userId);
  if (!student) throw new Error(`Aluno não encontrado: "${userId}".`);

  return {
    userId: student.slug,
    isFictional: student.isFictional,
    displayLabel: student.displayLabel,
    scenario: student.scenario ?? "",
    scenarioCode: student.scenarioCode ?? undefined,
    simulationDate: student.simulationDate ?? undefined,
    cohortBaseUserId: student.cohortBaseSlug ?? undefined,
    datasets: student.manifestDatasets ?? {
      userData: false,
      currentSemester: false,
      sofiaDadosAluno: false,
      disciplines: false,
      financialTitles: false,
    },
    subjects: student.subjects,
    screens: student.screens,
    notes: student.notes ?? "",
  };
}
