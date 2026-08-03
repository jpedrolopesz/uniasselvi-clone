/** "20:31:40" ou "20:31" -> "20:31". Retorna "-" se vazio. */
export function formatHourMinute(raw: string | null | undefined): string {
  if (!raw) return "-";
  const match = raw.match(/^(\d{2}):(\d{2})/);
  if (!match) return raw;
  return `${match[1]}:${match[2]}`;
}

/** "01:30:00" -> "1h30". Aceita formato HH:mm:ss ou HH:mm. Retorna "-" se vazio. */
export function formatDuration(raw: string | null | undefined): string {
  if (!raw) return "-";
  const match = raw.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return raw;
  const hours = Number(match[1]);
  const minutes = match[2];
  if (hours === 0) return `${minutes}min`;
  return minutes === "00" ? `${hours}h` : `${hours}h${minutes}`;
}
