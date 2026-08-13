import type { VitruSemanticSnapshot } from "@/lib/vitru/semantic-snapshot";
import { normalizeTokens, scoreOverlap } from "@/lib/vitru/trilha-resolution";

export const REFERENCE_CONFIDENCE_THRESHOLD = 0.75;
export const REFERENCE_AMBIGUITY_MARGIN = 0.15;

export interface ReferenceResolution {
  kind: "date" | "date_range" | "entity" | "ambiguous" | "unresolved";
  value: string | { start: string; end: string } | null;
  source: "focus" | "screen" | "history" | "app_data" | "none";
  confidence: number;
  candidates?: string[];
}

function isoDateAtTimezone(now: string): string {
  return now.slice(0, 10);
}

function addDays(iso: string, days: number): string {
  const date = new Date(`${iso}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function dayOfWeek(iso: string): number {
  return new Date(`${iso}T12:00:00Z`).getUTCDay();
}

export function resolveReference(phrase: string, snapshot: VitruSemanticSnapshot): ReferenceResolution {
  const normalized = normalizeTokens(phrase).join(" ");
  const today = isoDateAtTimezone(snapshot.state.now);

  if (/\b(este|esse)\s+(evento|compromisso|item)\b/.test(normalized)) {
    return snapshot.state.focus
      ? { kind: "entity", value: snapshot.state.focus.id, source: "focus", confidence: 1 }
      : { kind: "ambiguous", value: null, source: "none", confidence: 0, candidates: [] };
  }
  if (/\bamanha\b/.test(normalized)) {
    return { kind: "date", value: addDays(today, 1), source: "app_data", confidence: 1 };
  }
  if (/\bproxima\s+semana\b/.test(normalized)) {
    const untilMonday = ((8 - dayOfWeek(today)) % 7) || 7;
    const start = addDays(today, untilMonday);
    return { kind: "date_range", value: { start, end: addDays(start, 6) }, source: "app_data", confidence: 1 };
  }

  const dayMatch = normalized.match(/\b(?:dia\s+)?(\d{1,2})\b/);
  if (dayMatch) {
    const day = Number(dayMatch[1]);
    if (day < 1 || day > 31) return { kind: "ambiguous", value: null, source: "none", confidence: 0 };
    const visibleStart = snapshot.state.temporal.visibleStart;
    const [year, month] = visibleStart.split("-").map(Number);
    const asksNext = /\b(proximo|seguinte)\b/.test(normalized);
    const date = new Date(Date.UTC(year, month - 1 + (asksNext ? 1 : 0), day));
    if (date.getUTCDate() !== day) return { kind: "ambiguous", value: null, source: "none", confidence: 0 };
    const value = date.toISOString().slice(0, 10);
    const onScreen = !asksNext && value >= snapshot.state.temporal.visibleStart && value <= snapshot.state.temporal.visibleEnd;
    return { kind: "date", value, source: onScreen ? "screen" : "app_data", confidence: onScreen ? 1 : 0.95 };
  }

  const candidates = snapshot.sections.flatMap((section) => section.items).map((item) => ({
    id: item.id,
    score: scoreOverlap(phrase, `${item.name} ${item.status ?? ""} ${Object.values(item.facts ?? {}).join(" ")}`),
  })).sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
  const [best, second] = candidates;
  if (best?.score >= REFERENCE_CONFIDENCE_THRESHOLD) {
    if (second && best.score - second.score <= REFERENCE_AMBIGUITY_MARGIN) {
      return { kind: "ambiguous", value: null, source: "screen", confidence: best.score, candidates: candidates.slice(0, 3).map(({ id }) => id) };
    }
    return { kind: "entity", value: best.id, source: "screen", confidence: best.score };
  }
  return { kind: "unresolved", value: null, source: "none", confidence: best?.score ?? 0 };
}
