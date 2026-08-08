import { mkdir, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { readUserJsonFileOptional } from "@/lib/data/read-json-file";
import type { StudyActivity } from "@/lib/types/study-activity";

const USER_DATA_ROOT = path.join(process.cwd(), "public", "data", "user");
const pendingWrites = new Map<string, Promise<unknown>>();

export interface SaveStudyActivitiesResult {
  created: StudyActivity[];
  existing: StudyActivity[];
}

async function writeForUser(
  userId: string,
  proposed: StudyActivity[]
): Promise<SaveStudyActivitiesResult> {
  if (!/^[a-z0-9-]+$/.test(userId)) {
    throw new Error("Identificador de aluno inválido.");
  }

  const current =
    (await readUserJsonFileOptional<StudyActivity[]>(
      userId,
      "study-activities.json"
    )) ?? [];
  const currentById = new Map(current.map((activity) => [activity.id, activity]));
  const created = proposed.filter((activity) => !currentById.has(activity.id));
  const existing = proposed
    .map((activity) => currentById.get(activity.id))
    .filter((activity): activity is StudyActivity => Boolean(activity));

  if (created.length === 0) return { created, existing };

  const directory = path.join(USER_DATA_ROOT, userId);
  const target = path.join(directory, "study-activities.json");
  const temporary = path.join(directory, `.study-activities-${randomUUID()}.tmp`);
  await mkdir(directory, { recursive: true });
  await writeFile(temporary, `${JSON.stringify([...current, ...created], null, 2)}\n`);
  await rename(temporary, target);
  return { created, existing };
}

/** Serializa gravações por aluno e faz substituição atômica do JSON local. */
export function saveStudyActivities(
  userId: string,
  proposed: StudyActivity[]
): Promise<SaveStudyActivitiesResult> {
  const previous = pendingWrites.get(userId) ?? Promise.resolve();
  const next = previous.then(() => writeForUser(userId, proposed));
  pendingWrites.set(userId, next);
  const cleanup = () => {
    if (pendingWrites.get(userId) === next) pendingWrites.delete(userId);
  };
  void next.then(cleanup, cleanup);
  return next;
}
