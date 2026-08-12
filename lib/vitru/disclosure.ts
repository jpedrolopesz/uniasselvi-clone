export type DisclosureLevel = "first_visit" | "returning" | "frequent";

/**
 * Gradua o quanto o Vitru se explica a cada vez que o aluno abre uma
 * superfície, com base em quantas vezes ele já visitou (ver
 * lib/vitru/memory/surface-visits.ts). Determinístico de propósito — não é
 * o modelo quem decide o quanto falar, é este cálculo; com o modelo em uso
 * (amazon.nova-micro-v1:0) sendo pouco confiável para obedecer instruções
 * negativas de forma consistente, colocar a decisão em código é o que
 * garante o efeito, não uma instrução a mais na prosa do prompt.
 *
 * `visitCount` já vem pós-incremento: a primeira visita gravada tem valor
 * 1, nunca 0 (ver recordSurfaceVisit).
 */
export function resolveDisclosure(visitCount: number): DisclosureLevel {
  if (visitCount <= 1) return "first_visit";
  if (visitCount <= 4) return "returning";
  return "frequent";
}
