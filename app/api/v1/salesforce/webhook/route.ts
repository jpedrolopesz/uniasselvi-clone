/**
 * Webhook Salesforce → AVA
 *
 * POST /api/v1/salesforce/webhook
 *
 * Recebe eventos do Salesforce (Outbound Messages / Platform Events):
 * - case_updated: coordenador atualizou intervenção
 * - case_closed: caso de retenção encerrado
 * - campaign_activated: campanha de retenção ativada
 * - student_contacted: aluno foi contactado
 *
 * Segurança: valida shared secret no header X-SF-Webhook-Secret
 */
import { NextRequest } from "next/server";
import { getDb } from "@/lib/db/client";
import { interventions } from "@/lib/db/schema/risk-score";
import { eq, and } from "drizzle-orm";

function json(data: unknown, status = 200) {
  return Response.json(data, { status });
}

function error(message: string, status = 400) {
  return json({ ok: false, error: { code: "INVALID_REQUEST", message } }, status);
}

interface WebhookPayload {
  event: string;
  caseId?: string;
  studentId?: string;
  status?: string;
  notes?: string;
  campaignId?: string;
  campaignName?: string;
  assignedTo?: string;
  timestamp?: string;
}

export async function POST(request: NextRequest) {
  // 1. Validar segredo do webhook
  const secret = request.headers.get("x-sf-webhook-secret");
  const expectedSecret = process.env.SALESFORCE_WEBHOOK_SECRET;

  if (expectedSecret && secret !== expectedSecret) {
    return error("Unauthorized", 401);
  }

  // 2. Parse do body
  let payload: WebhookPayload;
  try {
    payload = await request.json();
  } catch {
    return error("Body inválido — esperado JSON");
  }

  if (!payload.event) return error("Campo 'event' é obrigatório");

  const db = await getDb();

  // 3. Processar por tipo de evento
  switch (payload.event) {
    case "case_updated":
    case "student_contacted": {
      if (!payload.studentId) return error("studentId é obrigatório para este evento");

      // Atualiza intervenção existente ou cria nova
      const existingInterventions = await db
        .select()
        .from(interventions)
        .where(
          and(
            eq(interventions.studentId, payload.studentId),
            eq(interventions.salesforceCaseId, payload.caseId ?? "")
          )
        )
        .limit(1);

      if (existingInterventions.length > 0) {
        await db
          .update(interventions)
          .set({
            status: payload.status === "Closed" ? "completed" : "in_progress",
            notes: payload.notes ?? existingInterventions[0].notes,
            completedAt: payload.status === "Closed" ? new Date() : null,
          })
          .where(eq(interventions.id, existingInterventions[0].id));
      } else {
        await db.insert(interventions).values({
          studentId: payload.studentId,
          source: "salesforce",
          type: "call",
          status: "in_progress",
          description: `Coordenador entrou em contato via Salesforce Case ${payload.caseId}`,
          salesforceCaseId: payload.caseId ?? null,
          assignedTo: payload.assignedTo ?? null,
          notes: payload.notes ?? null,
        });
      }

      console.log(
        `[Webhook SF] ${payload.event}: studentId=${payload.studentId}, caseId=${payload.caseId}`
      );

      return json({
        ok: true,
        processed: payload.event,
        studentId: payload.studentId,
      });
    }

    case "case_closed": {
      if (!payload.caseId) return error("caseId é obrigatório para case_closed");

      await db
        .update(interventions)
        .set({
          status: "completed",
          completedAt: new Date(),
          notes: payload.notes ?? "Caso encerrado pelo Salesforce",
        })
        .where(eq(interventions.salesforceCaseId, payload.caseId));

      return json({ ok: true, processed: "case_closed", caseId: payload.caseId });
    }

    case "campaign_activated": {
      if (!payload.campaignId) return error("campaignId é obrigatório");

      // Registra que uma campanha foi ativada (para exibir no AVA)
      console.log(
        `[Webhook SF] Campaign activated: ${payload.campaignName} (${payload.campaignId})`
      );

      return json({
        ok: true,
        processed: "campaign_activated",
        campaignId: payload.campaignId,
        campaignName: payload.campaignName,
      });
    }

    default:
      return json({
        ok: true,
        processed: false,
        message: `Evento '${payload.event}' não tratado — ignorado`,
      });
  }
}
