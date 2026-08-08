import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { AssistantSuggestion } from "@/lib/study-planner/ai-assistant";

interface PendingPlan {
  userId: string;
  conversationId: string;
  suggestions: AssistantSuggestion[];
  currentIndex: number;
  updatedAt: string;
}

interface PendingPlanStore {
  conversations: Record<string, PendingPlan>;
}

const STORE_PATH = path.join(
  process.cwd(),
  ".vitru",
  "whatsapp-pending-plans.local.json"
);

let pendingWrite: Promise<unknown> = Promise.resolve();

async function loadStore(): Promise<PendingPlanStore> {
  try {
    return JSON.parse(await readFile(STORE_PATH, "utf8")) as PendingPlanStore;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return { conversations: {} };
    }
    throw error;
  }
}

async function writeStore(store: PendingPlanStore) {
  const directory = path.dirname(STORE_PATH);
  const temporary = path.join(directory, `.pending-plans-${randomUUID()}.tmp`);
  await mkdir(directory, { recursive: true });
  await writeFile(temporary, `${JSON.stringify(store, null, 2)}\n`);
  await rename(temporary, STORE_PATH);
}

function queueWrite(change: (store: PendingPlanStore) => void) {
  const next = pendingWrite.then(async () => {
    const store = await loadStore();
    change(store);
    await writeStore(store);
  });
  pendingWrite = next.catch(() => undefined);
  return next;
}

export async function getPendingWhatsAppPlan(conversationId: string) {
  await pendingWrite;
  return (await loadStore()).conversations[conversationId] ?? null;
}

export function savePendingWhatsAppPlan(
  userId: string,
  conversationId: string,
  suggestions: AssistantSuggestion[],
  currentIndex = 0
) {
  return queueWrite((store) => {
    store.conversations[conversationId] = {
      userId,
      conversationId,
      suggestions,
      currentIndex,
      updatedAt: new Date().toISOString(),
    };
  });
}

export function clearPendingWhatsAppPlan(conversationId: string) {
  return queueWrite((store) => {
    delete store.conversations[conversationId];
  });
}
