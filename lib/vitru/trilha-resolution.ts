import type { LearningPathLessonRaw } from "@/lib/types/raw/learning-path";
import type { Resolution } from "@/lib/vitru/surfaces";

const STOPWORDS = new Set([
  "o", "a", "os", "as", "de", "da", "do", "das", "dos", "que", "e", "é", "um",
  "uma", "uns", "umas", "para", "por", "com", "em", "no", "na", "nos", "nas",
  "se", "como", "isso", "essa", "esse", "isto", "voce", "você", "eu", "meu",
  "minha", "tem", "ha", "há", "ou", "mas", "ao", "aos", "sobre", "eh",
  "tipo", "ne", "né", "ai", "aí",
]);

const SPOKEN_NUMBERS: Record<string, string> = {
  um: "1", uma: "1", dois: "2", duas: "2", tres: "3", quatro: "4",
  cinco: "5", seis: "6", sete: "7", oito: "8", nove: "9", dez: "10",
};
const SPOKEN_NUMBER_PATTERN = Object.keys(SPOKEN_NUMBERS).join("|");

function singularizePtBr(token: string): string {
  // Exceções frequentes que apenas terminam como os sufixos de plural.
  if (["mais", "dois", "tres", "seis", "depois", "mes"].includes(token)) return token;
  if (token.endsWith("oes") || token.endsWith("aes")) return `${token.slice(0, -3)}ao`;
  if (token.endsWith("ais")) return `${token.slice(0, -3)}al`;
  if (token.endsWith("eis")) return `${token.slice(0, -3)}el`;
  if (token.endsWith("ois")) return `${token.slice(0, -3)}ol`;
  if (token.endsWith("is")) return `${token.slice(0, -2)}il`;
  if (token.endsWith("ns")) return `${token.slice(0, -2)}m`;
  if (token.length > 3 && token.endsWith("s")) return token.slice(0, -1);
  return token;
}

/** Minúsculas, sem acento e com abreviações expandidas, mas sem remover stopwords. */
export function normalizeLexical(text: string): string {
  const lexical = text
    .toLocaleLowerCase("pt-BR")
    .normalize("NFD")
    // Faixa U+0300–U+036F (marcas de combinação diacríticas), escrita com os
    // caracteres literais em vez de \u — mesmo efeito de [̀-ͯ].
    .replace(/[̀-ͯ]/g, "");
  return lexical
    // Whisper pode separar foneticamente a sigla: "a vê um".
    .replace(new RegExp(`\\ba\\s+ve\\s+(${SPOKEN_NUMBER_PATTERN})\\b`, "g"), (_, number: string) => `av ${number}`)
    .replace(new RegExp(`\\bav\\s+(${SPOKEN_NUMBER_PATTERN})\\b`, "g"), (_, number: string) => `avaliacao virtual ${SPOKEN_NUMBERS[number]}`)
    .replace(new RegExp(`\\b(avaliacao|unidade|dia)\\s+(${SPOKEN_NUMBER_PATTERN})\\b`, "g"), (_, marker: string, number: string) => `${marker} ${SPOKEN_NUMBERS[number]}`)
    // No portal, AV1/AV2 são abreviações visíveis de "Avaliação Virtual 1/2".
    // Expandir aqui mantém todos os resolvedores sobre a mesma normalização.
    .replace(/\bav\s*(\d+)\b/g, "avaliacao virtual $1");
}

/** Minúsculas, sem acento, tokenizado — mesma normalização usada em chat/route.ts para intents de WhatsApp. */
export function normalizeTokens(text: string): string[] {
  return normalizeLexical(text)
    .split(/[^a-z0-9]+/)
    .map(singularizePtBr)
    .filter((token) => (/^\d+$/.test(token) || token.length > 1) && !STOPWORDS.has(token));
}

/**
 * Recall da mensagem sobre o candidato: quantos tokens da mensagem aparecem
 * no candidato, dividido pelo total de tokens da mensagem. Uma pergunta
 * curta que "cabe dentro" de uma resposta de FAQ ou de um parágrafo mais
 * longo ainda pontua bem.
 */
export function scoreOverlap(message: string, candidate: string): number {
  const messageTokens = normalizeTokens(message);
  if (messageTokens.length === 0) return 0;
  const candidateTokens = new Set(normalizeTokens(candidate));
  const hits = messageTokens.filter((token) => candidateTokens.has(token)).length;
  return hits / messageTokens.length;
}

/** Limiar de hit para FAQ/conteúdo local e também o limiar do critério 8 (confiança < 0.6 nunca é afirmativa) aplicado sobre a confiança que a geração reporta — ver app/api/v1/vitru/chat/route.ts. */
export const HIT_THRESHOLD = 0.6;
/** Confiança fixa atribuída a um hit do denylist de fora-de-escopo — é um match binário, não uma pontuação de similaridade. */
export const OUT_OF_SCOPE_CONFIDENCE = 0.9;

const OUT_OF_SCOPE_PHRASES = [
  "nota", "notas", "media", "medias", "boletim", "frequencia", "presenca",
  "falta", "faltas", "financeiro", "boleto", "boletos", "mensalidade",
  "matricula", "horario de trabalho", "pagamento", "desconto", "bolsa",
];

export interface FaqMatch {
  question: string;
  answer: string;
  score: number;
}

