import type { ActivityCategory } from "@/lib/types/study-activity";

interface CategoryMeta {
  label: string;
  /** Ponto (indicador) no mês e barra lateral do bloco nas visões dia/semana. */
  dotClassName: string;
  /** Fundo do bloco de atividade (semitransparente sobre bg-card). */
  blockClassName: string;
  /** Texto/selo (ex.: badge de categoria no formulário e no card de sugestão). */
  badgeClassName: string;
}

export const CATEGORY_ORDER: ActivityCategory[] = [
  "aula",
  "estudo",
  "revisao",
  "trabalho",
  "tarefa",
  "prova",
  "pessoal",
];

export const CATEGORY_META: Record<ActivityCategory, CategoryMeta> = {
  aula: {
    label: "Aula",
    dotClassName: "bg-accent-cyan",
    blockClassName: "border-accent-cyan/50 bg-accent-cyan/15 text-accent-cyan",
    badgeClassName: "bg-accent-cyan/15 text-accent-cyan",
  },
  estudo: {
    label: "Estudo individual",
    dotClassName: "bg-accent-green",
    blockClassName: "border-accent-green/50 bg-accent-green/15 text-accent-green",
    badgeClassName: "bg-accent-green/15 text-accent-green",
  },
  revisao: {
    label: "Revisão",
    dotClassName: "bg-accent-purple",
    blockClassName: "border-accent-purple/50 bg-accent-purple/15 text-accent-purple",
    badgeClassName: "bg-accent-purple/15 text-accent-purple",
  },
  trabalho: {
    label: "Trabalho",
    dotClassName: "bg-accent-orange",
    blockClassName: "border-accent-orange/50 bg-accent-orange/15 text-accent-orange",
    badgeClassName: "bg-accent-orange/15 text-accent-orange",
  },
  tarefa: {
    label: "Tarefa",
    dotClassName: "bg-brand-yellow",
    blockClassName: "border-brand-yellow/50 bg-brand-yellow/15 text-brand-yellow",
    badgeClassName: "bg-brand-yellow/15 text-brand-yellow",
  },
  prova: {
    label: "Prova",
    dotClassName: "bg-accent-red",
    blockClassName: "border-accent-red/50 bg-accent-red/15 text-accent-red",
    badgeClassName: "bg-accent-red/15 text-accent-red",
  },
  pessoal: {
    label: "Atividade pessoal",
    dotClassName: "bg-text-secondary",
    blockClassName: "border-border-subtle bg-bg-card-hover text-text-secondary",
    badgeClassName: "bg-white/10 text-text-secondary",
  },
};
