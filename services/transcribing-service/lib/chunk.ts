import { Segment } from "./transcript";

export interface Chunk {
  index: number;
  startMs: number;
  endMs: number;
  text: string;
}

// Auto-captions have no punctuation/paragraphs, so we chunk by TIME rather than
// by sentence (gotcha #3). Overlap preserves context across boundaries, and the
// start/end timestamps let the RAG answer cite the exact minute of the video.
const WINDOW_MS = Number(process.env.CHUNK_WINDOW_MS ?? 90_000); // ~90s per chunk
const OVERLAP_MS = Number(process.env.CHUNK_OVERLAP_MS ?? 15_000); // ~15s overlap

export function chunkByTime(segments: Segment[]): Chunk[] {
  if (segments.length === 0) return [];

  const chunks: Chunk[] = [];
  let cur: Segment[] = [];
  let windowStart = segments[0].startMs;
  let index = 0;

  const push = (nextStart: number | null) => {
    if (cur.length === 0) return;
    chunks.push({
      index: index++,
      startMs: cur[0].startMs,
      endMs: cur[cur.length - 1].startMs,
      text: cur.map((s) => s.text).join(" "),
    });
    if (nextStart === null) {
      cur = [];
    } else {
      // carry the trailing OVERLAP_MS of segments into the next window
      const cutoff = nextStart - OVERLAP_MS;
      cur = cur.filter((s) => s.startMs >= cutoff);
    }
  };

  for (const seg of segments) {
    if (seg.startMs - windowStart >= WINDOW_MS) {
      push(seg.startMs);
      windowStart = seg.startMs;
    }
    cur.push(seg);
  }
  push(null); // final flush

  return chunks;
}
