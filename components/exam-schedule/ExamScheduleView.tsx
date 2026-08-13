"use client";

import { useEffect, useState } from "react";
import { EmptyState } from "@/components/layout/EmptyState";
import { ExamDateCalendar } from "@/components/exam-schedule/ExamDateCalendar";
import { ExamLocationCard } from "@/components/exam-schedule/ExamLocationCard";
import { CityComparisonNotice } from "@/components/exam-schedule/CityComparisonNotice";
import { ClassmatesSection } from "@/components/exam-schedule/ClassmatesSection";
import { ExamScheduleSummary } from "@/components/exam-schedule/ExamScheduleSummary";
import { publishScheduleOverride } from "@/lib/exam-schedule/schedule-client-state";
import type { ScheduleOverride } from "@/lib/exam-schedule/schedule-repository";
import { useEffectiveScheduleStatus } from "@/lib/exam-schedule/use-effective-schedule-status";
import { compareStudentAndExamCity } from "@/lib/exam-schedule/normalize-city";
import { isSessionFull } from "@/lib/selectors/exam-schedule-selectors";
import type { ExamSession } from "@/lib/types/derived";
import type { RelatedStudentsGroups } from "@/lib/exam-schedule/group-related-students";
import { consumePendingAction, createPendingAction, executePendingWrite, type PendingAction } from "@/lib/vitru/pending-action";
import { resolveTarget } from "@/lib/vitru/resolve-target";
import { buildAssessmentSchedulingSnapshot } from "@/lib/vitru/adapters/assessment-scheduling";
import { appendVitruDebug } from "@/lib/vitru/debug-store";

const EMPTY_GROUPS: RelatedStudentsGroups = {
  classmates: [],
  sameCityStudents: [],
  travelingClassmates: [],
  examCityStudents: [],
};

interface ExamScheduleViewProps {
  subjectCode: string;
  testCode: string;
  examName: string;
  hasSeedSchedule: boolean;
  seedSession: ExamSession | null;
  scheduleOptions: ExamSession[];
  optionsLoadError: boolean;
  allowCancelSchedule: boolean;
  studentCity: string | null;
  studentState: string | null;
  groupsBySessionId: Record<string, RelatedStudentsGroups>;
  schedulingWindowOpen: boolean;
  userId: string;
  initialOverride: ScheduleOverride | null;
}

