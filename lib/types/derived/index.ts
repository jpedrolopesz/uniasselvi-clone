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

/**
 * Formato reduzido enviado ao cliente na seção de colegas do agendamento de
 * prova. Nunca inclui endereço, telefone, e-mail ou posição em tempo real —
 * a filtragem acontece inteiramente no Server Component
 * (ver lib/exam-schedule/group-related-students.ts), este é o único shape
 * que chega ao componente visual.
 */
export interface PublicStudentConnection {
  studentId: string;
  displayName: string;
  avatarUrl?: string;
  city?: string;
  state?: string;
  classmate: boolean;
  sameCity: boolean;
  sameExamDate: boolean;
  sameExamLocation: boolean;
  connectionAllowed: boolean;
}

export interface ExamCityComparison {
  isSameCity: boolean;
  studentCity: string | null;
  studentState: string | null;
  examCity: string | null;
  examState: string | null;
}

export interface ExamSessionLocation {
  id: string;
  name: string;
  address: string | null;
  number?: string;
  complement?: string;
  district?: string;
  city: string | null;
  state: string | null;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  accessInfo?: string;
}

/**
 * Uma "sessão" de prova: uma data+hora+local combinados. Representa tanto o
 * agendamento já confirmado (a partir de `ScheduleDetailRaw`) quanto cada
 * opção ainda não escolhida (a partir de `ExamScheduleOptionRaw`) — o
 * restante da página trabalha só com este formato normalizado.
 */
export interface ExamSession {
  id: string;
  isoDate: string | null;
  displayDate: string;
  startTime?: string;
  endTime?: string;
  location: ExamSessionLocation;
  capacity?: number;
  availableSlots?: number;
}
