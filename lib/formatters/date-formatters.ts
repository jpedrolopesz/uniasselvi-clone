/**
 * Formatação de datas para exibição. Nunca usar `new Date(string)` direto em
 * strings "YYYY-MM-DD" — o motor JS interpreta como UTC meia-noite e pode
 * exibir o dia anterior em fusos negativos. Este módulo extrai ano/mês/dia
 * manualmente para evitar esse deslocamento.
 */

interface DateParts {
  year: number;
  month: number; // 1-12
  day: number;
  hour?: number;
  minute?: number;
  second?: number;
}

function parseDateParts(raw: string): DateParts | null {
  if (!raw) return null;

  // YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss(.sss)?(Z)? or YYYY-MM-DD HH:mm:ss
  const isoLike = raw.match(
    /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?)?/
  );
  if (isoLike) {
    const [, y, mo, d, h, mi, s] = isoLike;
    return {
      year: Number(y),
      month: Number(mo),
      day: Number(d),
      hour: h !== undefined ? Number(h) : undefined,
      minute: mi !== undefined ? Number(mi) : undefined,
      second: s !== undefined ? Number(s) : undefined,
    };
  }

  // DD/MM/YYYY
  const brLike = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (brLike) {
    const [, d, mo, y] = brLike;
    return { year: Number(y), month: Number(mo), day: Number(d) };
  }

  return null;
}

const pad2 = (n: number) => String(n).padStart(2, "0");

/** "2026-07-23..." ou "23/07/2026" -> "23/07/2026". Retorna "-" se vazio/inválido. */
export function formatDateBr(raw: string | null | undefined): string {
  const parts = raw ? parseDateParts(raw) : null;
  if (!parts) return "-";
  return `${pad2(parts.day)}/${pad2(parts.month)}/${parts.year}`;
}

/** "2026-07-23 20:31:40" -> "23/07/2026 20:31". Retorna "-" se vazio/inválido. */
export function formatDateTimeBr(raw: string | null | undefined): string {
  const parts = raw ? parseDateParts(raw) : null;
  if (!parts) return "-";
  const datePart = `${pad2(parts.day)}/${pad2(parts.month)}/${parts.year}`;
  if (parts.hour === undefined || parts.minute === undefined) return datePart;
  return `${datePart} ${pad2(parts.hour)}:${pad2(parts.minute)}`;
}

/** Retorna "YYYY-MM-DD" a partir de qualquer formato suportado, para comparação de dias. */
export function toIsoDateKey(raw: string | null | undefined): string | null {
  const parts = raw ? parseDateParts(raw) : null;
  if (!parts) return null;
  return `${parts.year}-${pad2(parts.month)}-${pad2(parts.day)}`;
}
