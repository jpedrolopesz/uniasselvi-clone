const STORAGE_PREFIX = "agendamento-prova:";
const CHANGE_EVENT = "agendamento-prova-changed";

/**
 * O projeto não tem backend (ver lib/data/read-json-file.ts — só leitura de
 * JSON estático) e por isso não há endpoint real para confirmar/cancelar um
 * agendamento. Seguindo o mesmo padrão já usado para o progresso da trilha
 * (lib/learning-path/progress-storage.ts), o estado de agendamento feito
 * pelo aluno nesta funcionalidade vive só no navegador, como uma
 * sobreposição (override) por cima do `has_schedule`/`schedule` que já vem
 * do JSON semente. Isso é uma limitação documentada: em produção, a
 * confirmação precisa ser revalidada por um endpoint real antes de valer.
 */
export type ScheduleOverride =
  | { kind: "scheduled"; scheduleOptionId: string; confirmedAt: string }
  | { kind: "cancelled"; cancelledAt: string };

let cache: { key: string; raw: string | null; parsed: ScheduleOverride | null } | null = null;

function storageKey(subjectCode: string, testCode: string): string {
  return `${STORAGE_PREFIX}${subjectCode}:${testCode}`;
}

function readSnapshot(subjectCode: string, testCode: string): ScheduleOverride | null {
  if (typeof window === "undefined") return null;

  const key = storageKey(subjectCode, testCode);
  const raw = window.localStorage.getItem(key);
  if (cache && cache.key === key && cache.raw === raw) {
    return cache.parsed;
  }

  let parsed: ScheduleOverride | null = null;
  if (raw) {
    try {
      const value: unknown = JSON.parse(raw);
      if (value && typeof value === "object" && "kind" in value) {
        parsed = value as ScheduleOverride;
      }
    } catch {
      parsed = null;
    }
  }

  cache = { key, raw, parsed };
  return parsed;
}

export function getStoredScheduleOverride(
  subjectCode: string,
  testCode: string
): ScheduleOverride | null {
  return readSnapshot(subjectCode, testCode);
}

/** Snapshot usado durante SSR/hidratação — sempre nulo, já que localStorage não existe no servidor. */
export function getServerScheduleOverrideSnapshot(): ScheduleOverride | null {
  return null;
}

export function subscribeToScheduleOverrideChanges(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", callback);
  window.addEventListener(CHANGE_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(CHANGE_EVENT, callback);
  };
}

function write(subjectCode: string, testCode: string, value: ScheduleOverride): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(storageKey(subjectCode, testCode), JSON.stringify(value));
  cache = null;
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function confirmScheduleInStorage(
  subjectCode: string,
  testCode: string,
  scheduleOptionId: string
): void {
  write(subjectCode, testCode, {
    kind: "scheduled",
    scheduleOptionId,
    confirmedAt: new Date().toISOString(),
  });
}

export function cancelScheduleInStorage(subjectCode: string, testCode: string): void {
  write(subjectCode, testCode, { kind: "cancelled", cancelledAt: new Date().toISOString() });
}
