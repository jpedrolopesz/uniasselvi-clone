import { loadUserIndex } from "@/lib/data/load-user-index";
import { buildVitruStudentContext } from "@/lib/vitru/build-student-context";
import { POST as confirmStudyPlan } from "@/app/api/v1/vitru/study-plan/confirm/route";
import {
  clearPendingWhatsAppPlan,
  getPendingWhatsAppPlan,
  savePendingWhatsAppPlan,
} from "@/lib/vitru/whatsapp-pending-plan";
import type { AssistantSuggestion } from "@/lib/study-planner/ai-assistant";

interface ChatBody {
  channel?: unknown;
  agent?: unknown;
  userId?: unknown;
  conversationId?: unknown;
  message?: unknown;
}

interface VitruUpstreamResponse {
  ok?: boolean;
  data?: {
    replyText?: unknown;
    suggestions?: unknown[];
    confirmation?: unknown;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

function invalid(message: string) {
  return Response.json(
    { ok: false, error: { code: "INVALID_REQUEST", message } },
    { status: 400 }
  );
}

function normalizeIntent(text: string) {
  return text
    .toLocaleLowerCase("pt-BR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function formatSuggestionOffer(suggestion: AssistantSuggestion, position: number, total: number) {
  const [year, month, day] = suggestion.date.split("-");
  return `Encontrei esta opção para você: ${suggestion.title}, no dia ${day}/${month}/${year}, das ${suggestion.startTime} às ${suggestion.endTime}. Posso adicionar ao seu calendário? (${position} de ${total})`;
}

async function handlePendingWhatsAppIntent(
  userId: string,
  conversationId: string,
  message: string
) {
  const pending = await getPendingWhatsAppPlan(conversationId);
  if (!pending || pending.userId !== userId || pending.suggestions.length === 0) {
    return null;
  }

  const intent = normalizeIntent(message);
  const confirms = /^(sim|pode|confirmo|confirmar|ok|claro|adicione|adiciona|pode adicionar)[.! ]*$/.test(intent);
  const declines = /^(nao|cancelar|cancela|deixa|agora nao)[.! ]*$/.test(intent);
  const requestsAnother = /(outr[oa]|proxim[oa]|outro horario|nao consigo|trocar|mudar horario)/.test(intent);
  const requestedPeriod = intent.includes("manha")
    ? "morning"
    : intent.includes("tarde")
      ? "afternoon"
      : intent.includes("noite")
        ? "evening"
        : null;
  const requestedHour = Number(intent.match(/\b(\d{1,2})(?::\d{2})?\s*h\b/)?.[1]);

  if (declines) {
    await clearPendingWhatsAppPlan(conversationId);
    return "Tudo bem, não adicionei nada ao seu calendário. Quando quiser, posso procurar novos horários.";
  }

  if (requestsAnother || requestedPeriod || Number.isFinite(requestedHour)) {
    const candidates = pending.suggestions
      .map((suggestion, index) => ({ suggestion, index }))
      .filter(({ index }) => index !== pending.currentIndex);
    const matchesPreference = ({ suggestion }: (typeof candidates)[number]) => {
      const hour = Number(suggestion.startTime.split(":")[0]);
      if (Number.isFinite(requestedHour)) return Math.abs(hour - requestedHour) <= 1;
      if (requestedPeriod === "morning") return hour < 12;
      if (requestedPeriod === "afternoon") return hour >= 12 && hour < 18;
      if (requestedPeriod === "evening") return hour >= 18;
      return true;
    };
    const preferred = candidates.find(matchesPreference);
    if ((requestedPeriod || Number.isFinite(requestedHour)) && !preferred) {
      return "Não encontrei outra etapa disponível nesse período antes do prazo. Posso mostrar o próximo horário livre ou você pode indicar outro período.";
    }
    const nextIndex = preferred?.index ?? pending.currentIndex + 1;
    if (nextIndex >= pending.suggestions.length) {
      return "Essas eram as opções livres que encontrei antes do prazo. Se quiser, diga qual período prefere — manhã, tarde ou noite — para tentarmos ajustar o plano.";
    }
    await savePendingWhatsAppPlan(
      userId,
      conversationId,
      pending.suggestions,
      nextIndex
    );
    return formatSuggestionOffer(
      pending.suggestions[nextIndex],
      nextIndex + 1,
      pending.suggestions.length
    );
  }

  if (confirms) {
    const suggestion = pending.suggestions[pending.currentIndex];
    const confirmation = await confirmStudyPlan(
      new Request("http://localhost/api/v1/vitru/study-plan/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CREATE_STUDY_PLAN",
          userId,
          suggestionIds: [suggestion.id],
        }),
      })
    );
    if (!confirmation.ok) {
      await clearPendingWhatsAppPlan(conversationId);
      return "O plano mudou desde a última mensagem. Vou precisar consultar novamente antes de adicionar esse horário.";
    }
    await clearPendingWhatsAppPlan(conversationId);
    const [year, month, day] = suggestion.date.split("-");
    return `Pronto, adicionei “${suggestion.title}” ao seu calendário no dia ${day}/${month}/${year}, das ${suggestion.startTime} às ${suggestion.endTime}.`;
  }

