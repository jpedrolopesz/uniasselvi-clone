import { and, asc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import * as s from "@/lib/db/schema";
import { findStudentBySlug, hasDataset } from "@/lib/data/db-helpers";
import type { CalendarEventRaw } from "@/lib/types/raw/calendar-events";
import type { RecordingRaw } from "@/lib/types/raw/recordings";
import type { AssessmentRaw } from "@/lib/types/raw/assessments";
import type { AttendancesRaw } from "@/lib/types/raw/attendances";
import type { TestContentRaw, TestInfoRaw } from "@/lib/types/raw/test-content";
import type { LearningPathRaw } from "@/lib/types/raw/learning-path";
import type { ExamScheduleOptionRaw } from "@/lib/types/raw/exam-schedule-options";

export async function loadSubjectCalendarEvents(
  userId: string,
  subjectCode: string
): Promise<CalendarEventRaw[] | null> {
  const student = await findStudentBySlug(userId);
  if (!student) return null;
  if (!(await hasDataset(student.id, "calendar-events", subjectCode))) return null;

  const db = await getDb();
  const rows = await db
    .select()
    .from(s.calendarEvents)
    .where(
      and(eq(s.calendarEvents.studentId, student.id), eq(s.calendarEvents.subjectCode, subjectCode))
    )
    .orderBy(asc(s.calendarEvents.ordinal));
  return rows.map((row) => row.payload);
}

export async function loadSubjectRecordings(
  userId: string,
  subjectCode: string
): Promise<RecordingRaw[] | null> {
  const student = await findStudentBySlug(userId);
  if (!student) return null;
  if (!(await hasDataset(student.id, "recordings", subjectCode))) return null;

  const db = await getDb();
  const rows = await db
    .select()
    .from(s.recordings)
    .where(and(eq(s.recordings.studentId, student.id), eq(s.recordings.subjectCode, subjectCode)))
    .orderBy(asc(s.recordings.ordinal));
  return rows.map((row) => row.payload);
}

export async function loadSubjectAssessments(
  userId: string,
  subjectCode: string
): Promise<AssessmentRaw[] | null> {
  const student = await findStudentBySlug(userId);
  if (!student) return null;
  if (!(await hasDataset(student.id, "assessments", subjectCode))) return null;

  const db = await getDb();
  const rows = await db
    .select()
    .from(s.assessments)
    .where(and(eq(s.assessments.studentId, student.id), eq(s.assessments.subjectCode, subjectCode)))
    .orderBy(asc(s.assessments.ordinal));
  return rows.map((row) => row.payload);
}

/**
 * AttendancesRaw é um objeto único por disciplina, não uma coleção — a
 * própria existência da linha já é a resposta, sem precisar de
 * `academic.datasets`.
 */
export async function loadSubjectAttendances(
  userId: string,
  subjectCode: string
): Promise<AttendancesRaw | null> {
  const student = await findStudentBySlug(userId);
  if (!student) return null;

  const db = await getDb();
  const [row] = await db
    .select()
    .from(s.attendances)
    .where(and(eq(s.attendances.studentId, student.id), eq(s.attendances.subjectCode, subjectCode)))
    .limit(1);
  return row?.payload ?? null;
}

/**
 * O arquivo em tests/[test_code].json pode vir em dois formatos reais
 * (ver comentário em lib/types/raw/test-content.ts): envelope `{info,
 * questions}` para avaliação pendente, ou objeto achatado (TestInfoRaw puro)
 * para avaliação já concluída, sem perguntas. Retorna o payload bruto —
 * quem chama decide o formato com `isEnvelopedTestContent`.
 */
export async function loadSubjectTestContent(
  userId: string,
  subjectCode: string,
  testCode: string
): Promise<TestContentRaw | TestInfoRaw | null> {
  const student = await findStudentBySlug(userId);
  if (!student) return null;

  const db = await getDb();
  const [row] = await db
    .select()
    .from(s.testContents)
    .where(
      and(
        eq(s.testContents.studentId, student.id),
        eq(s.testContents.subjectCode, subjectCode),
        eq(s.testContents.testCode, testCode)
      )
    )
    .limit(1);
  return row?.payload ?? null;
}

export async function loadSubjectLearningPath(
  userId: string,
  subjectCode: string
): Promise<LearningPathRaw | null> {
  const student = await findStudentBySlug(userId);
  if (!student) return null;

  const db = await getDb();
  const [row] = await db
    .select()
    .from(s.learningPaths)
    .where(
      and(eq(s.learningPaths.studentId, student.id), eq(s.learningPaths.subjectCode, subjectCode))
    )
    .limit(1);
  return row?.payload ?? null;
}

/**
 * Lista de datas/locais disponíveis para agendar uma prova ainda não
 * agendada. Só existe como fixture proposta (ver lib/types/raw/exam-schedule-options.ts)
 * — não há endpoint real mapeado no projeto para este caso.
 */
export async function loadExamScheduleOptions(
  userId: string,
  subjectCode: string,
  testCode: string
): Promise<ExamScheduleOptionRaw[] | null> {
  const student = await findStudentBySlug(userId);
  if (!student) return null;
  if (!(await hasDataset(student.id, `schedule-options:${testCode}`, subjectCode))) return null;

  const db = await getDb();
  const rows = await db
    .select()
    .from(s.examScheduleOptions)
    .where(
      and(
        eq(s.examScheduleOptions.studentId, student.id),
        eq(s.examScheduleOptions.subjectCode, subjectCode),
        eq(s.examScheduleOptions.testCode, testCode)
      )
    )
    .orderBy(asc(s.examScheduleOptions.ordinal));
  return rows.map((row) => row.payload);
}

export function isEnvelopedTestContent(
  data: TestContentRaw | TestInfoRaw
): data is TestContentRaw {
  return "info" in data && "questions" in data;
}
