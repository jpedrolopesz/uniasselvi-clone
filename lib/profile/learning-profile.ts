/**
 * Learning Profile Engine — Perfil inteligente do aluno.
 */

export interface LearningProfile {
  studentId: string;
  varkScores: { visual: number; auditory: number; reading: number; kinesthetic: number };
  primaryStyle: "visual" | "auditory" | "reading" | "kinesthetic";
  schedule: {
    worksFullTime: boolean;
    workDays: number[];
    workStartTime: string | null;
    workEndTime: string | null;
    preferredStudyTimes: { weekday: number; startTime: string; endTime: string }[];
    sessionDurationMinutes: number;
  };
  goals: {
    primaryMotivation: string | null;
    careerObjective: string | null;
    shortTermGoal: string | null;
    expectedGraduationYear: number | null;
  };
  challenges: {
    reportedDifficulties: string[];
    strongSubjects: string[];
    weakSubjects: string[];
    preferredContentFormats: ContentFormat[];
  };
  interests: {
    categories: CommunityCategory[];
    skills: string[];
    openToMentoring: boolean;
    openToNetworking: boolean;
  };
  completeness: number;
  createdAt: string;
  updatedAt: string;
}

export type ContentFormat =
  | "video" | "text_summary" | "infographic" | "podcast"
  | "flashcards" | "mind_map" | "interactive_quiz" | "case_study";

export type CommunityCategory =
  | "empresa_junior" | "grupo_pesquisa" | "atletica" | "networking"
  | "mentoria" | "voluntariado" | "hackathon";

export interface CommunityGroup {
  id: string;
  name: string;
  category: CommunityCategory;
  description: string;
  institution: "unicesumar" | "uniasselvi" | "both";
  courseAffinity: string[];
  memberCount: number;
  maxMembers: number | null;
  meetingSchedule: { frequency: string; weekday: number; startTime: string; endTime: string; modality: string; platform?: string } | null;
  skills: string[];
  isActive: boolean;
  createdAt: string;
  imageUrl: string | null;
  contactEmail: string;
  socialLinks: { platform: string; url: string }[];
}

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  questions: OnboardingQuestion[];
}

