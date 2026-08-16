import { resolveActiveUserId } from "@/lib/data/resolve-active-user";
import {
  appendMessage,
  resolveConversationId,
  getRecentHistory,
} from "@/lib/vitru/conversation-store";
import type { VoiceSurface } from "@/lib/vitru/voice-session-contract";
import { buildVitruStudentContext } from "@/lib/vitru/build-student-context";
import { getStudentProfile } from "@/lib/vitru/memory/student-profile";
import { getSurfaceVisit } from "@/lib/vitru/memory/surface-visits";
import { resolveDisclosure } from "@/lib/vitru/disclosure";
import { generate } from "@/lib/vitru/generate";
import { buildCalendarSystemPrompt, buildPortalSystemPrompt } from "@/lib/vitru/prompts";
import { logInteraction } from "@/lib/vitru/interaction-log";

interface VoiceMessageBody {
  surface?: unknown;
  objectId?: unknown;
  role?: unknown;
  text?: unknown;
  generateResponse?: unknown; // Nova flag para indicar se deve gerar resposta
}

export async function POST(request: Request) {
  let body: VoiceMessageBody;
  try {
    body = (await request.json()) as VoiceMessageBody;
  } catch {
    return Response.json({ ok: false, error: { code: "INVALID_REQUEST" } }, { status: 400 });
  }

  if (body.surface !== "portal" && body.surface !== "calendario") {
    return Response.json({ ok: false, error: { code: "INVALID_SURFACE" } }, { status: 400 });
  }
  if (typeof body.objectId !== "string" || !body.objectId.trim() || body.objectId.length > 200) {
    return Response.json({ ok: false, error: { code: "INVALID_OBJECT" } }, { status: 400 });
  }
  if (body.role !== "user" && body.role !== "assistant") {
    return Response.json({ ok: false, error: { code: "INVALID_ROLE" } }, { status: 400 });
  }
  if (typeof body.text !== "string" || !body.text.trim() || body.text.length > 4_000) {
    return Response.json({ ok: false, error: { code: "INVALID_TEXT" } }, { status: 400 });
  }

  const userId = await resolveActiveUserId(undefined);
  const startedAt = Date.now();

  // Re-resolver pela identidade ativa impede anexar mensagens a uma conversa
  // de outro aluno usando um conversationId fabricado no cliente.
  const conversationId = await resolveConversationId(
    userId,
    body.surface as VoiceSurface,
    body.objectId.trim(),
  );

  const messageText = body.text.trim();
  const surface = body.surface as VoiceSurface;

  // Se for mensagem do usuário e generateResponse for true, gera resposta automática
  if (body.role === "user" && body.generateResponse === true) {
    // Adiciona mensagem do usuário
    await appendMessage(conversationId, { role: "user", text: messageText });

    // Mapeia VoiceSurface para Surface quando necessário
    // "portal" → "trilha" (para compatibilidade com getSurfaceVisit)
    const mappedSurface: "trilha" | "calendario" = surface === "portal" ? "trilha" : "calendario";

    // Busca histórico e contexto para gerar resposta
    const history = await getRecentHistory(conversationId);
    const [context, profile, visit] = await Promise.all([
      buildVitruStudentContext(userId),
      getStudentProfile(userId),
      getSurfaceVisit(userId, mappedSurface),
    ]);

    try {
      const disclosure = resolveDisclosure(visit?.visitCount ?? 1);

      // Escolhe o prompt baseado na superfície
      const systemPrompt = surface === "calendario"
        ? buildCalendarSystemPrompt(context, profile, disclosure)
        : buildPortalSystemPrompt(context, profile, disclosure);

      // Gera resposta usando o modelo de IA
      const generated = await generate({
        system: systemPrompt,
        userMessage: messageText,
        history: history.slice(0, -1), // Remove a última mensagem que acabamos de adicionar
        maxTokens: 1_200,
      });

      const assistantReply = generated.text;

      // Adiciona resposta do assistente
      await appendMessage(conversationId, { role: "assistant", text: assistantReply });

      // Log da interação
      await logInteraction({
        conversationId,
        userId,
        surface,
        objectId: body.objectId.trim(),
        lessonId: null,
        entryEventId: null,
        intent: null,
        confidence: 1,
        resolution: "generation",
        latencyMs: Date.now() - startedAt,
        inputTokens: generated.inputTokens,
        outputTokens: generated.outputTokens,
        actionReturned: null,
        actionClicked: null,
      });

      return Response.json({
        ok: true,
        reply: assistantReply,
        conversationId,
        inputTokens: generated.inputTokens,
        outputTokens: generated.outputTokens,
      }, { headers: { "Cache-Control": "no-store" } });

    } catch (error) {
      console.error("Falha ao gerar resposta via IA", error);
      return Response.json(
        { ok: false, error: { code: "GENERATION_FAILED", message: "Falha ao gerar resposta" } },
        { status: 500 }
      );
    }
  }

  // Comportamento original: apenas adiciona a mensagem sem gerar resposta
  await appendMessage(conversationId, { role: body.role, text: messageText });
  return Response.json({ ok: true, conversationId }, { headers: { "Cache-Control": "no-store" } });
}
