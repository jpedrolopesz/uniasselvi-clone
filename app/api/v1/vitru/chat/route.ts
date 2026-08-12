import { loadUserIndex } from "@/lib/data/load-user-index";
import { resolveActiveUserId } from "@/lib/data/resolve-active-user";
import { loadSubjectLearningPath } from "@/lib/data/load-subject-data";
import { buildVitruStudentContext } from "@/lib/vitru/build-student-context";
import type { AssistantAction, Resolution, Surface, SurfaceFocus } from "@/lib/vitru/surfaces";
import { resolveLocally } from "@/lib/vitru/trilha-resolution";
import {
  appendMessage,
  getRecentHistory,
  resolveConversationId,
  type ConversationMessage,
} from "@/lib/vitru/conversation-store";
import { consumeInboxEvent } from "@/lib/vitru/inbox-events";
import { logInteraction } from "@/lib/vitru/interaction-log";
import { getSurfaceVisit, recordSurfaceVisit } from "@/lib/vitru/memory/surface-visits";
import { getStudentProfile } from "@/lib/vitru/memory/student-profile";
import { resolveDisclosure } from "@/lib/vitru/disclosure";
import { generate } from "@/lib/vitru/generate";
import { buildCalendarSystemPrompt } from "@/lib/vitru/prompts";

function invalid(message: string) {
  return Response.json(
    { ok: false, error: { code: "INVALID_REQUEST", message } },
    { status: 400 }
  );
}

// --- Contrato por superfície (spec Vitru — AssistantPanel multi-superfície) ---

interface SurfaceChatBody {
  surface?: unknown;
  objectId?: unknown;
  focus?: unknown;
  entryEventId?: unknown;
  message?: unknown;
}

const VALID_SURFACES: Surface[] = ["trilha", "calendario"];

const DEFAULT_GREETING: Record<Surface, string> = {
  trilha: "Oi! Sou o Vitru. Pergunte algo sobre o conteúdo desta aula ou peça para rever uma aula anterior.",
  calendario:
    "Oi! Eu sou o Vitru · Calendário. Posso analisar suas avaliações abertas, seus prazos e sua rotina para sugerir um plano. Nada será adicionado sem sua confirmação.",
};

function isSurfaceFocus(value: unknown): value is SurfaceFocus {
  if (!value || typeof value !== "object") return false;
  const kind = (value as Record<string, unknown>).kind;
  return kind === "trilha" || kind === "calendario";
}

interface SurfaceResolutionResult {
  reply: string;
  resolution: Resolution;
  confidence: number;
  actions: AssistantAction[];
  inputTokens?: number | null;
  outputTokens?: number | null;
}

type SurfaceResolutionOutcome = SurfaceResolutionResult | { unavailable: true };

/** FAQ da aula → conteúdo da trilha → fora de escopo → geração, nesta ordem, com parada no primeiro acerto (spec §7). */
async function resolveTrilhaMessage(
  userId: string,
  subjectCode: string,
  focus: SurfaceFocus | undefined,
  message: string
): Promise<SurfaceResolutionOutcome> {
  if (!focus || focus.kind !== "trilha") {
    return {
      reply: "Preciso saber em qual lição você está para ajudar. Abra uma aula da trilha e tente de novo.",
      resolution: "low_confidence",
      confidence: 0,
      actions: [],
    };
  }

  const learningPath = await loadSubjectLearningPath(userId, subjectCode);
  const lessons = learningPath ? learningPath.sections.flatMap((section) => section.lessons) : [];
  const currentIndex = lessons.findIndex((lesson) => lesson.id === focus.lessonId);
  const currentLesson = currentIndex >= 0 ? lessons[currentIndex] : null;

  if (!currentLesson) {
    return {
      reply: "Não encontrei essa lição na trilha. Recarregue a página e tente novamente.",
      resolution: "low_confidence",
      confidence: 0,
      actions: [],
    };
  }

  const previousLesson = currentIndex > 0 ? lessons[currentIndex - 1] : null;
  const local = resolveLocally(message, currentLesson, previousLesson);

  if (local.resolution !== "generation") {
    const actions: AssistantAction[] =
      local.resolution === "out_of_scope"
        ? [
            {
              type: "navigate",
              label: "Ver notas e avaliações",
              href: `/disciplinas/${subjectCode}/notas-avaliacoes`,
            },
          ]
        : local.resolution === "retrieval" &&
            local.matchedLessonId &&
            local.matchedLessonId !== focus.lessonId
          ? [{ type: "open_lesson", label: "Abrir essa aula", lessonId: local.matchedLessonId }]
          : [];
    return { reply: local.reply, resolution: local.resolution, confidence: local.confidence, actions };
  }

  return {
    reply: "Não encontrei essa resposta no material desta aula. Quer falar com o mediador da disciplina? Ele responde dúvidas de conteúdo.",
    resolution: "low_confidence",
    confidence: local.confidence,
    actions: [
      {
        type: "navigate",
        label: "Falar com o mediador",
        href: `/disciplinas/${subjectCode}/fale-com-mediador`,
      },
    ],
  };
}

