"use client";

import { useMemo, useState } from "react";
import type { StudyActivity } from "@/lib/types/study-activity";
import type { AssistantSuggestion, SubjectOption } from "@/lib/study-planner/ai-assistant";
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
import { SparklesIcon } from "@/components/icons";
import { AssistantPanel } from "@/components/study-planner/AssistantPanel";
import { CalendarToolbar } from "@/components/study-planner/CalendarToolbar";
import { MonthGridView } from "@/components/study-planner/MonthGridView";
import { WeekGridView } from "@/components/study-planner/WeekGridView";
import { DayGridView } from "@/components/study-planner/DayGridView";
import { ActivityFormModal, type ActivityFormDraft } from "@/components/study-planner/ActivityFormModal";

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
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [isAssistantExpanded, setIsAssistantExpanded] = useState(false);

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

  async function handleAcceptSuggestion(suggestion: AssistantSuggestion) {
    const response = await fetch("/api/v1/vitru/study-plan/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "CREATE_STUDY_PLAN",
        userId,
        suggestionIds: [suggestion.id],
      }),
    });
    const result = await response.json();
    if (!response.ok || !result.ok) throw new Error("Falha ao confirmar etapa.");

    const persisted = result.data.created[0] ?? {
      ...suggestion,
      source: "ai" as const,
    };
    setActivities((current) => upsertActivity(current, persisted));
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end lg:hidden">
        <button
          type="button"
          onClick={() => setIsAssistantOpen(true)}
          className="flex items-center gap-2 rounded-full bg-bg-card px-4 py-2 text-sm font-medium text-white transition hover:bg-bg-card-hover"
        >
          <SparklesIcon className="h-4 w-4 text-brand-yellow" />
          Vitru · Calendário
        </button>
      </div>

      <div className="flex h-[75vh] min-h-140 flex-col gap-4 md:gap-6 lg:flex-row">
        <div
          className={`hidden min-h-0 shrink-0 transition-[width] duration-300 ease-out lg:block ${
            isAssistantExpanded ? "lg:w-[48%]" : "lg:w-95"
          }`}
        >
          <AssistantPanel
            userId={userId}
            onAcceptSuggestion={handleAcceptSuggestion}
            isExpanded={isAssistantExpanded}
            onToggleExpanded={() => setIsAssistantExpanded((current) => !current)}
          />
        </div>

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
            />
          )}
          {viewMode === "day" && (
            <DayGridView
              isoDate={selectedIsoDate}
              activities={activities}
              onCreateAt={openCreateModal}
              onSelectActivity={openEditModal}
            />
          )}
        </div>
      </div>

      {isAssistantOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Vitru · Calendário"
        >
          <div className="h-[85vh] w-full max-w-md">
            <AssistantPanel
              userId={userId}
              onAcceptSuggestion={handleAcceptSuggestion}
              onClose={() => setIsAssistantOpen(false)}
            />
          </div>
        </div>
      )}

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
    </div>
  );
}
