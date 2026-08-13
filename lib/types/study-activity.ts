export type ActivityCategory =
  | "aula"
  | "estudo"
  | "revisao"
  | "trabalho"
  | "tarefa"
  | "prova"
  | "pessoal";

export type ActivitySource = "seed" | "manual" | "ai";

/**
 * Modelo unificado usado pela página de Calendário de Estudos. `subjectCode`
 * é opcional pois atividades pessoais não pertencem a nenhuma disciplina.
 * Datas/horas seguem o mesmo formato usado no resto do projeto (ver
 * lib/formatters/date-formatters.ts): "YYYY-MM-DD" e "HH:mm".
 */
export interface StudyActivity {
  id: string;
  title: string;
  category: ActivityCategory;
  subjectCode: string | null;
  subjectName: string | null;
  date: string;
  startTime: string;
  endTime: string;
  notes: string;
  source: ActivitySource;
  /** Estado somente visual. Nunca é persistido em study_activities. */
  confirmationStatus?: "pending" | "saving" | "error";
}
