import type { OnboardingClientContext, OnboardingScene, SemanticDestination } from "./types";

export const ONBOARDING_SCENES: readonly OnboardingScene[] = [
  {
    id: "welcome",
    eyebrow: "Boas-vindas",
    title: "Este é o seu novo AVA",
    instruction: "Acompanhe o professor. Você poderá explorar sozinho quando quiser.",
    professorNote: "Apresente a dinâmica e explique que ninguém fará ações acadêmicas pelo aluno.",
    mode: "observe",
    destination: { kind: "HOME" },
    highlightId: "home-overview",
    completion: { kind: "IMMEDIATE" },
  },
  {
    id: "disciplines",
    eyebrow: "Sua vida acadêmica",
    title: "Encontre suas disciplinas",
    instruction: "Aqui ficam as disciplinas disponíveis no semestre atual.",
    professorNote: "Mostre os cartões e explique que cada aluno enxerga apenas a própria matrícula.",
    mode: "observe",
    destination: { kind: "HOME" },
    highlightId: "disciplines-section",
    completion: { kind: "IMMEDIATE" },
  },
  {
    id: "choose-subject",
    eyebrow: "Agora é com você",
    title: "Abra uma disciplina",
    instruction: "Escolha um dos cartões de disciplina para continuar.",
    professorNote: "Espere os alunos praticarem. O painel mostrará quantos chegaram à disciplina.",
    mode: "practice",
    destination: { kind: "HOME" },
    highlightId: "discipline-card",
    completion: { kind: "PATH_MATCH", pattern: "^/disciplinas/[^/]+$" },
  },
  {
    id: "learning-path-link",
    eyebrow: "Dentro da disciplina",
    title: "Conheça a Trilha de Aprendizagem",
    instruction: "A trilha organiza os conteúdos e mostra seu progresso.",
    professorNote: "Explique a função da trilha antes de pedir que os alunos a abram.",
    mode: "observe",
    destination: { kind: "CURRENT_SUBJECT" },
    highlightId: "learning-path-link",
    completion: { kind: "IMMEDIATE" },
  },
  {
    id: "open-learning-path",
    eyebrow: "Pratique novamente",
    title: "Entre na sua trilha",
    instruction: "Clique em “Trilha de aprendizagem” para ver as etapas da disciplina.",
    professorNote: "Aguarde a confirmação individual antes de concluir a apresentação.",
    mode: "practice",
    destination: { kind: "CURRENT_SUBJECT" },
    highlightId: "learning-path-link",
    completion: {
      kind: "PATH_MATCH",
      pattern: "^/disciplinas/[^/]+/trilha-de-aprendizagem$",
    },
  },
  {
    id: "path-overview",
    eyebrow: "Você já sabe começar",
    title: "Acompanhe sua evolução",
    instruction: "Nesta tela você encontra as aulas, atividades e o progresso da disciplina.",
    professorNote: "Encerre reforçando que o aluno pode voltar à trilha a qualquer momento.",
    mode: "explore",
    destination: { kind: "CURRENT_LEARNING_PATH" },
    highlightId: "learning-path-overview",
    completion: { kind: "IMMEDIATE" },
  },
] as const;

export function findOnboardingScene(sceneId: string): OnboardingScene {
  return ONBOARDING_SCENES.find((scene) => scene.id === sceneId) ?? ONBOARDING_SCENES[0];
}

export function sceneIndex(sceneId: string): number {
  const index = ONBOARDING_SCENES.findIndex((scene) => scene.id === sceneId);
  return index < 0 ? 0 : index;
}

export function subjectCodeFromPath(pathname: string): string | null {
  return pathname.match(/^\/disciplinas\/([^/]+)/)?.[1] ?? null;
}

export function resolveDestination(
  destination: SemanticDestination,
  context: OnboardingClientContext
): string | null {
  if (destination.kind === "HOME") return "/";
  if (!context.subjectCode) return null;
  if (destination.kind === "CURRENT_SUBJECT") {
    return `/disciplinas/${encodeURIComponent(context.subjectCode)}`;
  }
  return `/disciplinas/${encodeURIComponent(context.subjectCode)}/trilha-de-aprendizagem`;
}

export function isSceneComplete(scene: OnboardingScene, pathname: string): boolean {
  if (scene.completion.kind === "IMMEDIATE") return true;
  return new RegExp(scene.completion.pattern).test(pathname);
}