export function ExamScheduleView({
  subjectCode,
  testCode,
  examName,
  hasSeedSchedule,
  seedSession,
  scheduleOptions,
  optionsLoadError,
  allowCancelSchedule,
  studentCity,
  studentState,
  groupsBySessionId,
  schedulingWindowOpen,
  userId,
  initialOverride,
}: ExamScheduleViewProps) {
  const { status, effectiveSession } = useEffectiveScheduleStatus({
    subjectCode,
    testCode,
    hasSeedSchedule,
    seedSession,
    scheduleOptions,
    initialOverride,
  });
  const isScheduled = status === "scheduled";
  const isCancelled = status === "cancelled";

  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [isReschedulingView, setIsReschedulingView] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [pendingCancel, setPendingCancel] = useState(false);
  const [cancelConfirmationStage, setCancelConfirmationStage] = useState(0);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [reinforcedConfirmation, setReinforcedConfirmation] = useState(false);

  const canRebook = scheduleOptions.length > 0 && schedulingWindowOpen;

  const selectedSession = scheduleOptions.find((s) => s.id === selectedSessionId) ?? null;
  const pendingArgs = selectedSession ? { subjectCode, testCode, scheduleOptionId: selectedSession.id } : null;

  function publishPending(pending: PendingAction | null, summary?: string) {
    setPendingAction(pending);
    appendVitruDebug({ kind: "action", data: { type: "pending_action", pending, summary } });
  }

  function proposeSession(session: ExamSession) {
    setSelectedSessionId(session.id);
    const args = { subjectCode, testCode, scheduleOptionId: session.id };
    publishPending(createPendingAction(isScheduled ? "reschedule_exam" : "schedule_exam", args, "assessment-scheduling"), `${examName}: ${session.displayDate}, ${session.startTime ?? ""}, ${session.location.name}`);
  }

  useEffect(() => {
    const handleCommand = (event: Event) => {
      const command = (event as CustomEvent<{ id: string; type: string; referencia?: string }>).detail;
      if (!command) return;
      const respond = (ok: boolean, message: string, extra: object = {}) => window.dispatchEvent(new CustomEvent("vitru-schedule-result", { detail: { actionId: command.id, ok, message, ...extra } }));
      if (command.type === "list_options") { respond(true, `${scheduleOptions.length} horários disponíveis.`); return; }
      if (command.type === "select_option") {
        const snapshot = buildAssessmentSchedulingSnapshot({ code: subjectCode, name: subjectCode }, testCode, examName, scheduleOptions);
        const resolution = resolveTarget(command.referencia ?? "", snapshot);
        if (resolution.ambiguous) { respond(false, "Encontrei mais de um horário. Qual deles você quer?", { ambiguous: true, resolverScore: resolution.score }); return; }
        const session = scheduleOptions.find(item => `schedule-option:${item.id}:select` === resolution.actionId);
        if (!session) { respond(false, "Não encontrei esse horário.", { resolverScore: resolution.score }); return; }
        proposeSession(session); respond(true, "Opção selecionada. Revise o resumo na tela e diga confirmar.", { resolvedTarget: resolution.actionId, resolverScore: resolution.score }); return;
      }
      if (command.type === "confirm_write") {
        if (!selectedSession || !pendingArgs) { respond(false, "Não há nada pendente para confirmar."); return; }
        void handleConfirm(selectedSession).then(result => respond(result.ok, result.message));
      }
    };
    window.addEventListener("vitru-schedule-command", handleCommand);
    return () => window.removeEventListener("vitru-schedule-command", handleCommand);
  });

  async function handleConfirm(session: ExamSession): Promise<{ ok: boolean; message: string }> {
    const args = { subjectCode, testCode, scheduleOptionId: session.id };
    if (isScheduled && !reinforcedConfirmation) {
      const authorization = consumePendingAction(pendingAction, args, "assessment-scheduling");
      publishPending(pendingAction);
      if (!authorization.ok) {
        const message = "Confirmação recusada: não há uma proposta válida e vinculada a esta opção.";
        setSubmitError(message); return { ok: false, message };
      }
      setReinforcedConfirmation(true);
      publishPending(createPendingAction("reschedule_exam_reinforced", args, "assessment-scheduling"), `REAGENDAMENTO — ${examName}: ${session.displayDate}, ${session.startTime ?? ""}, ${session.location.name}`);
      const message = "Reagendamento exige uma segunda confirmação. Revise novamente o resumo.";
      setSubmitError(message); return { ok: false, message };
    }
    setSubmitError(null);
    setIsSubmitting(true);
    // O projeto não tem backend (ver diagnóstico) — esta é a melhor revalidação possível:
    // reler a vaga a partir do mesmo snapshot carregado no servidor antes de gravar o override local.
    await new Promise((resolve) => setTimeout(resolve, 350));
    if (isSessionFull(session)) {
      setSubmitError("Esta vaga acabou de ficar indisponível. Escolha outro horário.");
      setIsSubmitting(false);
      return { ok: false, message: "Esta vaga acabou de ficar indisponível." };
    }
    const authorization = executePendingWrite(pendingAction, args, "assessment-scheduling", () => true);
    publishPending(pendingAction);
    if (!authorization.ok) {
      setIsSubmitting(false);
      return { ok: false, message: "A autorização vinculada foi recusada pela camada de persistência." };
    }
    const response = await fetch("/api/v1/vitru/exam-schedule", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId, subjectCode, testCode, scheduleOptionId: session.id, operation: "schedule", authorization: authorization.pending }) });
    const result = await response.json();
    if (!response.ok || !result.ok) { setIsSubmitting(false); return { ok: false, message: "O PGlite recusou o agendamento." }; }
    publishScheduleOverride(subjectCode, testCode, result.override);
    setIsSubmitting(false);
    setSelectedSessionId(null);
    setIsReschedulingView(false);
    publishPending(null);
    setReinforcedConfirmation(false);
    return { ok: true, message: "Agendamento gravado após confirmação vinculada." };
  }

  async function handleCancel() {
    const args = { subjectCode, testCode, operation: "cancel" };
    const authorization = consumePendingAction(pendingAction, args, "assessment-scheduling");
    if (!authorization.ok) { setSubmitError("Cancelamento recusado: confirmação inválida."); return; }
    if (cancelConfirmationStage === 1) {
      setCancelConfirmationStage(2);
      publishPending(createPendingAction("cancel_exam_reinforced", args, "assessment-scheduling"), `EXCLUSÃO — cancelar ${examName}`);
      return;
    }
    setIsSubmitting(true);
    const response = await fetch("/api/v1/vitru/exam-schedule", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId, subjectCode, testCode, operation: "cancel", authorization: authorization.pending }) });
    const result = await response.json();
    if (!response.ok || !result.ok) {
      setSubmitError("A autorização vinculada foi recusada pela camada de persistência.");
      setIsSubmitting(false);
      return;
    }
    publishScheduleOverride(subjectCode, testCode, result.override);
    setIsSubmitting(false);
    setPendingCancel(false);
    setCancelConfirmationStage(0);
    publishPending(null);
  }

  if (isReschedulingView) {
    return renderChooseMode();
  }

  if (isScheduled && effectiveSession) {
    const comparison = compareStudentAndExamCity(
      studentCity,
      studentState,
      effectiveSession.location.city,
      effectiveSession.location.state
    );
    const groups = groupsBySessionId[effectiveSession.id] ?? EMPTY_GROUPS;

    return (
      <div className="flex flex-col gap-4">
        <p role="status" className="sr-only">
          Prova agendada para {effectiveSession.displayDate}.
        </p>
        <ExamScheduleSummary examName={examName} session={effectiveSession} comparison={comparison}>
          <div className="flex flex-wrap gap-2">
            {canRebook && (
              <button
                type="button"
                onClick={() => setIsReschedulingView(true)}
                className="rounded-full bg-bg-app px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110"
              >
                Alterar data
              </button>
            )}
            {allowCancelSchedule && !pendingCancel && (
              <button
                type="button"
                onClick={() => {
                  setPendingCancel(true);
                  setCancelConfirmationStage(1);
                  publishPending(createPendingAction("cancel_exam", { subjectCode, testCode, operation: "cancel" }, "assessment-scheduling"), `Cancelar ${examName}`);
                }}
                className="rounded-full bg-bg-app px-4 py-2 text-sm font-semibold text-accent-red transition hover:brightness-110"
              >
                Cancelar agendamento
              </button>
            )}
            {allowCancelSchedule && pendingCancel && (
              <div className="flex items-center gap-2 text-sm text-white">
                <span>{cancelConfirmationStage === 2 ? `Confirma novamente a exclusão de ${examName}?` : `Cancelar ${examName}?`}</span>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => void handleCancel()}
                  className="rounded-full bg-accent-red px-3 py-1.5 text-xs font-semibold text-black disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? "Cancelando…" : cancelConfirmationStage === 2 ? "Confirmar exclusão" : "Continuar"}
                </button>
                <button
                  type="button"
                  onClick={() => setPendingCancel(false)}
                  className="rounded-full bg-bg-card px-3 py-1.5 text-xs font-semibold text-white"
                >
                  Voltar
                </button>
              </div>
            )}
          </div>
        </ExamScheduleSummary>

        <ExamLocationCard location={effectiveSession.location} />
        <CityComparisonNotice comparison={comparison} />
        <ClassmatesSection
          groups={groups}
          examCity={effectiveSession.location.city}
          studentCity={studentCity}
          showTravelSection={!comparison.isSameCity}
        />
      </div>
    );
  }

  if (isCancelled) {
    return (
      <div className="flex flex-col gap-4">
        <EmptyState message="Agendamento cancelado." />
        {canRebook ? (
          <button
            type="button"
            onClick={() => setIsReschedulingView(true)}
            className="w-fit self-center rounded-full bg-accent-green px-5 py-2 text-sm font-semibold text-black transition hover:brightness-110"
          >
            Agendar novamente
          </button>
        ) : (
          <EmptyState message="Nenhuma nova data disponível no momento." />
        )}
      </div>
    );
  }

  return renderChooseMode();

  function renderChooseMode() {
    if (optionsLoadError) {
      return <EmptyState message="Erro ao carregar as datas disponíveis. Tente novamente mais tarde." />;
    }
    if (!schedulingWindowOpen) {
      return <EmptyState message="O prazo para agendar esta prova já foi encerrado." />;
    }
    if (scheduleOptions.length === 0) {
      return <EmptyState message="Nenhuma data está disponível para esta prova no momento." />;
    }

    const comparison = selectedSession
      ? compareStudentAndExamCity(
          studentCity,
          studentState,
          selectedSession.location.city,
          selectedSession.location.state
        )
      : null;
    const groups = selectedSession ? groupsBySessionId[selectedSession.id] ?? EMPTY_GROUPS : null;

    return (
      <div className="flex flex-col gap-4">
        <div className="rounded-xl bg-bg-card p-4">
          <ExamDateCalendar
            sessions={scheduleOptions}
            selectedSessionId={selectedSessionId}
            onSelectSession={(id) => {
              const session = scheduleOptions.find(item => item.id === id);
              if (session) proposeSession(session);
              setSubmitError(null);
            }}
          />
        </div>

        {selectedSession && comparison && groups && (
          <>
            <ExamLocationCard location={selectedSession.location} />
            <CityComparisonNotice comparison={comparison} />
            <ClassmatesSection
              groups={groups}
              examCity={selectedSession.location.city}
              studentCity={studentCity}
              showTravelSection={!comparison.isSameCity}
            />

            <ExamScheduleSummary examName={examName} session={selectedSession} comparison={comparison}>
              <div className="flex flex-col gap-2">
                {submitError && (
                  <p role="alert" className="text-sm text-accent-red">
                    {submitError}
                  </p>
                )}
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleConfirm(selectedSession)}
                    className="rounded-full bg-accent-green px-5 py-2 text-sm font-semibold text-black transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSubmitting ? "Confirmando…" : "Confirmar agendamento"}
                  </button>
                  {isReschedulingView && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsReschedulingView(false);
                        setSelectedSessionId(null);
                      }}
                      className="rounded-full bg-bg-app px-4 py-2 text-sm font-semibold text-white"
                    >
                      Manter agendamento atual
                    </button>
                  )}
                </div>
              </div>
            </ExamScheduleSummary>
          </>
        )}
      </div>
    );
  }
}
