import type { DisciplineRaw } from "@/lib/types/raw/disciplines";
import type { CalendarEventRaw } from "@/lib/types/raw/calendar-events";
import type { StudyActivity } from "@/lib/types/study-activity";
import type { WorkScheduleRaw } from "@/lib/types/raw/work-schedule";
import type { AssessmentRaw } from "@/lib/types/raw/assessments";
import { loadSubjectCalendarEvents } from "@/lib/data/load-subject-data";
import { loadSubjectAssessments } from "@/lib/data/load-subject-data";
import { readUserJsonFileOptional } from "@/lib/data/read-json-file";

/**
 * O Calendário de Estudos é uma visão pessoal do aluno, não vinculada a uma
 * única disciplina — então agregamos calendar-events.json de todas as
 * disciplinas do semestre (mesma fonte já usada por
 * app/disciplinas/[subjectCode]/calendario).
 */
export async function loadAllSubjectCalendarEvents(
  userId: string,
  disciplines: DisciplineRaw[]
): Promise<CalendarEventRaw[]> {
  const eventsPerSubject = await Promise.all(
    disciplines.map((discipline) => loadSubjectCalendarEvents(userId, discipline.code))
  );

  return eventsPerSubject.flatMap((events) => events ?? []);
}

export interface AssessmentWithSubject {
  assessment: AssessmentRaw;
  subjectCode: string;
  subjectName: string;
}

/** Agrega as avaliações de todas as disciplinas disponíveis no semestre. */
export async function loadAllSubjectAssessments(
  userId: string,
  disciplines: DisciplineRaw[]
): Promise<AssessmentWithSubject[]> {
  const assessmentsPerSubject = await Promise.all(
    disciplines.map(async (discipline) => ({
      discipline,
      assessments: await loadSubjectAssessments(userId, discipline.code),
    }))
  );

  return assessmentsPerSubject.flatMap(({ discipline, assessments }) =>
    (assessments ?? []).map((assessment) => ({
      assessment,
      subjectCode: discipline.code,
      subjectName: discipline.description,
    }))
  );
}

/** A data controlada do cenário; perfis normais usam a data atual. */
export async function loadSimulationDate(userId: string): Promise<string | null> {
  const manifest = await readUserJsonFileOptional<{ simulationDate?: string }>(
    userId,
    "manifest.json"
  );
  return manifest?.simulationDate ?? null;
}

/**
 * Carrega compromissos pessoais usados nos cenários de simulação do Vitru.
 * O arquivo é opcional porque os perfis mais antigos e o perfil-base podem
 * não possuir uma agenda pessoal fictícia.
 */
export function loadStudyActivities(
  userId: string
): Promise<StudyActivity[] | null> {
  return readUserJsonFileOptional<StudyActivity[]>(
    userId,
    "study-activities.json"
  );
}

/** Carrega a jornada semanal de trabalho usada na simulação do aluno EAD. */
export function loadWorkSchedule(
  userId: string
): Promise<WorkScheduleRaw | null> {
  return readUserJsonFileOptional<WorkScheduleRaw>(userId, "work-schedule.json");
}
