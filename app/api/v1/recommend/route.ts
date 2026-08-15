/**
 * API de Recomendações de Estudo — estilo NotebookLM
 *
 * GET /api/v1/recommend?studentId=xxx
 *   Retorna:
 *   - Disciplinas priorizadas (urgência)
 *   - Métodos de estudo recomendados (baseado no VARK)
 *   - Formatos de conteúdo sugeridos
 *   - Conteúdo adaptativo gerado por IA (opcional, com ?generate=true)
 */
import { NextRequest } from "next/server";
import { getDb } from "@/lib/db/client";
import { learningProfiles } from "@/lib/db/schema/learning-profile";
import { eq } from "drizzle-orm";
import {
  prioritizeSubjects,
  recommendMethods,
  suggestContentFormats,
  buildAdaptiveContentPrompt,
} from "@/lib/recommender/study-recommender";
import type { LearningProfile } from "@/lib/profile/learning-profile";
import { generate } from "@/lib/vitru/generate";

function json(data: unknown, status = 200) {
  return Response.json(data, { status });
}

function error(message: string, status = 400) {
  return json({ ok: false, error: { code: "INVALID_REQUEST", message } }, status);
}

/**
 * Reconstrói um LearningProfile parcial a partir da row do banco.
 */
function rowToProfile(row: typeof learningProfiles.$inferSelect): LearningProfile {
  return {
    studentId: row.studentId,
    varkScores: {
      visual: row.varkVisual,
      auditory: row.varkAuditory,
      reading: row.varkReading,
      kinesthetic: row.varkKinesthetic,
    },
    primaryStyle: (row.primaryStyle as LearningProfile["primaryStyle"]) ?? "reading",
    schedule: {
      worksFullTime: row.worksFullTime ?? false,
      workDays: row.workDays ?? [],
      workStartTime: row.workStartTime,
      workEndTime: row.workEndTime,
      preferredStudyTimes: row.preferredStudyTimes ?? [],
      sessionDurationMinutes: row.sessionDurationMinutes ?? 45,
    },
    goals: {
      primaryMotivation: (row.primaryMotivation as LearningProfile["goals"]["primaryMotivation"]) ?? "personal_development",
      careerObjective: row.careerObjective,
      shortTermGoal: row.shortTermGoal,
      expectedGraduationYear: row.expectedGraduationYear,
    },
    challenges: {
      reportedDifficulties: (row.reportedDifficulties ?? []) as LearningProfile["challenges"]["reportedDifficulties"],
      strongSubjects: row.strongSubjects ?? [],
      weakSubjects: row.weakSubjects ?? [],
      preferredContentFormats: (row.preferredContentFormats ?? []) as LearningProfile["challenges"]["preferredContentFormats"],
    },
    interests: {
      categories: (row.communityInterests ?? []) as LearningProfile["interests"]["categories"],
      skills: row.skills ?? [],
      openToMentoring: row.openToMentoring,
      openToNetworking: row.openToNetworking,
    },
    completeness: row.completeness,
    createdAt: row.createdAt?.toISOString() ?? "",
    updatedAt: row.updatedAt?.toISOString() ?? "",
  };
}

