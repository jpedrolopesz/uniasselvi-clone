/**
 * Carrega os fixtures de public/data para o banco.
 *
 *   npm run db:seed
 *
 * Idempotente: cada aluno é apagado e reinserido dentro de uma transação, de
 * forma que rodar duas vezes seguidas produz exatamente o mesmo estado.
 *
 * Os fixtures continuam sendo a fonte do seed e o simulador da API da
 * instituição — este script não os modifica.
 */
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { eq, sql } from "drizzle-orm";
import type { Database } from "@/lib/db/client";
import * as s from "@/lib/db/schema";
import { STUDENT_LEVEL } from "@/lib/db/schema/academic";
import type { AssessmentRaw } from "@/lib/types/raw/assessments";
import type { AttendancesRaw } from "@/lib/types/raw/attendances";
import type { CalendarEventRaw } from "@/lib/types/raw/calendar-events";
import type { ClassmateRecordRaw } from "@/lib/types/raw/classmates";
import type { CurrentSemesterRaw } from "@/lib/types/raw/current-semester";
import type { DisciplineRaw } from "@/lib/types/raw/disciplines";
import type { ExamScheduleOptionRaw } from "@/lib/types/raw/exam-schedule-options";
import type { FinancialTitleRaw } from "@/lib/types/raw/financial-titles";
import type { LearningPathRaw } from "@/lib/types/raw/learning-path";
import type { UserIndex, UserManifest } from "@/lib/types/raw/local";
import type { RecordingRaw } from "@/lib/types/raw/recordings";
import type { SofiaDadosAlunoRaw } from "@/lib/types/raw/sofia-dados-aluno";
import type { TestContentRaw, TestInfoRaw } from "@/lib/types/raw/test-content";
import type { UserDataRaw } from "@/lib/types/raw/user-data";
import type { WorkScheduleRaw } from "@/lib/types/raw/work-schedule";
import type { StudyActivity } from "@/lib/types/study-activity";
import type { TrilhaProgressRecord } from "@/lib/data/load-trilha-progress";

const USER_ROOT = path.join(process.cwd(), "public", "data", "user");
const SHARED_ROOT = path.join(process.cwd(), "public", "data", "shared");

/** Subdiretório de `subjects/` que guarda imagens, não uma disciplina. */
const NON_SUBJECT_DIRS = new Set(["images"]);

async function readJson<T>(...segments: string[]): Promise<T | null> {
  try {
    return JSON.parse(await readFile(path.join(...segments), "utf-8")) as T;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}

async function listDirs(directory: string): Promise<string[]> {
  try {
    const entries = await readdir(directory, { withFileTypes: true });
    return entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name);
  } catch {
    return [];
  }
}

async function listFiles(directory: string): Promise<string[]> {
  try {
    const entries = await readdir(directory, { withFileTypes: true });
    return entries.filter((entry) => entry.isFile()).map((entry) => entry.name);
  } catch {
    return [];
  }
}

interface Counters {
  [table: string]: number;
}

const counters: Counters = {};
function counted<T>(table: string, rows: T[]): T[] {
  counters[table] = (counters[table] ?? 0) + rows.length;
  return rows;
}

