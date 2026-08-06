import type { AssessmentRaw, ScheduleDetailRaw } from "@/lib/types/raw/assessments";
import type { ExamScheduleOptionRaw } from "@/lib/types/raw/exam-schedule-options";
import type { ExamSession } from "@/lib/types/derived";
import { toIsoDateKey, formatDateBr, formatDateTimeBr } from "@/lib/formatters/date-formatters";

function isScheduleDetail(
  schedule: AssessmentRaw["schedule"]
): schedule is ScheduleDetailRaw {
  return !Array.isArray(schedule);
}

/** A prova já tem data/local confirmados no dado semente (ver ScheduleDetailRaw). */
export function buildScheduledSession(assessment: AssessmentRaw): ExamSession | null {
  if (!assessment.has_schedule || !isScheduleDetail(assessment.schedule)) return null;
  const s = assessment.schedule;

  return {
    id: s.id,
    isoDate: toIsoDateKey(s.data),
    displayDate: formatDateBr(s.data),
    startTime: s.hora_inicio,
    endTime: s.hora_fim,
    location: {
      id: s.id,
      name: s.ambiente || "Local da prova",
      address: s.endereco || null,
      number: s.numero,
      complement: s.complemento,
      district: s.bairro,
      city: s.cidade || null,
      state: s.sigla || null,
      postalCode: s.cep,
    },
  };
}

/** Opções ainda não escolhidas — ver diagnóstico: fixture proposta, não há endpoint real mapeado. */
export function buildSessionsFromOptions(options: ExamScheduleOptionRaw[]): ExamSession[] {
  return options.map((option) => ({
    id: option.id,
    isoDate: toIsoDateKey(option.data),
    displayDate: formatDateBr(option.data),
    startTime: option.hora_inicio,
    endTime: option.hora_fim,
    location: {
      id: option.location.id,
      name: option.location.nome,
      address: option.location.endereco,
      number: option.location.numero,
      complement: option.location.complemento,
      district: option.location.bairro,
      city: option.location.cidade,
      state: option.location.sigla,
      postalCode: option.location.cep,
      latitude: option.location.latitude,
      longitude: option.location.longitude,
      accessInfo: option.location.informacoes_acesso,
    },
    capacity: option.capacity,
    availableSlots: option.available_slots,
  }));
}

export function todayIsoDateKey(): string {
  const now = new Date();
  return toIsoDateKey(
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
      now.getDate()
    ).padStart(2, "0")}`
  )!;
}

export function isSessionFull(session: ExamSession): boolean {
  return session.availableSlots !== undefined && session.availableSlots <= 0;
}

export function isSessionInPast(session: ExamSession, todayIso: string): boolean {
  return session.isoDate !== null && session.isoDate < todayIso;
}

export function isSessionSelectable(session: ExamSession, todayIso: string): boolean {
  return !isSessionInPast(session, todayIso) && !isSessionFull(session);
}

export function getSchedulingDeadlineDisplay(assessment: AssessmentRaw): string | null {
  if (!assessment.schedule_window_end) return null;
  return formatDateTimeBr(assessment.schedule_window_end);
}

export function isSchedulingWindowOpen(assessment: AssessmentRaw, todayIso: string): boolean {
  const endIso = toIsoDateKey(assessment.schedule_window_end);
  if (!endIso) return true;
  return todayIso <= endIso;
}
