/**
 * API de Perfil Inteligente do Aluno
 *
 * GET    /api/v1/profile?studentId=xxx  — Retorna o perfil completo
 * POST   /api/v1/profile               — Cria perfil (onboarding)
 * PATCH  /api/v1/profile               — Atualiza parcialmente (por step)
 */
import { NextRequest } from "next/server";
import { getDb } from "@/lib/db/client";
import { learningProfiles } from "@/lib/db/schema/learning-profile";
import { eq } from "drizzle-orm";
import {
  calculateProfileCompleteness,
  determinePrimaryStyle,
} from "@/lib/profile/learning-profile";

function json(data: unknown, status = 200) {
  return Response.json(data, { status });
}

function error(message: string, status = 400) {
  return json({ ok: false, error: { code: "INVALID_REQUEST", message } }, status);
}

// --- GET: busca perfil do aluno ---
export async function GET(request: NextRequest) {
  const studentId = request.nextUrl.searchParams.get("studentId");
  if (!studentId) return error("studentId é obrigatório");

  const db = await getDb();
  const profile = await db
    .select()
    .from(learningProfiles)
    .where(eq(learningProfiles.studentId, studentId))
    .limit(1);

  if (profile.length === 0) {
    return json({ ok: true, profile: null, completeness: 0 });
  }

  const row = profile[0];
  return json({
    ok: true,
    profile: {
      studentId: row.studentId,
      varkScores: {
        visual: row.varkVisual,
        auditory: row.varkAuditory,
        reading: row.varkReading,
        kinesthetic: row.varkKinesthetic,
      },
      primaryStyle: row.primaryStyle,
      schedule: {
        worksFullTime: row.worksFullTime,
        workDays: row.workDays,
        workStartTime: row.workStartTime,
        workEndTime: row.workEndTime,
        preferredStudyTimes: row.preferredStudyTimes,
        sessionDurationMinutes: row.sessionDurationMinutes,
      },
      goals: {
        primaryMotivation: row.primaryMotivation,
        careerObjective: row.careerObjective,
        shortTermGoal: row.shortTermGoal,
        expectedGraduationYear: row.expectedGraduationYear,
      },
      challenges: {
        reportedDifficulties: row.reportedDifficulties,
        strongSubjects: row.strongSubjects,
        weakSubjects: row.weakSubjects,
        preferredContentFormats: row.preferredContentFormats,
      },
      interests: {
        categories: row.communityInterests,
        skills: row.skills,
        openToMentoring: row.openToMentoring,
        openToNetworking: row.openToNetworking,
      },
      completeness: row.completeness,
      createdAt: row.createdAt?.toISOString() ?? null,
      updatedAt: row.updatedAt?.toISOString() ?? null,
    },
  });
}

// --- POST: cria perfil inicial (onboarding completo de uma vez) ---
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { studentId } = body;

  if (!studentId) return error("studentId é obrigatório");

  const varkScores = body.varkScores ?? { visual: 0, auditory: 0, reading: 0, kinesthetic: 0 };
  const primaryStyle = determinePrimaryStyle(varkScores);

  const completeness = calculateProfileCompleteness({
    varkScores,
    schedule: body.schedule,
    goals: body.goals,
    challenges: body.challenges,
    interests: body.interests,
  });

  const db = await getDb();

  await db.insert(learningProfiles).values({
    studentId,
    varkVisual: varkScores.visual,
    varkAuditory: varkScores.auditory,
    varkReading: varkScores.reading,
    varkKinesthetic: varkScores.kinesthetic,
    primaryStyle,
    worksFullTime: body.schedule?.worksFullTime ?? null,
    workDays: body.schedule?.workDays ?? [],
    workStartTime: body.schedule?.workStartTime ?? null,
    workEndTime: body.schedule?.workEndTime ?? null,
    preferredStudyTimes: body.schedule?.preferredStudyTimes ?? [],
    sessionDurationMinutes: body.schedule?.sessionDurationMinutes ?? null,
    primaryMotivation: body.goals?.primaryMotivation ?? null,
    careerObjective: body.goals?.careerObjective ?? null,
    shortTermGoal: body.goals?.shortTermGoal ?? null,
    expectedGraduationYear: body.goals?.expectedGraduationYear ?? null,
    reportedDifficulties: body.challenges?.reportedDifficulties ?? [],
    strongSubjects: body.challenges?.strongSubjects ?? [],
    weakSubjects: body.challenges?.weakSubjects ?? [],
    preferredContentFormats: body.challenges?.preferredContentFormats ?? [],
    communityInterests: body.interests?.categories ?? [],
    skills: body.interests?.skills ?? [],
    openToMentoring: body.interests?.openToMentoring ?? false,
    openToNetworking: body.interests?.openToNetworking ?? false,
    completeness,
    onboardingCompletedAt: completeness >= 80 ? new Date() : null,
  }).onConflictDoUpdate({
    target: learningProfiles.studentId,
    set: {
      varkVisual: varkScores.visual,
      varkAuditory: varkScores.auditory,
      varkReading: varkScores.reading,
      varkKinesthetic: varkScores.kinesthetic,
      primaryStyle,
      completeness,
      updatedAt: new Date(),
    },
  });

  return json({ ok: true, completeness, primaryStyle }, 201);
}

