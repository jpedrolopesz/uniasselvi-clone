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
import { VITRU_PLAN_CONFIRMED_EVENT } from "@/components/vitru/planner-events";
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
  seedActivities,
  subjects,
  planningDate,
}: StudyPlannerViewProps) {
  const [activities, setActivities] = useState<StudyActivity[]>(seedActivities);
  const [viewMode, setViewMode] = useState<StudyPlannerViewMode>("week");
  const [selectedIsoDate, setSelectedIsoDate] = useState(planningDate);
  const [formDraft, setFormDraft] = useState<ActivityFormDraft | null>(null);

  useEffect(() => {
    const handleConfirmedPlan = (event: Event) => {
      const activity = (event as CustomEvent<StudyActivity>).detail;
      if (activity) setActivities((current) => upsertActivity(current, activity));
    };
    window.addEventListener(VITRU_PLAN_CONFIRMED_EVENT, handleConfirmedPlan);
    return () => window.removeEventListener(VITRU_PLAN_CONFIRMED_EVENT, handleConfirmedPlan);
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
