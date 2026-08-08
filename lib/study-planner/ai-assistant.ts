/**
 * Assistente Vitru para o Calendário de Estudos.
 *
 * Ponto de integração futura: hoje `getAssistantResponse` é síncrona e
 * resolve tudo localmente (parsing por palavra-chave + busca de vagas livres
 * em lib/study-planner/calendar-logic.ts). Para plugar uma IA de verdade,
 * troque o corpo desta função por uma chamada a uma API (ex.: POST
 * /api/ai/study-assistant) que receba `message`, `activities` e `subjects` e
 * devolva o mesmo formato `AssistantResponse` — o resto da UI (AssistantPanel,
 * SuggestionCard, StudyPlannerView) não precisa mudar.
 */
import type { ActivityCategory, StudyActivity } from "@/lib/types/study-activity";
import { findFreeSlots, getActivitiesInRange } from "@/lib/study-planner/calendar-logic";
import { addDays, formatMinutesLabel, getTodayIsoDate } from "@/lib/study-planner/date-utils";
import type { AssessmentWithSubject } from "@/lib/data/load-study-planner-data";
import { buildNextAssessmentPlan } from "@/lib/study-planner/assessment-plan";

export interface SubjectOption {
  code: string;
  name: string;
}

export interface AssistantSuggestion {
  id: string;
  title: string;
  category: ActivityCategory;
  subjectCode: string | null;
  subjectName: string | null;
  date: string;
  startTime: string;
  endTime: string;
  notes: string;
}

export interface AssistantResponse {
  replyText: string;
  suggestions: AssistantSuggestion[];
}

export const QUICK_PROMPTS = [
  "Organizar minha semana",
  "Encontrar horário livre",
  "Planejar uma revisão",
  "Preparar para uma prova",
  "Criar rotina de estudos",
];

