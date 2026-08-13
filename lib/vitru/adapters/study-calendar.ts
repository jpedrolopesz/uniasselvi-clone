import type { StudyActivity } from "@/lib/types/study-activity";
import { buildWeekDays, parseIsoDate, toIso } from "@/lib/study-planner/date-utils";
import { destinationsForPage } from "@/lib/vitru/destinations";
import { VITRU_NAVIGATION_DESTINATIONS } from "@/lib/vitru/page-context";
import type { VitruSemanticSnapshot, VitruSnapshotState } from "@/lib/vitru/semantic-snapshot";

export interface StudyCalendarSnapshotInput {
  activities: StudyActivity[];
  selectedIsoDate: string;
  view: "day" | "week" | "month";
  now: string;
  focusId?: string | null;
}

function visibleRange(date: string, view: StudyCalendarSnapshotInput["view"]) {
  if (view === "day") return { visibleStart: date, visibleEnd: date };
  if (view === "week") {
    const days = buildWeekDays(date);
    return { visibleStart: days[0].isoDate, visibleEnd: days[6].isoDate };
  }
  const { year, month } = parseIsoDate(date);
  return { visibleStart: toIso(year, month, 1), visibleEnd: toIso(year, month, new Date(Date.UTC(year, month, 0)).getUTCDate()) };
}

export function buildStudyCalendarSnapshot(input: StudyCalendarSnapshotInput): VitruSemanticSnapshot {
  const range = visibleRange(input.selectedIsoDate, input.view);
  const visible = input.activities.filter((activity) => activity.date >= range.visibleStart && activity.date <= range.visibleEnd);
  const actions = visible.map((activity) => ({ id: `calendar-activity:${activity.id}:show`, label: `Mostrar ${activity.title}`, kind: "read" as const }));
  const state: VitruSnapshotState = {
    now: input.now,
    timezone: "America/Sao_Paulo",
    focus: input.focusId ? { type: "calendar_activity", id: `calendar-activity:${input.focusId}` } : null,
    temporal: { view: input.view, ...range },
    filters: {},
    permissions: ["read_calendar", "prepare_calendar_event", "confirm_write"],
  };
  return {
    version: 0,
    status: "ready",
    page: { id: "study-calendar", name: "Calendário de Estudos" },
    state,
    sections: [{
      id: "calendar:visible-activities",
      name: "Eventos e atividades visíveis",
      items: visible.map((activity) => ({
        id: `calendar-activity:${activity.id}`,
        name: activity.title,
        status: activity.confirmationStatus === "pending" ? "Aguardando confirmação" : "Confirmado",
        facts: {
          inicio: `${activity.date}T${activity.startTime}:00-03:00`,
          fim: `${activity.date}T${activity.endTime}:00-03:00`,
          categoria: activity.category,
          ...(activity.subjectName ? { disciplina: activity.subjectName } : {}),
        },
        actionIds: [`calendar-activity:${activity.id}:show`],
      })),
    }],
    actions,
    destinations: destinationsForPage("study-calendar", VITRU_NAVIGATION_DESTINATIONS),
  };
}
