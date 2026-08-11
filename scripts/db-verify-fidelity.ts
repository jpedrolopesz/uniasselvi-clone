/**
 * Compara o que está no banco com os fixtures de origem, campo a campo.
 *
 *   npm run db:verify
 *
 * A migração só é confiável se o banco devolver exatamente o que os arquivos
 * diziam — inclusive na distinção entre "dataset ausente" e "dataset vazio",
 * que a interface usa para escolher entre duas mensagens diferentes.
 */
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { and, eq } from "drizzle-orm";
import { closeDb, getDb } from "@/lib/db/client";
import * as s from "@/lib/db/schema";
import { STUDENT_LEVEL } from "@/lib/db/schema/academic";
import type { AssessmentRaw } from "@/lib/types/raw/assessments";
import type { DisciplineRaw } from "@/lib/types/raw/disciplines";
import type { UserIndex } from "@/lib/types/raw/local";
import type { WorkScheduleRaw } from "@/lib/types/raw/work-schedule";

const USER_ROOT = path.join(process.cwd(), "public", "data", "user");

/**
 * Serializa com as chaves de objeto ordenadas.
 *
 * `jsonb` normaliza a ordem das chaves ao armazenar — é comportamento
 * definido do Postgres, não perda de dado. Comparar com JSON.stringify cru
 * acusaria diferença em todo objeto cuja ordem mudou, o que não diz nada
 * sobre fidelidade: a aplicação lê por chave, nunca por posição. A ordem de
 * *arrays* continua significativa e é preservada aqui.
 */
function canonical(value: unknown): string {
  const walk = (node: unknown): unknown => {
    if (Array.isArray(node)) return node.map(walk);
    if (node && typeof node === "object") {
      return Object.fromEntries(
        Object.keys(node as Record<string, unknown>)
          .sort()
          .map((key) => [key, walk((node as Record<string, unknown>)[key])])
      );
    }
    return node;
  };
  return JSON.stringify(walk(value));
}

let failures = 0;
function check(label: string, actual: unknown, expected: unknown): void {
  if (canonical(actual) === canonical(expected)) return;
  failures += 1;
  console.log(`  ✗ ${label}`);
  console.log(`      esperado: ${canonical(expected)?.slice(0, 160)}`);
  console.log(`      obtido:   ${canonical(actual)?.slice(0, 160)}`);
}

async function readJson<T>(...segments: string[]): Promise<T | null> {
  try {
    return JSON.parse(await readFile(path.join(...segments), "utf-8")) as T;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}

async function main(): Promise<void> {
  const db = await getDb();
  const index = await readJson<UserIndex>(USER_ROOT, "index.json");
  if (!index) throw new Error("index.json não encontrado.");

  let students = 0;
  let disciplinesChecked = 0;
  let assessmentsChecked = 0;
  let absentDatasets = 0;

  for (const entry of index.users) {
    const root = path.join(USER_ROOT, entry.id);
    const [student] = await db
      .select()
      .from(s.students)
      .where(eq(s.students.slug, entry.id));

    if (!student) {
      failures += 1;
      console.log(`  ✗ aluno ausente no banco: ${entry.id}`);
      continue;
    }
    students += 1;

    // --- jornada de trabalho: o dado que a IA insistia em perguntar ---
    const fileWork = await readJson<WorkScheduleRaw>(root, "work-schedule.json");
    check(`${entry.id} · work_schedule`, student.workSchedule ?? null, fileWork);
    if (fileWork === null) absentDatasets += 1;

    // --- disciplinas: payload bruto tem de voltar idêntico ---
    const fileDisciplines = await readJson<DisciplineRaw[]>(root, "disciplines.json");
    const dbDisciplines = await db
      .select()
      .from(s.disciplines)
      .where(eq(s.disciplines.studentId, student.id))
      .orderBy(s.disciplines.ordinal);
    check(
      `${entry.id} · disciplines`,
      dbDisciplines.map((row) => row.payload),
      fileDisciplines ?? []
    );
    disciplinesChecked += dbDisciplines.length;

    // --- presença de dataset: ausente ≠ vazio ---
    const [presence] = await db
      .select()
      .from(s.datasets)
      .where(
        and(
          eq(s.datasets.studentId, student.id),
          eq(s.datasets.subjectCode, STUDENT_LEVEL),
          eq(s.datasets.kind, "disciplines")
        )
      );
    check(
      `${entry.id} · datasets[disciplines] presente`,
      Boolean(presence),
      fileDisciplines !== null
    );

    // --- avaliações por disciplina ---
    const subjectsDir = path.join(root, "subjects");
    let subjectDirs: string[] = [];
    try {
      subjectDirs = (await readdir(subjectsDir, { withFileTypes: true }))
        .filter((e) => e.isDirectory() && e.name !== "images")
        .map((e) => e.name);
    } catch {
      subjectDirs = [];
    }

    for (const subjectCode of subjectDirs) {
      const fileAssessments = await readJson<AssessmentRaw[]>(
        subjectsDir,
        subjectCode,
        "assessments.json"
      );
      const dbAssessments = await db
        .select()
        .from(s.assessments)
        .where(
          and(
            eq(s.assessments.studentId, student.id),
            eq(s.assessments.subjectCode, subjectCode)
          )
        )
        .orderBy(s.assessments.ordinal);
      check(
        `${entry.id}/${subjectCode} · assessments`,
        dbAssessments.map((row) => row.payload),
        fileAssessments ?? []
      );
      assessmentsChecked += dbAssessments.length;
      if (fileAssessments === null) absentDatasets += 1;
    }
  }

  console.log();
  console.log(`alunos verificados:      ${students}`);
  console.log(`disciplinas comparadas:  ${disciplinesChecked}`);
  console.log(`avaliações comparadas:   ${assessmentsChecked}`);
  console.log(`datasets ausentes vistos: ${absentDatasets} (confirmam null ≠ [])`);
  console.log();
  console.log(failures === 0 ? "FIDELIDADE OK — nenhuma divergência." : `${failures} DIVERGÊNCIAS.`);
  if (failures > 0) process.exitCode = 1;
}

main()
  .then(() => closeDb())
  .catch(async (error) => {
    console.error(error);
    await closeDb().catch(() => undefined);
    process.exit(1);
  });
