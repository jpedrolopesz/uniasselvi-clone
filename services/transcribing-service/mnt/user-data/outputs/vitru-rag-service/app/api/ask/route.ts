import { NextRequest, NextResponse } from "next/server";
import { embed } from "@/lib/embeddings";
import { search } from "@/lib/vectorstore";

export const runtime = "nodejs";

const LLM_BASE = process.env.LLM_BASE_URL || "https://api.openai.com/v1";
const LLM_KEY = process.env.LLM_API_KEY || process.env.OPENAI_API_KEY || "";
const LLM_MODEL = process.env.LLM_MODEL || "gpt-4o-mini";

function ytLink(videoId: string, startMs: number): string {
  return `https://www.youtube.com/watch?v=${videoId}&t=${Math.floor(startMs / 1000)}s`;
}
function fmtTime(ms: number): string {
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/**
 * Answers a student question grounded ONLY in retrieved lecture transcripts,
 * returning timestamped links back to the exact minute of the source video —
 * the verifiable, source-cited rationale that anchors trust (cf. RAG literature).
 * Body: { question: string, materia?: string, k?: number }
 */
export async function POST(req: NextRequest) {
  let body: { question?: string; materia?: string; k?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  const { question, materia, k } = body;
  if (!question) {
    return NextResponse.json({ error: "question is required" }, { status: 400 });
  }

  const [qEmb] = await embed([question]);
  const hits = await search(qEmb, { materia, k: k ?? 6 });

  if (hits.length === 0) {
    return NextResponse.json({
      answer: "Não encontrei esse conteúdo nas aulas indexadas desta matéria.",
      sources: [],
    });
  }

  const context = hits
    .map(
      (h, i) =>
        `[${i + 1}] (aula ${h.videoId} @ ${fmtTime(h.startMs)})\n${h.content}`,
    )
    .join("\n\n");

  const system = [
    "Você é um monitor que tira dúvidas de alunos usando SOMENTE as transcrições de aula fornecidas no contexto.",
    "Se a resposta não estiver no contexto, diga claramente que o tema não foi abordado nas aulas indexadas — não invente.",
    "Cite sempre a fonte usada no formato [n], correspondente ao trecho do contexto.",
    "As transcrições vêm de legendas automáticas e podem conter erros em termos técnicos; interprete com bom senso e corrija termos óbvios.",
  ].join(" ");

  const user = `Pergunta: ${question}\n\nContexto:\n${context}`;

  const res = await fetch(`${LLM_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${LLM_KEY}`,
    },
    body: JSON.stringify({
      model: LLM_MODEL,
      temperature: 0.2,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });

  if (!res.ok) {
    return NextResponse.json(
      { error: `LLM ${res.status}: ${await res.text()}` },
      { status: 502 },
    );
  }

  const json = await res.json();
  const answer: string = json.choices?.[0]?.message?.content ?? "";

  const sources = hits.map((h, i) => ({
    ref: i + 1,
    videoId: h.videoId,
    materia: h.materia,
    at: fmtTime(h.startMs),
    url: ytLink(h.videoId, h.startMs),
    distance: typeof h.distance === "number" ? Number(h.distance.toFixed(4)) : h.distance,
  }));

  return NextResponse.json({ answer, sources });
}
