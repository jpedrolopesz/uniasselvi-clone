/**
 * API de Risk Score (Risco de Evasão)
 *
 * GET  /api/v1/risk-score?studentId=xxx  — Retorna score atual e histórico
 * POST /api/v1/risk-score                — Recalcula score de um aluno
 */
import { NextRequest } from "next/server";
import { getDb } from "@/lib/db/client";
import { riskScores, engagementSnapshots } from "@/lib/db/schema/risk-score";
import { eq, desc } from "drizzle-orm";
import { calculateRiskScore, type StudentEngagementData } from "@/lib/risk-score/calculate";

function json(data: unknown, status = 200) {
  return Response.json(data, { status });
}

function error(message: string, status = 400) {
  return json({ ok: false, error: { code: "INVALID_REQUEST", message } }, status);
}

// --- GET: retorna score atual + histórico ---
export async function GET(request: NextRequest) {
  const studentId = request.nextUrl.searchParams.get("studentId");
  if (!studentId) return error("studentId é obrigatório");

  const db = await getDb();

  // Score mais recente
  const latestScores = await db
    .select()
    .from(riskScores)
    .where(eq(riskScores.studentId, studentId))
    .orderBy(desc(riskScores.calculatedAt))
    .limit(1);

  // Histórico dos últimos 30 dias (para gráfico de tendência)
  const history = await db
    .select()
    .from(riskScores)
    .where(eq(riskScores.studentId, studentId))
    .orderBy(desc(riskScores.calculatedAt))
    .limit(30);

  if (latestScores.length === 0) {
    return json({
      ok: true,
      hasScore: false,
      message: "Score ainda não calculado. Será processado no próximo ciclo.",
      currentScore: null,
      history: [],
    });
  }

  const current = latestScores[0];

  return json({
    ok: true,
    hasScore: true,
    currentScore: {
      score: current.score,
      level: current.level,
      factors: current.factors,
      calculatedAt: current.calculatedAt?.toISOString(),
      syncedToSalesforce: current.syncedToSalesforce?.toISOString() ?? null,
    },
    history: history.map((h) => ({
      score: h.score,
      level: h.level,
      calculatedAt: h.calculatedAt?.toISOString(),
    })),
    trend: calculateTrend(history.map((h) => h.score)),
  });
}

// --- POST: recalcula score de um aluno ---
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { studentId, engagementData } = body;

  if (!studentId) return error("studentId é obrigatório");

  const db = await getDb();

  // Se dados de engajamento foram passados diretamente, usa eles.
  // Senão, busca o snapshot mais recente.
  let data: StudentEngagementData;

  if (engagementData) {
    data = engagementData;
  } else {
    // Busca snapshot mais recente
    const snapshots = await db
      .select()
      .from(engagementSnapshots)
      .where(eq(engagementSnapshots.studentId, studentId))
      .orderBy(desc(engagementSnapshots.createdAt))
      .limit(1);

    if (snapshots.length === 0) {
      // Sem dados de engajamento — usa valores padrão (aluno novo)
      data = {
        daysSinceLastAccess: 0,
        accessesLast14Days: 5,
        averageGrade: null,
        onTimeSubmissionRate: 1,
        vitruInteractionsLast30Days: 0,
        communityParticipations: 0,
        learningPathProgress: 0,
        hasFinancialPending: false,
        daysSinceEnrollment: 30,
        activeDisciplines: 4,
        disciplinesBelowAverage: 0,
      };
    } else {
      const snap = snapshots[0];
      data = {
        daysSinceLastAccess: snap.daysSinceLastAccess,
        accessesLast14Days: snap.accessesLast14Days,
        averageGrade: snap.averageGrade,
        onTimeSubmissionRate: snap.onTimeSubmissionRate,
        vitruInteractionsLast30Days: snap.vitruInteractionsLast30Days,
        communityParticipations: snap.communityParticipations,
        learningPathProgress: snap.learningPathProgress,
        hasFinancialPending: snap.hasFinancialPending === 1,
        daysSinceEnrollment: 90, // default
        activeDisciplines: 4,
        disciplinesBelowAverage: 0,
      };
    }
  }

  // Calcula
  const result = calculateRiskScore(data);

  // Persiste
  await db.insert(riskScores).values({
    studentId,
    score: result.score,
    level: result.level,
    factors: result.factors,
  });

  // Salva snapshot de engajamento
  await db.insert(engagementSnapshots).values({
    studentId,
    daysSinceLastAccess: data.daysSinceLastAccess,
    accessesLast14Days: data.accessesLast14Days,
    averageGrade: data.averageGrade,
    onTimeSubmissionRate: data.onTimeSubmissionRate,
    vitruInteractionsLast30Days: data.vitruInteractionsLast30Days,
    communityParticipations: data.communityParticipations,
    learningPathProgress: data.learningPathProgress,
    hasFinancialPending: data.hasFinancialPending ? 1 : 0,
    snapshotDate: new Date().toISOString().slice(0, 10),
  });

  return json({
    ok: true,
    score: result.score,
    level: result.level,
    factors: result.factors,
    calculatedAt: new Date().toISOString(),
    shouldSyncSalesforce: result.level === "high" || result.level === "critical",
  }, 201);
}

/**
 * Calcula tendência do score: subindo, descendo ou estável.
 */
function calculateTrend(scores: number[]): "improving" | "worsening" | "stable" {
  if (scores.length < 2) return "stable";

  const recent = scores.slice(0, 5); // 5 mais recentes
  const older = scores.slice(5, 10); // 5 anteriores

  if (older.length === 0) return "stable";

  const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
  const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;

  const diff = recentAvg - olderAvg;
  if (diff > 5) return "worsening"; // Score subindo = piorando (mais risco)
  if (diff < -5) return "improving"; // Score descendo = melhorando
  return "stable";
}
