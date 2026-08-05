"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { LearningPathRaw } from "@/lib/types/raw/learning-path";
import {
  findLessonNavigation,
  getLessonSummary,
} from "@/lib/selectors/learning-path-selectors";
import { useLearningPathProgress } from "@/components/learning-path/use-learning-path-progress";
import { LessonChat } from "@/components/learning-path/LessonChat";
import { LessonMarkdown } from "@/components/learning-path/LessonMarkdown";
import { CheckCircleIcon, ChevronRightIcon, ClockIcon, TerminalIcon } from "@/components/icons";

interface LessonViewProps {
  path: LearningPathRaw;
  subjectCode: string;
  lessonId: string;
  disciplineName: string;
}

export function LessonView({ path, subjectCode, lessonId, disciplineName }: LessonViewProps) {
  const router = useRouter();
  const { mounted, completedIds, markCompleted } = useLearningPathProgress(path, subjectCode);
  const nav = findLessonNavigation(path, completedIds, lessonId);
  const trilhaHref = `/disciplinas/${subjectCode}/trilha-de-aprendizagem`;

  if (!nav.lesson) {
    return (
      <div className="rounded-2xl bg-bg-card p-8 text-center">
        <p className="text-white">Lição não encontrada.</p>
        <Link href={trilhaHref} className="mt-3 inline-block text-sm text-brand-yellow hover:underline">
          Voltar para a trilha
        </Link>
      </div>
    );
  }

  const { lesson, prev, next } = nav;

  if (!mounted) {
    return <div className="h-96 animate-pulse rounded-2xl bg-bg-card" />;
  }

  if (lesson.status === "locked") {
    return (
      <div className="rounded-2xl bg-bg-card p-8 text-center">
        <p className="text-white">Esta lição ainda está bloqueada.</p>
        <p className="mt-1 text-sm text-text-secondary">
          Conclua as lições anteriores da trilha para desbloqueá-la.
        </p>
        <Link href={trilhaHref} className="mt-4 inline-block text-sm text-brand-yellow hover:underline">
          Voltar para a trilha
        </Link>
      </div>
    );
  }

  const isCompleted = lesson.status === "completed";
  const nextHref = next ? `/disciplinas/${subjectCode}/trilha-de-aprendizagem/${next.id}` : trilhaHref;

  function handlePrimaryAction() {
    if (!isCompleted) markCompleted(lessonId);
    router.push(nextHref);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5 text-sm">
          <Link href={trilhaHref} className="text-text-secondary transition hover:text-white">
            ‹ {disciplineName}
          </Link>
          <ChevronRightIcon className="h-3.5 w-3.5 text-text-secondary" />
          <span className="text-text-secondary">{lesson.sectionTitle}</span>
          <ChevronRightIcon className="h-3.5 w-3.5 text-text-secondary" />
          <span className="font-semibold text-white">{lesson.title}</span>
        </div>

        <div className="flex items-center gap-3 text-xs text-text-secondary">
          <span className="inline-flex items-center gap-1.5">
            {lesson.kind === "pratica" ? (
              <TerminalIcon className="h-3.5 w-3.5" />
            ) : (
              <ClockIcon className="h-3.5 w-3.5" />
            )}
            {lesson.duration_min} min
          </span>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-semibold ${
              isCompleted ? "bg-accent-green/15 text-accent-green" : "bg-brand-yellow/15 text-brand-yellow"
            }`}
          >
            {isCompleted && <CheckCircleIcon className="h-3.5 w-3.5" />}
            {isCompleted ? "Concluída" : `+${lesson.points} EP`}
          </span>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[360px_1fr] lg:items-start">
        <div className="h-[520px] lg:sticky lg:top-6">
          <LessonChat lessonTitle={lesson.title} lessonSummary={getLessonSummary(lesson.content)} />
        </div>

        <div className="flex flex-col gap-6 rounded-2xl bg-bg-card p-6 md:p-8">
          <LessonMarkdown content={lesson.content} />

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border-subtle pt-5">
            {prev ? (
              <Link
                href={`/disciplinas/${subjectCode}/trilha-de-aprendizagem/${prev.id}`}
                className="text-sm font-medium text-text-secondary transition hover:text-white"
              >
                ‹ Lição anterior
              </Link>
            ) : (
              <span />
            )}

            {isCompleted ? (
              <Link
                href={nextHref}
                className="rounded-full bg-brand-yellow px-6 py-2.5 text-sm font-semibold text-black transition hover:bg-brand-yellow-dark"
              >
                {next ? "Próxima lição →" : "Voltar à trilha"}
              </Link>
            ) : (
              <button
                type="button"
                onClick={handlePrimaryAction}
                className="rounded-full bg-brand-yellow px-6 py-2.5 text-sm font-semibold text-black transition hover:bg-brand-yellow-dark"
              >
                {next ? "Concluir e avançar →" : "Concluir lição"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
