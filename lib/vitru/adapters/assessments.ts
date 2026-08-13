import type { AssessmentRaw } from "@/lib/types/raw/assessments";
import { deriveAssessmentUiState } from "@/lib/selectors/assessment-selectors";
import { defaultSnapshotState, type VitruSemanticSnapshot } from "@/lib/vitru/semantic-snapshot";
import { destinationsForPage } from "@/lib/vitru/destinations";

export interface AssessmentsSnapshotInput {
  subject: { code: string; name: string };
  assessments: AssessmentRaw[] | null;
}

export function assessmentItemId(subjectCode: string, assessmentCode: string): string {
  return `assessment:${subjectCode}:${assessmentCode}`;
}

export function assessmentActionId(assessment: AssessmentRaw, subjectCode: string): string | null {
  const state = deriveAssessmentUiState(assessment);
  if (state.actionKind === "indisponivel") return null;
  return `${assessmentItemId(subjectCode, assessment.code)}:${state.actionKind === "agendar-prova" ? "schedule" : "answer"}`;
}

export function buildAssessmentsSnapshot({ subject, assessments }: AssessmentsSnapshotInput): VitruSemanticSnapshot {
  const actions = (assessments ?? []).flatMap((assessment) => {
    const id = assessmentActionId(assessment, subject.code);
    if (!id) return [];
    return [{ id, label: deriveAssessmentUiState(assessment).actionLabel, kind: "navigate" as const }];
  });

  return {
    version: 0,
    status: assessments === null ? "error" : "ready",
    page: { id: "assessments", name: "Notas e Avaliações", subject },
    state: defaultSnapshotState(),
    sections: [{
      id: `discipline:${subject.code}:assessments`,
      name: "Avaliações",
      items: (assessments ?? []).map((assessment) => {
        const state = deriveAssessmentUiState(assessment);
        const actionId = assessmentActionId(assessment, subject.code);
        return {
          id: assessmentItemId(subject.code, assessment.code),
          name: assessment.description,
          status: state.actionLabel,
          facts: {
            codigo: assessment.code,
            nota: state.gradeDisplay,
            peso: assessment.weight,
            periodo: `${assessment.begin_date} a ${assessment.end_date}`,
            resultadoPublicado: state.publishedDisplay,
          },
          actionIds: actionId ? [actionId] : [],
        };
      }),
    }],
    actions,
    destinations: destinationsForPage("assessments", [
      { id: "discipline", name: subject.name, href: `/disciplinas/${subject.code}` },
      { id: "learning-path", name: "Trilha de aprendizagem", href: `/disciplinas/${subject.code}/trilha-de-aprendizagem` },
      { id: "mediator", name: "Fale com o mediador", href: `/disciplinas/${subject.code}/fale-com-mediador` },
    ]),
  };
}
