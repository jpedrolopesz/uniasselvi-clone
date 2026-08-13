"use client";

import { useEffect, useMemo, useState } from "react";
import type { StudyActivity } from "@/lib/types/study-activity";
import type { SubjectOption } from "@/lib/study-planner/ai-assistant";
import {
  removeActivity,
  upsertActivity,
} from "@/lib/study-planner/calendar-logic";
import {
  addDays,
  buildWeekDays,
  formatWeekdayFullLabel,
  minutesToTime,
  parseIsoDate,
  timeToMinutes,
  toIso,
} from "@/lib/study-planner/date-utils";
import { MONTH_LABELS_PT } from "@/lib/selectors/calendar-selectors";
import { formatDateBr } from "@/lib/formatters/date-formatters";
import type { StudyPlannerViewMode } from "@/components/study-planner/view-mode";
import {
  VITRU_PLAN_CONFIRMED_EVENT,
  VITRU_PLAN_PREVIEW_EVENT,
  VITRU_PLAN_PREVIEW_REMOVED_EVENT,
} from "@/components/vitru/planner-events";
import type { AssistantSuggestion } from "@/lib/study-planner/ai-assistant";
import { CalendarToolbar } from "@/components/study-planner/CalendarToolbar";
import { MonthGridView } from "@/components/study-planner/MonthGridView";
import { WeekGridView } from "@/components/study-planner/WeekGridView";
import { DayGridView } from "@/components/study-planner/DayGridView";
import { ActivityFormModal, type ActivityFormDraft } from "@/components/study-planner/ActivityFormModal";
import { buildStudyCalendarSnapshot } from "@/lib/vitru/adapters/study-calendar";
import { publishSemanticSnapshot } from "@/components/vitru/SemanticSnapshotProvider";

interface StudyPlannerViewProps {
  userId: string;
  seedActivities: StudyActivity[];
  subjects: SubjectOption[];
  planningDate: string;
}

function addMonths(isoDate: string, delta: number): string {
  const { year, month } = parseIsoDate(isoDate);
  const date = new Date(Date.UTC(year, month - 1 + delta, 1));
  return toIso(date.getUTCFullYear(), date.getUTCMonth() + 1, 1);
}

function confirmedActivity(activity: StudyActivity): StudyActivity {
  const copy = { ...activity };
  delete copy.confirmationStatus;
  return copy;
}

