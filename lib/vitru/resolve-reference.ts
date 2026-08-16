import type { VitruSemanticSnapshot } from "@/lib/vitru/semantic-snapshot";
import { normalizeLexical, normalizeTokens, scoreOverlap } from "@/lib/vitru/trilha-resolution";
import { isReferenceAmbiguous, REFERENCE_ABSOLUTE_AMBIGUITY_MARGIN } from "@/lib/vitru/resolution-ambiguity";

export const REFERENCE_CONFIDENCE_THRESHOLD = 0.75;
export const REFERENCE_AMBIGUITY_MARGIN = REFERENCE_ABSOLUTE_AMBIGUITY_MARGIN;

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

function rangeSource(start: string, end: string, snapshot: VitruSemanticSnapshot): "screen" | "app_data" {
  return start >= snapshot.state.temporal.visibleStart && end <= snapshot.state.temporal.visibleEnd
    ? "screen"
    : "app_data";
}

function monthRange(iso: string, offset: number): { start: string; end: string } {
  const [year, month] = iso.split("-").map(Number);
  const startDate = new Date(Date.UTC(year, month - 1 + offset, 1));
  const endDate = new Date(Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth() + 1, 0));
  return { start: startDate.toISOString().slice(0, 10), end: endDate.toISOString().slice(0, 10) };
}

function resolveDay(day: number, asksNext: boolean, snapshot: VitruSemanticSnapshot, confidence: number): ReferenceResolution {
  if (day < 1 || day > 31) return { kind: "ambiguous", value: null, source: "none", confidence: 0 };
  const [year, month] = snapshot.state.temporal.visibleStart.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1 + (asksNext ? 1 : 0), day));
  if (date.getUTCDate() !== day) return { kind: "ambiguous", value: null, source: "none", confidence: 0 };
  const value = date.toISOString().slice(0, 10);
  return { kind: "date", value, source: rangeSource(value, value, snapshot), confidence };
}

function scoreEntities(phrase: string, snapshot: VitruSemanticSnapshot) {
  return snapshot.sections.flatMap((section) => section.items).map((item) => ({
    id: item.id,
    score: scoreOverlap(phrase, `${item.name} ${item.referenceCodes?.join(" ") ?? ""} ${item.status ?? ""} ${Object.values(item.facts ?? {}).join(" ")}`),
  })).sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
}

function resolveExactReferenceCode(phrase: string, snapshot: VitruSemanticSnapshot): ReferenceResolution | null {
  const phraseTokens = new Set(normalizeTokens(phrase));
  const matches = snapshot.sections.flatMap((section) => section.items).filter((item) =>
    item.referenceCodes?.some((code) => normalizeTokens(code).every((token) => phraseTokens.has(token)))
  );
  return matches.length === 1
    ? { kind: "entity", value: matches[0].id, source: "screen", confidence: 1 }
    : null;
}

export function resolveReference(phrase: string, snapshot: VitruSemanticSnapshot): ReferenceResolution {
  const lexical = normalizeLexical(phrase);
  const normalized = normalizeTokens(phrase).join(" ");
  const today = isoDateAtTimezone(snapshot.state.now);

  const codeResolution = resolveExactReferenceCode(phrase, snapshot);
  if (codeResolution) return codeResolution;

  if (/\b(este|esse)\s+(evento|compromisso|item)\b/.test(lexical)) {
    return snapshot.state.focus
      ? { kind: "entity", value: snapshot.state.focus.id, source: "focus", confidence: 1 }
      : { kind: "ambiguous", value: null, source: "none", confidence: 0, candidates: [] };
  }
  if (/\bhoje\b/.test(lexical)) {
    return { kind: "date", value: today, source: rangeSource(today, today, snapshot), confidence: 1 };
  }
  if (/\bontem\b/.test(lexical)) {
    const value = addDays(today, -1);
    return { kind: "date", value, source: rangeSource(value, value, snapshot), confidence: 1 };
  }
  if (/\bamanha\b/.test(lexical)) {
    return { kind: "date", value: addDays(today, 1), source: "app_data", confidence: 1 };
  }
  if (/\b(esta|essa)\s+semana\b/.test(lexical)) {
    const start = addDays(today, -((dayOfWeek(today) + 6) % 7));
    const end = addDays(start, 6);
    return { kind: "date_range", value: { start, end }, source: rangeSource(start, end, snapshot), confidence: 1 };
  }
  if (/\bproxima\s+semana\b/.test(lexical)) {
    const untilMonday = ((8 - dayOfWeek(today)) % 7) || 7;
    const start = addDays(today, untilMonday);
    const end = addDays(start, 6);
    return { kind: "date_range", value: { start, end }, source: rangeSource(start, end, snapshot), confidence: 1 };
  }
  if (/\b(este|esse)\s+mes\b/.test(lexical)) {
    const value = monthRange(today, 0);
    return { kind: "date_range", value, source: rangeSource(value.start, value.end, snapshot), confidence: 1 };
  }
  if (/\bproximo\s+mes\b/.test(lexical)) {
    const value = monthRange(today, 1);
    return { kind: "date_range", value, source: rangeSource(value.start, value.end, snapshot), confidence: 1 };
  }

  const dayMatch = lexical.match(/\b(?:(?:no|para\s+o|proximo|seguinte)\s+)?dia\s+(\d{1,2})\b/);
  if (dayMatch) {
    const asksNext = /\b(proximo|seguinte)\s+dia\b/.test(lexical);
    return resolveDay(Number(dayMatch[1]), asksNext, snapshot, asksNext ? 0.95 : 1);
  }

  const candidates = scoreEntities(normalized, snapshot);
  const [best, second] = candidates;
  if (best?.score >= REFERENCE_CONFIDENCE_THRESHOLD) {
    if (second && isReferenceAmbiguous(best.score, second.score)) {
      return { kind: "ambiguous", value: null, source: "screen", confidence: best.score, candidates: candidates.slice(0, 3).map(({ id }) => id) };
    }
    return { kind: "entity", value: best.id, source: "screen", confidence: best.score };
  }

  if ((best?.score ?? 0) === 0) {
    const bareNumber = lexical.match(/\b(\d{1,2})\b/);
    if (bareNumber) return resolveDay(Number(bareNumber[1]), false, snapshot, 0.6);
  }
  return { kind: "unresolved", value: null, source: "none", confidence: best?.score ?? 0 };
}
