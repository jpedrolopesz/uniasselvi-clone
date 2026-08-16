export const RELATIVE_AMBIGUITY_MARGIN = 0.15;
export const REFERENCE_ABSOLUTE_AMBIGUITY_MARGIN = 0.15;

export function isRelativelyAmbiguous(best: number, second: number): boolean {
  return second >= best * (1 - RELATIVE_AMBIGUITY_MARGIN);
}

/** Referências conservam margem absoluta porque a relativa suprimiria uma
 * pergunta legítima na faixa best=0,75 / second=0,61. */
export function isReferenceAmbiguous(best: number, second: number): boolean {
  return best - second <= REFERENCE_ABSOLUTE_AMBIGUITY_MARGIN;
}