export interface OnboardingQuestion {
  id: string;
  text: string;
  type: "single_choice" | "multiple_choice" | "scale" | "time_picker" | "text";
  options?: { value: string; label: string }[];
  required: boolean;
}

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: "learning_style",
    title: "Como você aprende melhor?",
    description: "Entender seu estilo ajuda a direcionar o formato do conteúdo.",
    questions: [
      { id: "vark_visual", text: "Prefiro diagramas, gráficos e vídeos a textos longos.", type: "scale", required: true },
      { id: "vark_auditory", text: "Aprendo melhor ouvindo explicações (podcasts, aulas).", type: "scale", required: true },
      { id: "vark_reading", text: "Prefiro ler e fazer anotações escritas para fixar.", type: "scale", required: true },
      { id: "vark_kinesthetic", text: "Aprendo fazendo — exercícios práticos me ajudam mais.", type: "scale", required: true },
    ],
  },
  {
    id: "routine",
    title: "Sua rotina",
    description: "Para sugerir horários de estudo que funcionem na sua vida.",
    questions: [
      {
        id: "works_full_time", text: "Você trabalha?", type: "single_choice", required: true,
        options: [
          { value: "yes", label: "Sim, período integral" },
          { value: "part_time", label: "Meio período" },
          { value: "no", label: "Não trabalho atualmente" },
        ],
      },
      {
        id: "preferred_study_time", text: "Quando tem mais energia para estudar?", type: "multiple_choice", required: true,
        options: [
          { value: "early_morning", label: "Cedo (6h-8h)" },
          { value: "morning", label: "Manhã (8h-12h)" },
          { value: "afternoon", label: "Tarde (12h-18h)" },
          { value: "evening", label: "Noite (18h-22h)" },
          { value: "night", label: "Madrugada (22h+)" },
        ],
      },
      {
        id: "session_duration", text: "Quanto tempo consegue estudar sem perder o foco?", type: "single_choice", required: true,
        options: [
          { value: "25", label: "25 minutos (Pomodoro)" },
          { value: "45", label: "45 minutos" },
          { value: "60", label: "1 hora" },
          { value: "90", label: "1h30" },
          { value: "120", label: "2 horas ou mais" },
        ],
      },
    ],
  },
  {
    id: "goals",
    title: "Seus objetivos",
    description: "Para conectar você com oportunidades relevantes.",
    questions: [
      {
        id: "primary_motivation", text: "O que mais te motiva a concluir o curso?", type: "single_choice", required: true,
        options: [
          { value: "career_advancement", label: "Crescer na carreira atual" },
          { value: "career_change", label: "Mudar de área" },
          { value: "personal_development", label: "Desenvolvimento pessoal" },
          { value: "requirement", label: "Exigência do trabalho" },
          { value: "academic_interest", label: "Interesse acadêmico" },
          { value: "entrepreneurship", label: "Empreender" },
        ],
      },
      { id: "career_objective", text: "Descreva brevemente seu objetivo profissional:", type: "text", required: false },
    ],
  },
  {
    id: "challenges",
    title: "Suas dificuldades",
    description: "Para oferecer o suporte certo no momento certo.",
    questions: [
      {
        id: "difficulties", text: "Quais são seus maiores desafios no EAD?", type: "multiple_choice", required: true,
        options: [
          { value: "time_management", label: "Falta de tempo" },
          { value: "content_difficulty", label: "Dificuldade com conteúdo" },
          { value: "motivation", label: "Falta de motivação" },
          { value: "technology", label: "Dificuldade com tecnologia" },
          { value: "isolation", label: "Me sinto isolado(a)" },
          { value: "financial", label: "Dificuldades financeiras" },
          { value: "work_life_balance", label: "Equilibrar trabalho e estudo" },
        ],
      },
      {
        id: "content_formats", text: "Quais formatos de conteúdo você prefere?", type: "multiple_choice", required: true,
        options: [
          { value: "video", label: "Vídeos curtos" },
          { value: "text_summary", label: "Resumos em texto" },
          { value: "infographic", label: "Infográficos" },
          { value: "podcast", label: "Podcasts / áudio" },
          { value: "flashcards", label: "Flashcards" },
          { value: "mind_map", label: "Mapas mentais" },
          { value: "interactive_quiz", label: "Quizzes interativos" },
          { value: "case_study", label: "Estudos de caso" },
        ],
      },
    ],
  },
  {
    id: "community",
    title: "Interesses além das aulas",
    description: "Para conectar você com pessoas e projetos relevantes.",
    questions: [
      {
        id: "community_interests", text: "O que te interessa participar?", type: "multiple_choice", required: true,
        options: [
          { value: "empresa_junior", label: "Empresa Júnior" },
          { value: "grupo_pesquisa", label: "Grupo de Pesquisa" },
          { value: "atletica", label: "Atlética / Esportes" },
          { value: "networking", label: "Networking profissional" },
          { value: "mentoria", label: "Mentoria" },
          { value: "voluntariado", label: "Voluntariado" },
          { value: "hackathon", label: "Hackathons / Competições" },
        ],
      },
      {
        id: "open_to_mentoring", text: "Gostaria de ter um mentor ou mentorar outros?", type: "single_choice", required: false,
        options: [
          { value: "receive", label: "Quero ter um mentor" },
          { value: "give", label: "Quero mentorar outros" },
          { value: "both", label: "Ambos" },
          { value: "no", label: "Não por enquanto" },
        ],
      },
    ],
  },
];

export function determinePrimaryStyle(scores: LearningProfile["varkScores"]): LearningProfile["primaryStyle"] {
  const entries = Object.entries(scores) as [LearningProfile["primaryStyle"], number][];
  return entries.reduce((max, current) => current[1] > max[1] ? current : max)[0];
}

export function calculateProfileCompleteness(profile: Partial<LearningProfile>): number {
  const sections = [
    { weight: 25, filled: !!profile.varkScores },
    { weight: 25, filled: !!(profile.schedule as { preferredStudyTimes?: unknown[] })?.preferredStudyTimes?.length },
    { weight: 20, filled: !!(profile.goals as { primaryMotivation?: string })?.primaryMotivation },
    { weight: 15, filled: !!(profile.challenges as { reportedDifficulties?: unknown[] })?.reportedDifficulties?.length },
    { weight: 15, filled: !!(profile.interests as { categories?: unknown[] })?.categories?.length },
  ];
  return sections.reduce((sum, s) => sum + (s.filled ? s.weight : 0), 0);
}