async function seedStudent(
  db: Database,
  slug: string,
  label: string,
  isFictional: boolean,
  isDefault: boolean
): Promise<void> {
  const root = path.join(USER_ROOT, slug);

  const manifest = await readJson<UserManifest>(root, "manifest.json");
  if (!manifest) throw new Error(`manifest.json ausente para "${slug}".`);

  const userData = await readJson<UserDataRaw>(root, "user-data.json");
  const semester = await readJson<CurrentSemesterRaw>(root, "current-semester.json");
  const sofia = await readJson<SofiaDadosAlunoRaw>(root, "sofia-dados-aluno.json");
  const workSchedule = await readJson<WorkScheduleRaw>(root, "work-schedule.json");
  const disciplines = await readJson<DisciplineRaw[]>(root, "disciplines.json");
  const financialTitles = await readJson<FinancialTitleRaw[]>(root, "financial-titles.json");
  const studyActivities = await readJson<StudyActivity[]>(root, "study-activities.json");

  // Um registro por aluno; apagar em cascata limpa tudo o que depende dele.
  await db.delete(s.students).where(eq(s.students.slug, slug));

  const [student] = await db
    .insert(s.students)
    .values({
      slug,
      personId: userData?.person ?? null,
      subscriptionCode: userData?.subscription_code ?? null,
      username: userData?.username ?? null,
      email: userData?.email ?? null,
      fullName: userData?.full_name ?? null,
      firstName: userData?.first_name ?? null,
      courseCode: userData?.course_code ?? null,
      courseName: userData?.course_name ?? null,
      modality: userData?.modality ?? null,
      statusDescription: userData?.status_description ?? null,
      pole: userData?.pole ?? null,
      headquarter: userData?.headquarter ?? null,
      displayLabel: manifest.displayLabel ?? label,
      isFictional,
      isDefault,
      scenario: manifest.scenario ?? null,
      scenarioCode: manifest.scenarioCode ?? null,
      simulationDate: manifest.simulationDate ?? null,
      cohortBaseSlug: manifest.cohortBaseUserId ?? null,
      notes: manifest.notes ?? null,
      subjects: manifest.subjects ?? [],
      screens: manifest.screens ?? [],
      manifestDatasets: manifest.datasets ?? null,
      userData,
      currentSemester: semester?.value ?? null,
      sofia,
      workSchedule,
    })
    .returning({ id: s.students.id });

  const studentId = student.id;
  const datasetRows: (typeof s.datasets.$inferInsert)[] = [];
  const present = (kind: string, subjectCode = STUDENT_LEVEL) =>
    datasetRows.push({ studentId, subjectCode, kind });

  if (userData) present("user-data");
  if (semester) present("current-semester");
  if (sofia) present("sofia-dados-aluno");
  if (workSchedule) present("work-schedule");

  if (disciplines) {
    present("disciplines");
    if (disciplines.length > 0) {
      await db.insert(s.disciplines).values(
        counted(
          "academic.disciplines",
          disciplines.map((payload, ordinal) => ({
            studentId,
            ordinal,
            code: payload.code,
            classCode: payload.class ?? null,
            description: payload.description ?? null,
            currentSubject: payload.current_subject ?? null,
            payload,
          }))
        )
      );
    }
  }

  if (financialTitles) {
    present("financial-titles");
    if (financialTitles.length > 0) {
      await db.insert(s.financialTitles).values(
        counted(
          "academic.financial_titles",
          financialTitles.map((payload, ordinal) => ({
            studentId,
            ordinal,
            ourNumber: payload.our_number ?? null,
            dueDate: payload.due_date ?? null,
            status: payload.status ?? null,
            paid: payload.paid ?? null,
            payload,
          }))
        )
      );
    }
  }

  if (studyActivities) {
    present("study-activities");
    if (studyActivities.length > 0) {
      await db.insert(s.studyActivities).values(
        counted(
          "vitru.study_activities",
          studyActivities.map((activity) => ({
            studentId,
            externalId: activity.id,
            title: activity.title,
            category: activity.category,
            subjectCode: activity.subjectCode,
            subjectName: activity.subjectName,
            date: activity.date,
            startTime: activity.startTime,
            endTime: activity.endTime,
            notes: activity.notes ?? "",
            source: activity.source,
          }))
        )
      );
    }
  }

  // O manifesto lista disciplinas que nem sempre têm pasta — o sistema de
  // arquivos é quem manda para o seed; `manifest.subjects` fica preservado
  // na coluna para que loadUserManifest continue retornando o mesmo valor.
  const subjectsDir = path.join(root, "subjects");
  const subjectCodes = (await listDirs(subjectsDir)).filter(
    (name) => !NON_SUBJECT_DIRS.has(name)
  );

  for (const subjectCode of subjectCodes) {
    const subjectRoot = path.join(subjectsDir, subjectCode);

    const assessments = await readJson<AssessmentRaw[]>(subjectRoot, "assessments.json");
    if (assessments) {
      present("assessments", subjectCode);
      if (assessments.length > 0) {
        await db.insert(s.assessments).values(
          counted(
            "academic.assessments",
            assessments.map((payload, ordinal) => ({
              studentId,
              subjectCode,
              ordinal,
              code: payload.code,
              testCode: payload.test_code ?? null,
              testTypeCode: payload.test_type_code ?? null,
              description: payload.description ?? null,
              beginDate: payload.begin_date ?? null,
              endDate: payload.end_date ?? null,
              weight: payload.weight ?? null,
              examMade: payload.exam_made ?? null,
              needSchedule: payload.need_schedule ?? null,
              hasSchedule: payload.has_schedule ?? null,
              canAnswer: payload.can_answer ?? null,
              payload,
            }))
          )
        );
      }
    }

    const events = await readJson<CalendarEventRaw[]>(subjectRoot, "calendar-events.json");
    if (events) {
      present("calendar-events", subjectCode);
      if (events.length > 0) {
        await db.insert(s.calendarEvents).values(
          counted(
            "academic.calendar_events",
            events.map((payload, ordinal) => ({
              studentId,
              subjectCode,
              ordinal,
              code: payload.code,
              beginDate: payload.begin_date ?? null,
              endDate: payload.end_date ?? null,
              payload,
            }))
          )
        );
      }
    }

    const recordings = await readJson<RecordingRaw[]>(subjectRoot, "recordings.json");
    if (recordings) {
      present("recordings", subjectCode);
      if (recordings.length > 0) {
        await db.insert(s.recordings).values(
          counted(
            "academic.recordings",
            recordings.map((payload, ordinal) => ({
              studentId,
              subjectCode,
              ordinal,
              title: payload.title ?? null,
              dateRecording: payload.date_recording ?? null,
              payload,
            }))
          )
        );
      }
    }

    const attendance = await readJson<AttendancesRaw>(subjectRoot, "attendances.json");
    if (attendance) {
      present("attendances", subjectCode);
      await db.insert(s.attendances).values(
        counted("academic.attendances", [
          {
            studentId,
            subjectCode,
            frequency: attendance.frequency ?? null,
            payload: attendance,
          },
        ])
      );
    }

    const learningPath = await readJson<LearningPathRaw>(subjectRoot, "learning-path.json");
    if (learningPath) {
      present("learning-path", subjectCode);
      await db.insert(s.learningPaths).values(
        counted("academic.learning_paths", [
          { studentId, subjectCode, payload: learningPath },
        ])
      );
    }

    const progress = await readJson<TrilhaProgressRecord>(subjectRoot, "trilha-progress.json");
    if (progress) {
      present("trilha-progress", subjectCode);
      if (progress.completedLessonIds.length > 0) {
        await db.insert(s.trilhaCompletions).values(
          counted(
            "vitru.trilha_completions",
            progress.completedLessonIds.map((lessonId) => ({
              studentId,
              subjectCode,
              lessonId,
            }))
          )
        );
      }
      if (progress.marks.length > 0) {
        await db.insert(s.trilhaMarks).values(
          counted(
            "vitru.trilha_marks",
            progress.marks.map((mark) => ({
              studentId,
              subjectCode,
              lessonId: mark.lessonId,
              paragraphId: mark.paragraphId,
              excerpt: mark.excerpt,
              markedAt: new Date(mark.markedAt),
            }))
          )
        );
      }
    }

    // tests/<testCode>.json é o conteúdo da prova;
    // tests/<testCode>/schedule-options.json são as opções de agendamento.
    const testsDir = path.join(subjectRoot, "tests");
    for (const fileName of await listFiles(testsDir)) {
      if (!fileName.endsWith(".json")) continue;
      const testCode = fileName.slice(0, -".json".length);
      const payload = await readJson<TestContentRaw | TestInfoRaw>(testsDir, fileName);
      if (!payload) continue;
      present(`test-content:${testCode}`, subjectCode);
      await db.insert(s.testContents).values(
        counted("academic.test_contents", [{ studentId, subjectCode, testCode, payload }])
      );
    }

    for (const testCode of await listDirs(testsDir)) {
      const options = await readJson<ExamScheduleOptionRaw[]>(
        testsDir,
        testCode,
        "schedule-options.json"
      );
      if (!options) continue;
      present(`schedule-options:${testCode}`, subjectCode);
      if (options.length > 0) {
        await db.insert(s.examScheduleOptions).values(
          counted(
            "academic.exam_schedule_options",
            options.map((payload, ordinal) => ({
              studentId,
              subjectCode,
              testCode,
              ordinal,
              payload,
            }))
          )
        );
      }
    }
  }

  if (datasetRows.length > 0) {
    await db.insert(s.datasets).values(counted("academic.datasets", datasetRows));
  }
}

