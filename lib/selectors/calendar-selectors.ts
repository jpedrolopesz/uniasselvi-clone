import type { CalendarEventRaw } from "@/lib/types/raw/calendar-events";
import { toIsoDateKey } from "@/lib/formatters/date-formatters";

/**
 * Regra de marcação: um dia é marcado (indicador vermelho) somente quando
 * `begin_date` de algum evento cai literalmente naquele dia. A especificação
 * observou um evento cujo período (begin_date..end_date) incluía uma data
 * que o painel NÃO marcou como tendo evento — ou seja, o intervalo completo
 * não deve ser preenchido, apenas o dia de begin_date. Sem o JSON completo
 * não há como confirmar uma regra mais rica; esta é a leitura mais literal
 * e conservadora dos dados.
 */
export function getEventsForDay(
  events: CalendarEventRaw[],
  isoDate: string
): CalendarEventRaw[] {
  return events.filter((event) => toIsoDateKey(event.begin_date) === isoDate);
}

export function getMarkedDayKeys(events: CalendarEventRaw[]): Set<string> {
  const keys = new Set<string>();
  for (const event of events) {
    const key = toIsoDateKey(event.begin_date);
    if (key) keys.add(key);
  }
  return keys;
}

export interface MonthGridCell {
  isoDate: string;
  day: number;
  isCurrentMonth: boolean;
}

const pad2 = (n: number) => String(n).padStart(2, "0");

/** Grade de 6 semanas (42 células) para o mês, começando no domingo. Usa Date.UTC apenas para calcular o dia da semana, sem risco de deslocamento de fuso. */
export function buildMonthGrid(year: number, month: number): MonthGridCell[] {
  const firstOfMonth = new Date(Date.UTC(year, month - 1, 1));
  const startWeekday = firstOfMonth.getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const daysInPrevMonth = new Date(Date.UTC(year, month - 1, 0)).getUTCDate();

  const cells: MonthGridCell[] = [];

  for (let i = startWeekday - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i;
    const prevMonthDate = new Date(Date.UTC(year, month - 2, day));
    cells.push({
      isoDate: `${prevMonthDate.getUTCFullYear()}-${pad2(prevMonthDate.getUTCMonth() + 1)}-${pad2(day)}`,
      day,
      isCurrentMonth: false,
    });
  }

  for (let day = 1; day <= daysInMonth; day++) {
    cells.push({ isoDate: `${year}-${pad2(month)}-${pad2(day)}`, day, isCurrentMonth: true });
  }

  let nextDay = 1;
  while (cells.length < 42) {
    const nextMonthDate = new Date(Date.UTC(year, month, nextDay));
    cells.push({
      isoDate: `${nextMonthDate.getUTCFullYear()}-${pad2(nextMonthDate.getUTCMonth() + 1)}-${pad2(nextDay)}`,
      day: nextDay,
      isCurrentMonth: false,
    });
    nextDay++;
  }

  return cells;
}

export const MONTH_LABELS_PT = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

export const WEEKDAY_LABELS_PT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
