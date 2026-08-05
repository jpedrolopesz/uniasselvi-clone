"use client";

import { useMemo, useState } from "react";
import type { StudyActivity } from "@/lib/types/study-activity";
import type { AssistantSuggestion, SubjectOption } from "@/lib/study-planner/ai-assistant";
import {
  generateActivityId,
  removeActivity,
  upsertActivity,
} from "@/lib/study-planner/calendar-logic";
import {
  addDays,
  buildWeekDays,
  formatWeekdayFullLabel,
  getTodayIsoDate,
  minutesToTime,
  parseIsoDate,
  timeToMinutes,
  toIso,
} from "@/lib/study-planner/date-utils";
import { MONTH_LABELS_PT } from "@/lib/selectors/calendar-selectors";
import { formatDateBr } from "@/lib/formatters/date-formatters";
import type { StudyPlannerViewMode } from "@/components/study-planner/view-mode";
import { PlannerHeader } from "@/components/study-planner/PlannerHeader";
import { AssistantPanel } from "@/components/study-planner/AssistantPanel";
import { CalendarToolbar } from "@/components/study-planner/CalendarToolbar";
import { MonthGridView } from "@/components/study-planner/MonthGridView";
import { WeekGridView } from "@/components/study-planner/WeekGridView";
import { DayGridView } from "@/components/study-planner/DayGridView";
import { ActivityFormModal, type ActivityFormDraft } from "@/components/study-planner/ActivityFormModal";

interface StudyPlannerViewProps {
  seedActivities: StudyActivity[];
  subjects: SubjectOption[];
}

function addMonths(isoDate: string, delta: number): string {
  const { year, month } = parseIsoDate(isoDate);
  const date = new Date(Date.UTC(year, month - 1 + delta, 1));
  return toIso(date.getUTCFullYear(), date.getUTCMonth() + 1, 1);
}

export function StudyPlannerView({ seedActivities, subjects }: StudyPlannerViewProps) {
  const [activities, setActivities] = useState<StudyActivity[]>(seedActivities);
  const [viewMode, setViewMode] = useState<StudyPlannerViewMode>("week");
  const [selectedIsoDate, setSelectedIsoDate] = useState(getTodayIsoDate());
  const [formDraft, setFormDraft] = useState<ActivityFormDraft | null>(null);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);

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
    setSelectedIsoDate(getTodayIsoDate());
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

  function handleAcceptSuggestion(suggestion: AssistantSuggestion) {
    const activity: StudyActivity = {
      id: generateActivityId("ai"),
      title: suggestion.title,
      category: suggestion.category,
      subjectCode: suggestion.subjectCode,
      subjectName: suggestion.subjectName,
      date: suggestion.date,
      startTime: suggestion.startTime,
      endTime: suggestion.endTime,
      notes: suggestion.notes,
      source: "ai",
    };
    setActivities((current) => upsertActivity(current, activity));
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <PlannerHeader onOpenAssistant={() => setIsAssistantOpen(true)} />

      <div className="flex min-h-0 flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6 lg:flex-row">
        <div className="hidden min-h-0 lg:block lg:w-95 lg:shrink-0">
          <AssistantPanel
            activities={activities}
            subjects={subjects}
            onAcceptSuggestion={handleAcceptSuggestion}
          />
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl bg-bg-card">
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
          aria-label="Assistente Sofia"
        >
          <div className="h-[85vh] w-full max-w-md">
            <AssistantPanel
              activities={activities}
              subjects={subjects}
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
