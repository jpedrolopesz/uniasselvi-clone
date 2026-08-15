// OpenAI-compatible embeddings client.
// Point EMBEDDINGS_BASE_URL at api.openai.com OR a local Ollama/vLLM server
// exposing the /embeddings route — the code doesn't change.

const BASE = process.env.EMBEDDINGS_BASE_URL || "https://api.openai.com/v1";
const KEY =
  process.env.EMBEDDINGS_API_KEY || process.env.OPENAI_API_KEY || "";

export const EMBEDDING_MODEL =
  process.env.EMBEDDING_MODEL || "text-embedding-3-small";

export async function embed(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];

  const res = await fetch(`${BASE}/embeddings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${KEY}`,
    },
    body: JSON.stringify({ model: EMBEDDING_MODEL, input: texts }),
  });

  if (!res.ok) {
    throw new Error(`Embeddings API ${res.status}: ${await res.text()}`);
  }
  const json = await res.json();
  return json.data.map((d: { embedding: number[] }) => d.embedding);
}
