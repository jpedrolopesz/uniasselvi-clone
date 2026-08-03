/**
 * Espelha https://api-cursolivre.uniasselvi.com.br/academic/master-class/simplified/get
 * Tipos ajustados a partir de um retorno real do endpoint (2026-08-02).
 * A API mistura representações: alguns booleanos são `boolean` de fato
 * (allow_new_academic_production, current_subject, mediator/regent ausentes
 * como `false`...), outros continuam como string "S"/"N" (paid,
 * have_production). `mediator`/`regent` vêm como `false` quando não há
 * pessoa vinculada — nunca normalizar isso para objeto vazio ou string.
 */
export interface DisciplinePersonRaw {
  formation: string;
  person_code: string;
  person_mail: string;
  person_name: string;
  person_phone?: string;
  person_site?: string;
  specialization_code: string;
}

export interface DisciplineRaw {
  code: string;
  description: string;
  type: string;
  agroupment_period: string;
  agroupment_type: string;
  allow_new_academic_production: boolean;
  aluno_online: string;
  begin_date: string;
  book_code: string;
  book_code_identification: string;
  can_use_academic_production: boolean;
  class: string;
  class_code_grouping: string;
  coordinator: string;
  course_code: string;
  current_subject: boolean;
  desc_period: string;
  desc_week_day: string;
  end_date: string;
  got_approved_by_vacation_exam: boolean;
  grade_average?: string;
  grade_code: string;
  grouping: string;
  has_pending_practice: boolean;
  has_practice: boolean;
  has_schedule: boolean | string;
  has_scheduled_practice: boolean;
  have_book: boolean;
  have_production: string;
  leadtime?: string;
  max_semester_date: string;
  mediator: DisciplinePersonRaw | boolean;
  meet_type: string;
  offer_show_informatives: boolean;
  offer_type: string;
  offer_type_description: string;
  online_material: boolean;
  only_digital_book: boolean;
  order_progress: string;
  paid: string;
  polo: string;
  polo_atende_online: string;
  practice_environment: string;
  reason_block_new_academic_production: string;
  regent: DisciplinePersonRaw | boolean;
  replacement: boolean;
  semester: string;
  situation: string;
  status_semester?: string;
  subject_order: string;
  teacher: unknown[];
  turma_agrup: string;
  turs_codi: string;
}