export async function GET(request: NextRequest) {
  const studentId = request.nextUrl.searchParams.get("studentId");
  const shouldGenerate = request.nextUrl.searchParams.get("generate") === "true";

  if (!studentId) return error("studentId é obrigatório");

  const db = await getDb();

  // 1. Carrega perfil
  const profileRows = await db
    .select()
    .from(learningProfiles)
    .where(eq(learningProfiles.studentId, studentId))
    .limit(1);

  if (profileRows.length === 0) {
    return json({
      ok: true,
      hasProfile: false,
      message: "Complete o perfil primeiro para receber recomendações personalizadas.",
      prioritizedSubjects: [],
      suggestedMethods: [],
      contentFormats: [],
    });
  }

  const profile = rowToProfile(profileRows[0]);

  // 2. Carrega disciplinas do aluno (usa schema academic)
  // Aqui fazemos uma query simplificada — em produção, integraria com loadDisciplines
  const { datasets, students } = await import("@/lib/db/schema/academic");

  const studentRows = await db
    .select()
    .from(students)
    .where(eq(students.id, studentId))
    .limit(1);

  // Monta contexto de disciplinas para priorização
  // (mock simplificado — em produção, carrega dados reais do academic schema)
  const today = new Date().toISOString().slice(0, 10);

  const subjectContexts = [
    {
      code: "CALC1",
      name: "Cálculo I",
      beginDate: "2025-02-01",
      endDate: "2025-06-30",
      currentGrade: 5.2,
      assessmentsDue: [{ deadline: "2025-09-01", weight: 3 }],
      progressPercent: 45,
    },
    {
      code: "DIR101",
      name: "Introdução ao Direito",
      beginDate: "2025-02-01",
      endDate: "2025-06-30",
      currentGrade: 7.8,
      assessmentsDue: [{ deadline: "2025-09-15", weight: 2 }],
      progressPercent: 70,
    },
    {
      code: "ADM200",
      name: "Administração Estratégica",
      beginDate: "2025-02-01",
      endDate: "2025-06-30",
      currentGrade: null,
      assessmentsDue: [{ deadline: "2025-08-20", weight: 4 }],
      progressPercent: 30,
    },
  ];

  // 3. Calcula prioridades
  const prioritizedSubjects = prioritizeSubjects(subjectContexts, today);

  // 4. Recomenda métodos de estudo
  const suggestedMethods = recommendMethods(profile);

  // 5. Sugere formatos de conteúdo
  const contentFormats = suggestContentFormats(profile);

  // 6. Geração de conteúdo adaptativo (opcional, custa tokens)
  let adaptiveContent: { format: string; title: string; content: string } | null = null;

  if (shouldGenerate && prioritizedSubjects.length > 0) {
    const topSubject = prioritizedSubjects[0];
    const preferredFormat = contentFormats[0] ?? "text_summary";

    const prompt = buildAdaptiveContentPrompt(
      topSubject.subjectName,
      "Aula introdutória",
      `Conteúdo base da disciplina ${topSubject.subjectName}. Conceitos fundamentais e aplicações práticas.`,
      preferredFormat,
      profile
    );

    try {
      const result = await generate({
        system: prompt,
        userMessage: `Gere ${preferredFormat} sobre ${topSubject.subjectName} para um aluno ${profile.primaryStyle}.`,
        maxTokens: 1000,
      });

      adaptiveContent = {
        format: preferredFormat,
        title: `${topSubject.subjectName} — Conteúdo Adaptativo`,
        content: result.text,
      };
    } catch (err) {
      console.error("Erro ao gerar conteúdo adaptativo:", err);
      // Não falha a request inteira por causa da geração
    }
  }

  return json({
    ok: true,
    hasProfile: true,
    studentId,
    generatedAt: new Date().toISOString(),
    prioritizedSubjects,
    suggestedMethods: suggestedMethods.slice(0, 5), // Top 5 métodos
    contentFormats,
    adaptiveContent,
    tips: buildStudyTips(profile),
  });
}

/**
 * Gera dicas personalizadas baseadas no perfil.
 */
function buildStudyTips(profile: LearningProfile): string[] {
  const tips: string[] = [];

  if (profile.primaryStyle === "visual") {
    tips.push("Use cores diferentes para categorizar informações nos seus resumos.");
    tips.push("Assista vídeos com diagramas e animações para conceitos complexos.");
  } else if (profile.primaryStyle === "auditory") {
    tips.push("Grave áudios explicando a matéria para si mesmo e ouça depois.");
    tips.push("Participe de grupos de estudo onde possa discutir o conteúdo em voz alta.");
  } else if (profile.primaryStyle === "reading") {
    tips.push("Faça anotações manuscritas durante as aulas — a escrita fixa melhor.");
    tips.push("Reescreva conceitos com suas próprias palavras após cada aula.");
  } else if (profile.primaryStyle === "kinesthetic") {
    tips.push("Resolva exercícios práticos antes de ler a teoria — aprenda fazendo.");
    tips.push("Use a Técnica Feynman: explique o conceito como se ensinasse a alguém.");
  }

  if (profile.challenges.reportedDifficulties.includes("time_management")) {
    tips.push("Use a técnica Pomodoro (25min foco + 5min pausa) para manter a consistência.");
  }

  if (profile.challenges.reportedDifficulties.includes("isolation")) {
    tips.push("Explore o Hub de Comunidade — conectar-se com colegas reduz o isolamento.");
  }

  if (profile.schedule.sessionDurationMinutes && profile.schedule.sessionDurationMinutes <= 30) {
    tips.push("Sessões curtas funcionam! Priorize flashcards e recordação ativa nesses minutos.");
  }

  return tips;
}