/**
 * Superfície calendário: sempre delega ao modelo hoje — não há
 * atalho local determinístico equivalente ao FAQ/conteúdo da trilha, então
 * fica fixa em resolution "generation" (dívida documentada no plano: é a
 * única superfície com escrita real a jusante, então nunca emite
 * low_confidence nesta versão).
 */
async function resolveCalendarMessage(
  userId: string,
  message: string,
  history: ConversationMessage[]
): Promise<SurfaceResolutionOutcome> {
  const [context, profile, visit] = await Promise.all([
    buildVitruStudentContext(userId),
    getStudentProfile(userId),
    getSurfaceVisit(userId, "calendario"),
  ]);
  const disclosure = resolveDisclosure(visit?.visitCount ?? 1);
  const plan = context.suggestedPlan;
  let generated;
  try {
    generated = await generate({
      system: buildCalendarSystemPrompt(context, profile, disclosure),
      userMessage: message,
      history,
      maxTokens: 1_200,
    });
  } catch (error) {
    console.error("Falha na geração de texto (calendário)", error);
    if (plan && plan.suggestions.length > 0) {
      return {
        reply: plan.replyText,
        resolution: "generation",
        confidence: 1,
        actions: [
          {
            type: "confirm_plan",
            label: "Confirmar horários sugeridos",
            suggestions: plan.suggestions,
          },
        ],
      };
    }
    return { unavailable: true };
  }

  const actions: AssistantAction[] = [];
  let reply = generated.text;

  if (plan && plan.suggestions.length > 0) {
    reply = plan.replyText;
    actions.push({
      type: "confirm_plan",
      label: "Confirmar horários sugeridos",
      suggestions: plan.suggestions,
    });
  }

  return {
    reply,
    resolution: "generation",
    confidence: 1,
    actions,
    inputTokens: generated.inputTokens,
    outputTokens: generated.outputTokens,
  };
}

