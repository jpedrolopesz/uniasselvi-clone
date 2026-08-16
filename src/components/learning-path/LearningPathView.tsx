"use client";

import { useState } from "react";
import Link from "next/link";
import type { LearningPathRaw } from "@/lib/types/raw/learning-path";
import type { LessonWithStatus, SectionWithProgress } from "@/lib/selectors/learning-path-selectors";
import { findCurrentLesson } from "@/lib/selectors/learning-path-selectors";
import { useLearningPathProgress } from "@/components/learning-path/use-learning-path-progress";
import {
  BookOpenIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  ClockIcon,
  LayersIcon,
  LockIcon,
  PlayCircleIcon,
  TargetIcon,
  TerminalIcon,
} from "@/components/icons";

interface LearningPathViewProps {
  path: LearningPathRaw;
  subjectCode: string;
  completedLessonIds: string[];
}

export function LearningPathView({ path, subjectCode, completedLessonIds }: LearningPathViewProps) {
  const { sections, overall } = useLearningPathProgress(path, completedLessonIds);

  const allStatuses = sections.flatMap((section) => section.lessons);
  const currentLesson = findCurrentLesson(allStatuses);

  // null = usuário ainda não mexeu no acordeão -> abre a seção da lição atual por padrão.
  // "" (string vazia) = usuário fechou manualmente todas as seções.
  const [manualOpenSectionId, setManualOpenSectionId] = useState<string | null>(null);
  const defaultOpenSectionId = currentLesson?.sectionId ?? path.sections[0]?.id;
  const openSectionId = manualOpenSectionId ?? defaultOpenSectionId;

  return (
    <div className="flex flex-col gap-6">
      <div data-tour-id="learning-path-overview" className="flex flex-col gap-5 rounded-3xl bg-bg-card p-6 md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-yellow/15">
              <TargetIcon className="h-7 w-7 text-brand-yellow" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
                {path.subtitle}
              </p>
              <h1 className="text-2xl font-bold text-white md:text-3xl">{path.title}</h1>
            </div>
          </div>

          {currentLesson && (
            <Link
              href={`/disciplinas/${subjectCode}/trilha-de-aprendizagem/${currentLesson.id}`}
              className="rounded-full bg-brand-yellow px-6 py-3 text-sm font-semibold text-black transition hover:bg-brand-yellow-dark"
            >
              Continuar trilha
            </Link>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between text-xs text-text-secondary">
            <span>
              {overall.completed} de {overall.total} lições concluídas
            </span>
            <span className="font-semibold text-white">{overall.percent}%</span>
          </div>
          <div className="mt-1.5 h-2 w-full rounded-full bg-black/40">
            <div
              className="h-2 rounded-full bg-brand-yellow transition-all"
              style={{ width: `${overall.percent}%` }}
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {sections.map((section) => (
          <SectionCard
            key={section.id}
            section={section}
            subjectCode={subjectCode}
            open={openSectionId === section.id}
            onToggle={() => setManualOpenSectionId(openSectionId === section.id ? "" : section.id)}
          />
        ))}
      </div>
    </div>
  );
}

function SectionCard({
  section,
  subjectCode,
  open,
  onToggle,
}: {
  section: SectionWithProgress;
  subjectCode: string;
  open: boolean;
  onToggle: () => void;
}) {
  const practiceCount = section.lessons.filter((l) => l.kind === "pratica").length;
  const sectionPercent =
    section.totalCount === 0 ? 0 : Math.round((section.completedCount / section.totalCount) * 100);

  return (
    <div className="overflow-hidden rounded-2xl bg-bg-card">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-4 p-5 text-left transition hover:bg-bg-card-hover"
      >
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-black/30 text-text-secondary">
          <LayersIcon className="h-5 w-5" />
        </div>

        <div className="min-w-0 flex-1">
          <h2 className="font-semibold text-white">{section.title}</h2>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-secondary">
            {practiceCount > 0 && (
              <span className="inline-flex items-center gap-1.5">
                <TargetIcon className="h-3.5 w-3.5" />
                {practiceCount} prática{practiceCount > 1 ? "s" : ""}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5">
              <ClockIcon className="h-3.5 w-3.5" />
              {section.totalMinutes} min
            </span>
          </div>
        </div>

        <div className="hidden w-24 shrink-0 sm:block">
          <div className="h-1.5 w-full rounded-full bg-black/40">
            <div
              className="h-1.5 rounded-full bg-brand-yellow"
              style={{ width: `${sectionPercent}%` }}
            />
          </div>
        </div>

        <ChevronDownIcon
          className={`h-4 w-4 shrink-0 text-text-secondary transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="flex flex-col gap-2 border-t border-border-subtle p-3">
          {section.lessons.map((lesson) => (
            <LessonRow key={lesson.id} lesson={lesson} subjectCode={subjectCode} />
          ))}
        </div>
      )}
    </div>
  );
}

function LessonRow({ lesson, subjectCode }: { lesson: LessonWithStatus; subjectCode: string }) {
  const KindIcon = lesson.kind === "leitura" ? BookOpenIcon : TerminalIcon;
  const locked = lesson.status === "locked";

  const iconWrapClass =
    lesson.status === "completed"
      ? "bg-accent-green/15 text-accent-green"
      : lesson.status === "current"
        ? "bg-brand-yellow/15 text-brand-yellow"
        : "bg-black/30 text-text-secondary/50";

  const content = (
    <>
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${iconWrapClass}`}>
        <KindIcon className="h-4.5 w-4.5" />
      </div>

      <span className={`min-w-0 flex-1 truncate text-sm font-medium ${locked ? "text-text-secondary/60" : "text-white"}`}>
        {lesson.title}
      </span>

      <span className={`shrink-0 text-xs font-semibold ${locked ? "text-text-secondary/40" : "text-brand-yellow"}`}>
        +{lesson.points} EP
      </span>

      <div className="flex h-8 w-8 shrink-0 items-center justify-center">
        {lesson.status === "completed" && <CheckCircleIcon className="h-6 w-6 text-accent-green" />}
        {lesson.status === "current" && <PlayCircleIcon className="h-6 w-6 text-brand-yellow" />}
        {lesson.status === "locked" && <LockIcon className="h-4 w-4 text-text-secondary/40" />}
      </div>
    </>
  );

  const rowClass = "flex items-center gap-3 rounded-xl px-3 py-2.5 transition";

  if (locked) {
    return (
      <div
        className={`${rowClass} cursor-not-allowed opacity-70`}
        title="Conclua a lição anterior para desbloquear"
      >
        {content}
      </div>
    );
  }

  return (
    <Link
      href={`/disciplinas/${subjectCode}/trilha-de-aprendizagem/${lesson.id}`}
      className={`${rowClass} hover:bg-bg-card-hover`}
    >
      {content}
    </Link>
  );
}