export function matchFaq(message: string, lesson: LearningPathLessonRaw): FaqMatch | null {
  let best: FaqMatch | null = null;
  for (const entry of lesson.faq ?? []) {
    const score = scoreOverlap(message, `${entry.question} ${entry.answer}`);
    if (!best || score > best.score) best = { question: entry.question, answer: entry.answer, score };
  }
  return best && best.score >= HIT_THRESHOLD ? best : null;
}

interface Paragraph {
  paragraphId: string;
  text: string;
}

/** Mesma regra de blocos usada em LessonMarkdown/getLessonSummary: parágrafos separados por linha em branco, títulos "## " descartados. */
export function lessonParagraphs(lesson: LearningPathLessonRaw): Paragraph[] {
  return lesson.content
    .trim()
    .split(/\n\n+/)
    .filter((block) => !block.startsWith("## "))
    .map((block, index) => ({ paragraphId: `p${index}`, text: block.replace(/\*\*/g, "") }));
}

const REVIEW_CUES = ["aula anterior", "rever", "revisar", "revisao", "ultima aula", "licao anterior"];

function normalizedIncludes(haystack: string, needle: string): boolean {
  return haystack.includes(normalizeTokens(needle).join(" "));
}

export interface ContentMatch {
  lessonId: string;
  paragraphId: string;
  text: string;
  score: number;
}

export function matchContent(
  message: string,
  currentLesson: LearningPathLessonRaw,
  previousLesson: LearningPathLessonRaw | null
): ContentMatch | null {
  const normalizedMessage = normalizeTokens(message).join(" ");
  const wantsReview = REVIEW_CUES.some((cue) => normalizedIncludes(normalizedMessage, cue));

  const candidates = lessonParagraphs(currentLesson).map((p) => ({
    ...p,
    lessonId: currentLesson.id,
  }));
  if (wantsReview && previousLesson) {
    candidates.push(
      ...lessonParagraphs(previousLesson).map((p) => ({ ...p, lessonId: previousLesson.id }))
    );
  }

  let best: ContentMatch | null = null;
  for (const candidate of candidates) {
    const score = scoreOverlap(message, candidate.text);
    if (!best || score > best.score) best = { ...candidate, score };
  }
  return best && best.score >= HIT_THRESHOLD ? best : null;
}

export function matchOutOfScope(message: string): { score: number } | null {
  const normalized = normalizeTokens(message).join(" ");
  const hit = OUT_OF_SCOPE_PHRASES.some((phrase) => normalizedIncludes(normalized, phrase));
  return hit ? { score: OUT_OF_SCOPE_CONFIDENCE } : null;
}

export interface LocalResolutionResult {
  resolution: Resolution;
  reply: string;
  confidence: number;
  matchedLessonId?: string;
}

export const CLARIFICATION_REPLY =
  "Não tenho certeza do que você quis perguntar. Pode reformular ou dar mais detalhes sobre o que está estudando?";
const OUT_OF_SCOPE_REPLY =
  "Essa pergunta é sobre outra área do portal, não sobre o conteúdo desta aula. Você pode resolver isso na tela correspondente.";

/**
 * Ordem obrigatória: FAQ da aula → conteúdo da trilha → fora de escopo →
 * geração. A verificação de fora-de-escopo é determinística e roda antes de
 * qualquer chamada de modelo (a geração é decidida por quem chama, com base
 * em resolution === "generation" e reply === "").
 */
export function resolveLocally(
  message: string,
  currentLesson: LearningPathLessonRaw,
  previousLesson: LearningPathLessonRaw | null
): LocalResolutionResult {
  const faqMatch = matchFaq(message, currentLesson);
  if (faqMatch) {
    return { resolution: "faq", reply: faqMatch.answer, confidence: faqMatch.score };
  }

  const contentMatch = matchContent(message, currentLesson, previousLesson);
  if (contentMatch) {
    return {
      resolution: "retrieval",
      reply: contentMatch.text,
      confidence: contentMatch.score,
      matchedLessonId: contentMatch.lessonId,
    };
  }

  const outOfScope = matchOutOfScope(message);
  if (outOfScope) {
    return { resolution: "out_of_scope", reply: OUT_OF_SCOPE_REPLY, confidence: outOfScope.score };
  }

  // A pontuação de sobreposição de palavras serve para achar hits exatos de
  // FAQ/conteúdo, mas não serve para medir "isso faz sentido?" — uma
  // pergunta real e sobre o assunto ("não entendi essa parte", "pode
  // explicar melhor?") quase nunca repete o vocabulário literal da aula, e
  // pontuaria perto de zero mesmo sendo uma pergunta legítima. Por isso o
  // filtro de baixa confiança aqui só barra mensagem sem nenhum token
  // reconhecível (vazia, só pontuação, só stopwords) — a confiança de
  // verdade do critério 8 é aplicada depois, sobre o que o modelo reporta
  // na geração (ver app/api/v1/vitru/chat/route.ts).
  const bestLocalScore = Math.max(
    0,
    ...(currentLesson.faq ?? []).map((entry) =>
      scoreOverlap(message, `${entry.question} ${entry.answer}`)
    ),
    ...lessonParagraphs(currentLesson).map((paragraph) => scoreOverlap(message, paragraph.text))
  );

  if (normalizeTokens(message).length === 0) {
    return { resolution: "low_confidence", reply: CLARIFICATION_REPLY, confidence: 0 };
  }

  return { resolution: "generation", reply: "", confidence: bestLocalScore };
}
