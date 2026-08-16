/**
 * Construção das instructions/tools do Vitru e tradução de tool calls do
 * assistente de voz para BrowserAction.
 *
 * Este módulo é puro e agnóstico do protocolo de transporte: quem fala com o
 * relay (server/nova-sonic-relay.ts) é lib/vitru/nova-sonic-connection.ts e
 * lib/vitru/voice-relay-protocol.ts.
 */
import type { BrowserAction } from "@/lib/vitru/browser-action-decision";
import type { AssistantSuggestion } from "@/lib/study-planner/ai-assistant";
import type { VitruVoiceSession } from "@/lib/vitru/voice-session-contract";
import { SNAPSHOT_SENTINEL } from "@/lib/vitru/voice-relay-protocol";

const BASE_SYSTEM_PROMPT = `
Você é Vitru, assistente de voz acadêmico da plataforma Uniasselvi. Seu nome é
sempre Vitru; nunca se apresente como Alê, Ale ou qualquer outro nome. Fale em português brasileiro, sem
markdown, em até duas frases. Nunca invente dados nem peça credenciais, CPF ou
cartão. Quando faltar informação, indique atendimento humano.
`.trim();

const SEMANTIC_CONTRACT = `

CONTRATO SEMÂNTICO
O último ${SNAPSHOT_SENTINEL} é confiável. Pergunta factual usa
responder_sem_acao. Abrir página usa navigate_to(destination_id). Apontar ação
usa show(referencia), repetindo a expressão do aluno, e fechar usa
close_interface(referencia). O portal resolve referências aproximadas; nunca
escolha IDs de ação. Use só o enum de destino; nunca emita URL. Só confirme ação
após o resultado da ferramenta. Se o resultado indicar ambiguidade, pergunte qual
das opções o aluno quis. Perguntas "onde respondo", "onde agendo" e "mostre onde"
sempre usam show, nunca responder_sem_acao.
Resolva referências primeiro pelo state/foco, depois pelos itens visíveis do
snapshot. Só use pedir_esclarecimento se ainda houver ambiguidade.
ANTES de navigate_to, compare o pedido com page.id e page.name. Se o aluno pedir
a página que já está aberta, responda que ele já está nela e NÃO use ferramenta.
`;

export interface VitruInstructionsInput {
  surface: "portal" | "calendario";
  suggestions?: AssistantSuggestion[];
  session?: VitruVoiceSession | null;
}

/** Prompt de sistema enviado no session.update — só contexto estável da sessão. */
export function buildVitruInstructions({ surface, suggestions, session }: VitruInstructionsInput): string {
  const stableContext = session
    ? `

CONTEXTO ACADÊMICO AUTORIZADO
Os dados abaixo pertencem ao aluno autenticado desta sessão. Use somente esses
dados. Não peça informações que já estejam presentes e não revele identificadores
internos.
${JSON.stringify({
  academicContext: session.academicContext,
  profile: session.profile,
  memories: session.memories,
  recentHistory: session.history,
})}

REGRAS DE MEMÓRIA E HISTÓRICO
Use as memórias apenas como preferências ou restrições auxiliares. Se uma memória
conflitar com um dado acadêmico atual, o dado acadêmico prevalece. O histórico
serve para continuidade, mas nunca autoriza uma alteração. Toda escrita exige
confirmação explícita do aluno e retorno positivo da ferramenta autorizada.
`
    : "";
  const base = `${BASE_SYSTEM_PROMPT}${SEMANTIC_CONTRACT}${stableContext}`;
  if (surface !== "calendario") return base;

  const calendarContext = JSON.stringify(
    (suggestions ?? []).slice(0, 20).map(({ title, subjectName, date, startTime, endTime }) => ({
      title,
      subjectName,
      date,
      startTime,
      endTime,
    }))
  );
  return `${base}

CONTEXTO ESTÁVEL DO PLANEJAMENTO
O portal analisou avaliações, prazos e horários livres nesta sessão e produziu
estas sugestões na janela do Vitru:
${calendarContext}

Converse sobre esse planejamento e explique datas e horários quando solicitado.
Não afirme que um horário foi salvo apenas pela fala: peça ao aluno para confirmar
o cartão visível na tela. Se não houver sugestões, diga que a análise ainda está
em andamento e ajude o aluno a explicar sua prioridade de estudo.
`;
}

