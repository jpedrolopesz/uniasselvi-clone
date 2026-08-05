import type { DisciplineRaw } from "@/lib/types/raw/disciplines";
import type { CalendarEventRaw } from "@/lib/types/raw/calendar-events";
import { loadSubjectCalendarEvents } from "@/lib/data/load-subject-data";

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
