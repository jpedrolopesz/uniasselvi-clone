/**
 * Study Recommender — Recomendação adaptativa de estudos.
 */
import type { LearningProfile, ContentFormat } from "@/lib/profile/learning-profile";

interface SubjectContext {
  code: string;
  name: string;
  beginDate: string;
  endDate: string;
  currentGrade: number | null;
  assessmentsDue: { deadline: string; weight: number }[];
  progressPercent: number;
}

export interface SubjectPriority {
  subjectCode: string;
  subjectName: string;
  score: number;
  reasons: string[];
  nextDeadline: string | null;
  currentGrade: number | null;
  suggestedHoursPerWeek: number;
}

export interface StudyMethod {
  type: string;
  name: string;
  description: string;
  bestFor: string[];
  estimatedEfficiency: number;
}

export function prioritizeSubjects(subjects: SubjectContext[], referenceDate: string): SubjectPriority[] {
  return subjects.map(subject => {
    let score = 0;
    const reasons: string[] = [];

    const next = subject.assessmentsDue.filter(a => a.deadline >= referenceDate).sort((a, b) => a.deadline.localeCompare(b.deadline))[0];
    if (next) {
      const days = Math.floor((Date.parse(next.deadline) - Date.parse(referenceDate)) / 86_400_000);
      if (days <= 3) { score += 40; reasons.push(`Avaliação em ${days} dia(s)`); }
      else if (days <= 7) { score += 25; reasons.push(`Avaliação em ${days} dias`); }
      else if (days <= 14) { score += 15; reasons.push(`Avaliação em ${days} dias`); }
      score += Math.round(next.weight * 10);
    }

    if (subject.currentGrade !== null && subject.currentGrade < 6) {
      score += 20;
      reasons.push(`Nota atual: ${subject.currentGrade.toFixed(1)}`);
    }

    const total = Math.floor((Date.parse(subject.endDate) - Date.parse(subject.beginDate)) / 86_400_000);
    const elapsed = Math.floor((Date.parse(referenceDate) - Date.parse(subject.beginDate)) / 86_400_000);
    const expectedProgress = total > 0 ? (elapsed / total) * 100 : 100;
    if (subject.progressPercent < expectedProgress - 20) {
      score += 15;
      reasons.push(`Progresso ${Math.round(subject.progressPercent)}% (esperado ~${Math.round(expectedProgress)}%)`);
    }

    return {
      subjectCode: subject.code, subjectName: subject.name,
      score: Math.min(100, score), reasons,
      nextDeadline: next?.deadline ?? null,
      currentGrade: subject.currentGrade,
      suggestedHoursPerWeek: score >= 70 ? 6 : score >= 50 ? 4 : score >= 30 ? 3 : 2,
    };
  }).sort((a, b) => b.score - a.score);
}

export function recommendMethods(profile: LearningProfile): StudyMethod[] {
  const methods: StudyMethod[] = [
    { type: "active_recall", name: "Recordação Ativa", description: "Feche o material e tente lembrar os pontos principais.", bestFor: ["reading", "kinesthetic"], estimatedEfficiency: 0 },
    { type: "spaced_repetition", name: "Repetição Espaçada", description: "Revise em intervalos crescentes (1d, 3d, 7d).", bestFor: ["visual", "reading"], estimatedEfficiency: 0 },
    { type: "mind_mapping", name: "Mapas Mentais", description: "Organize conceitos em diagrama visual.", bestFor: ["visual", "kinesthetic"], estimatedEfficiency: 0 },
    { type: "feynman_technique", name: "Técnica Feynman", description: "Explique como se ensinasse a alguém.", bestFor: ["auditory", "kinesthetic"], estimatedEfficiency: 0 },
    { type: "pomodoro", name: "Pomodoro", description: "25 min foco + 5 min pausa. A cada 4, pausa longa.", bestFor: ["reading", "visual", "auditory", "kinesthetic"], estimatedEfficiency: 0 },
    { type: "practice_testing", name: "Teste Prático", description: "Resolva questões antes de revisar material.", bestFor: ["kinesthetic", "reading"], estimatedEfficiency: 0 },
  ];

  const bonus: Record<string, Record<string, number>> = {
    active_recall: { reading: 0.3, kinesthetic: 0.2 },
    spaced_repetition: { visual: 0.2, reading: 0.3 },
    mind_mapping: { visual: 0.4, kinesthetic: 0.1 },
    feynman_technique: { auditory: 0.3, kinesthetic: 0.2 },
    pomodoro: { reading: 0.1, visual: 0.1, auditory: 0.1, kinesthetic: 0.1 },
    practice_testing: { kinesthetic: 0.3, reading: 0.2 },
  };

  return methods.map(m => ({
    ...m,
    estimatedEfficiency: Math.min(1, 0.5 + (bonus[m.type]?.[profile.primaryStyle] ?? 0)),
  })).sort((a, b) => b.estimatedEfficiency - a.estimatedEfficiency);
}

export function suggestContentFormats(profile: LearningProfile): ContentFormat[] {
  const byStyle: Record<string, ContentFormat[]> = {
    visual: ["infographic", "mind_map", "video"],
    auditory: ["podcast", "video", "case_study"],
    reading: ["text_summary", "flashcards", "case_study"],
    kinesthetic: ["interactive_quiz", "flashcards", "case_study"],
  };
  const declared = profile.challenges.preferredContentFormats;
  return [...new Set([...declared, ...(byStyle[profile.primaryStyle] ?? [])])].slice(0, 5);
}

export function buildAdaptiveContentPrompt(subjectName: string, lessonTitle: string, content: string, format: ContentFormat, profile: LearningProfile): string {
  const instructions: Record<string, string> = {
    video: "Crie roteiro para vídeo curto (3-5 min).",
    text_summary: "Crie resumo conciso (máx 500 palavras).",
    infographic: "Descreva infográfico com seções visuais.",
    podcast: "Crie roteiro de áudio (5 min) conversacional.",
    flashcards: "Gere 10 flashcards (pergunta/resposta).",
    mind_map: "Crie mapa mental em texto estruturado.",
    interactive_quiz: "Gere 5 questões múltipla escolha com feedback.",
    case_study: "Crie estudo de caso prático.",
  };

  return `Tutor acadêmico. Disciplina: ${subjectName}. Aula: ${lessonTitle}. Estilo: ${profile.primaryStyle}.\n${instructions[format] ?? "Gere conteúdo adaptativo."}\n\nConteúdo base:\n${content.slice(0, 3000)}`;
}