async function seedClassmates(db: Database): Promise<void> {
  const directory = path.join(SHARED_ROOT, "classmates");
  await db.delete(s.classmates);
  for (const fileName of await listFiles(directory)) {
    if (!fileName.endsWith(".json")) continue;
    const classCode = fileName.slice(0, -".json".length);
    const records = await readJson<ClassmateRecordRaw[]>(directory, fileName);
    if (!records || records.length === 0) continue;
    await db.insert(s.classmates).values(
      counted(
        "academic.classmates",
        records.map((payload, ordinal) => ({ classCode, ordinal, payload }))
      )
    );
  }
}

export async function seedFixtures(db: Database): Promise<void> {
  const index = await readJson<UserIndex>(USER_ROOT, "index.json");
  if (!index) throw new Error("public/data/user/index.json não encontrado.");

  for (const entry of index.users) {
    await seedStudent(
      db,
      entry.id,
      entry.label,
      entry.isFictional,
      entry.id === index.defaultUserId
    );
    console.log(`  ✓ ${entry.id}`);
  }

  await seedClassmates(db);

  await db
    .insert(s.appSettings)
    .values({ key: "defaultUserId", value: index.defaultUserId })
    .onConflictDoUpdate({
      target: s.appSettings.key,
      set: { value: index.defaultUserId, updatedAt: sql`now()` },
    });

  console.log();
  console.table(
    Object.entries(counters)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([tabela, linhas]) => ({ tabela, linhas }))
  );
  console.log(`${index.users.length} alunos semeados.`);
}
