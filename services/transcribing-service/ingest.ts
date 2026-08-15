import { fetchAutoSubs } from "./ytdlp";
import { parseJson3 } from "./transcript";
import { chunkByTime } from "./chunk";
import { embed } from "./embeddings";
import { upsertChunks, ChunkMeta } from "./vectorstore";

const EMBED_BATCH = Number(process.env.EMBED_BATCH ?? 64);

/**
 * Full pipeline for one video. Throws CaptionsNotReadyError (from fetchAutoSubs)
 * when captions aren't available yet, which the worker treats as "retry later".
 */
export async function ingestVideo(meta: ChunkMeta): Promise<{ chunks: number }> {
  const raw = await fetchAutoSubs(meta.videoId);
  const segments = parseJson3(raw);
  if (segments.length === 0) {
    throw new Error(`Empty transcript after parse for ${meta.videoId}`);
  }

  const chunks = chunkByTime(segments);
  const embeddings: number[][] = [];
  for (let i = 0; i < chunks.length; i += EMBED_BATCH) {
    const batch = chunks.slice(i, i + EMBED_BATCH).map((c) => c.text);
    embeddings.push(...(await embed(batch)));
  }

  await upsertChunks(meta, chunks, embeddings);
  return { chunks: chunks.length };
}
