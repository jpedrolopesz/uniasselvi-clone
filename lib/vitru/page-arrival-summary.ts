import type { DisclosureLevel } from "@/lib/vitru/disclosure";
import type { VitruSemanticSnapshot } from "@/lib/vitru/semantic-snapshot";

const NUMBERS = ["zero", "uma", "duas", "três", "quatro", "cinco", "seis", "sete", "oito", "nove", "dez"];
const number = (value: number) => NUMBERS[value] ?? String(value);
const plural = (value: number, singular: string, pluralForm: string) => `${number(value)} ${value === 1 ? singular : pluralForm}`;

export interface PageArrivalSummary {
  pageId: string;
  total: number;
  counts: Record<string, number>;
  message: string;
}

export function buildPageArrivalSummary(snapshot: VitruSemanticSnapshot): PageArrivalSummary | null {
  if (snapshot.page.id === "assessments") {
    const items = snapshot.sections.filter(section => section.id.endsWith(":assessments")).flatMap(section => section.items);
    const completed = items.filter(item => /conclu|respondida|realizada/i.test(item.status ?? "")).length;
    const pending = items.length - completed;
    return {
      pageId: snapshot.page.id, total: items.length, counts: { completed, pending },
      message: `Você tem ${plural(items.length, "avaliação", "avaliações")}. ${number(completed).replace(/^./, letter => letter.toLocaleUpperCase("pt-BR"))} ${completed === 1 ? "concluída" : "concluídas"} e ${plural(pending, "pendente", "pendentes")}. Qual delas você quer consultar?`,
    };
  }
  if (snapshot.page.id === "study-calendar") {
    const activities = snapshot.sections.find(section => section.id === "calendar:visible-activities")?.items.length ?? 0;
    const availableSlots = snapshot.sections.find(section => section.id === "calendar:study-options")?.items.length ?? 0;
    return {
      pageId: snapshot.page.id, total: activities + availableSlots, counts: { activities, availableSlots },
      message: `Seu calendário tem ${plural(activities, "atividade", "atividades")} no período e ${plural(availableSlots, "horário livre", "horários livres")}. O que você quer consultar?`,
    };
  }
  return null;
}

export function arrivalMessage(summary: PageArrivalSummary, disclosure: DisclosureLevel): string {
  if (disclosure === "first_visit") return `Esta página reúne seus dados acadêmicos. ${summary.message}`;
  if (disclosure === "returning") return `Nesta página, ${summary.message.charAt(0).toLocaleLowerCase("pt-BR")}${summary.message.slice(1)}`;
  return summary.message;
}