let counter = 0;
function nextId(): string {
  counter += 1;
  return `sug-${Date.now()}-${counter}`;
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

const WORD_NUMBERS: Record<string, number> = {
  uma: 1,
  um: 1,
  duas: 2,
  dois: 2,
  tres: 3,
  quatro: 4,
  cinco: 5,
};

function parseDurationMinutes(normalizedMessage: string): number {
  const minutesMatch = normalizedMessage.match(/(\d+)\s*min/);
  if (minutesMatch) return Number(minutesMatch[1]);

  const digitHoursMatch = normalizedMessage.match(/(\d+)\s*h(?:ora)?/);
  if (digitHoursMatch) return Number(digitHoursMatch[1]) * 60;

  const wordHoursMatch = normalizedMessage.match(
    /(uma|um|duas|dois|tres|quatro|cinco)\s*horas?/
  );
  if (wordHoursMatch) return WORD_NUMBERS[wordHoursMatch[1]] * 60;

  return 60;
}

const WEEKDAY_KEYWORDS: { keyword: string; index: number }[] = [
  { keyword: "domingo", index: 0 },
  { keyword: "segunda", index: 1 },
  { keyword: "terca", index: 2 },
  { keyword: "quarta", index: 3 },
  { keyword: "quinta", index: 4 },
  { keyword: "sexta", index: 5 },
  { keyword: "sabado", index: 6 },
];

/** Próxima data (>= hoje) cujo dia da semana bate com a palavra encontrada na mensagem, se houver. */
function parseDeadlineIsoDate(normalizedMessage: string): string | null {
  if (normalizedMessage.includes("amanha")) return addDays(getTodayIsoDate(), 1);
  if (normalizedMessage.includes("hoje")) return getTodayIsoDate();

  const found = WEEKDAY_KEYWORDS.find(({ keyword }) => normalizedMessage.includes(keyword));
  if (!found) return null;

  const today = getTodayIsoDate();
  for (let offset = 0; offset <= 7; offset++) {
    const candidate = addDays(today, offset);
    const weekday = new Date(candidate + "T00:00:00Z").getUTCDay();
    if (weekday === found.index) return candidate;
  }
  return null;
}

function matchSubject(
  normalizedMessage: string,
  subjects: SubjectOption[]
): SubjectOption | null {
  for (const subject of subjects) {
    const words = normalize(subject.name)
      .split(/[^a-z0-9]+/)
      .filter((word) => word.length >= 4);
    if (words.some((word) => normalizedMessage.includes(word))) return subject;
  }
  return null;
}

function detectCategory(normalizedMessage: string): ActivityCategory {
  if (normalizedMessage.includes("prova") || normalizedMessage.includes("avaliac")) return "prova";
  if (normalizedMessage.includes("revis")) return "revisao";
  if (normalizedMessage.includes("trabalho")) return "trabalho";
  if (normalizedMessage.includes("tarefa")) return "tarefa";
  return "estudo";
}

function buildSuggestion(
  slot: { date: string; startTime: string; endTime: string },
  category: ActivityCategory,
  subject: SubjectOption | null,
  titlePrefix: string
): AssistantSuggestion {
  return {
    id: nextId(),
    title: subject ? `${titlePrefix} — ${subject.name}` : titlePrefix,
    category,
    subjectCode: subject?.code ?? null,
    subjectName: subject?.name ?? null,
    date: slot.date,
    startTime: slot.startTime,
    endTime: slot.endTime,
    notes: "Sugestão gerada pelo Vitru · Calendário (demonstração).",
  };
}

function noSlotsReply(): AssistantResponse {
  return {
    replyText:
      "Não encontrei um horário livre com essa duração nos próximos dias sem esbarrar em algo que você já tem marcado. Quer tentar com uma duração menor ou olhar mais adiante na semana?",
    suggestions: [],
  };
}

/** Quantos dias (>=1) faltam de `fromIsoDate` até `deadlineIsoDate`, inclusive. */
function daysUntil(fromIsoDate: string, deadlineIsoDate: string): number {
  const from = Date.parse(fromIsoDate + "T00:00:00Z");
  const to = Date.parse(deadlineIsoDate + "T00:00:00Z");
  const diffDays = Math.round((to - from) / (24 * 60 * 60 * 1000));
  return Math.max(diffDays + 1, 1);
}

/**
 * "IA" simulada: resposta baseada em regras/palavras-chave sobre a mensagem
 * do aluno, cruzando com os horários já ocupados em `activities`. Determinística
 * e sem custo de rede — troque por uma chamada de API real quando disponível
 * (ver comentário no topo do arquivo).
 */
export function getAssistantResponse(
  message: string,
  activities: StudyActivity[],
  subjects: SubjectOption[],
  assessments: AssessmentWithSubject[] = [],
  planningDate: string = getTodayIsoDate()
): AssistantResponse {
  const normalized = normalize(message);
  const today = planningDate;
  const durationMinutes = parseDurationMinutes(normalized);
  const subject = matchSubject(normalized, subjects);
  const deadlineIsoDate = parseDeadlineIsoDate(normalized);

  const requestsAssessmentPlan =
    normalized.includes("plano") ||
    normalized.includes("preparar") ||
    normalized.includes("prova") ||
    normalized.includes("avaliac") ||
    normalized.includes("trabalho") ||
    normalized.includes("atividade aberta");

  if (requestsAssessmentPlan && assessments.length > 0) {
    const plan = buildNextAssessmentPlan(assessments, activities, today);
    if (plan) return { replyText: plan.replyText, suggestions: plan.suggestions };
    return {
      replyText: "Não encontrei avaliações abertas e pendentes para montar um plano neste momento.",
      suggestions: [],
    };
  }

  if (normalized.includes("organizar") && normalized.includes("semana")) {
    const slots = findFreeSlots(activities, {
      fromIsoDate: today,
      days: 7,
      durationMinutes: 60,
      maxSlots: subjects.length > 0 ? Math.min(subjects.length, 5) : 3,
    });
    if (slots.length === 0) return noSlotsReply();

    const suggestions = slots.map((slot, index) =>
      buildSuggestion(slot, "estudo", subjects[index % Math.max(subjects.length, 1)] ?? null, "Bloco de estudo")
    );
    return {
      replyText: `Olha só, distribuí ${suggestions.length} blocos de estudo ao longo dos próximos 7 dias, espalhados entre suas disciplinas e sem bater com nada que você já tem marcado. Dá uma olhada e confirma o que fizer sentido:`,
      suggestions,
    };
  }

  if (normalized.includes("livre") || normalized.includes("encontrar horario")) {
    const slots = findFreeSlots(activities, {
      fromIsoDate: today,
      days: 5,
      durationMinutes,
      maxSlots: 3,
    });
    if (slots.length === 0) return noSlotsReply();

    const category = subject ? "estudo" : detectCategory(normalized);
    const suggestions = slots.map((slot) =>
      buildSuggestion(slot, category, subject, subject ? "Estudo" : "Horário livre")
    );
    return {
      replyText: `Encontrei ${suggestions.length} horário(s) livre(s) de ${formatMinutesLabel(
        durationMinutes
      )} nos próximos dias:`,
      suggestions,
    };
  }

  if (normalized.includes("rotina") || normalized.includes("por dia") || normalized.includes("todos os dias")) {
    const slots = findFreeSlots(activities, {
      fromIsoDate: today,
      days: 7,
      durationMinutes,
      maxSlots: 5,
    });
    if (slots.length === 0) return noSlotsReply();

    const suggestions = slots.map((slot) => buildSuggestion(slot, "estudo", subject, "Estudo diário"));
    return {
      replyText: `Montei uma rotina com ${suggestions.length} sessões de estudo${
        subject ? ` de ${subject.name}` : ""
      } ao longo da semana, um bloco por dia para não pesar. Confirma os que quiser manter:`,
      suggestions,
    };
  }

  if (normalized.includes("revis")) {
    const slots = findFreeSlots(activities, {
      fromIsoDate: today,
      days: deadlineIsoDate ? daysUntil(today, deadlineIsoDate) : 6,
      durationMinutes,
      maxSlots: 3,
    });
    if (slots.length === 0) return noSlotsReply();

    const suggestions = slots.map((slot) => buildSuggestion(slot, "revisao", subject, "Revisão"));
    return {
      replyText: subject
        ? `Separei ${suggestions.length} horário(s) para revisar ${subject.name}:`
        : `Separei ${suggestions.length} horário(s) para revisão:`,
      suggestions,
    };
  }

  if (normalized.includes("prova") || normalized.includes("avaliac")) {
    const days = deadlineIsoDate ? daysUntil(today, deadlineIsoDate) : 5;
    const slots = findFreeSlots(activities, {
      fromIsoDate: today,
      days,
      durationMinutes,
      maxSlots: 3,
    });
    if (slots.length === 0) return noSlotsReply();

    const suggestions = slots.map((slot, index) =>
      buildSuggestion(slot, index === slots.length - 1 ? "revisao" : "estudo", subject, "Preparação para a prova")
    );
    return {
      replyText: `Montei um plano de preparação com ${suggestions.length} sessão(ões)${
        subject ? ` para ${subject.name}` : ""
      }, terminando numa revisão final antes da data:`,
      suggestions,
    };
  }

  if (subject || normalized.includes("estudar")) {
    const days = deadlineIsoDate ? daysUntil(today, deadlineIsoDate) : 4;
    const slots = findFreeSlots(activities, {
      fromIsoDate: today,
      days: Math.max(days, 1),
      durationMinutes,
      maxSlots: 2,
    });
    if (slots.length === 0) return noSlotsReply();

    const category = detectCategory(normalized);
    const suggestions = slots.map((slot) =>
      buildSuggestion(slot, category, subject, subject ? "Estudo" : "Estudo individual")
    );
    return {
      replyText: subject
        ? `Encontrei ${suggestions.length} horário(s) livre(s) para estudar ${subject.name}${
            deadlineIsoDate ? " antes do prazo que você mencionou" : ""
          }:`
        : `Encontrei ${suggestions.length} horário(s) livre(s) para estudar:`,
      suggestions,
    };
  }

  const upcoming = getActivitiesInRange(activities, today, addDays(today, 6));
  return {
    replyText:
      upcoming.length > 0
        ? `Posso te ajudar a organizar sua semana! Você já tem ${upcoming.length} atividade(s) marcada(s) nos próximos 7 dias. Me conte seus horários livres, uma matéria para estudar ou use um dos atalhos abaixo.`
        : "Posso te ajudar a organizar sua semana! Me conte seus horários livres, uma matéria para estudar ou use um dos atalhos abaixo.",
    suggestions: [],
  };
}
