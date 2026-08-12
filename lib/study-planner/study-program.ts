import type { AssessmentWithSubject } from "@/lib/data/load-study-planner-data";
import type { ActivityCategory, StudyActivity } from "@/lib/types/study-activity";
import { toIsoDateKey } from "@/lib/formatters/date-formatters";
import { addDays } from "@/lib/study-planner/date-utils";
import {
  ASSIGNMENT_STEPS,
  EXAM_STEPS,
  daysBetween,
  isAssignmentAssessment,
  pendingOpenAssessments,
  planSteps,
} from "@/lib/study-planner/assessment-plan";

export interface StudyProgramSession {
  /** Mesmo esquema de id que StudyPlanSuggestion usa (plan-<code>-<n>) — reaproveitado de propósito, ver comentário em lib/db/schema/vitru.ts. */
  id: string;
  assessmentCode: string;
  subjectCode: string;
  subjectName: string;
  title: string;
  category: ActivityCategory;
  date: string;
  startTime: string;
  endTime: string;
  notes: string;
}

export interface StudyProgramAssessmentSummary {
  assessmentCode: string;
  assessmentDescription: string;
  subjectCode: string;
  subjectName: string;
  kind: "exam" | "assignment";
  deadline: string;
  daysRemaining: number;
  sessionsPlanned: number;
}

export interface StudyProgram {
  horizonStart: string;
  horizonEnd: string;
  sessions: StudyProgramSession[];
  /** Toda avaliação pendente considerada, mesmo quando sessionsPlanned é 0 (não coube horário). */
  assessments: StudyProgramAssessmentSummary[];
  replyText: string;
}

function narrate(program: Omit<StudyProgram, "replyText">): string {
  const covered = program.assessments.filter((a) => a.sessionsPlanned > 0);
  if (covered.length === 0) {
    return `Não encontrei horários livres suficientes entre ${program.horizonStart} e ${program.horizonEnd} para montar um plano. Podemos revisar sua agenda ou ampliar o período.`;
  }

  const assessmentList = covered
    .map((a) => `${a.assessmentDescription} (${a.subjectName})`)
    .join("; ");
  const skipped = program.assessments.length - covered.length;
  const skippedText =
    skipped > 0
      ? ` ${skipped} avaliação(ões) pendente(s) não coube(ram) neste período.`
      : "";

  return `Organizei um plano de estudos de ${program.horizonStart} a ${program.horizonEnd}, cobrindo ${covered.length} avaliação(ões): ${assessmentList}. No total, ${program.sessions.length} sessão(ões) de estudo foram encaixadas nos seus horários livres.${skippedText} Confirme individualmente o que deseja adicionar ao calendário.`;
}

/**
 * Plano de estudos de vários dias, cobrindo todas as avaliações pendentes
 * (não só a mais urgente, diferente de buildNextAssessmentPlan) dentro de um
 * horizonte fixo de dias.
 *
 * Reaproveita as mesmas peças do plano de avaliação única —
 * `pendingOpenAssessments` para ordenar por prazo/peso/status,
 * `planSteps`/`findFreeSlots` (por dentro de planSteps) para encaixar cada
 * etapa numa janela livre real. A diferença é o acumulador `occupied`
 * compartilhado entre avaliações: a etapa da avaliação seguinte nunca cai
 * num horário que a anterior já tomou, e o horizonte de cada avaliação é
 * limitado ao horizonte pedido, não ao prazo real dela (uma prova daqui a
 * 60 dias não trava um plano de 7 dias, só entra com prioridade menor).
 *
 * A geração é inteiramente determinística — nenhuma chamada ao modelo aqui.
 * O modelo (Fase 5) narra e negocia o resultado; nunca inventa uma data.
 */
export function buildStudyProgram(
  assessments: AssessmentWithSubject[],
  activities: StudyActivity[],
  today: string,
  options: { horizonDays: number }
): StudyProgram | null {
  const horizonEnd = addDays(today, options.horizonDays - 1);
  const pending = pendingOpenAssessments(assessments, today);
  if (pending.length === 0) return null;

  const occupied = [...activities];
  const sessions: StudyProgramSession[] = [];
  const assessmentSummaries: StudyProgramAssessmentSummary[] = [];

  for (const item of pending) {
    const deadline = toIsoDateKey(item.assessment.end_date);
    if (!deadline) continue;

    const kind = isAssignmentAssessment(item.assessment.description, item.assessment.test_type_code)
      ? "assignment"
      : "exam";
    const safetyDays = kind === "assignment" ? 2 : 1;
    const safeDeadlineCandidate = addDays(deadline, -safetyDays);
    const personalPlanningDeadline = safeDeadlineCandidate < today ? deadline : safeDeadlineCandidate;
    // Nunca planeja além do horizonte pedido, mesmo que o prazo real da
    // avaliação seja mais distante — é o que faz um plano de 7 dias
    // continuar sendo um plano de 7 dias mesmo com provas em 2 meses.
    const effectiveDeadline =
      personalPlanningDeadline < horizonEnd ? personalPlanningDeadline : horizonEnd;

    const steps = kind === "assignment" ? ASSIGNMENT_STEPS : EXAM_STEPS;
    const suggestions = planSteps(steps, item, occupied, today, effectiveDeadline);

    for (const suggestion of suggestions) {
      sessions.push({
        id: suggestion.id,
        assessmentCode: item.assessment.code,
        subjectCode: item.subjectCode,
        subjectName: item.subjectName,
        title: suggestion.title,
        category: suggestion.category,
        date: suggestion.date,
        startTime: suggestion.startTime,
        endTime: suggestion.endTime,
        notes: suggestion.notes,
      });
      // Reserva o horário para as avaliações seguintes do laço — mesma
      // mecânica que planSteps já usa internamente para uma só avaliação.
      occupied.push({ ...suggestion, source: "ai" });
    }

    assessmentSummaries.push({
      assessmentCode: item.assessment.code,
      assessmentDescription: item.assessment.description,
      subjectCode: item.subjectCode,
      subjectName: item.subjectName,
      kind,
      deadline,
      daysRemaining: daysBetween(today, deadline),
      sessionsPlanned: suggestions.length,
    });
  }

  sessions.sort((a, b) =>
    a.date === b.date ? a.startTime.localeCompare(b.startTime) : a.date.localeCompare(b.date)
  );

  const program = { horizonStart: today, horizonEnd, sessions, assessments: assessmentSummaries };
  return { ...program, replyText: narrate(program) };
}
