import type { ExamCityComparison } from "@/lib/types/derived";

/** Espaços redundantes, maiúsculas/minúsculas e acentos não podem gerar falso-negativo (ex.: "Jundiaí" vs "JUNDIAÍ "). */
export function normalizeCityText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

/**
 * Compara cidade+estado, nunca só cidade — evita colisão entre cidades
 * homônimas de estados diferentes (ex.: existem "Bom Jesus" em vários
 * estados). O projeto não tem identificador oficial de cidade além de
 * `city_code` (UserDataRaw) e `ScheduleDetailRaw`/`ExamLocationRaw` não têm
 * um código equivalente, então city_code não pode ser usado nesta
 * comparação sem introduzir uma lacuna nova.
 */
export function isSameCity(
  studentCity: string | null | undefined,
  studentState: string | null | undefined,
  examCity: string | null | undefined,
  examState: string | null | undefined
): boolean {
  if (!studentCity || !studentState || !examCity || !examState) return false;
  return (
    normalizeCityText(studentCity) === normalizeCityText(examCity) &&
    normalizeCityText(studentState) === normalizeCityText(examState)
  );
}

export function compareStudentAndExamCity(
  studentCity: string | null | undefined,
  studentState: string | null | undefined,
  examCity: string | null | undefined,
  examState: string | null | undefined
): ExamCityComparison {
  return {
    isSameCity: isSameCity(studentCity, studentState, examCity, examState),
    studentCity: studentCity ?? null,
    studentState: studentState ?? null,
    examCity: examCity ?? null,
    examState: examState ?? null,
  };
}
