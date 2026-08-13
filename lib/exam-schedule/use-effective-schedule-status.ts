"use client";

import { useSyncExternalStore } from "react";
import {
  getScheduleOverrideSnapshot,
  seedScheduleOverride,
  subscribeToScheduleOverrideChanges,
} from "@/lib/exam-schedule/schedule-client-state";
import type { ScheduleOverride } from "@/lib/exam-schedule/schedule-repository";
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
  initialOverride,
}: {
  subjectCode: string;
  testCode: string;
  hasSeedSchedule: boolean;
  seedSession: ExamSession | null;
  scheduleOptions: ExamSession[];
  initialOverride: ScheduleOverride | null;
}): EffectiveScheduleStatus {
  seedScheduleOverride(subjectCode, testCode, initialOverride);
  const override = useSyncExternalStore(
    subscribeToScheduleOverrideChanges,
    () => getScheduleOverrideSnapshot(subjectCode, testCode),
    () => initialOverride
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
