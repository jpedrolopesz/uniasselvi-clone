import type { AssessmentRaw } from "@/lib/types/raw/assessments";
import type { AssessmentUiState } from "@/lib/types/derived";
import { formatDateBr } from "@/lib/formatters/date-formatters";

/**
 * `show_button` não implica botão habilitado — foi observado show_button=true
 * com can_answer=false renderizando o botão desabilitado. `is_online` também
 * não determina sozinho o texto do botão (havia is_online=false com o texto
 * "Responder on-line" mesmo assim). A regra usada aqui:
 *  - need_schedule=true  -> ação "Agendar prova"/"Ver agendamento", sempre
 *    habilitada quando show_button=true (a página de agendamento trata os
 *    dois estados — ainda não agendada ou já agendada/gerenciável — então
 *    `has_schedule=true` não é mais motivo para desabilitar o botão aqui,
 *    diferente da leitura original antes de essa página existir)
 *  - caso contrário       -> ação "Responder on-line", habilitada por can_answer
 *
 * `grade` e `answers_published_date` só existem no dado real quando a
 * avaliação já foi corrigida — nos demais casos exibidos como "-".
 */
function deriveGradeAndPublished(assessment: AssessmentRaw) {
  return {
    gradeDisplay: assessment.grade ?? "-",
    publishedDisplay: assessment.answers_published_date
      ? formatDateBr(assessment.answers_published_date)
      : "-",
  };
}

export function deriveAssessmentUiState(
  assessment: AssessmentRaw
): AssessmentUiState {
  const gradeAndPublished = deriveGradeAndPublished(assessment);

  if (assessment.need_schedule) {
    return {
      actionKind: "agendar-prova",
      actionLabel: assessment.has_schedule ? "Ver agendamento" : "Agendar prova",
      isActionEnabled: assessment.show_button,
      ...gradeAndPublished,
    };
  }

  if (assessment.show_button) {
    return {
      actionKind: "responder-online",
      actionLabel: "Responder on-line",
      isActionEnabled: assessment.can_answer,
      ...gradeAndPublished,
    };
  }

  return {
    actionKind: "indisponivel",
    actionLabel: "Indisponível",
    isActionEnabled: false,
    ...gradeAndPublished,
  };
}
