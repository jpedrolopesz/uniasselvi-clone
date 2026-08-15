/**
 * API do Hub de Comunidade
 *
 * GET  /api/v1/community?studentId=xxx              — Lista grupos recomendados
 * GET  /api/v1/community?action=groups              — Lista todos os grupos ativos
 * GET  /api/v1/community?action=my&studentId=xxx    — Grupos do aluno
 * POST /api/v1/community                            — Entrar/sair de grupo
 */
import { NextRequest } from "next/server";
import { getDb } from "@/lib/db/client";
import { communityGroups, communityMemberships } from "@/lib/db/schema/community";
import { learningProfiles } from "@/lib/db/schema/learning-profile";
import { eq, and, desc } from "drizzle-orm";
import { recommendGroups } from "@/lib/community/community-hub";
import type { CommunityGroup, LearningProfile } from "@/lib/profile/learning-profile";

function json(data: unknown, status = 200) {
  return Response.json(data, { status });
}

function error(message: string, status = 400) {
  return json({ ok: false, error: { code: "INVALID_REQUEST", message } }, status);
}

export async function GET(request: NextRequest) {
  const studentId = request.nextUrl.searchParams.get("studentId");
  const action = request.nextUrl.searchParams.get("action");

  const db = await getDb();

  // Lista todos os grupos ativos
  if (action === "groups") {
    const groups = await db
      .select()
      .from(communityGroups)
      .where(eq(communityGroups.isActive, true))
      .orderBy(desc(communityGroups.memberCount));

    return json({ ok: true, groups });
  }

  // Grupos em que o aluno participa
  if (action === "my") {
    if (!studentId) return error("studentId é obrigatório para action=my");

    const memberships = await db
      .select({
        membership: communityMemberships,
        group: communityGroups,
      })
      .from(communityMemberships)
      .innerJoin(communityGroups, eq(communityMemberships.groupId, communityGroups.id))
      .where(
        and(
          eq(communityMemberships.studentId, studentId),
          eq(communityMemberships.isActive, true)
        )
      );

    return json({
      ok: true,
      memberships: memberships.map((m) => ({
        group: m.group,
        role: m.membership.role,
        joinedAt: m.membership.joinedAt,
      })),
    });
  }

  // Recomendações personalizadas (default)
  if (!studentId) return error("studentId é obrigatório");

  // Carrega perfil
  const profileRows = await db
    .select()
    .from(learningProfiles)
    .where(eq(learningProfiles.studentId, studentId))
    .limit(1);

  if (profileRows.length === 0) {
    // Sem perfil, retorna todos os grupos ativos
    const allGroups = await db
      .select()
      .from(communityGroups)
      .where(eq(communityGroups.isActive, true));

    return json({
      ok: true,
      hasProfile: false,
      message: "Complete seu perfil para receber recomendações personalizadas.",
      groups: allGroups,
      recommendations: [],
    });
  }

  const row = profileRows[0];

  // Monta perfil para o matcher
  const profile: LearningProfile = {
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
      primaryMotivation: (row.primaryMotivation ?? "personal_development") as LearningProfile["goals"]["primaryMotivation"],
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

  // Carrega grupos
  const allGroups = await db
    .select()
    .from(communityGroups)
    .where(eq(communityGroups.isActive, true));

  // Converte para o tipo esperado pelo matcher
  const groupsForMatcher: CommunityGroup[] = allGroups.map((g) => ({
    id: g.id,
    name: g.name,
    category: g.category as CommunityGroup["category"],
    description: g.description,
    institution: g.institution as CommunityGroup["institution"],
    courseAffinity: g.courseAffinity ?? [],
    memberCount: g.memberCount,
    maxMembers: g.maxMembers,
    meetingSchedule: g.meetingSchedule as CommunityGroup["meetingSchedule"],
    skills: g.skills ?? [],
    isActive: g.isActive,
    createdAt: g.createdAt?.toISOString() ?? "",
    imageUrl: g.imageUrl,
    contactEmail: g.contactEmail ?? "",
    socialLinks: g.socialLinks ?? [],
  }));

  // Calcula recomendações
  const recommendations = recommendGroups(profile, groupsForMatcher, "");

  return json({
    ok: true,
    hasProfile: true,
    recommendations,
    totalGroups: allGroups.length,
  });
}

// --- POST: Entrar ou sair de um grupo ---
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { studentId, groupId, action } = body;

  if (!studentId) return error("studentId é obrigatório");
  if (!groupId) return error("groupId é obrigatório");
  if (!action || !["join", "leave"].includes(action)) {
    return error("action deve ser 'join' ou 'leave'");
  }

  const db = await getDb();

  if (action === "join") {
    // Verifica se grupo existe e tem vagas
    const group = await db
      .select()
      .from(communityGroups)
      .where(eq(communityGroups.id, groupId))
      .limit(1);

    if (group.length === 0) return error("Grupo não encontrado", 404);

    const g = group[0];
    if (!g.isActive) return error("Grupo não está ativo");
    if (g.maxMembers && g.memberCount >= g.maxMembers) {
      return error("Grupo lotado — sem vagas disponíveis");
    }

    // Cria membership
    await db.insert(communityMemberships).values({
      studentId,
      groupId,
      role: "member",
    }).onConflictDoUpdate({
      target: [communityMemberships.studentId, communityMemberships.groupId],
      set: { isActive: true, joinedAt: new Date() },
    });

    // Incrementa contador
    await db
      .update(communityGroups)
      .set({ memberCount: g.memberCount + 1 })
      .where(eq(communityGroups.id, groupId));

    return json({ ok: true, action: "joined", groupId, groupName: g.name }, 201);
  }

  // Leave
  await db
    .update(communityMemberships)
    .set({ isActive: false })
    .where(
      and(
        eq(communityMemberships.studentId, studentId),
        eq(communityMemberships.groupId, groupId)
      )
    );

  // Decrementa contador
  const group = await db
    .select()
    .from(communityGroups)
    .where(eq(communityGroups.id, groupId))
    .limit(1);

  if (group.length > 0 && group[0].memberCount > 0) {
    await db
      .update(communityGroups)
      .set({ memberCount: group[0].memberCount - 1 })
      .where(eq(communityGroups.id, groupId));
  }

  return json({ ok: true, action: "left", groupId });
}
