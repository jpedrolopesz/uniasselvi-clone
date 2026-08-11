import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";
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

const LOG_PATH = path.join(process.cwd(), ".vitru", "interactions.local.log");

/**
 * Log dedicado, append-only, em JSON-lines — não console.error, não
 * execuções do n8n (spec §10). Grava o dado bruto por interação; métricas
 * derivadas (taxa de generation por aula, taxa de out_of_scope por
 * superfície etc.) não são calculadas nesta versão — ficam para trabalho
 * futuro sobre este log.
 */
export async function logInteraction(entry: InteractionLogEntry): Promise<void> {
  const line = `${JSON.stringify({ ...entry, at: new Date().toISOString() })}\n`;
  try {
    await mkdir(path.dirname(LOG_PATH), { recursive: true });
    await appendFile(LOG_PATH, line, "utf8");
  } catch (error) {
    console.error("Falha ao gravar o log de interação do Vitru", error);
  }
}
