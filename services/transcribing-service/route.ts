import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";

// yt-dlp is a native binary → must run on the Node.js runtime, never edge.
export const runtime = "nodejs";

/**
 * Enqueue a lesson for transcript ingestion.
 * Body: { videoId: string, course?: string, materia?: string }
 *
 * Intentionally does NOT process inline: captions may not exist yet
 * (gotcha #1), so processing is deferred to the worker with retry/backoff.
 */
export async function POST(req: NextRequest) {
  let body: { videoId?: string; course?: string; materia?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  const { videoId, course, materia } = body;
  if (!videoId) {
    return NextResponse.json({ error: "videoId is required" }, { status: 400 });
  }

  await pool.query(
    `insert into ingest_jobs (video_id, course, materia)
       values ($1, $2, $3)
     on conflict (video_id) do update
       set course = excluded.course,
           materia = excluded.materia,
           status = 'pending',
           attempts = 0,
           next_retry_at = now(),
           updated_at = now()`,
    [videoId, course ?? null, materia ?? null],
  );

  return NextResponse.json({ ok: true, queued: videoId });
}
