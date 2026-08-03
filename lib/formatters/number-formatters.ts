/** weight = "1.5" (raw, string) -> "1,50" (exibição pt-BR). */
export function formatWeight(raw: string | number | null | undefined): string {
  if (raw === null || raw === undefined || raw === "") return "-";
  const numeric = typeof raw === "number" ? raw : Number(raw);
  if (Number.isNaN(numeric)) return String(raw);
  return numeric.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** frequency = 0 (raw, number) -> "0%". */
export function formatPercent(raw: number | null | undefined): string {
  if (raw === null || raw === undefined || Number.isNaN(raw)) return "-";
  return `${raw}%`;
}

/** total_value = 350.5 (raw, number) -> "R$ 350,50". */
export function formatCurrencyBrl(raw: number | null | undefined): string {
  if (raw === null || raw === undefined || Number.isNaN(raw)) return "-";
  return raw.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
