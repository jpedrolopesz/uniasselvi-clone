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

export interface LearningPathLessonRaw {
  id: string;
  title: string;
  kind: LearningPathLessonKind;
  duration_min: number;
  points: number;
  /** Estado de conclusão "de fábrica" — mesclado no cliente com o progresso salvo em localStorage. */
  completed: boolean;
  /** Corpo em markdown simplificado (## títulos, parágrafos separados por linha em branco, **negrito**). */
  content: string;
  /** Vídeos do Kit Pedagógico relacionados a esta lição, se houver. */
  videos?: LearningPathVideoRaw[];
}

export interface LearningPathSectionRaw {
  id: string;
  title: string;
  summary: string;
  lessons: LearningPathLessonRaw[];
}

export interface LearningPathRaw {
  subject_code: string;
  title: string;
  subtitle: string;
  sections: LearningPathSectionRaw[];
}