export function StudyPlannerView({
  userId,
  seedActivities,
  subjects,
  planningDate,
}: StudyPlannerViewProps) {
  const [activities, setActivities] = useState<StudyActivity[]>(seedActivities);
  const [viewMode, setViewMode] = useState<StudyPlannerViewMode>("week");
  const [selectedIsoDate, setSelectedIsoDate] = useState(planningDate);
  const [formDraft, setFormDraft] = useState<ActivityFormDraft | null>(null);
  const [previewToReview, setPreviewToReview] = useState<StudyActivity | null>(null);
  const snapshotNow = `${planningDate}T12:00:00-03:00`;

  useEffect(() => {
    publishSemanticSnapshot(buildStudyCalendarSnapshot({
      activities,
      selectedIsoDate,
      view: viewMode,
      now: snapshotNow,
      focusId: previewToReview?.id ?? null,
    }));
  }, [activities, previewToReview?.id, selectedIsoDate, snapshotNow, viewMode]);

  useEffect(() => {
    const handlePlanPreviews = (event: Event) => {
      const suggestions = (event as CustomEvent<AssistantSuggestion[]>).detail ?? [];
      setActivities((current) => {
        const suggestionIds = new Set(suggestions.map(({ id }) => id));
        const withoutOldPreviews = current.filter(
          (activity) => activity.confirmationStatus !== "pending" || suggestionIds.has(activity.id)
        );
        return suggestions.reduce(
          (result, suggestion) => upsertActivity(result, {
            ...suggestion,
            source: "ai",
            confirmationStatus: "pending",
          }),
          withoutOldPreviews
        );
      });
    };
    const handlePreviewRemoved = (event: Event) => {
      const suggestionId = (event as CustomEvent<string>).detail;
      setActivities((current) => current.filter((activity) => activity.id !== suggestionId));
    };
    const handleConfirmedPlan = (event: Event) => {
      const activity = (event as CustomEvent<StudyActivity>).detail;
      if (activity) {
        setActivities((current) => upsertActivity(current, confirmedActivity(activity)));
      }
    };
    window.addEventListener(VITRU_PLAN_PREVIEW_EVENT, handlePlanPreviews);
    window.addEventListener(VITRU_PLAN_PREVIEW_REMOVED_EVENT, handlePreviewRemoved);
    window.addEventListener(VITRU_PLAN_CONFIRMED_EVENT, handleConfirmedPlan);
    return () => {
      window.removeEventListener(VITRU_PLAN_PREVIEW_EVENT, handlePlanPreviews);
      window.removeEventListener(VITRU_PLAN_PREVIEW_REMOVED_EVENT, handlePreviewRemoved);
      window.removeEventListener(VITRU_PLAN_CONFIRMED_EVENT, handleConfirmedPlan);
    };
  }, []);

  const periodLabel = useMemo(() => {
    if (viewMode === "day") {
      return `${formatWeekdayFullLabel(selectedIsoDate)}, ${formatDateBr(selectedIsoDate)}`;
    }
    if (viewMode === "week") {
      const days = buildWeekDays(selectedIsoDate);
      return `${formatDateBr(days[0].isoDate)} – ${formatDateBr(days[6].isoDate)}`;
    }
    const { year, month } = parseIsoDate(selectedIsoDate);
    return `${MONTH_LABELS_PT[month - 1]} ${year}`;
  }, [viewMode, selectedIsoDate]);

  function handlePrev() {
    setSelectedIsoDate((current) => {
      if (viewMode === "day") return addDays(current, -1);
      if (viewMode === "week") return addDays(current, -7);
      return addMonths(current, -1);
    });
  }

  function handleNext() {
    setSelectedIsoDate((current) => {
      if (viewMode === "day") return addDays(current, 1);
      if (viewMode === "week") return addDays(current, 7);
      return addMonths(current, 1);
    });
  }

  function handleToday() {
    setSelectedIsoDate(planningDate);
  }

  function handleSelectDayFromMonth(isoDate: string) {
    setSelectedIsoDate(isoDate);
    setViewMode("day");
  }

  function openCreateModal(isoDate: string, startTime: string) {
    const endTime = minutesToTime(timeToMinutes(startTime) + 60);
    setFormDraft({
      title: "",
      category: "estudo",
      subjectCode: null,
      date: isoDate,
      startTime,
      endTime,
      notes: "",
    });
  }

  function openEditModal(activity: StudyActivity) {
    if (activity.confirmationStatus === "pending") return;
    setFormDraft({
      id: activity.id,
      title: activity.title,
      category: activity.category,
      subjectCode: activity.subjectCode,
      date: activity.date,
      startTime: activity.startTime,
      endTime: activity.endTime,
      notes: activity.notes,
    });
  }

  function handleSaveActivity(activity: StudyActivity) {
    setActivities((current) => upsertActivity(current, activity));
    setFormDraft(null);
  }

  function handleDeleteActivity() {
    if (!formDraft?.id) return;
    setActivities((current) => removeActivity(current, formDraft.id!));
    setFormDraft(null);
  }

  function rejectPreview(activity: StudyActivity) {
    setActivities((current) => removeActivity(current, activity.id));
    setPreviewToReview(null);
  }

  async function acceptPreview(activity: StudyActivity) {
    const savingActivity = { ...activity, confirmationStatus: "saving" as const };
    setActivities((current) => upsertActivity(current, savingActivity));
    setPreviewToReview(savingActivity);
    try {
      const response = await fetch("/api/v1/vitru/study-plan/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "CREATE_STUDY_PLAN", userId, suggestionIds: [activity.id] }),
      });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error("Falha ao confirmar horário.");
      const persisted = result.data.created[0] ?? activity;
      setActivities((current) => upsertActivity(current, { ...confirmedActivity(persisted), source: "ai" }));
      setPreviewToReview(null);
    } catch {
      const failedActivity = { ...activity, confirmationStatus: "error" as const };
      setActivities((current) => upsertActivity(current, failedActivity));
      setPreviewToReview(failedActivity);
    }
  }

  return (
    <div className="flex flex-col gap-4 transition-[padding] duration-300 lg:pl-[424px]">
      <div className="flex h-[75vh] min-h-140 flex-col">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-2xl bg-bg-card transition-[width] duration-300 ease-out">
          <CalendarToolbar
            viewMode={viewMode}
            onChangeViewMode={setViewMode}
            periodLabel={periodLabel}
            onPrev={handlePrev}
            onNext={handleNext}
            onToday={handleToday}
            onCreateActivity={() => openCreateModal(selectedIsoDate, "08:00")}
          />

          {viewMode === "month" && (
            <MonthGridView
              isoDate={selectedIsoDate}
              activities={activities}
              onSelectDay={handleSelectDayFromMonth}
            />
          )}
          {viewMode === "week" && (
            <WeekGridView
              isoDate={selectedIsoDate}
              activities={activities}
              onCreateAt={openCreateModal}
              onSelectActivity={openEditModal}
              onReviewPreview={setPreviewToReview}
            />
          )}
          {viewMode === "day" && (
            <DayGridView
              isoDate={selectedIsoDate}
              activities={activities}
              onCreateAt={openCreateModal}
              onSelectActivity={openEditModal}
              onReviewPreview={setPreviewToReview}
            />
          )}
        </div>
      </div>

      {formDraft && (
        <ActivityFormModal
          draft={formDraft}
          subjects={subjects}
          activities={activities}
          onSave={handleSaveActivity}
          onDelete={formDraft.id ? handleDeleteActivity : undefined}
          onClose={() => setFormDraft(null)}
        />
      )}

      {previewToReview && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 p-4" role="presentation" onMouseDown={() => setPreviewToReview(null)}>
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="vitru-preview-title"
            className="w-full max-w-md rounded-2xl border border-brand-yellow/35 bg-bg-card p-5 shadow-2xl"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-yellow">Sugestão do Vitru</p>
            <h2 id="vitru-preview-title" className="mt-2 text-lg font-semibold text-white">{previewToReview.title}</h2>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div><dt className="text-text-secondary">Data</dt><dd className="font-medium text-white">{formatDateBr(previewToReview.date)}</dd></div>
              <div><dt className="text-text-secondary">Horário</dt><dd className="font-medium text-white">{previewToReview.startTime}–{previewToReview.endTime}</dd></div>
              {previewToReview.subjectName && <div className="col-span-2"><dt className="text-text-secondary">Disciplina</dt><dd className="font-medium text-white">{previewToReview.subjectName}</dd></div>}
            </dl>
            <p className="mt-4 text-sm text-text-secondary">Esta é apenas uma prévia. A atividade só será adicionada depois da confirmação.</p>
            {previewToReview.confirmationStatus === "error" && <p className="mt-3 text-sm text-accent-red">Não foi possível adicionar. Você pode tentar novamente.</p>}
            <div className="mt-5 flex gap-3">
              <button type="button" disabled={previewToReview.confirmationStatus === "saving"} onClick={() => void acceptPreview(previewToReview)} className="flex-1 rounded-full bg-brand-yellow px-4 py-2 text-sm font-semibold text-black disabled:opacity-60">
                {previewToReview.confirmationStatus === "saving" ? "Adicionando…" : previewToReview.confirmationStatus === "error" ? "Tentar novamente" : "Aceitar"}
              </button>
              <button type="button" disabled={previewToReview.confirmationStatus === "saving"} onClick={() => rejectPreview(previewToReview)} className="flex-1 rounded-full border border-border-subtle px-4 py-2 text-sm font-semibold text-text-secondary hover:text-white disabled:opacity-60">
                Não aceitar
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
