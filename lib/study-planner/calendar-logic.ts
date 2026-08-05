import type { StudyActivity } from "@/lib/types/study-activity";
import { addDays, minutesToTime, timeToMinutes } from "@/lib/study-planner/date-utils";

/** Janela padrão considerada "horário de estudo" ao procurar vagas livres. */
const DAY_START_MINUTES = 8 * 60;
const DAY_END_MINUTES = 22 * 60;
/** Evita concentrar tudo no mesmo dia: no máximo N atividades por dia ao sugerir. */
const MAX_SUGGESTIONS_PER_DAY = 2;

export function getActivitiesForDate(
  activities: StudyActivity[],
  isoDate: string
): StudyActivity[] {
  return activities
    .filter((activity) => activity.date === isoDate)
    .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
}

export function getActivitiesInRange(
  activities: StudyActivity[],
  startIsoDate: string,
  endIsoDateInclusive: string
): StudyActivity[] {
  return activities.filter(
    (activity) => activity.date >= startIsoDate && activity.date <= endIsoDateInclusive
  );
}

function overlaps(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return aStart < bEnd && bStart < aEnd;
}

/** Verifica se um horário candidato colide com alguma atividade existente no mesmo dia. */
export function hasConflict(
  activities: StudyActivity[],
  candidate: Pick<StudyActivity, "date" | "startTime" | "endTime">,
  excludeId?: string
): boolean {
  const candidateStart = timeToMinutes(candidate.startTime);
  const candidateEnd = timeToMinutes(candidate.endTime);

  return getActivitiesForDate(activities, candidate.date).some((activity) => {
    if (activity.id === excludeId) return false;
    return overlaps(
      candidateStart,
      candidateEnd,
      timeToMinutes(activity.startTime),
      timeToMinutes(activity.endTime)
    );
  });
}

export interface FreeSlot {
  date: string;
  startTime: string;
  endTime: string;
}

/**
 * Varre os próximos `days` dias a partir de `fromIsoDate` e devolve janelas
 * livres com pelo menos `durationMinutes`. No máximo uma sugestão por dia e
 * no máximo `maxSlots` no total, para distribuir o estudo ao longo da semana
 * em vez de concentrar tudo num único dia.
 */
export function findFreeSlots(
  activities: StudyActivity[],
  options: { fromIsoDate: string; days: number; durationMinutes: number; maxSlots: number }
): FreeSlot[] {
  const { fromIsoDate, days, durationMinutes, maxSlots } = options;
  const slots: FreeSlot[] = [];

  for (let dayOffset = 0; dayOffset < days && slots.length < maxSlots; dayOffset++) {
    const isoDate = addDays(fromIsoDate, dayOffset);
    const dayActivities = getActivitiesForDate(activities, isoDate);
    if (dayActivities.length >= MAX_SUGGESTIONS_PER_DAY) continue;

    const busyIntervals = dayActivities
      .map((activity) => ({
        start: timeToMinutes(activity.startTime),
        end: timeToMinutes(activity.endTime),
      }))
      .sort((a, b) => a.start - b.start);

    let cursor = DAY_START_MINUTES;
    for (const interval of busyIntervals) {
      if (interval.start - cursor >= durationMinutes) break;
      cursor = Math.max(cursor, interval.end);
    }

    if (DAY_END_MINUTES - cursor >= durationMinutes) {
      slots.push({
        date: isoDate,
        startTime: minutesToTime(cursor),
        endTime: minutesToTime(cursor + durationMinutes),
      });
    }
  }

  return slots;
}

export function upsertActivity(
  activities: StudyActivity[],
  activity: StudyActivity
): StudyActivity[] {
  const exists = activities.some((item) => item.id === activity.id);
  return exists
    ? activities.map((item) => (item.id === activity.id ? activity : item))
    : [...activities, activity];
}

export function removeActivity(activities: StudyActivity[], id: string): StudyActivity[] {
  return activities.filter((activity) => activity.id !== id);
}

let activityIdCounter = 0;
export function generateActivityId(prefix: "manual" | "ai"): string {
  activityIdCounter += 1;
  return `${prefix}-${Date.now()}-${activityIdCounter}`;
}
