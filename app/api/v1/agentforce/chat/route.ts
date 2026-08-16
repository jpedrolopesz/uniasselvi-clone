/**
 * API Route — Chat Agentforce (proxy ou simulação).
 *
 * POST /api/v1/agentforce/chat
 * Body: { "message": "O que estudar hoje?", "sessionId": "..." }
 *
 * Em produção com Agent API habilitada: cria sessão e envia mensagem para SF.
 * Em dev/demo: retorna respostas simuladas que demonstram o comportamento.
 */
import { NextRequest } from "next/server";

function json(data: unknown, status = 200) {
  return Response.json(data, { status });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { message } = body;

  if (!message) {
    return json({ ok: false, error: { code: "INVALID_REQUEST", message: "'message' é obrigatório" } }, 400);
  }

  // Modo simulado — Agentforce Agent API não disponível na org Developer Edition
  // Em produção: conecta via /services/data/v62.0/einstein/ai-agent/agents/{id}/sessions
  return json({
    ok: true,
    simulated: true,
    sessionId: `sim-${Date.now()}`,
    replies: [
      {
        id: `r-${Date.now()}`,
        text: getSimulatedReply(message),
        type: "Inform",
        safe: true,
      },
    ],
  });
}

function getSimulatedReply(message: string): string {
  const msg = message.toLowerCase();

  if (msg.includes("estudar")) return "Sugiro focar em Estatística (avaliação em 3 dias). Método: Mapas Mentais.";
  if (msg.includes("grupo") || msg.includes("comunidade")) return "Recomendo a EJ Admin (75% match com seu perfil).";
  if (msg.includes("plano")) return "Montei: Seg-Sex 19h, 45min/dia. Total 3h45/semana.";
  if (msg.includes("progresso") || msg.includes("como estou")) return "Score: 62/100. Atenção em Cálculo I (nota 5.2).";
  return "Posso ajudar com: recomendações de estudo, comunidade, planejamento ou progresso.";
}