  return null;
}

export async function POST(request: Request) {
  let body: ChatBody;
  try {
    body = (await request.json()) as ChatBody;
  } catch {
    return invalid("O corpo deve ser um JSON válido.");
  }

  if (body.channel !== "portal" && body.channel !== "whatsapp") {
    return invalid("channel deve ser portal ou whatsapp.");
  }
  if (body.agent !== "study_planner" && body.agent !== "universal") {
    return invalid("agent deve ser universal ou study_planner.");
  }
  if (typeof body.userId !== "string" || !body.userId.trim()) {
    return invalid("userId é obrigatório.");
  }
  if (
    typeof body.conversationId !== "string" ||
    !body.conversationId.trim() ||
    body.conversationId.length > 160
  ) {
    return invalid("conversationId é inválido.");
  }
  if (
    typeof body.message !== "string" ||
    !body.message.trim() ||
    body.message.length > 4000
  ) {
    return invalid("message deve conter entre 1 e 4000 caracteres.");
  }

  const userId = body.userId.trim();
  const conversationId = body.conversationId.trim();
  const message = body.message.trim();
  const index = await loadUserIndex();
  if (!index.users.some((user) => user.id === userId)) {
    return Response.json(
      {
        ok: false,
        error: { code: "STUDENT_NOT_FOUND", message: "Aluno não encontrado." },
      },
      { status: 404 }
    );
  }

  if (body.channel === "whatsapp") {
    const pendingReply = await handlePendingWhatsAppIntent(
      userId,
      conversationId,
      message
    );
    if (pendingReply) {
      return Response.json({
        ok: true,
        data: {
          conversationId,
          messageId: `msg-${Date.now()}`,
          agent: "study_planner",
          replyText: pendingReply,
          suggestions: [],
          confirmation: null,
        },
        meta: { channel: "whatsapp", handledLocally: true, version: "v1" },
      });
    }
  }

  const webhookUrl =
    process.env.N8N_VITRU_WEBHOOK_URL ??
    "http://127.0.0.1:5679/webhook/vitru/v1/chat";

  try {
    const upstream = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        channel: body.channel,
        agent: body.agent,
        userId,
        conversationId,
        message,
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(45_000),
    });
    const responseBody = (await upstream.json()) as VitruUpstreamResponse;

    if (
      upstream.ok &&
      responseBody.ok === true &&
      responseBody.data &&
      body.agent === "study_planner"
    ) {
      const context = await buildVitruStudentContext(userId);
      const suggestedPlan = context.suggestedPlan;

      if (suggestedPlan) {
        if (suggestedPlan.suggestions.length > 0) {
          if (body.channel === "whatsapp") {
            await savePendingWhatsAppPlan(
              userId,
              conversationId,
              suggestedPlan.suggestions
            );
            responseBody.data.replyText = formatSuggestionOffer(
              suggestedPlan.suggestions[0],
              1,
              suggestedPlan.suggestions.length
            );
            responseBody.data.suggestions = [];
            responseBody.data.confirmation = null;
          } else {
            responseBody.data.replyText = suggestedPlan.replyText;
          }
        }
        if (body.channel === "portal") {
          responseBody.data.suggestions = suggestedPlan.suggestions;
          responseBody.data.confirmation =
            suggestedPlan.suggestions.length > 0
              ? {
                  required: true,
                  action: "CREATE_STUDY_PLAN",
                  message:
                    "Confirme individualmente os horários que deseja adicionar ao calendário.",
                }
              : null;
        }
      }
    }

    return Response.json(responseBody, {
      status: upstream.status,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("Falha na comunicação com o n8n", error);
    return Response.json(
      {
        ok: false,
        error: {
          code: "AUTOMATION_UNAVAILABLE",
          message: "O Vitru está temporariamente indisponível.",
        },
      },
      { status: 503 }
    );
  }
}