/** Definição achatada de tool, no formato GA aceito pelo session.update. */
export interface RealtimeTool {
  type: "function";
  name: string;
  description: string;
  parameters: {
    type: "object";
    properties: Record<string, unknown>;
    required: string[];
    additionalProperties: false;
  };
}

function tool(
  name: string,
  description: string,
  properties: Record<string, unknown> = {},
  required: string[] = []
): RealtimeTool {
  return {
    type: "function",
    name,
    description,
    parameters: { type: "object", properties, required, additionalProperties: false },
  };
}

interface ToolSnapshot {
  page?: { id?: string };
  destinations?: Array<{ id?: string }>;
}

/**
 * Tools válidas para o snapshot atual. O enum de destinos muda a cada página,
 * então isto é reenviado junto de cada session.update.
 */
export function buildVitruTools(snapshot: ToolSnapshot | null): RealtimeTool[] {
  const destinationIds = (snapshot?.destinations ?? [])
    .map((destination) => destination?.id)
    .filter((id): id is string => typeof id === "string");

  const tools = [
    tool(
      "responder_sem_acao",
      "Só responde fatos: página, nota, peso, prazo ou status. Nunca use para 'onde', 'mostre', abrir, responder ou agendar."
    ),
    tool(
      "navigate_to",
      "Abre OUTRA página por destination_id permitido. Se page.id/page.name já é o pedido, não use esta ferramenta. Nunca use URL.",
      { destination_id: { type: "string", enum: destinationIds } },
      ["destination_id"]
    ),
    tool(
      "show",
      "Use para 'onde', 'mostre', responder ou agendar uma ação. O portal resolve o alvo.",
      { referencia: { type: "string", description: "Expressão original do aluno" } },
      ["referencia"]
    ),
    tool(
      "close_interface",
      "Fecha uma interface descrita pelo aluno; o portal resolve o alvo.",
      { referencia: { type: "string", description: "Expressão original do aluno" } },
      ["referencia"]
    ),
    tool(
      "pedir_esclarecimento",
      "Pergunta somente quando a referência continua ambígua depois de usar o snapshot atual.",
      { pergunta: { type: "string" } },
      ["pergunta"]
    ),
    tool("go_back", "Volta no histórico."),
    tool("go_forward", "Avança no histórico."),
  ];

  if (snapshot?.page?.id === "assessment-scheduling") {
    tools.push(
      tool("listar_opcoes", "Lista horários disponíveis; não grava."),
      tool(
        "selecionar_opcao",
        "Seleciona pela referência do aluno; não use ids, datas inventadas nem tokens.",
        { referencia: { type: "string" } },
        ["referencia"]
      ),
      tool("confirmar", "Confirma somente a proposta pendente exibida na tela. Não recebe argumentos.")
    );
  }
  return tools;
}

// --- Tools → BrowserAction ---

const ACTION_TYPES: Record<string, BrowserAction["type"]> = {
  navigate_to: "navigate",
  go_back: "go_back",
  go_forward: "go_forward",
  highlight_component: "highlight",
  close_interface: "close",
  show: "show",
  listar_opcoes: "list_options",
  selecionar_opcao: "select_option",
  confirmar: "confirm_write",
  pedir_esclarecimento: "clarify",
};

export type ToolCallTranslation =
  | { kind: "action"; action: BrowserAction }
  | { kind: "no_action"; result: { ok: true; message: string } }
  | { kind: "unknown_tool"; result: { ok: false; message: string } };

/**
 * Converte uma function call em BrowserAction. `utterance` vem do portal (última
 * fala transcrita), não do modelo: é o que permite recusar deterministicamente
 * um enum errado que tiraria o aluno da página recém-pedida.
 */
export function translateToolCall(
  name: string,
  args: Record<string, unknown>,
  actionId: string,
  utterance = ""
): ToolCallTranslation {
  if (name === "responder_sem_acao") {
    return { kind: "no_action", result: { ok: true, message: "Nenhuma ação no portal é necessária." } };
  }
  const type = ACTION_TYPES[name];
  if (!type) return { kind: "unknown_tool", result: { ok: false, message: "Ferramenta desconhecida." } };

  const action = { id: actionId, type, ...args } as BrowserAction;
  if (type === "navigate") (action as Extract<BrowserAction, { type: "navigate" }>).utterance = utterance;
  return { kind: "action", action };
}
