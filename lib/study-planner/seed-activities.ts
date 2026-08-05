import type { CalendarEventRaw } from "@/lib/types/raw/calendar-events";
import type { StudyActivity } from "@/lib/types/study-activity";
import { toIsoDateKey } from "@/lib/formatters/date-formatters";
import { formatHourMinute } from "@/lib/formatters/time-formatters";

/**
 * Converte os eventos reais de calendario-events.json (aulas ao vivo,
 * plantões etc., um arquivo por disciplina) para o modelo unificado
 * StudyActivity usado pelo Calendário de Estudos. Toda atividade semeada a
 * partir daqui entra como categoria "aula" e fica marcada como `source:
 * "seed"` — o aluno não edita/exclui esses horários, só os que ele mesmo
 * cria (manual ou via Sofia).
 */
export function buildSeedActivities(eventsBySubject: CalendarEventRaw[]): StudyActivity[] {
  return eventsBySubject
    .map((event): StudyActivity | null => {
      const date = toIsoDateKey(event.begin_date);
      if (!date) return null;

      return {
        id: `seed-${event.code}`,
        title: event.description,
        category: "aula",
        subjectCode: event.subject_code,
        subjectName: event.subject_name,
        date,
        startTime: formatHourMinute(event.begin_hour),
        endTime: formatHourMinute(event.end_hour || event.begin_hour),
        notes: "",
        source: "seed",
      };
    })
    .filter((activity): activity is StudyActivity => activity !== null);
}
