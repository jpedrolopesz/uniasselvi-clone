import type { AssessmentRaw } from "@/lib/types/raw/assessments";
import { deriveAssessmentUiState } from "@/lib/selectors/assessment-selectors";
import { formatDateBr } from "@/lib/formatters/date-formatters";
import { AssessmentStatus } from "@/components/assessments/AssessmentStatus";
import { AssessmentAction } from "@/components/assessments/AssessmentAction";
import { assessmentActionId, assessmentItemId } from "@/lib/vitru/adapters/assessments";

interface AssessmentCardProps {
  assessment: AssessmentRaw;
  subjectCode: string;
}

export function AssessmentCard({ assessment, subjectCode }: AssessmentCardProps) {
  const uiState = deriveAssessmentUiState(assessment);
  const testHref =
    uiState.actionKind === "responder-online" && assessment.test_code
      ? `/disciplinas/${subjectCode}/notas-avaliacoes/${assessment.test_code}`
      : uiState.actionKind === "agendar-prova" && assessment.test_code
        ? `/disciplinas/${subjectCode}/notas-avaliacoes/${assessment.test_code}/agendamento`
        : undefined;
  const itemId = assessmentItemId(subjectCode, assessment.code);
  const actionId = assessmentActionId(assessment, subjectCode);

  return (
    <div data-vitru-id={itemId} className="flex flex-col gap-3 rounded-xl bg-bg-card p-4">
      <div>
        <h3 className="text-sm font-semibold text-white">
          {assessment.description}
          {assessment.code && (
            <span className="ml-1 font-normal text-text-secondary">(Cod.:{assessment.code})</span>
          )}
        </h3>
        <p className="mt-1 text-xs text-text-secondary">
          {formatDateBr(assessment.begin_date)} a {formatDateBr(assessment.end_date)}
        </p>
      </div>

      <AssessmentStatus weight={assessment.weight} uiState={uiState} />
      <AssessmentAction uiState={uiState} href={testHref} vitruActionId={actionId ?? undefined} />
    </div>
  );
}
