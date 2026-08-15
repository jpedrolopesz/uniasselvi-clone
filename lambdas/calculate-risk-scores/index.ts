/**
 * Lambda: calculate-risk-scores
 *
 * Executada diariamente pelo EventBridge Scheduler (02:00 UTC).
 * Calcula o risk score de evasão de todos os alunos ativos.
 *
 * Fluxo:
 * 1. Busca todos os alunos ativos no Aurora
 * 2. Para cada aluno, coleta métricas de engajamento
 * 3. Calcula risk score
 * 4. Persiste resultado
 * 5. Emite evento para alunos com risco alto/crítico
 *
 * Em produção: conecta ao Aurora via Data API e emite para EventBridge.
 * Neste arquivo: lógica completa simulável localmente.
 */

import { calculateRiskScore, type StudentEngagementData } from "../../lib/risk-score/calculate";

// Tipos para o contexto Lambda
interface LambdaEvent {
  source: string;
  "detail-type": string;
  detail?: { targetStudentId?: string };
}

interface LambdaContext {
  functionName: string;
  awsRequestId: string;
}

interface RiskResult {
  studentId: string;
  score: number;
  level: string;
  previousScore: number | null;
  changed: boolean;
}

/**
 * Handler principal da Lambda.
 */
export async function handler(event: LambdaEvent, context: LambdaContext) {
  console.log(`[${context.functionName}] Início do cálculo de risk scores`);
  console.log(`[${context.functionName}] Event:`, JSON.stringify(event));

  const startTime = Date.now();
  const results: RiskResult[] = [];
  const errors: { studentId: string; error: string }[] = [];

  try {
    // Em produção: query Aurora Data API para listar alunos ativos
    // const students = await queryAurora("SELECT id FROM academic.students WHERE status = 'active'");
    
    // Simulação com dados de teste
    const students = await getActiveStudents();

    console.log(`[${context.functionName}] Processando ${students.length} alunos`);

    for (const student of students) {
      try {
        // Coleta métricas de engajamento do aluno
        const engagementData = await collectEngagementData(student.id);

        // Calcula score
        const result = calculateRiskScore(engagementData);

        // Busca score anterior (para detectar mudança)
        const previousScore = await getPreviousScore(student.id);

        // Persiste
        await saveRiskScore(student.id, result);

        const changed = previousScore === null || Math.abs(result.score - previousScore) >= 5;

        results.push({
          studentId: student.id,
          score: result.score,
          level: result.level,
          previousScore,
          changed,
        });

        // Se risco alto/crítico E mudou significativamente → emite evento
        if (changed && (result.level === "high" || result.level === "critical")) {
          await emitRiskEvent(student.id, result.score, result.level, previousScore);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        errors.push({ studentId: student.id, error: message });
        console.error(`[${context.functionName}] Erro para ${student.id}:`, message);
      }
    }

    const elapsed = Date.now() - startTime;
    const summary = {
      processedStudents: results.length,
      errors: errors.length,
      highRisk: results.filter((r) => r.level === "high").length,
      criticalRisk: results.filter((r) => r.level === "critical").length,
      changed: results.filter((r) => r.changed).length,
      elapsedMs: elapsed,
    };

    console.log(`[${context.functionName}] Concluído:`, JSON.stringify(summary));

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true, summary, errors }),
    };
  } catch (err) {
    console.error(`[${context.functionName}] Erro fatal:`, err);
    return {
      statusCode: 500,
      body: JSON.stringify({
        ok: false,
        error: err instanceof Error ? err.message : "Internal error",
      }),
    };
  }
}

// --- Funções auxiliares (em produção: queries reais ao Aurora) ---

async function getActiveStudents(): Promise<{ id: string }[]> {
  // Em produção: SELECT id FROM academic.students WHERE status_description != 'Cancelado'
  // Simulação:
  return [
    { id: "student-001" },
    { id: "student-002" },
    { id: "student-003" },
  ];
}

async function collectEngagementData(studentId: string): Promise<StudentEngagementData> {
  // Em produção: queries agregadas ao Aurora
  // Simulação com dados variados para demonstrar:
  const seed = studentId.charCodeAt(studentId.length - 1);
  return {
    daysSinceLastAccess: seed % 15,
    accessesLast14Days: 14 - (seed % 12),
    averageGrade: 4 + (seed % 6),
    onTimeSubmissionRate: 0.3 + (seed % 7) * 0.1,
    vitruInteractionsLast30Days: seed % 20,
    communityParticipations: seed % 4,
    learningPathProgress: 0.2 + (seed % 6) * 0.1,
    hasFinancialPending: seed % 3 === 0,
    daysSinceEnrollment: 60 + seed,
    activeDisciplines: 3 + (seed % 3),
    disciplinesBelowAverage: seed % 3,
  };
}

async function getPreviousScore(studentId: string): Promise<number | null> {
  // Em produção: SELECT score FROM vitru.risk_scores WHERE student_id = $1 ORDER BY calculated_at DESC LIMIT 1
  return null; // Primeira execução
}

async function saveRiskScore(
  studentId: string,
  result: { score: number; level: string; factors: unknown[] }
): Promise<void> {
  // Em produção: INSERT INTO vitru.risk_scores (student_id, score, level, factors)
  console.log(`  → [Save] ${studentId}: score=${result.score}, level=${result.level}`);
}

async function emitRiskEvent(
  studentId: string,
  score: number,
  level: string,
  previousScore: number | null
): Promise<void> {
  // Em produção: EventBridge putEvents
  // {
  //   Source: "vitru.risk-engine",
  //   DetailType: "student.risk_score_changed",
  //   Detail: JSON.stringify({ studentId, score, level, previousScore })
  // }
  console.log(`  → [Event] student.risk_score_changed: ${studentId} → ${level} (${score})`);
}
