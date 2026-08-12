import { getDb } from "@/lib/db/client";
import * as s from "@/lib/db/schema";
import { findStudentBySlug } from "@/lib/data/db-helpers";
import type { Resolution, Surface } from "@/lib/vitru/surfaces";

export interface InteractionLogEntry {
  conversationId: string;
  userId: string;
  surface: Surface;
  objectId: string;
  lessonId: string | null;
  entryEventId: string | null;
  intent: string | null;
  confidence: number | null;
  resolution: Resolution;
  latencyMs: number;
  inputTokens: number | null;
  outputTokens: number | null;
  actionReturned: string | null;
  actionClicked: string | null;
}

/**
 * Grava uma linha por interação em vitru.interactions — substitui o
 * JSON-lines append-only anterior (spec §10: log dedicado, não
 * console.error, não execuções do n8n). Métricas derivadas (taxa de
 * generation por aula, taxa de out_of_scope por superfície etc.) não são
 * calculadas nesta versão — ficam para trabalho futuro sobre esta tabela.
 *
 * Igual ao comportamento anterior, uma falha aqui nunca deve derrubar a
 * resposta do chat — só registra o erro e segue.
 */
export async function logInteraction(entry: InteractionLogEntry): Promise<void> {
  try {
    const student = await findStudentBySlug(entry.userId);
    const db = await getDb();
    await db.insert(s.interactions).values({
      conversationId: entry.conversationId,
      studentId: student?.id ?? null,
      surface: entry.surface,
      objectId: entry.objectId,
      lessonId: entry.lessonId,
      entryEventId: entry.entryEventId,
      intent: entry.intent,
      confidence: entry.confidence,
      resolution: entry.resolution,
      latencyMs: entry.latencyMs,
      inputTokens: entry.inputTokens,
      outputTokens: entry.outputTokens,
      actionReturned: entry.actionReturned,
      actionClicked: entry.actionClicked,
    });
  } catch (error) {
    console.error("Falha ao gravar o log de interação do Vitru", error);
  }
}
