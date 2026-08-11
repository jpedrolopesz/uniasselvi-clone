import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

/**
 * Consumo de eventos do inbox (spec §8). Não existe, neste projeto, um
 * sistema de inbox real — nenhuma tela ou workflow decide quando um evento
 * deve ser criado (ex.: "aluno marcou 3 trechos nesta aula"). Esse gatilho
 * fica fora do escopo desta versão; este módulo cobre só a leitura/consumo
 * idempotente de um evento já existente, para que AssistantPanel possa
 * mostrar a mensagem de retomada quando `entryEventId` aponta para um
 * evento válido e ainda não consumido.
 */
export interface InboxEvent {
  id: string;
  userId: string;
  surface: "trilha";
  objectId: string;
  lessonId: string;
  /** Motivo concreto, já pronto para virar a mensagem de retomada (ex.: "vi que você marcou três trechos na aula 14"). */
  reason: string;
  createdAt: string;
  consumedAt: string | null;
}

interface InboxEventStore {
  events: Record<string, InboxEvent>;
}

const STORE_PATH = path.join(process.cwd(), ".vitru", "inbox-events.local.json");

let pendingWrite: Promise<unknown> = Promise.resolve();

async function loadStore(): Promise<InboxEventStore> {
  try {
    return JSON.parse(await readFile(STORE_PATH, "utf8")) as InboxEventStore;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return { events: {} };
    }
    throw error;
  }
}

async function writeStore(store: InboxEventStore) {
  const directory = path.dirname(STORE_PATH);
  const temporary = path.join(directory, `.inbox-events-${randomUUID()}.tmp`);
  await mkdir(directory, { recursive: true });
  await writeFile(temporary, `${JSON.stringify(store, null, 2)}\n`);
  await rename(temporary, STORE_PATH);
}

function queueWrite(change: (store: InboxEventStore) => void) {
  const next = pendingWrite.then(async () => {
    const store = await loadStore();
    change(store);
    await writeStore(store);
  });
  pendingWrite = next.catch(() => undefined);
  return next;
}

/** Primitiva de escrita genérica — não é o "produtor" do evento (essa decisão de negócio está fora de escopo), apenas a persistência. */
export function saveInboxEvent(
  event: Omit<InboxEvent, "createdAt" | "consumedAt">
): Promise<void> {
  return queueWrite((store) => {
    store.events[event.id] = { ...event, createdAt: new Date().toISOString(), consumedAt: null };
  });
}

export async function getInboxEvent(eventId: string): Promise<InboxEvent | null> {
  await pendingWrite;
  return (await loadStore()).events[eventId] ?? null;
}

/** Só para reset de estado em teste — produtores com id determinístico (ex.: lib/vitru/wrong-answer-nudge.ts) não têm outro jeito de garantir estado limpo entre execuções. */
export function deleteInboxEvent(eventId: string): Promise<void> {
  return queueWrite((store) => {
    delete store.events[eventId];
  });
}

/**
 * Idempotente: id inexistente ou já consumido não é erro, apenas `null` —
 * quem chama trata isso como "abrir normalmente, sem retomada" (critério de
 * aceite 7), nunca como falha.
 */
export async function consumeInboxEvent(eventId: string): Promise<InboxEvent | null> {
  const existing = await getInboxEvent(eventId);
  if (!existing || existing.consumedAt) return null;

  const consumedAt = new Date().toISOString();
  await queueWrite((store) => {
    const current = store.events[eventId];
    if (current && !current.consumedAt) current.consumedAt = consumedAt;
  });
  return { ...existing, consumedAt };
}
