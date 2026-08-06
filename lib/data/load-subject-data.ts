import { readUserJsonFileOptional } from "@/lib/data/read-json-file";
import type { CalendarEventRaw } from "@/lib/types/raw/calendar-events";
import type { RecordingRaw } from "@/lib/types/raw/recordings";
import type { AssessmentRaw } from "@/lib/types/raw/assessments";
import type { AttendancesRaw } from "@/lib/types/raw/attendances";
import type { TestContentRaw, TestInfoRaw } from "@/lib/types/raw/test-content";
import type { LearningPathRaw } from "@/lib/types/raw/learning-path";
import type { ExamScheduleOptionRaw } from "@/lib/types/raw/exam-schedule-options";

export function loadSubjectCalendarEvents(
  userId: string,
  subjectCode: string
): Promise<CalendarEventRaw[] | null> {
  return readUserJsonFileOptional<CalendarEventRaw[]>(
    userId,
    "subjects",
    subjectCode,
    "calendar-events.json"
  );
}

export function loadSubjectRecordings(
  userId: string,
  subjectCode: string
): Promise<RecordingRaw[] | null> {
  return readUserJsonFileOptional<RecordingRaw[]>(
    userId,
    "subjects",
    subjectCode,
    "recordings.json"
  );
}

export function loadSubjectAssessments(
  userId: string,
  subjectCode: string
): Promise<AssessmentRaw[] | null> {
  return readUserJsonFileOptional<AssessmentRaw[]>(
    userId,
    "subjects",
    subjectCode,
    "assessments.json"
  );
}

export function loadSubjectAttendances(
  userId: string,
  subjectCode: string
): Promise<AttendancesRaw | null> {
  return readUserJsonFileOptional<AttendancesRaw>(
    userId,
    "subjects",
    subjectCode,
    "attendances.json"
  );
}

/**
 * O arquivo em tests/[test_code].json pode vir em dois formatos reais
 * (ver comentário em lib/types/raw/test-content.ts): envelope `{info,
 * questions}` para avaliação pendente, ou objeto achatado (TestInfoRaw puro)
 * para avaliação já concluída, sem perguntas. Retorna o JSON bruto —
 * quem chama decide o formato com `isEnvelopedTestContent`.
 */
export function loadSubjectTestContent(
  userId: string,
  subjectCode: string,
  testCode: string
): Promise<TestContentRaw | TestInfoRaw | null> {
  return readUserJsonFileOptional<TestContentRaw | TestInfoRaw>(
    userId,
    "subjects",
    subjectCode,
    "tests",
    `${testCode}.json`
  );
}

export function loadSubjectLearningPath(
  userId: string,
  subjectCode: string
): Promise<LearningPathRaw | null> {
  return readUserJsonFileOptional<LearningPathRaw>(
    userId,
    "subjects",
    subjectCode,
    "learning-path.json"
  );
}

/**
 * Lista de datas/locais disponíveis para agendar uma prova ainda não
 * agendada. Só existe como fixture proposta (ver lib/types/raw/exam-schedule-options.ts)
 * — não há endpoint real mapeado no projeto para este caso.
 */
export function loadExamScheduleOptions(
  userId: string,
  subjectCode: string,
  testCode: string
): Promise<ExamScheduleOptionRaw[] | null> {
  return readUserJsonFileOptional<ExamScheduleOptionRaw[]>(
    userId,
    "subjects",
    subjectCode,
    "tests",
    testCode,
    "schedule-options.json"
  );
}

export function isEnvelopedTestContent(
  data: TestContentRaw | TestInfoRaw
): data is TestContentRaw {
  return "info" in data && "questions" in data;
}
