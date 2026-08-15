/**
 * Sincronização manual AVA → Salesforce
 *
 * POST /api/v1/salesforce/sync
 *
 * Força o envio do risk score de um aluno para o Salesforce.
 * Usado pelo coordenador ou pelo painel admin para sync imediato.
 */
import { NextRequest } from "next/server";
import { getDb } from "@/lib/db/client";
import { riskScores } from "@/lib/db/schema/risk-score";
import { students } from "@/lib/db/schema/academic";
import { eq, desc } from "drizzle-orm";
import { syncStudentRiskToSalesforce } from "@/lib/salesforce/sync-student-risk";

function json(data: unknown, status = 200) {
  return Response.json(data, { status });
}

function error(message: string, status = 400) {
  return json({ ok: false, error: { code: "INVALID_REQUEST", message } }, status);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { studentId } = body;

  if (!studentId) return error("studentId é obrigatório");

  const db = await getDb();

  // 1. Carrega dados do aluno
  const studentRows = await db
    .select()
    .from(students)
    .where(eq(students.id, studentId))
    .limit(1);

  if (studentRows.length === 0) {
    return error("Aluno não encontrado", 404);
  }

  const student = studentRows[0];

  // 2. Carrega risk score mais recente
  const scoreRows = await db
    .select()
    .from(riskScores)
    .where(eq(riskScores.studentId, studentId))
    .orderBy(desc(riskScores.calculatedAt))
    .limit(1);

  if (scoreRows.length === 0) {
    return error("Nenhum risk score calculado para este aluno. Calcule primeiro via POST /api/v1/risk-score.");
  }

  const score = scoreRows[0];

  // 3. Verifica se Salesforce está configurado
  if (!process.env.SALESFORCE_INSTANCE_URL || !process.env.SALESFORCE_CLIENT_ID) {
    return json({
      ok: false,
      error: {
        code: "SALESFORCE_NOT_CONFIGURED",
        message: "Variáveis de ambiente do Salesforce não configuradas. Sync simulado.",
      },
      simulated: true,
      payload: {
        studentId,
        studentName: student.fullName ?? student.displayLabel,
        email: student.email ?? "sem-email@placeholder.com",
        courseCode: student.courseCode ?? "N/A",
        courseName: student.courseName ?? "N/A",
        riskScore: score.score,
        riskLevel: score.level,
        factors: score.factors,
        calculatedAt: score.calculatedAt?.toISOString() ?? new Date().toISOString(),
      },
    }, 200);
  }

  // 4. Executa sync com Salesforce
  try {
    const result = await syncStudentRiskToSalesforce({
      studentId,
      studentName: student.fullName ?? student.displayLabel,
      email: student.email ?? "",
      courseCode: student.courseCode ?? "",
      courseName: student.courseName ?? "",
      riskScore: score.score,
      riskLevel: score.level as "low" | "medium" | "high" | "critical",
      factors: (score.factors ?? []).map((f) => ({
        name: f.name,
        weight: f.weight,
        value: f.value,
        description: f.description,
      })),
      calculatedAt: score.calculatedAt?.toISOString() ?? new Date().toISOString(),
    });

    // Marca como sincronizado
    await db
      .update(riskScores)
      .set({
        syncedToSalesforce: new Date(),
        salesforceCaseId: result.caseId ?? null,
      })
      .where(eq(riskScores.id, score.id));

    return json({
      ok: true,
      synced: true,
      salesforce: {
        contactId: result.contactId,
        riskScoreId: result.riskScoreId,
        caseId: result.caseId ?? null,
        caseCreated: !!result.caseId,
      },
    });
  } catch (err) {
    console.error("[Salesforce Sync] Erro:", err);
    return json({
      ok: false,
      error: {
        code: "SALESFORCE_SYNC_FAILED",
        message: err instanceof Error ? err.message : "Erro desconhecido",
      },
    }, 502);
  }
}
