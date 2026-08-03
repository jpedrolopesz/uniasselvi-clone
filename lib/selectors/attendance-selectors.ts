import type { FrequencyDiaryRaw, MeetingRaw } from "@/lib/types/raw/attendances";
import { toIsoDateKey } from "@/lib/formatters/date-formatters";

/**
 * A especificação observou uma marcação vermelha numa data que era, ao mesmo
 * tempo, um frequency_diary[].event_date e um meetings[].begin_date — mas
 * nem toda data de meetings estava marcada. A leitura mais segura é marcar
 * apenas pelas datas presentes em frequency_diary (registro real de
 * frequência), não pela simples existência de um encontro agendado.
 */
export function getMarkedAttendanceDayKeys(
  diary: FrequencyDiaryRaw[]
): Set<string> {
  const keys = new Set<string>();
  for (const entry of diary) {
    const key = toIsoDateKey(entry.event_date);
    if (key) keys.add(key);
  }
  return keys;
}

export function getMeetingsForDay(
  meetings: MeetingRaw[],
  isoDate: string
): MeetingRaw[] {
  return meetings.filter((meeting) => toIsoDateKey(meeting.begin_date) === isoDate);
}

export function getDiaryEntryForDay(
  diary: FrequencyDiaryRaw[],
  isoDate: string
): FrequencyDiaryRaw | undefined {
  return diary.find((entry) => toIsoDateKey(entry.event_date) === isoDate);
}
