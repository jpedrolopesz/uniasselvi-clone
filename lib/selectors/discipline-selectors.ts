import type { DisciplineRaw } from "@/lib/types/raw/disciplines";

export function findDisciplineByCode(
  disciplines: DisciplineRaw[],
  code: string
): DisciplineRaw | undefined {
  return disciplines.find((discipline) => discipline.code === code);
}

export function sortDisciplinesByProgress(
  disciplines: DisciplineRaw[]
): DisciplineRaw[] {
  return [...disciplines].sort((a, b) => Number(a.subject_order) - Number(b.subject_order));
}
