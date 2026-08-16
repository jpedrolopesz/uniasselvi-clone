import { generate } from "@/lib/vitru/generate";

const COMMUNITY_IDS = ["steps", "class", "study", "career"] as const;

const COMMUNITY_KEYWORDS: Record<(typeof COMMUNITY_IDS)[number], string[]> = {
  steps: ["ava", "plataforma", "acesso", "navegar", "calouro", "começar", "primeiros passos"],
  class: ["amigos", "colegas", "pessoas", "turma", "conversa", "amizade", "integração"],
  study: ["estudo", "foco", "produtividade", "rotina", "prova", "aprender", "métodos"],
  career: ["carreira", "emprego", "estágio", "trabalho", "pesquisa", "acadêmica", "networking"],
};

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function fallbackRecommendations(interest: string) {
  const normalizedInterest = normalize(interest);
  const ranked = COMMUNITY_IDS.map((id) => ({
    id,
    score: COMMUNITY_KEYWORDS[id].reduce((score, keyword) => score + (normalizedInterest.includes(normalize(keyword)) ? 1 : 0), 0),
  })).sort((first, second) => second.score - first.score);
  const matched = ranked.filter(({ score }) => score > 0).slice(0, 2).map(({ id }) => id);
  return matched.length > 0 ? matched : ["class", "study"];
}

function parseGeneratedRecommendations(text: string) {
  const json = text.match(/\{[\s\S]*\}/)?.[0];
  if (!json) return null;
  const parsed = JSON.parse(json) as { recommendations?: unknown; explanation?: unknown };
  if (!Array.isArray(parsed.recommendations)) return null;
  const recommendations = parsed.recommendations
    .filter((id): id is string => typeof id === "string" && COMMUNITY_IDS.includes(id as (typeof COMMUNITY_IDS)[number]))
    .slice(0, 2);
  if (recommendations.length === 0) return null;
  return {
    recommendations,
    explanation: typeof parsed.explanation === "string" && parsed.explanation.trim()
      ? parsed.explanation.trim()
      : "Encontrei comunidades alinhadas aos interesses informados.",
  };
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { interest?: unknown } | null;
  if (!body || typeof body.interest !== "string" || !body.interest.trim() || body.interest.length > 500) {
    return Response.json({ ok: false, error: "Informe um interesse com até 500 caracteres." }, { status: 400 });
  }

  const interest = body.interest.trim();
  try {
    const generated = await Promise.race([
      generate({
        system: `Você recomenda comunidades acadêmicas para calouros. Escolha até 2 IDs desta lista:\n- steps: primeiros passos e navegação no AVA\n- class: integração, colegas e turma\n- study: métodos, foco e produtividade\n- career: carreira, estágio, trabalho, networking e pesquisa acadêmica\nResponda somente JSON válido no formato {"recommendations":["id"],"explanation":"uma frase curta em português"}.`,
        userMessage: interest,
        maxTokens: 180,
      }),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error("AI_TIMEOUT")), 6_000)),
    ]);
    const parsed = parseGeneratedRecommendations(generated.text);
    if (parsed) return Response.json({ ok: true, ...parsed, source: "ai" });
  } catch (error) {
    console.warn("Recomendação de comunidade por IA indisponível; usando fallback local.", error);
  }

  const recommendations = fallbackRecommendations(interest);
  return Response.json({
    ok: true,
    recommendations,
    explanation: recommendations.length === 1
      ? `Encontrei uma comunidade alinhada ao seu interesse em “${interest}”.`
      : `Encontrei ${recommendations.length} comunidades alinhadas ao seu interesse em “${interest}”.`,
    source: "fallback",
  });
}
