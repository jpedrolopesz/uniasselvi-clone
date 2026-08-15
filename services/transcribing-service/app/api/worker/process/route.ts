import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { ingestVideo } from "@/lib/ingest";
import { CaptionsNotReadyError } from "@/lib/ytdlp";

export const runtime = "nodejs";
export const maxDuration = 300; // seconds; bump on your host if needed

const MAX_ATTEMPTS = Number(process.env.MAX_ATTEMPTS ?? 8);
// Backoff schedule in minutes — front-loaded because auto-captions usually
// appear within the first hour, but can lag longer for long videos.
const BACKOFF_MIN = [5, 15, 30, 60, 120, 240, 360, 720];

/**
 * Processes a small batch of due jobs. Trigger this on a schedule
 * (Vercel Cron, GitHub Actions, or `* / 10 * * * *` on a VM).
 * Uses SELECT ... FOR UPDATE SKIP LOCKED so concurrent runs don't collide.
 */
export async function POST(req: NextRequest) {
  // Optional shared-secret guard for the cron trigger.
  const secret = process.env.WORKER_SECRET;
  if (secret && req.headers.get("x-worker-secret") !== secret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { rows: jobs } = await pool.query(
    `update ingest_jobs set status = 'processing', updated_at = now()
       where id in (
         select id from ingest_jobs
          where status = 'pending' and next_retry_at <= now()
          order by next_retry_at asc
          limit 3
          for update skip locked
       )
     returning *`,
  );

  const results: unknown[] = [];

  for (const job of jobs) {
    try {
      const r = await ingestVideo({
        videoId: job.video_id,
        course: job.course,
        materia: job.materia,
      });
      await pool.query(
        `update ingest_jobs set status = 'done', last_error = null, updated_at = now() where id = $1`,
        [job.id],
      );
      results.push({ videoId: job.video_id, status: "done", ...r });
    } catch (e: unknown) {
      const attempts = job.attempts + 1;
      const notReady = e instanceof CaptionsNotReadyError;
      const msg = e instanceof Error ? e.message : String(e);

      if (attempts >= MAX_ATTEMPTS) {
        await pool.query(
          `update ingest_jobs set status = 'failed', attempts = $2, last_error = $3, updated_at = now() where id = $1`,
          [job.id, attempts, msg],
        );
        results.push({ videoId: job.video_id, status: "failed", reason: msg });
      } else {
        const mins = BACKOFF_MIN[Math.min(attempts - 1, BACKOFF_MIN.length - 1)];
        await pool.query(
          `update ingest_jobs
              set status = 'pending', attempts = $2, last_error = $3,
                  next_retry_at = now() + ($4 || ' minutes')::interval,
                  updated_at = now()
            where id = $1`,
          [job.id, attempts, notReady ? "captions_not_ready" : msg, mins],
        );
        results.push({
          videoId: job.video_id,
          status: "retry",
          inMinutes: mins,
          reason: notReady ? "captions_not_ready" : msg,
        });
      }
    }
  }

  return NextResponse.json({ processed: results.length, results });
}
