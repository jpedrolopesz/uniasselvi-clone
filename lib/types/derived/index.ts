/**
 * Tipos derivados: nunca vêm diretamente de um JSON. São produzidos por
 * funções em lib/selectors a partir de dados raw, para uso exclusivo na UI.
 */

export interface SofiaParticipationDerived {
  participatesActively: boolean;
  isControlGroup: boolean;
}

export type AssessmentActionKind =
  | "responder-online"
  | "agendar-prova"
  | "indisponivel";

export interface AssessmentUiState {
  actionLabel: string;
  actionKind: AssessmentActionKind;
  isActionEnabled: boolean;
  gradeDisplay: string;
  publishedDisplay: string;
}

export interface CalendarMarkedDay {
  isoDate: string;
  hasEvent: boolean;
}
