const STORAGE_PREFIX = "trilha-progress:";
const CHANGE_EVENT = "trilha-progress-changed";
const EMPTY_IDS: string[] = [];

/**
 * Progresso do aluno vive só no navegador (não há endpoint de escrita para a
 * trilha). Guardamos apenas o que foi concluído *além* do estado semente do
 * JSON — o merge (semente ∪ localStorage) é feito por quem consome isto
 * (ver use-learning-path-progress.ts, via useSyncExternalStore).
 *
 * O cache abaixo garante que a snapshot só troca de referência quando o
 * valor bruto no localStorage muda — necessário porque useSyncExternalStore
 * chama getSnapshot a cada render e espera igualdade referencial quando nada
 * mudou.
 */
let cache: { subjectCode: string; raw: string | null; parsed: string[] } | null = null;

function readSnapshot(subjectCode: string): string[] {
  if (typeof window === "undefined") return EMPTY_IDS;

  const raw = window.localStorage.getItem(STORAGE_PREFIX + subjectCode);
  if (cache && cache.subjectCode === subjectCode && cache.raw === raw) {
    return cache.parsed;
  }

  let parsed: string[] = EMPTY_IDS;
  if (raw) {
    try {
      const value: unknown = JSON.parse(raw);
      if (Array.isArray(value)) {
        parsed = value.filter((id): id is string => typeof id === "string");
      }
    } catch {
      parsed = EMPTY_IDS;
    }
  }

  cache = { subjectCode, raw, parsed };
  return parsed;
}

export function getStoredCompletedLessonIdsSnapshot(subjectCode: string): string[] {
  return readSnapshot(subjectCode);
}

/** Snapshot usado durante SSR/hidratação — sempre vazio, já que localStorage não existe no servidor. */
export function getServerCompletedLessonIdsSnapshot(): string[] {
  return EMPTY_IDS;
}

export function subscribeToProgressChanges(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", callback);
  window.addEventListener(CHANGE_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(CHANGE_EVENT, callback);
  };
}

export function markLessonCompletedInStorage(subjectCode: string, lessonId: string): void {
  if (typeof window === "undefined") return;
  const current = new Set(readSnapshot(subjectCode));
  current.add(lessonId);
  window.localStorage.setItem(STORAGE_PREFIX + subjectCode, JSON.stringify([...current]));
  cache = null;
  // "storage" só dispara em outras abas — disparamos manualmente para a própria aba reagir.
  window.dispatchEvent(new Event(CHANGE_EVENT));
}
