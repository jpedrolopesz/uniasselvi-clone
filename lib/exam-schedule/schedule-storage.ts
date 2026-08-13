/**
 * Compatibilidade exclusiva dos testes adversariais antigos. A aplicação não
 * importa este módulo e nenhum dado é escrito no navegador; produção persiste
 * por schedule-repository.ts no PGlite.
 */
import { hashPendingArgs, type PendingAction } from "@/lib/vitru/pending-action";
import type { ScheduleOverride } from "@/lib/exam-schedule/schedule-repository";

let testValue: ScheduleOverride | null = null;
const used = new WeakSet<PendingAction>();
export function getStoredScheduleOverride(_subjectCode?: string, _testCode?: string) { return testValue; }
export function resetScheduleStorageForTests() { testValue = null; }
export function confirmScheduleInStorage(subjectCode: string, testCode: string, scheduleOptionId: string, authorization?: PendingAction | null) {
  const args = { subjectCode, testCode, scheduleOptionId };
  if (!authorization?.consumed || authorization.surface !== "assessment-scheduling" || authorization.argsHash !== hashPendingArgs(args) || used.has(authorization)) return false;
  used.add(authorization); testValue = { kind: "scheduled", scheduleOptionId }; return true;
}
export function cancelScheduleInStorage(subjectCode: string, testCode: string, authorization?: PendingAction | null) {
  const args = { subjectCode, testCode, operation: "cancel" };
  if (!authorization?.consumed || authorization.surface !== "assessment-scheduling" || authorization.argsHash !== hashPendingArgs(args) || used.has(authorization)) return false;
  used.add(authorization); testValue = { kind: "cancelled" }; return true;
}
