import type { AssessmentWithSubject } from "@/lib/data/load-study-planner-data";
import type { ActivityCategory, StudyActivity } from "@/lib/types/study-activity";
import { toIsoDateKey } from "@/lib/formatters/date-formatters";
import { findFreeSlots } from "@/lib/study-planner/calendar-logic";
import { addDays } from "@/lib/study-planner/date-utils";

export interface StudyPlanSuggestion {
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

export interface AssessmentPlan {
  assessmentCode: string;
  assessmentDescription: string;
  subjectCode: string;
  subjectName: string;
  kind: "exam" | "assignment";
  deadline: string;
  daysRemaining: number;
  urgency: "critical" | "high" | "medium" | "low";
  replyText: string;
  suggestions: StudyPlanSuggestion[];
}

export interface PlanStep {
  title: string;
  durationMinutes: number;
  category: ActivityCategory;
}

export const EXAM_STEPS: PlanStep[] = [
  { title: "Mapear conteúdos da avaliação", durationMinutes: 45, category: "estudo" },
  { title: "Estudar conteúdos prioritários", durationMinutes: 90, category: "estudo" },
  { title: "Resolver exercícios e verificar dúvidas", durationMinutes: 60, category: "estudo" },
  { title: "Revisão final para a avaliação", durationMinutes: 45, category: "revisao" },
];

export const ASSIGNMENT_STEPS: PlanStep[] = [
  { title: "Ler enunciado e definir entregáveis", durationMinutes: 45, category: "tarefa" },
  { title: "Pesquisar referências", durationMinutes: 90, category: "trabalho" },
  { title: "Montar estrutura do trabalho", durationMinutes: 60, category: "trabalho" },
  { title: "Produzir primeira versão", durationMinutes: 120, category: "trabalho" },
  { title: "Revisar e preparar entrega final", durationMinutes: 60, category: "revisao" },
];

export function daysBetween(from: string, to: string): number {
  const fromMs = Date.parse(`${from}T00:00:00Z`);
  const toMs = Date.parse(`${to}T00:00:00Z`);
  return Math.floor((toMs - fromMs) / 86_400_000);
}

export function isAssignmentAssessment(description: string, testTypeCode: string): boolean {
  const normalized = description.toLocaleLowerCase("pt-BR");
  return (
    normalized.includes("desafio profissional") ||
    normalized.includes("trabalho") ||
    normalized.includes("produção") ||
    testTypeCode === "1525"
  );
}

function urgencyFor(daysRemaining: number): AssessmentPlan["urgency"] {
  if (daysRemaining <= 1) return "critical";
  if (daysRemaining <= 3) return "high";
  if (daysRemaining <= 7) return "medium";
  return "low";
}

function priorityScore(item: AssessmentWithSubject, today: string): number {
  const deadline = toIsoDateKey(item.assessment.end_date);
  if (!deadline) return Number.NEGATIVE_INFINITY;
  const days = daysBetween(today, deadline);
  const assignmentBonus = isAssignmentAssessment(
    item.assessment.description,
    item.assessment.test_type_code
  )
    ? 20
    : 0;
  return 120 - Math.max(days, 0) * 5 + Number(item.assessment.weight || 0) * 3 + assignmentBonus;
}

export function pendingOpenAssessments(
  assessments: AssessmentWithSubject[],
  today: string
): AssessmentWithSubject[] {
  return assessments
    .filter(({ assessment }) => {
      const begin = toIsoDateKey(assessment.begin_date);
      const end = toIsoDateKey(assessment.end_date);
      return (
        assessment.exam_made === 0 &&
        Boolean(begin && end) &&
        begin! <= today &&
        end! >= today
      );
    })
    .sort((a, b) => priorityScore(b, today) - priorityScore(a, today));
}

export function planSteps(
  steps: PlanStep[],
  assessment: AssessmentWithSubject,
  activities: StudyActivity[],
  today: string,
  planningDeadline: string
): StudyPlanSuggestion[] {
  const suggestions: StudyPlanSuggestion[] = [];
  const occupied = [...activities];
  const availableDays = Math.max(daysBetween(today, planningDeadline) + 1, 1);

  for (const [index, step] of steps.entries()) {
    const suggestionId = `plan-${assessment.assessment.code}-${index + 1}`;
    if (occupied.some((activity) => activity.id === suggestionId)) continue;

    const slot = findFreeSlots(occupied, {
      fromIsoDate: today,
      days: availableDays,
      durationMinutes: step.durationMinutes,
      maxSlots: 1,
    })[0];
    if (!slot) break;

    const suggestion: StudyPlanSuggestion = {
      id: suggestionId,
      title: `${step.title} — ${assessment.subjectName}`,
      category: step.category,
      subjectCode: assessment.subjectCode,
      subjectName: assessment.subjectName,
      date: slot.date,
      startTime: slot.startTime,
      endTime: slot.endTime,
      notes: `Etapa sugerida para ${assessment.assessment.description}. Confirme antes de adicionar ao calendário.`,
    };
    suggestions.push(suggestion);
    occupied.push({ ...suggestion, source: "ai" });
  }

  return suggestions;
}

/** Cria o plano da avaliação aberta com maior prioridade. */
export function buildNextAssessmentPlan(
  assessments: AssessmentWithSubject[],
  activities: StudyActivity[],
  today: string
): AssessmentPlan | null {
  const target = pendingOpenAssessments(assessments, today)[0];
  if (!target) return null;

  const deadline = toIsoDateKey(target.assessment.end_date)!;
  const kind = isAssignmentAssessment(
    target.assessment.description,
    target.assessment.test_type_code
  )
    ? "assignment"
    : "exam";
  const safetyDays = kind === "assignment" ? 2 : 1;
  const safeDeadlineCandidate = addDays(deadline, -safetyDays);
  const planningDeadline = safeDeadlineCandidate < today ? deadline : safeDeadlineCandidate;
  const steps = kind === "assignment" ? ASSIGNMENT_STEPS : EXAM_STEPS;
  const suggestions = planSteps(
    steps,
    target,
    activities,
    today,
    planningDeadline
  );
  const daysRemaining = daysBetween(today, deadline);
  const marginText =
    planningDeadline === deadline
      ? "O prazo está muito próximo, então não há margem de segurança completa."
      : `O plano termina até ${planningDeadline}, antes do prazo final.`;
  const typeText = kind === "assignment" ? "trabalho" : "avaliação";

  return {
    assessmentCode: target.assessment.code,
    assessmentDescription: target.assessment.description,
    subjectCode: target.subjectCode,
    subjectName: target.subjectName,
    kind,
    deadline,
    daysRemaining,
    urgency: urgencyFor(daysRemaining),
    replyText:
      suggestions.length > 0
        ? `Identifiquei ${target.assessment.description}, de ${target.subjectName}, com prazo em ${deadline} (${daysRemaining} dia(s) restante(s)). Organizei ${suggestions.length} etapa(s) para preparar o ${typeText}. ${marginText} Confirme individualmente o que deseja adicionar ao calendário.`
        : `Identifiquei ${target.assessment.description}, com prazo em ${deadline}, mas não encontrei tempo livre suficiente antes da entrega. Podemos reduzir os blocos ou revisar sua agenda.`,
    suggestions,
  };
}
