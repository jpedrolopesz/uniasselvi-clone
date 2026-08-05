/**
 * Utilitários de data para o Calendário de Estudos. Segue a mesma regra de
 * lib/selectors/calendar-selectors.ts: usar Date.UTC apenas para aritmética
 * de calendário (dia da semana, soma de dias), nunca `new Date("YYYY-MM-DD")`
 * direto, para não sofrer deslocamento de fuso horário.
 */

const pad2 = (n: number) => String(n).padStart(2, "0");

export function toIso(year: number, month: number, day: number): string {
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

export function parseIsoDate(isoDate: string): { year: number; month: number; day: number } {
  const [y, m, d] = isoDate.split("-").map(Number);
  return { year: y, month: m, day: d };
}

export function getTodayIsoDate(): string {
  const now = new Date();
  return toIso(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

export function addDays(isoDate: string, amount: number): string {
  const { year, month, day } = parseIsoDate(isoDate);
  const date = new Date(Date.UTC(year, month - 1, day + amount));
  return toIso(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
}

export function getWeekdayIndex(isoDate: string): number {
  const { year, month, day } = parseIsoDate(isoDate);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

/** Domingo da semana que contém `isoDate` (semana começa no domingo, igual ao CalendarGrid). */
export function startOfWeek(isoDate: string): string {
  return addDays(isoDate, -getWeekdayIndex(isoDate));
}

export interface WeekDayCell {
  isoDate: string;
  day: number;
  weekdayLabel: string;
  isToday: boolean;
}

const WEEKDAY_LABELS_PT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export function buildWeekDays(isoDate: string): WeekDayCell[] {
  const start = startOfWeek(isoDate);
  const today = getTodayIsoDate();

  return Array.from({ length: 7 }, (_, i) => {
    const cellIso = addDays(start, i);
    return {
      isoDate: cellIso,
      day: parseIsoDate(cellIso).day,
      weekdayLabel: WEEKDAY_LABELS_PT[i],
      isToday: cellIso === today,
    };
  });
}

/** Converte "HH:mm" em minutos desde meia-noite. Retorna 0 se inválido. */
export function timeToMinutes(time: string): number {
  const match = time.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return 0;
  return Number(match[1]) * 60 + Number(match[2]);
}

export function minutesToTime(minutes: number): string {
  const clamped = Math.max(0, Math.min(24 * 60, minutes));
  return `${pad2(Math.floor(clamped / 60))}:${pad2(clamped % 60)}`;
}

/** 90 -> "1h30", 45 -> "45min", 120 -> "2h". */
export function formatMinutesLabel(totalMinutes: number): string {
  const minutes = Math.max(0, totalMinutes);
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (hours === 0) return `${remainder}min`;
  if (remainder === 0) return `${hours}h`;
  return `${hours}h${pad2(remainder)}`;
}

/** "1h30", "45min" ou "2h" a partir do intervalo HH:mm–HH:mm. */
export function formatDurationLabel(startTime: string, endTime: string): string {
  return formatMinutesLabel(Math.max(0, timeToMinutes(endTime) - timeToMinutes(startTime)));
}

export function formatWeekdayFullLabel(isoDate: string): string {
  const labels = [
    "Domingo",
    "Segunda-feira",
    "Terça-feira",
    "Quarta-feira",
    "Quinta-feira",
    "Sexta-feira",
    "Sábado",
  ];
  return labels[getWeekdayIndex(isoDate)];
}
