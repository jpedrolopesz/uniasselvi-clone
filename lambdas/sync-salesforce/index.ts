/**
 * Lambda: sync-salesforce
 *
 * Triggered por EventBridge quando um aluno atinge risco alto/crítico.
 * Sincroniza o score de evasão com o Salesforce Education Cloud.
 *
 * Event pattern:
 * {
 *   "source": "vitru.risk-engine",
 *   "detail-type": "student.risk_score_changed",
 *   "detail": { "level": ["high", "critical"] }
 * }
 *
 * Ações no Salesforce:
 * 1. Upsert Contact (aluno) com dados atualizados
 * 2. Create Vitru_Risk_Score__c (registro de score)
 * 3. IF critical → Create Case para coordenador intervir
 * 4. IF high → Add to Campaign de retenção
 */

import {
  syncStudentRiskToSalesforce,
  addToCampaign,
  type RiskScorePayload,
} from "../../lib/salesforce/sync-student-risk";

interface EventBridgeEvent {
  source: string;
  "detail-type": string;
  detail: {
    studentId: string;
    score: number;
    level: "high" | "critical";
    previousScore: number | null;
    factors?: { name: string; weight: number; value: number; description: string }[];
  };
  time: string;
}

interface LambdaContext {
  functionName: string;
  awsRequestId: string;
}

export async function handler(event: EventBridgeEvent, context: LambdaContext) {
  console.log(`[${context.functionName}] Evento recebido:`, JSON.stringify(event));

  const { studentId, score, level, factors } = event.detail;

  if (!studentId || !score || !level) {
    console.error(`[${context.functionName}] Evento inválido — campos obrigatórios faltando`);
    return { statusCode: 400, body: "Invalid event" };
  }

  try {
    // 1. Busca dados completos do aluno (em produção: query Aurora)
    const studentData = await getStudentData(studentId);

    if (!studentData) {
      console.error(`[${context.functionName}] Aluno não encontrado: ${studentId}`);
      return { statusCode: 404, body: "Student not found" };
    }

    // 2. Monta payload para Salesforce
    const payload: RiskScorePayload = {
      studentId,
      studentName: studentData.fullName,
      email: studentData.email,
      courseCode: studentData.courseCode,
      courseName: studentData.courseName,
      riskScore: score,
      riskLevel: level,
      factors: factors ?? [
        {
          name: "Score calculado automaticamente",
          weight: 1,
          value: score,
          description: `Nível ${level} — ver detalhes no AVA`,
        },
      ],
      calculatedAt: event.time ?? new Date().toISOString(),
    };

    console.log(`[${context.functionName}] Sincronizando com Salesforce: ${studentData.fullName} (${level}, score=${score})`);

    // 3. Verifica se Salesforce está configurado
    if (!process.env.SALESFORCE_INSTANCE_URL) {
      console.warn(`[${context.functionName}] Salesforce não configurado — sync simulado`);
      return {
        statusCode: 200,
        body: JSON.stringify({
          ok: true,
          simulated: true,
          payload,
          message: "Salesforce não configurado. Em produção, este payload seria enviado.",
        }),
      };
    }

    // 4. Executa sincronização
    const result = await syncStudentRiskToSalesforce(payload);

    console.log(`[${context.functionName}] Salesforce sync OK:`, JSON.stringify(result));

    // 5. Se high (não critical), adiciona em campanha de retenção
    if (level === "high" && process.env.SALESFORCE_RETENTION_CAMPAIGN_ID) {
      try {
        await addToCampaign(
          result.contactId,
          process.env.SALESFORCE_RETENTION_CAMPAIGN_ID,
          "Sent"
        );
        console.log(`[${context.functionName}] Adicionado à campanha de retenção`);
      } catch (err) {
        // Não falha a Lambda por erro na campanha
        console.warn(`[${context.functionName}] Erro ao adicionar à campanha:`, err);
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        ok: true,
        salesforce: result,
        studentId,
        level,
      }),
    };
  } catch (err) {
    console.error(`[${context.functionName}] Erro na sincronização:`, err);

    // Não lança — DLQ captura via Lambda Destinations se necessário
    return {
      statusCode: 500,
      body: JSON.stringify({
        ok: false,
        error: err instanceof Error ? err.message : "Unknown error",
        studentId,
        level,
      }),
    };
  }
}

// --- Helpers (em produção: queries Aurora Data API) ---

interface StudentData {
  fullName: string;
  email: string;
  courseCode: string;
  courseName: string;
}

async function getStudentData(studentId: string): Promise<StudentData | null> {
  // Em produção: query Aurora via Data API
  // SELECT full_name, email, course_code, course_name
  // FROM academic.students WHERE id = $1

  // Simulação:
  return {
    fullName: `Aluno ${studentId}`,
    email: `aluno.${studentId}@email.com`,
    courseCode: "ADM",
    courseName: "Administração",
  };
}
