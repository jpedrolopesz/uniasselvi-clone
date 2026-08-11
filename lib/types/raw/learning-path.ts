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
  /** Estado de conclusão "de fábrica" — mesclado no servidor com o progresso salvo em trilha-progress.json (ver lib/data/load-trilha-progress.ts). */
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

export interface LearningPathRaw {
  subject_code: string;
  title: string;
  subtitle: string;
  sections: LearningPathSectionRaw[];
}
