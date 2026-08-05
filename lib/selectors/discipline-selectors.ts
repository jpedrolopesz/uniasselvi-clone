import type { DisciplineRaw } from "@/lib/types/raw/disciplines";
import { toIsoDateKey } from "@/lib/formatters/date-formatters";

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

/**
 * Imagens de capa por disciplina, servidas de public/data/user/{userId}/subjects/images/.
 * Hoje só existem para o usuário de demonstração principal (joao-pedro-lopes-zamonelo);
 * disciplinas/usuários sem entrada aqui caem no placeholder (ver DisciplineCard/DisciplinePage).
 */
const DISCIPLINE_HERO_IMAGES: Record<string, string> = {
  GTI03: "modelagem-e-gestao-de-processo-de-negocio.png",
  MAT24: "probabilidade-e-estatistica.png",
  "114480": "mineracao-de-dados.png",
  GTI04: "sistemas-aplicacoes-distribuidas.png",
  "159490": "experiencia-profissional-desafios-comtemporaneos.png",
};

export function getDisciplineHeroImageSrc(
  userId: string,
  disciplineCode: string
): string | undefined {
  const file = DISCIPLINE_HERO_IMAGES[disciplineCode];
  return file ? `/data/user/${userId}/subjects/images/${file}` : undefined;
}

export type DisciplineStatus = "concluida" | "em-andamento" | "em-breve";

export const DISCIPLINE_STATUS_LABELS: Record<DisciplineStatus, string> = {
  concluida: "Concluída",
  "em-andamento": "Em andamento",
  "em-breve": "Em breve",
};

/** Deriva o status pelas datas de vigência — mais confiável que `current_subject`, que a API às vezes marca em mais de uma disciplina ao mesmo tempo. */
export function getDisciplineStatus(
  discipline: DisciplineRaw,
  todayIsoDate: string
): DisciplineStatus {
  const beginIso = toIsoDateKey(discipline.begin_date);
  const endIso = toIsoDateKey(discipline.end_date);
  if (endIso && endIso < todayIsoDate) return "concluida";
  if (beginIso && beginIso > todayIsoDate) return "em-breve";
  return "em-andamento";
}

/** "5 - Quinta" -> "Quinta". Retorna a string original se não bater o padrão "N - Label". */
export function formatWeekdayLabel(descWeekDay: string): string {
  return descWeekDay.replace(/^\d+\s*-\s*/, "");
}
