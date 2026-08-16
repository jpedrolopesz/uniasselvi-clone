"use client";

import { useState } from "react";
import type { ActivityCategory, StudyActivity } from "@/lib/types/study-activity";
import type { SubjectOption } from "@/lib/study-planner/ai-assistant";
import { CATEGORY_META, CATEGORY_ORDER } from "@/lib/study-planner/category-meta";
import { formatDurationLabel } from "@/lib/study-planner/date-utils";
import { generateActivityId, hasConflict } from "@/lib/study-planner/calendar-logic";
import { TrashIcon } from "@/components/icons";

export interface ActivityFormDraft {
  id?: string;
  title: string;
  category: ActivityCategory;
  subjectCode: string | null;
  date: string;
  startTime: string;
  endTime: string;
  notes: string;
}

interface ActivityFormModalProps {
  draft: ActivityFormDraft;
  subjects: SubjectOption[];
  activities: StudyActivity[];
  onSave: (activity: StudyActivity) => void;
  onDelete?: () => void;
  onClose: () => void;
}

const inputClassName =
  "w-full rounded-lg border border-border-subtle bg-bg-app px-3 py-2 text-sm text-white placeholder:text-text-secondary/60 focus:outline-none focus:ring-1 focus:ring-brand-yellow";

export function ActivityFormModal({
  draft,
  subjects,
  activities,
  onSave,
  onDelete,
  onClose,
}: ActivityFormModalProps) {
  const isEditing = Boolean(draft.id);
  const [title, setTitle] = useState(draft.title);
  const [category, setCategory] = useState<ActivityCategory>(draft.category);
  const [subjectCode, setSubjectCode] = useState<string>(draft.subjectCode ?? "");
  const [date, setDate] = useState(draft.date);
  const [startTime, setStartTime] = useState(draft.startTime);
  const [endTime, setEndTime] = useState(draft.endTime);
  const [notes, setNotes] = useState(draft.notes);
  const [error, setError] = useState<string | null>(null);

  const durationMinutesValid = startTime < endTime;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!title.trim()) {
      setError("Informe um título para a atividade.");
      return;
    }
    if (!durationMinutesValid) {
      setError("O horário final precisa ser depois do horário inicial.");
      return;
    }
    if (hasConflict(activities, { date, startTime, endTime }, draft.id)) {
      setError("Esse horário conflita com outra atividade já marcada nesse dia.");
      return;
    }

    const subject = subjects.find((s) => s.code === subjectCode) ?? null;

    onSave({
      id: draft.id ?? generateActivityId("manual"),
      title: title.trim(),
      category,
      subjectCode: subject?.code ?? null,
      subjectName: subject?.name ?? null,
      date,
      startTime,
      endTime,
      notes: notes.trim(),
      source: draft.id ? (activities.find((a) => a.id === draft.id)?.source ?? "manual") : "manual",
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="activity-form-title"
    >
      <form
        onSubmit={handleSubmit}
        className="flex max-h-[90vh] w-full max-w-lg flex-col gap-4 overflow-y-auto rounded-xl bg-bg-card p-6"
      >
        <div className="flex items-center justify-between">
          <h2 id="activity-form-title" className="text-lg font-bold uppercase text-white">
            {isEditing ? "Editar atividade" : "Nova atividade"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="text-text-secondary hover:text-white"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="activity-title" className="text-xs font-medium text-text-secondary">
            Título
          </label>
          <input
            id="activity-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex.: Estudar Modelagem de Processos"
            required
            className={inputClassName}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="activity-category" className="text-xs font-medium text-text-secondary">
              Tipo da atividade
            </label>
            <select
              id="activity-category"
              value={category}
              onChange={(e) => setCategory(e.target.value as ActivityCategory)}
              className={inputClassName}
            >
              {CATEGORY_ORDER.map((option) => (
                <option key={option} value={option}>
                  {CATEGORY_META[option].label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="activity-subject" className="text-xs font-medium text-text-secondary">
              Matéria
            </label>
            <select
              id="activity-subject"
              value={subjectCode}
              onChange={(e) => setSubjectCode(e.target.value)}
              className={inputClassName}
            >
              <option value="">Sem matéria (pessoal)</option>
              {subjects.map((subject) => (
                <option key={subject.code} value={subject.code}>
                  {subject.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-3 flex flex-col gap-1.5 sm:col-span-1">
            <label htmlFor="activity-date" className="text-xs font-medium text-text-secondary">
              Data
            </label>
            <input
              id="activity-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className={inputClassName}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="activity-start" className="text-xs font-medium text-text-secondary">
              Horário inicial
            </label>
            <input
              id="activity-start"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
              className={inputClassName}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="activity-end" className="text-xs font-medium text-text-secondary">
              Horário final
            </label>
            <input
              id="activity-end"
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              required
              className={inputClassName}
            />
          </div>
        </div>

        <p className="text-xs text-text-secondary">
          Duração:{" "}
          <span className="font-semibold text-white">
            {durationMinutesValid ? formatDurationLabel(startTime, endTime) : "-"}
          </span>
        </p>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="activity-notes" className="text-xs font-medium text-text-secondary">
            Observações
          </label>
          <textarea
            id="activity-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Opcional"
            className={inputClassName}
          />
        </div>

        {error && (
          <p role="alert" className="rounded-lg bg-accent-red/15 px-3 py-2 text-xs text-accent-red">
            {error}
          </p>
        )}

        <div className="flex items-center justify-between gap-3 pt-2">
          {isEditing && onDelete ? (
            <button
              type="button"
              onClick={onDelete}
              className="flex items-center gap-1.5 rounded-full border border-accent-red/40 px-4 py-2 text-sm font-medium text-accent-red transition hover:bg-accent-red/10"
            >
              <TrashIcon className="h-4 w-4" />
              Excluir
            </button>
          ) : (
            <span />
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full bg-bg-app px-4 py-2 text-sm font-medium text-white hover:bg-bg-card-hover"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rounded-full bg-brand-yellow px-4 py-2 text-sm font-semibold text-black transition hover:bg-brand-yellow-dark"
            >
              Salvar
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
