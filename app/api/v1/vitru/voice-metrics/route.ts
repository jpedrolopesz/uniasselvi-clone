import { NextResponse } from "next/server";
import { logInteraction } from "@/lib/vitru/interaction-log";

export async function POST(request: Request) {
  const body = await request.json() as { userId?: string; metrics?: Record<string, number | boolean | string | null> };
  if (!body.userId || !body.metrics) return NextResponse.json({ error: "invalid metrics" }, { status: 400 });
  await logInteraction({ conversationId: crypto.randomUUID(), userId: body.userId, surface: "portal", objectId: "voice", lessonId: null, entryEventId: null, intent: null, confidence: null, resolution: "generation", latencyMs: 0, inputTokens: typeof body.metrics.prompt_tokens === "number" ? body.metrics.prompt_tokens : null, outputTokens: typeof body.metrics.output_tokens === "number" ? body.metrics.output_tokens : null, actionReturned: null, actionClicked: null, voiceMetrics: body.metrics });
  return NextResponse.json({ ok: true });
}