async function handleSurfaceChat(body: SurfaceChatBody): Promise<Response> {
  if (typeof body.surface !== "string" || !VALID_SURFACES.includes(body.surface as Surface)) {
    return invalid("surface deve ser trilha ou calendario.");
  }
  const surface = body.surface as Surface;

  if (typeof body.objectId !== "string" || !body.objectId.trim()) {
    return invalid("objectId é obrigatório.");
  }
  const objectId = body.objectId.trim();

  if (body.focus !== undefined && !isSurfaceFocus(body.focus)) {
    return invalid("focus é inválido.");
  }
  const focus = body.focus as SurfaceFocus | undefined;

  if (body.entryEventId !== undefined && typeof body.entryEventId !== "string") {
    return invalid("entryEventId é inválido.");
  }
  const entryEventId = typeof body.entryEventId === "string" ? body.entryEventId.trim() || null : null;

  const hasMessage = typeof body.message === "string" && body.message.trim().length > 0;
  if (body.message !== undefined && typeof body.message !== "string") {
    return invalid("message deve ser uma string.");
  }
  if (hasMessage && (body.message as string).length > 4000) {
    return invalid("message deve conter no máximo 4000 caracteres.");
  }
  if (!hasMessage && !entryEventId) {
    return invalid("message é obrigatória.");
  }

  const userId = await resolveActiveUserId(undefined);
  const index = await loadUserIndex();
  if (!index.users.some((user) => user.id === userId)) {
    return Response.json(
      { ok: false, error: { code: "STUDENT_NOT_FOUND", message: "Aluno não encontrado." } },
      { status: 404 }
    );
  }

  const startedAt = Date.now();
  const conversationId = await resolveConversationId(userId, surface, objectId);
  const lessonId = focus?.kind === "trilha" ? focus.lessonId : null;

  // Histórico vazio = superfície recém-aberta (sessão nova ou renovada após
  // 24h). Vale tanto para o modo abertura (trilha) quanto para o Calendário,
  // que nunca passa por ele — a UI já entra mandando a mensagem de análise
  // automaticamente. Contar aqui, uma vez por sessão, é o que faz o nível de
  // explicação graduar nas duas superfícies, não só na que abre sem mensagem.
  const priorHistory = await getRecentHistory(conversationId);
  if (priorHistory.length === 0) {
    await recordSurfaceVisit(userId, surface);
  }

  // Modo abertura: sem mensagem do aluno, só resolve a retomada do inbox (spec §8). Não roda a ordem de resolução.
  if (!hasMessage) {
    const consumed = entryEventId ? await consumeInboxEvent(entryEventId) : null;
    const reply = consumed ? consumed.reason : DEFAULT_GREETING[surface];
    await appendMessage(conversationId, { role: "assistant", text: reply });
    await logInteraction({
      conversationId,
      userId,
      surface,
      objectId,
      lessonId,
      entryEventId,
      intent: null,
      confidence: consumed ? 1 : null,
      resolution: "retrieval",
      latencyMs: Date.now() - startedAt,
      inputTokens: null,
      outputTokens: null,
      actionReturned: null,
      actionClicked: null,
    });
    return Response.json(
      { conversationId, reply, resolution: "retrieval", confidence: consumed ? 1 : 0, actions: [] },
      { headers: { "Cache-Control": "no-store" } }
    );
  }

  const message = (body.message as string).trim();
  await appendMessage(conversationId, { role: "user", text: message });
  // priorHistory já foi buscado antes de anexar esta mensagem — é
  // exatamente o histórico anterior a este turno, sem precisar descartar a
  // última entrada como antes (quando a busca acontecia depois do append).
  const previousHistory = priorHistory;

  const outcome =
    surface === "trilha"
      ? await resolveTrilhaMessage(userId, objectId, focus, message)
      : await resolveCalendarMessage(userId, message, previousHistory);

  if ("unavailable" in outcome) {
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

  await appendMessage(conversationId, { role: "assistant", text: outcome.reply });
  await logInteraction({
    conversationId,
    userId,
    surface,
    objectId,
    lessonId,
    entryEventId,
    intent: null,
    confidence: outcome.confidence,
    resolution: outcome.resolution,
    latencyMs: Date.now() - startedAt,
    inputTokens: outcome.inputTokens ?? null,
    outputTokens: outcome.outputTokens ?? null,
    actionReturned: outcome.actions[0]?.type ?? null,
    actionClicked: null,
  });

  return Response.json(
    {
      conversationId,
      reply: outcome.reply,
      resolution: outcome.resolution,
      confidence: outcome.confidence,
      actions: outcome.actions,
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}

export async function POST(request: Request) {
  let body: SurfaceChatBody;
  try {
    body = (await request.json()) as SurfaceChatBody;
  } catch {
    return invalid("O corpo deve ser um JSON válido.");
  }

  return handleSurfaceChat(body);
}
