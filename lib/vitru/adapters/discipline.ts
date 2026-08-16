import type { DisciplineRaw } from "@/lib/types/raw/disciplines";
import type { RecordingRaw } from "@/lib/types/raw/recordings";
import type { AssessmentRaw } from "@/lib/types/raw/assessments";
import { defaultSnapshotState, type VitruSemanticSnapshot } from "@/lib/vitru/semantic-snapshot";
import { destinationsForPage } from "@/lib/vitru/destinations";
import { sanitizeSnapshotText } from "@/lib/vitru/sanitize-snapshot-text";

export interface DisciplineSnapshotInput {
  discipline: DisciplineRaw;
  recordings: RecordingRaw[] | null;
  assessments: AssessmentRaw[] | null;
  frequency?: number;
}

export function buildDisciplineSnapshot({
  discipline,
  recordings,
  assessments,
  frequency,
}: DisciplineSnapshotInput): VitruSemanticSnapshot {
  const code = discipline.code;
  const actionIds = [
    `discipline:${code}:learning-path`,
    `discipline:${code}:assessments`,
    `discipline:${code}:recordings`,
    `discipline:${code}:attendance`,
    `discipline:${code}:study-calendar`,
    `discipline:${code}:mediator`,
  ];

  return {
    version: 0,
    status: "ready",
    page: { id: "discipline", name: "Disciplina", subject: { code, name: discipline.description } },
    state: defaultSnapshotState(),
    sections: [
      {
        id: `discipline:${code}:summary`,
        name: "Resumo da disciplina",
        items: [{
          id: `discipline:${code}`,
          name: sanitizeSnapshotText(discipline.description),
          referenceCodes: [code],
          status: discipline.current_subject ? "Em andamento" : discipline.situation,
          facts: {
            periodo: `${discipline.begin_date} a ${discipline.end_date}`,
            avaliacoes: String(assessments?.length ?? 0),
            aulasGravadas: String(recordings?.length ?? 0),
            ...(frequency === undefined ? {} : { frequencia: `${frequency}%` }),
          },
          actionIds,
        }],
      },
      {
        id: `discipline:${code}:assessments-summary`,
        name: "Avaliações",
        items: (assessments ?? []).map((assessment) => ({
          id: `assessment:${code}:${assessment.code}`,
          name: sanitizeSnapshotText(assessment.description),
          referenceCodes: [assessment.code],
          actionIds: [],
        })),
      },
      {
        id: `discipline:${code}:recordings-summary`,
        name: "Aulas gravadas",
        items: (recordings ?? []).map((recording) => ({
          id: `recording:${code}:${recording.date_recording}`,
          name: recording.title,
          actionIds: [],
        })),
      },
    ],
    actions: [
      { id: actionIds[0], label: "Abrir trilha de aprendizagem", kind: "navigate" },
      { id: actionIds[1], label: "Abrir notas e avaliações", kind: "navigate" },
      { id: actionIds[2], label: "Mostrar aulas gravadas", kind: "read" },
      { id: actionIds[3], label: "Abrir registro de frequência", kind: "navigate" },
      { id: actionIds[4], label: "Abrir calendário de estudos", kind: "navigate" },
      { id: actionIds[5], label: "Falar com o mediador", kind: "navigate" },
    ],
    destinations: destinationsForPage("discipline", [
      { id: "learning-path", name: "Trilha de aprendizagem", href: `/disciplinas/${code}/trilha-de-aprendizagem` },
      { id: "assessments", name: "Notas e avaliações", href: `/disciplinas/${code}/notas-avaliacoes` },
      { id: "attendance", name: "Registro de frequência", href: `/disciplinas/${code}/registro-de-frequencia` },
      { id: "study-calendar", name: "Calendário de estudos", href: `/calendario-de-estudos?subjectCode=${code}` },
      { id: "mediator", name: "Fale com o mediador", href: `/disciplinas/${code}/fale-com-mediador` },
    ]),
  };
}
