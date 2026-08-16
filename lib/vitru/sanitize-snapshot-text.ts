/** Remove somente marcação de apresentação que não pertence ao nome acadêmico. */
export function sanitizeSnapshotText(text: string): string {
  return text
    .replace(/\*\*|__/g, "")
    .replace(/[*_`#]/g, "")
    .replace(/^\s*(?:[-+*]|\d+[.)])\s+/gm, "")
    .trim();
}
