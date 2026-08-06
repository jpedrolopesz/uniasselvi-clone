"use client";

import { useState } from "react";
import { EmptyState } from "@/components/layout/EmptyState";
import { ExamDateCalendar } from "@/components/exam-schedule/ExamDateCalendar";
import { ExamLocationCard } from "@/components/exam-schedule/ExamLocationCard";
import { CityComparisonNotice } from "@/components/exam-schedule/CityComparisonNotice";
import { ClassmatesSection } from "@/components/exam-schedule/ClassmatesSection";
import { ExamScheduleSummary } from "@/components/exam-schedule/ExamScheduleSummary";
import { cancelScheduleInStorage, confirmScheduleInStorage } from "@/lib/exam-schedule/schedule-storage";
import { useEffectiveScheduleStatus } from "@/lib/exam-schedule/use-effective-schedule-status";
import { compareStudentAndExamCity } from "@/lib/exam-schedule/normalize-city";
import { isSessionFull } from "@/lib/selectors/exam-schedule-selectors";
import type { ExamSession } from "@/lib/types/derived";
import type { RelatedStudentsGroups } from "@/lib/exam-schedule/group-related-students";

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
}: ExamScheduleViewProps) {
  const { status, effectiveSession } = useEffectiveScheduleStatus({
    subjectCode,
    testCode,
    hasSeedSchedule,
    seedSession,
    scheduleOptions,
  });
  const isScheduled = status === "scheduled";
  const isCancelled = status === "cancelled";

  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [isReschedulingView, setIsReschedulingView] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [pendingCancel, setPendingCancel] = useState(false);

  const canRebook = scheduleOptions.length > 0 && schedulingWindowOpen;

  const selectedSession = scheduleOptions.find((s) => s.id === selectedSessionId) ?? null;

  async function handleConfirm(session: ExamSession) {
    setSubmitError(null);
    setIsSubmitting(true);
    // O projeto não tem backend (ver diagnóstico) — esta é a melhor revalidação possível:
    // reler a vaga a partir do mesmo snapshot carregado no servidor antes de gravar o override local.
    await new Promise((resolve) => setTimeout(resolve, 350));
    if (isSessionFull(session)) {
      setSubmitError("Esta vaga acabou de ficar indisponível. Escolha outro horário.");
      setIsSubmitting(false);
      return;
    }
    confirmScheduleInStorage(subjectCode, testCode, session.id);
    setIsSubmitting(false);
    setSelectedSessionId(null);
    setIsReschedulingView(false);
  }

  function handleCancel() {
    setIsSubmitting(true);
    cancelScheduleInStorage(subjectCode, testCode);
    setIsSubmitting(false);
    setPendingCancel(false);
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
                onClick={() => setPendingCancel(true)}
                className="rounded-full bg-bg-app px-4 py-2 text-sm font-semibold text-accent-red transition hover:brightness-110"
              >
                Cancelar agendamento
              </button>
            )}
            {allowCancelSchedule && pendingCancel && (
              <div className="flex items-center gap-2 text-sm text-white">
                <span>Cancelar mesmo assim?</span>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleCancel}
                  className="rounded-full bg-accent-red px-3 py-1.5 text-xs font-semibold text-black disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? "Cancelando…" : "Sim, cancelar"}
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
              setSelectedSessionId(id);
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
