const COMPACT = new Intl.NumberFormat("pt-BR", { notation: "compact", maximumFractionDigits: 1 });

/** 1284 → "1,3 mil". Usado em contagem de votos e de membros. */
export function formatCompact(value: number): string {
  return COMPACT.format(value);
}
