/**
 * Endpoint ainda não identificado — conteúdo de uma prova/avaliação
 * associada a um `test_code` específico dentro de uma disciplina. Estrutura
 * diferente de assessments.ts (que cobre a listagem de avaliações com
 * prazos/elegibilidade) — não misturar os dois. Campo `weigth` preservado
 * com o erro de digitação do dado original (não corrigir para "weight").
 *
 * Dois formatos reais observados em subjects/[code]/tests/[test_code].json,
 * ambos envelope `{ info, questions, cpa? }`:
 *  - avaliação pendente de resposta (GTI03/123265797): `questions` traz só
 *    o enunciado e as alternativas, sem gabarito nem resposta do aluno.
 *  - avaliação já concluída (159490/124208039, `completed: "S"`):
 *    `questions` vem muito mais rica — cada questão traz a resposta dada
 *    (`answer`), se acertou (`got_right`), status da correção
 *    (`status_description`), e cada alternativa traz se é a correta
 *    (`correct: "S"/"N"`). Os campos extras abaixo são opcionais porque só
 *    aparecem nesse segundo caso.
 * `cpa` visto vazio (`[]`) só na avaliação concluída — propósito ainda
 * desconhecido, preservado sem interpretar.
 */
export interface TestAlternativeRaw {
  alternative_code: string;
  description: string;
  letter: string;
  question_code?: string;
  alternative_code_question_bank?: string;
  code_question_bank?: string;
  question_code_question_bank?: string;
  /** "S" / "N" — só presente em avaliação já corrigida. */
  correct?: string;
}

export interface TestQuestionRaw {
  question_code: string;
  number: string;
  description: string;
  alternatives: TestAlternativeRaw[];
  /** Letra escolhida pelo aluno — só presente em avaliação já respondida. */
  answer?: string;
  answer_attachment?: unknown[];
  attachments?: unknown[];
  bonus?: string;
  description_formated?: string;
  got_right?: boolean;
  image?: unknown[];
  new_answer_format?: boolean;
  new_answer_type?: string;
  new_answer_type_code?: string;
  status?: string;
  status_description?: string;
  summary?: string[];
  type?: string;
  type_code?: string;
}

export interface TestInfoRaw {
  description: string;
  weigth: string;
  subject_name: string;
  subject_code: string;
  test_code: string;
  specialization: string;
  completed: string;
  week_day: string;
  shift: string;
  type: string;
  status_semester?: string;
  created_at?: string;
  updated_at?: string;
}

export interface TestContentRaw {
  info: TestInfoRaw;
  questions: TestQuestionRaw[];
  cpa?: unknown[];
}