// --- PATCH: atualiza parcialmente (por step de onboarding) ---
export async function PATCH(request: NextRequest) {
  const body = await request.json();
  const { studentId, step, data } = body;

  if (!studentId) return error("studentId é obrigatório");
  if (!step) return error("step é obrigatório (learning_style, routine, goals, challenges, community)");
  if (!data) return error("data é obrigatório");

  const db = await getDb();

  // Verifica se perfil existe, senão cria vazio
  const existing = await db
    .select()
    .from(learningProfiles)
    .where(eq(learningProfiles.studentId, studentId))
    .limit(1);

  if (existing.length === 0) {
    await db.insert(learningProfiles).values({ studentId });
  }

  // Atualiza os campos do step específico
  const updates: Record<string, unknown> = { updatedAt: new Date() };

  switch (step) {
    case "learning_style":
      updates.varkVisual = data.visual ?? 0;
      updates.varkAuditory = data.auditory ?? 0;
      updates.varkReading = data.reading ?? 0;
      updates.varkKinesthetic = data.kinesthetic ?? 0;
      updates.primaryStyle = determinePrimaryStyle({
        visual: data.visual ?? 0,
        auditory: data.auditory ?? 0,
        reading: data.reading ?? 0,
        kinesthetic: data.kinesthetic ?? 0,
      });
      break;

    case "routine":
      updates.worksFullTime = data.worksFullTime ?? null;
      updates.workDays = data.workDays ?? [];
      updates.workStartTime = data.workStartTime ?? null;
      updates.workEndTime = data.workEndTime ?? null;
      updates.preferredStudyTimes = data.preferredStudyTimes ?? [];
      updates.sessionDurationMinutes = data.sessionDurationMinutes ?? null;
      break;

    case "goals":
      updates.primaryMotivation = data.primaryMotivation ?? null;
      updates.careerObjective = data.careerObjective ?? null;
      updates.shortTermGoal = data.shortTermGoal ?? null;
      updates.expectedGraduationYear = data.expectedGraduationYear ?? null;
      break;

    case "challenges":
      updates.reportedDifficulties = data.reportedDifficulties ?? [];
      updates.strongSubjects = data.strongSubjects ?? [];
      updates.weakSubjects = data.weakSubjects ?? [];
      updates.preferredContentFormats = data.preferredContentFormats ?? [];
      break;

    case "community":
      updates.communityInterests = data.categories ?? [];
      updates.skills = data.skills ?? [];
      updates.openToMentoring = data.openToMentoring ?? false;
      updates.openToNetworking = data.openToNetworking ?? false;
      break;

    default:
      return error(`Step desconhecido: ${step}`);
  }

  await db
    .update(learningProfiles)
    .set(updates)
    .where(eq(learningProfiles.studentId, studentId));

  // Recalcula completeness
  const updated = await db
    .select()
    .from(learningProfiles)
    .where(eq(learningProfiles.studentId, studentId))
    .limit(1);

  if (updated.length > 0) {
    const row = updated[0];
    const completeness = calculateProfileCompleteness({
      varkScores: {
        visual: row.varkVisual,
        auditory: row.varkAuditory,
        reading: row.varkReading,
        kinesthetic: row.varkKinesthetic,
      },
      schedule: { preferredStudyTimes: row.preferredStudyTimes },
      goals: { primaryMotivation: row.primaryMotivation },
      challenges: { reportedDifficulties: row.reportedDifficulties },
      interests: { categories: row.communityInterests },
    });

    await db
      .update(learningProfiles)
      .set({
        completeness,
        onboardingCompletedAt: completeness >= 80 ? new Date() : null,
      })
      .where(eq(learningProfiles.studentId, studentId));

    return json({ ok: true, step, completeness });
  }

  return json({ ok: true, step });
}
