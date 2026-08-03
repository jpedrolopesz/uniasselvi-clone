/**
 * Espelha https://api-ava.uniasselvi.com.br/test/get (confirmado com dado
 * real de GTI03, 2026-08-02). Cobre a listagem de avaliações da disciplina
 * (prazos, elegibilidade, agendamento) — diferente de test-content.ts, que
 * cobre o conteúdo de uma prova específica (perguntas/gabarito). Não
 * misturar os dois. Campo `weight` aqui está com a grafia correta (o typo
 * "weigth" observado é exclusivo do outro endpoint).
 */
export interface ScheduleDetailRaw {
  data: string;
  hora_inicio: string;
  hora_fim: string;
  ambiente: string;
  id: string;
  cep: string;
  endereco: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  sigla: string;
}

export interface AssessmentRaw {
  allow_after_period: boolean;
  allow_cancel_schedule: boolean;
  assessment_reset: boolean;
  begin_date: string;
  can_answer: boolean;
  can_answer_2_opportunity: boolean;
  can_request_2_opportunity: boolean;
  can_scan: boolean;
  can_scan_batch: boolean;
  can_schedule_2_opportunity: boolean;
  can_see_answers: boolean;
  can_try_again: boolean;
  canceled_schedules: number;
  class: string;
  code: string;
  description: string;
  end_date: string;
  exam_code?: string;
  exam_made: number;
  /** Nota do aluno nesta avaliação — só presente quando já corrigida. */
  grade?: string;
  has_schedule: boolean;
  have_accessibility_video: boolean;
  have_individual_extension: boolean;
  have_request_second_oportunity: boolean;
  is_online: boolean;
  max_free_test_reposition: number;
  monitored_disabled: string;
  need_2_opportunity: boolean;
  need_schedule: boolean;
  new_exam: boolean;
  new_oportunity: boolean;
  new_oportunity_msg: string;
  parameter: string;
  realization_1_oportunity_end: string;
  realization_1_oportunity_start: string;
  realization_date: string;
  realization_way: string | number;
  realization_window_2_oportunity_end: string;
  realization_window_2_oportunity_start: string;
  realization_window_end: string;
  realization_window_start: string;
  request_window_2_oportunity_end: string;
  request_window_2_oportunity_start: string;
  response_method: string;
  /** Array vazio quando não agendada; objeto com local/horário quando has_schedule=true. */
  schedule: unknown[] | ScheduleDetailRaw;
  schedule_window_2_oportunity_end: string;
  schedule_window_2_oportunity_start: string;
  schedule_window_end: string;
  schedule_window_start: string;
  semester: string;
  show_button: boolean;
  subject: string;
  subject_type: string;
  test_class: string;
  test_code: string;
  test_type_code: string;
  type_code: string;
  weight: string;
  /** Data em que o resultado foi publicado — só presente quando já corrigida. */
  answers_published_date?: string;
}
