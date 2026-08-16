/**
 * Não espelha nenhum endpoint real da UNIASSELVI (não identificamos API
 * pública para a Trilha de Aprendizagem). Estrutura própria, com conteúdo
 * transcrito manualmente das páginas reais de apresentação/unidades da
 * disciplina para servir de dado de demonstração.
 */
export type LearningPathLessonKind = "leitura" | "pratica";

export interface LearningPathVideoRaw {
  title: string;
  /** URL de embed do YouTube (formato .../embed/VIDEO_ID?...) — a mesma usada na página real "Vídeos da Disciplina". */
  embed_url: string;
}

export interface LearningPathFaqEntry {
  question: string;
  answer: string;
}

export interface LearningPathLessonRaw {
  id: string;
  title: string;
  kind: LearningPathLessonKind;
  duration_min: number;
  points: number;
  /**
   * @deprecated Campo inerte. O progresso real vem exclusivamente de
   * `trilha_completions` no banco (ver lib/data/load-trilha-progress.ts); nem
   * a página nem os selectors leem este valor. Mantido só porque as fixtures
   * existentes o carregam — não use para decidir estado de conclusão.
   */
  completed: boolean;
  /** Corpo em markdown simplificado (## títulos, parágrafos separados por linha em branco, **negrito**). */
  content: string;
  /** Vídeos do Kit Pedagógico relacionados a esta lição, se houver. */
  videos?: LearningPathVideoRaw[];
  /** Dúvidas pré-cadastradas desta lição — primeiro passo da ordem de resolução do Vitru (custo zero, sem chamada de modelo). */
  faq?: LearningPathFaqEntry[];
}

export interface LearningPathSectionRaw {
  id: string;
  title: string;
  summary: string;
  lessons: LearningPathLessonRaw[];
}

/**
 * Procedência do conteúdo da trilha — nenhuma delas vem de endpoint real da
 * UNIASSELVI, mas o grau de invenção difere e isso importa na hora de decidir
 * o que pode ser mostrado como demonstração fiel.
 *
 * - `transcribed`: transcrito à mão das páginas reais da disciplina (MAT24).
 * - `derived`: reconstruído a partir de outras fixtures reais do próprio
 *   projeto — títulos de aulas gravadas, enunciados de avaliação, eventos de
 *   calendário. O recorte de tópicos reflete o que a disciplina realmente cobra.
 * - `synthetic`: ementa inventada a partir apenas do nome da disciplina, sem
 *   nenhum material de origem. Substituir assim que houver conteúdo real.
 */
export type LearningPathSource = "transcribed" | "derived" | "synthetic";

export interface LearningPathRaw {
  subject_code: string;
  title: string;
  subtitle: string;
  /** Ausente equivale a `transcribed` (fixture MAT24, anterior a este campo). */
  source?: LearningPathSource;
  /** Fixtures de origem que embasaram uma trilha `derived`, para auditoria. */
  derived_from?: string[];
  sections: LearningPathSectionRaw[];
}
