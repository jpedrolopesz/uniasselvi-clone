import { createHash } from "node:crypto";
import { pool } from "./db";
import { Chunk } from "./chunk";
import { EMBEDDING_MODEL } from "./embeddings";

function toVector(v: number[]): string {
  return `[${v.join(",")}]`;
}
function sha256(s: string): string {
  return createHash("sha256").update(s).digest("hex");
}

export interface ChunkMeta {
  videoId: string;
  course?: string;
  materia?: string;
}

/**
 * Replaces all chunks for (videoId, model) transactionally — makes re-ingest
 * idempotent. If you re-run with a different EMBEDDING_MODEL, both versions
 * coexist; queries use whatever model produced the query embedding.
 */
export async function upsertChunks(
  meta: ChunkMeta,
  chunks: Chunk[],
  embeddings: number[][],
): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query("begin");
    await client.query(
      "delete from transcript_chunks where video_id = $1 and model_version = $2",
      [meta.videoId, EMBEDDING_MODEL],
    );
    for (let i = 0; i < chunks.length; i++) {
      const c = chunks[i];
      await client.query(
        `insert into transcript_chunks
           (video_id, course, materia, chunk_index, start_ms, end_ms,
            content, content_hash, embedding, model_version)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [
          meta.videoId,
          meta.course ?? null,
          meta.materia ?? null,
          c.index,
          c.startMs,
          c.endMs,
          c.text,
          sha256(c.text),
          toVector(embeddings[i]),
          EMBEDDING_MODEL,
        ],
      );
    }
    await client.query("commit");
  } catch (e) {
    await client.query("rollback");
    throw e;
  } finally {
    client.release();
  }
}

export interface Retrieved {
  videoId: string;
  materia: string | null;
  startMs: number;
  endMs: number;
  content: string;
  distance: number;
}

/**
 * Cosine-distance search, optionally filtered by materia — this is how the
 * /r/materia community scoping becomes the retrieval namespace: a question in
 * /r/calculo-1 only retrieves calculus transcripts.
 */
export async function search(
  queryEmbedding: number[],
  opts: { materia?: string; k?: number } = {},
): Promise<Retrieved[]> {
  const params: unknown[] = [toVector(queryEmbedding)];
  let where = "where model_version = $2";
  params.push(EMBEDDING_MODEL);

  if (opts.materia) {
    params.push(opts.materia);
    where += ` and materia = $${params.length}`;
  }
  params.push(opts.k ?? 6);

  const { rows } = await pool.query(
    `select video_id, materia, start_ms, end_ms, content,
            embedding <=> $1 as distance
       from transcript_chunks
       ${where}
       order by embedding <=> $1
       limit $${params.length}`,
    params,
  );

  return rows.map((r: {
    video_id: string;
    materia: string | null;
    start_ms: number;
    end_ms: number;
    content: string;
    distance: number;
  }) => ({
    videoId: r.video_id,
    materia: r.materia,
    startMs: r.start_ms,
    endMs: r.end_ms,
    content: r.content,
    distance: r.distance,
  }));
}
