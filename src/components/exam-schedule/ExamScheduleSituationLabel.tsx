"use client";

import { useEffectiveScheduleStatus } from "@/lib/exam-schedule/use-effective-schedule-status";
import type { ExamSession } from "@/lib/types/derived";
import type { ScheduleOverride } from "@/lib/exam-schedule/schedule-repository";

interface ExamScheduleSituationLabelProps {
  subjectCode: string;
  testCode: string;
  hasSeedSchedule: boolean;
  seedSession: ExamSession | null;
  scheduleOptions: ExamSession[];
  initialOverride: ScheduleOverride | null;
}

/**
 * Mesma fonte de verdade do resumo interativo (ver use-effective-schedule-status.ts)
 * — evita o cabeçalho (antes renderizado só a partir do dado semente do
 * servidor) mostrar uma data diferente da que aparece no resumo depois que
 * o aluno reagenda ou cancela pelo navegador.
 */
export function ExamScheduleSituationLabel({
  subjectCode,
  testCode,
  hasSeedSchedule,
  seedSession,
  scheduleOptions,
  initialOverride,
}: ExamScheduleSituationLabelProps) {
  const { status, effectiveSession } = useEffectiveScheduleStatus({
    subjectCode,
    testCode,
    hasSeedSchedule,
    seedSession,
    scheduleOptions,
    initialOverride,
  });

  if (status === "scheduled" && effectiveSession) {
    return <>Agendada para {effectiveSession.displayDate}</>;
  }
  if (status === "cancelled") {
    return <>Cancelada</>;
  }
  return <>Aguardando agendamento</>;
}
