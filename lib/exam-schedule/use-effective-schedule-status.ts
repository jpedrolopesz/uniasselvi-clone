"use client";

import { useSyncExternalStore } from "react";
import {
  getServerScheduleOverrideSnapshot,
  getStoredScheduleOverride,
  subscribeToScheduleOverrideChanges,
} from "@/lib/exam-schedule/schedule-storage";
import type { ExamSession } from "@/lib/types/derived";

export interface EffectiveScheduleStatus {
  status: "scheduled" | "cancelled" | "not_scheduled";
  effectiveSession: ExamSession | null;
}

/**
 * Combina o dado semente (server) com a sobreposição local (client, ver
 * schedule-storage.ts) para decidir o estado real do agendamento. Único
 * lugar com essa lógica — tanto o resumo interativo quanto o rótulo
 * "Situação atual" do cabeçalho a usam, para nunca mostrarem datas
 * diferentes na mesma página.
 */
export function useEffectiveScheduleStatus({
  subjectCode,
  testCode,
  hasSeedSchedule,
  seedSession,
  scheduleOptions,
}: {
  subjectCode: string;
  testCode: string;
  hasSeedSchedule: boolean;
  seedSession: ExamSession | null;
  scheduleOptions: ExamSession[];
}): EffectiveScheduleStatus {
  const override = useSyncExternalStore(
    subscribeToScheduleOverrideChanges,
    () => getStoredScheduleOverride(subjectCode, testCode),
    getServerScheduleOverrideSnapshot
  );

  if (override?.kind === "cancelled") {
    return { status: "cancelled", effectiveSession: null };
  }

  const effectiveSessionId =
    override?.kind === "scheduled" ? override.scheduleOptionId : hasSeedSchedule ? seedSession?.id ?? null : null;

  if (!effectiveSessionId) {
    return { status: "not_scheduled", effectiveSession: null };
  }

  const effectiveSession =
    seedSession?.id === effectiveSessionId
      ? seedSession
      : (scheduleOptions.find((s) => s.id === effectiveSessionId) ?? null);

  return { status: effectiveSession ? "scheduled" : "not_scheduled", effectiveSession };
}
