import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const execFileAsync = promisify(execFile);
const YTDLP = process.env.YTDLP_PATH || "yt-dlp";

/**
 * Raised when yt-dlp writes no auto-caption file. On a freshly uploaded video
 * this usually means YouTube hasn't finished generating captions yet, so the
 * worker should retry with backoff rather than fail permanently.
 */
export class CaptionsNotReadyError extends Error {
  constructor(msg: string) {
    super(msg);
    this.name = "CaptionsNotReadyError";
  }
}

/**
 * Downloads YouTube auto-generated subtitles in json3 format (chosen over VTT
 * because json3 is far easier to de-duplicate — gotcha #2, rolling captions).
 * Returns the raw json3 string. Cleans up its temp dir afterwards.
 */
export async function fetchAutoSubs(
  videoId: string,
  langs = process.env.SUB_LANGS || "pt,pt-orig",
): Promise<string> {
  const url = `https://www.youtube.com/watch?v=${videoId}`;
  const dir = await mkdtemp(join(tmpdir(), `subs-${videoId}-`));
  try {
    await execFileAsync(
      YTDLP,
      [
        "--skip-download",
        "--write-auto-subs",
        "--sub-langs", langs,
        "--sub-format", "json3",
        "--no-warnings",
        "-o", join(dir, "%(id)s.%(ext)s"),
        url,
      ],
      { timeout: 120_000, maxBuffer: 1024 * 1024 * 64 },
    );

    // yt-dlp writes files like "<id>.<lang>.json3"
    const files = (await readdir(dir)).filter(
      (f) => f.endsWith(".json3") || f.endsWith(".json"),
    );
    if (files.length === 0) {
      throw new CaptionsNotReadyError(
        `No auto captions written for ${videoId} (langs=${langs})`,
      );
    }
    // Prefer an exact "-orig" (original language) track if present.
    const chosen = files.find((f) => f.includes("orig")) ?? files[0];
    return await readFile(join(dir, chosen), "utf-8");
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
