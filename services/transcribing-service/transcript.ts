export interface Segment {
  startMs: number;
  text: string;
}

/**
 * Parses a YouTube json3 auto-caption payload into clean, de-duplicated
 * segments (gotcha #2). Rolling captions repeat each line as it scrolls, so we
 * skip any line identical to one of the last RECENT emitted lines — this kills
 * the scroll duplicates without dropping legitimately repeated short phrases
 * that occur far apart in the lecture.
 */
export function parseJson3(raw: string): Segment[] {
  const data = JSON.parse(raw);
  const out: Segment[] = [];
  const RECENT = 8;

  for (const ev of data.events ?? []) {
    const segs = ev.segs;
    if (!Array.isArray(segs)) continue;

    const text = segs
      .map((s: { utf8?: string }) => s.utf8 ?? "")
      .join("")
      .replace(/\s+/g, " ")
      .trim();

    if (!text) continue;

    const recent = out.slice(-RECENT).map((s) => s.text);
    if (recent.includes(text)) continue;

    out.push({ startMs: ev.tStartMs ?? 0, text });
  }
  return out;
}

/** Flattens segments into a single plain-text transcript (for .txt storage). */
export function toPlainText(segments: Segment[]): string {
  return segments.map((s) => s.text).join(" ");
}
