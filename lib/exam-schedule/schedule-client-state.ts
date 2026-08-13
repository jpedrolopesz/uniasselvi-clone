import type { ScheduleOverride } from "@/lib/exam-schedule/schedule-repository";

const values = new Map<string, ScheduleOverride | null>();
const listeners = new Set<() => void>();
const keyFor = (subjectCode: string, testCode: string) => `${subjectCode}:${testCode}`;

export function publishScheduleOverride(subjectCode: string, testCode: string, override: ScheduleOverride | null) {
  values.set(keyFor(subjectCode, testCode), override);
  listeners.forEach((listener) => listener());
}
export function seedScheduleOverride(subjectCode: string, testCode: string, override: ScheduleOverride | null) {
  const key = keyFor(subjectCode, testCode);
  if (!values.has(key)) values.set(key, override);
}
export function subscribeToScheduleOverrideChanges(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
export function getScheduleOverrideSnapshot(subjectCode: string, testCode: string) { return values.get(keyFor(subjectCode, testCode)) ?? null; }
