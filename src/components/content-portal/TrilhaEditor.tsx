"use client";

import { useState, useTransition } from "react";
import type {
  LearningPathLessonKind,
  LearningPathLessonRaw,
  LearningPathRaw,
  LearningPathSectionRaw,
  LearningPathVideoRaw,
} from "@/lib/types/raw/learning-path";
import { saveLearningPath } from "@/lib/content-portal/actions";
import { slugify, uniqueSlug } from "@/lib/content-portal/slug";
import { ChevronDownIcon, PlusIcon, TrashIcon } from "@/components/icons";

interface TrilhaEditorProps {
  userId: string;
  subjectCode: string;
  disciplineName: string;
  initialPath: LearningPathRaw;
}

function move<T>(list: T[], index: number, direction: -1 | 1): T[] {
  const target = index + direction;
  if (target < 0 || target >= list.length) return list;
  const next = [...list];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

function allIds(path: LearningPathRaw): { sectionIds: Set<string>; lessonIds: Set<string> } {
  const sectionIds = new Set<string>();
  const lessonIds = new Set<string>();
  for (const section of path.sections) {
    sectionIds.add(section.id);
    for (const lesson of section.lessons) lessonIds.add(lesson.id);
  }
  return { sectionIds, lessonIds };
}

function newLesson(existingIds: Set<string>): LearningPathLessonRaw {
  return {
    id: uniqueSlug("nova-licao", existingIds),
    title: "Nova lição",
    kind: "leitura",
    duration_min: 5,
    points: 20,
    completed: false,
    content: "",
  };
}

function newSection(existingIds: Set<string>): LearningPathSectionRaw {
  const id = uniqueSlug("nova-secao", existingIds);
  return {
    id,
    title: "Nova seção",
    summary: "",
    lessons: [],
  };
}

export function TrilhaEditor({ userId, subjectCode, disciplineName, initialPath }: TrilhaEditorProps) {
  const [draft, setDraft] = useState<LearningPathRaw>(initialPath);
  const [openSections, setOpenSections] = useState<Set<string>>(
    () => new Set(initialPath.sections.slice(0, 1).map((s) => s.id))
  );
  const [openLessons, setOpenLessons] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(null);

  function toggleSection(id: string) {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleLesson(id: string) {
    setOpenLessons((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function updateSection(sectionIndex: number, patch: Partial<LearningPathSectionRaw>) {
    setDraft((prev) => ({
      ...prev,
      sections: prev.sections.map((section, i) =>
        i === sectionIndex ? { ...section, ...patch } : section
      ),
    }));
  }

  function updateLesson(
    sectionIndex: number,
    lessonIndex: number,
    patch: Partial<LearningPathLessonRaw>
  ) {
    setDraft((prev) => ({
      ...prev,
      sections: prev.sections.map((section, i) =>
        i !== sectionIndex
          ? section
          : {
              ...section,
              lessons: section.lessons.map((lesson, j) =>
                j === lessonIndex ? { ...lesson, ...patch } : lesson
              ),
            }
      ),
    }));
  }

  function addSection() {
    const { sectionIds } = allIds(draft);
    const section = newSection(sectionIds);
    setDraft((prev) => ({ ...prev, sections: [...prev.sections, section] }));
    setOpenSections((prev) => new Set(prev).add(section.id));
  }

  function removeSection(sectionIndex: number) {
    const section = draft.sections[sectionIndex];
    if (!confirm(`Remover a seção "${section.title}" e todas as suas lições?`)) return;
    setDraft((prev) => ({
      ...prev,
      sections: prev.sections.filter((_, i) => i !== sectionIndex),
    }));
  }

  function moveSection(sectionIndex: number, direction: -1 | 1) {
    setDraft((prev) => ({ ...prev, sections: move(prev.sections, sectionIndex, direction) }));
  }

  function addLesson(sectionIndex: number) {
    const { lessonIds } = allIds(draft);
    const lesson = newLesson(lessonIds);
    setDraft((prev) => ({
      ...prev,
      sections: prev.sections.map((section, i) =>
        i === sectionIndex ? { ...section, lessons: [...section.lessons, lesson] } : section
      ),
    }));
    setOpenLessons((prev) => new Set(prev).add(lesson.id));
  }

  function removeLesson(sectionIndex: number, lessonIndex: number) {
    const lesson = draft.sections[sectionIndex].lessons[lessonIndex];
    if (!confirm(`Remover a lição "${lesson.title}"?`)) return;
    setDraft((prev) => ({
      ...prev,
      sections: prev.sections.map((section, i) =>
        i === sectionIndex
          ? { ...section, lessons: section.lessons.filter((_, j) => j !== lessonIndex) }
          : section
      ),
    }));
  }

  function moveLesson(sectionIndex: number, lessonIndex: number, direction: -1 | 1) {
    setDraft((prev) => ({
      ...prev,
      sections: prev.sections.map((section, i) =>
        i === sectionIndex
          ? { ...section, lessons: move(section.lessons, lessonIndex, direction) }
          : section
      ),
    }));
  }

  function regenerateLessonId(sectionIndex: number, lessonIndex: number) {
    const lesson = draft.sections[sectionIndex].lessons[lessonIndex];
    const { lessonIds } = allIds(draft);
    lessonIds.delete(lesson.id);
    updateLesson(sectionIndex, lessonIndex, { id: uniqueSlug(lesson.title, lessonIds) });
  }

  function regenerateSectionId(sectionIndex: number) {
    const section = draft.sections[sectionIndex];
    const { sectionIds } = allIds(draft);
    sectionIds.delete(section.id);
    updateSection(sectionIndex, { id: uniqueSlug(section.title, sectionIds) });
  }

  function addVideo(sectionIndex: number, lessonIndex: number) {
    const lesson = draft.sections[sectionIndex].lessons[lessonIndex];
    const video: LearningPathVideoRaw = { title: "", embed_url: "" };
    updateLesson(sectionIndex, lessonIndex, { videos: [...(lesson.videos ?? []), video] });
  }

  function updateVideo(
    sectionIndex: number,
    lessonIndex: number,
    videoIndex: number,
    patch: Partial<LearningPathVideoRaw>
  ) {
    const lesson = draft.sections[sectionIndex].lessons[lessonIndex];
    updateLesson(sectionIndex, lessonIndex, {
      videos: (lesson.videos ?? []).map((v, i) => (i === videoIndex ? { ...v, ...patch } : v)),
    });
  }

  function removeVideo(sectionIndex: number, lessonIndex: number, videoIndex: number) {
    const lesson = draft.sections[sectionIndex].lessons[lessonIndex];
    updateLesson(sectionIndex, lessonIndex, {
      videos: (lesson.videos ?? []).filter((_, i) => i !== videoIndex),
    });
  }

  function handleSave() {
    setStatus(null);
    startTransition(async () => {
      const result = await saveLearningPath(userId, subjectCode, draft);
      setStatus(
        result.ok
          ? { ok: true, message: "Trilha salva com sucesso." }
          : { ok: false, message: result.error ?? "Erro ao salvar." }
      );
    });
  }

  return (
    <div className="flex flex-col gap-6 pb-24">
      <div className="flex flex-col gap-4 rounded-3xl bg-bg-card p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
          {disciplineName} ({subjectCode})
        </p>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-text-secondary">Título da trilha</span>
          <input
            value={draft.title}
            onChange={(e) => setDraft((prev) => ({ ...prev, title: e.target.value }))}
            className="rounded-lg border border-border-subtle bg-bg-app px-3 py-2 text-sm text-white outline-none focus:border-brand-yellow"
            placeholder="Ex.: Probabilidade e Estatística"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-text-secondary">Subtítulo</span>
          <input
            value={draft.subtitle}
            onChange={(e) => setDraft((prev) => ({ ...prev, subtitle: e.target.value }))}
            className="rounded-lg border border-border-subtle bg-bg-app px-3 py-2 text-sm text-white outline-none focus:border-brand-yellow"
            placeholder="Ex.: Trilha de Aprendizagem"
          />
        </label>
      </div>

      <div className="flex flex-col gap-3">
        {draft.sections.map((section, sectionIndex) => (
          <SectionEditor
            key={section.id}
            section={section}
            isFirst={sectionIndex === 0}
            isLast={sectionIndex === draft.sections.length - 1}
            open={openSections.has(section.id)}
            openLessons={openLessons}
            onToggle={() => toggleSection(section.id)}
            onToggleLesson={toggleLesson}
            onUpdateSection={(patch) => updateSection(sectionIndex, patch)}
            onRegenerateSectionId={() => regenerateSectionId(sectionIndex)}
            onRemoveSection={() => removeSection(sectionIndex)}
            onMoveSection={(direction) => moveSection(sectionIndex, direction)}
            onAddLesson={() => addLesson(sectionIndex)}
            onUpdateLesson={(lessonIndex, patch) => updateLesson(sectionIndex, lessonIndex, patch)}
            onRegenerateLessonId={(lessonIndex) => regenerateLessonId(sectionIndex, lessonIndex)}
            onRemoveLesson={(lessonIndex) => removeLesson(sectionIndex, lessonIndex)}
            onMoveLesson={(lessonIndex, direction) => moveLesson(sectionIndex, lessonIndex, direction)}
            onAddVideo={(lessonIndex) => addVideo(sectionIndex, lessonIndex)}
            onUpdateVideo={(lessonIndex, videoIndex, patch) =>
              updateVideo(sectionIndex, lessonIndex, videoIndex, patch)
            }
            onRemoveVideo={(lessonIndex, videoIndex) => removeVideo(sectionIndex, lessonIndex, videoIndex)}
          />
        ))}

        <button
          type="button"
          onClick={addSection}
          className="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-border-subtle p-4 text-sm font-medium text-text-secondary transition hover:border-brand-yellow hover:text-brand-yellow"
        >
          <PlusIcon className="h-4 w-4" />
          Nova seção
        </button>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-4 border-t border-border-subtle bg-bg-app/95 p-4 backdrop-blur">
        <div className="text-sm">
          {status && (
            <span className={status.ok ? "text-accent-green" : "text-red-400"}>{status.message}</span>
          )}
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="rounded-full bg-brand-yellow px-6 py-3 text-sm font-semibold text-black transition hover:bg-brand-yellow-dark disabled:opacity-60"
        >
          {isPending ? "Salvando..." : "Salvar trilha"}
        </button>
      </div>
    </div>
  );
}

function fieldClass() {
  return "rounded-lg border border-border-subtle bg-bg-app px-3 py-2 text-sm text-white outline-none focus:border-brand-yellow";
}

function SectionEditor({
  section,
  isFirst,
  isLast,
  open,
  openLessons,
  onToggle,
  onToggleLesson,
  onUpdateSection,
  onRegenerateSectionId,
  onRemoveSection,
  onMoveSection,
  onAddLesson,
  onUpdateLesson,
  onRegenerateLessonId,
  onRemoveLesson,
  onMoveLesson,
  onAddVideo,
  onUpdateVideo,
  onRemoveVideo,
}: {
  section: LearningPathSectionRaw;
  isFirst: boolean;
  isLast: boolean;
  open: boolean;
  openLessons: Set<string>;
  onToggle: () => void;
  onToggleLesson: (lessonId: string) => void;
  onUpdateSection: (patch: Partial<LearningPathSectionRaw>) => void;
  onRegenerateSectionId: () => void;
  onRemoveSection: () => void;
  onMoveSection: (direction: -1 | 1) => void;
  onAddLesson: () => void;
  onUpdateLesson: (lessonIndex: number, patch: Partial<LearningPathLessonRaw>) => void;
  onRegenerateLessonId: (lessonIndex: number) => void;
  onRemoveLesson: (lessonIndex: number) => void;
  onMoveLesson: (lessonIndex: number, direction: -1 | 1) => void;
  onAddVideo: (lessonIndex: number) => void;
  onUpdateVideo: (
    lessonIndex: number,
    videoIndex: number,
    patch: Partial<LearningPathVideoRaw>
  ) => void;
  onRemoveVideo: (lessonIndex: number, videoIndex: number) => void;
}) {
  return (
    <div className="overflow-hidden rounded-2xl bg-bg-card">
      <div className="flex items-center gap-3 p-4">
        <button
          type="button"
          onClick={onToggle}
          className="flex flex-1 items-center gap-3 text-left"
        >
          <ChevronDownIcon
            className={`h-4 w-4 shrink-0 text-text-secondary transition-transform ${open ? "rotate-180" : ""}`}
          />
          <div className="min-w-0">
            <p className="truncate font-semibold text-white">{section.title || "Sem título"}</p>
            <p className="text-xs text-text-secondary">
              {section.lessons.length} lição{section.lessons.length === 1 ? "" : "ões"}
            </p>
          </div>
        </button>

        <div className="flex shrink-0 items-center gap-1">
          <IconButton label="Mover para cima" disabled={isFirst} onClick={() => onMoveSection(-1)}>
            ↑
          </IconButton>
          <IconButton label="Mover para baixo" disabled={isLast} onClick={() => onMoveSection(1)}>
            ↓
          </IconButton>
          <IconButton label="Remover seção" onClick={onRemoveSection}>
            <TrashIcon className="h-4 w-4" />
          </IconButton>
        </div>
      </div>

      {open && (
        <div className="flex flex-col gap-4 border-t border-border-subtle p-4">
          <div className="grid gap-3 sm:grid-cols-[2fr_1fr]">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-text-secondary">Título da seção</span>
              <input
                value={section.title}
                onChange={(e) => onUpdateSection({ title: e.target.value })}
                className={fieldClass()}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-text-secondary">
                Código{" "}
                <button
                  type="button"
                  onClick={onRegenerateSectionId}
                  className="text-brand-yellow hover:underline"
                >
                  gerar do título
                </button>
              </span>
              <input
                value={section.id}
                onChange={(e) => onUpdateSection({ id: slugify(e.target.value) })}
                className={fieldClass()}
              />
            </label>
          </div>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-text-secondary">Resumo</span>
            <textarea
              value={section.summary}
              onChange={(e) => onUpdateSection({ summary: e.target.value })}
              rows={2}
              className={fieldClass()}
            />
          </label>

          <div className="flex flex-col gap-2">
            {section.lessons.map((lesson, lessonIndex) => (
              <LessonEditor
                key={lesson.id}
                lesson={lesson}
                lessonIndex={lessonIndex}
                isFirst={lessonIndex === 0}
                isLast={lessonIndex === section.lessons.length - 1}
                open={openLessons.has(lesson.id)}
                onToggle={() => onToggleLesson(lesson.id)}
                onUpdate={(patch) => onUpdateLesson(lessonIndex, patch)}
                onRegenerateId={() => onRegenerateLessonId(lessonIndex)}
                onRemove={() => onRemoveLesson(lessonIndex)}
                onMove={(direction) => onMoveLesson(lessonIndex, direction)}
                onAddVideo={() => onAddVideo(lessonIndex)}
                onUpdateVideo={(videoIndex, patch) => onUpdateVideo(lessonIndex, videoIndex, patch)}
                onRemoveVideo={(videoIndex) => onRemoveVideo(lessonIndex, videoIndex)}
              />
            ))}

            <button
              type="button"
              onClick={onAddLesson}
              className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-border-subtle p-3 text-xs font-medium text-text-secondary transition hover:border-brand-yellow hover:text-brand-yellow"
            >
              <PlusIcon className="h-3.5 w-3.5" />
              Nova lição
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function LessonEditor({
  lesson,
  isFirst,
  isLast,
  open,
  onToggle,
  onUpdate,
  onRegenerateId,
  onRemove,
  onMove,
  onAddVideo,
  onUpdateVideo,
  onRemoveVideo,
}: {
  lesson: LearningPathLessonRaw;
  lessonIndex: number;
  isFirst: boolean;
  isLast: boolean;
  open: boolean;
  onToggle: () => void;
  onUpdate: (patch: Partial<LearningPathLessonRaw>) => void;
  onRegenerateId: () => void;
  onRemove: () => void;
  onMove: (direction: -1 | 1) => void;
  onAddVideo: () => void;
  onUpdateVideo: (videoIndex: number, patch: Partial<LearningPathVideoRaw>) => void;
  onRemoveVideo: (videoIndex: number) => void;
}) {
  return (
    <div className="overflow-hidden rounded-xl bg-black/20">
      <div className="flex items-center gap-3 p-3">
        <button type="button" onClick={onToggle} className="flex flex-1 items-center gap-3 text-left">
          <ChevronDownIcon
            className={`h-3.5 w-3.5 shrink-0 text-text-secondary transition-transform ${open ? "rotate-180" : ""}`}
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-white">{lesson.title || "Sem título"}</p>
            <p className="text-xs text-text-secondary">
              {lesson.kind === "leitura" ? "Leitura" : "Prática"} · {lesson.duration_min} min · +
              {lesson.points} EP
            </p>
          </div>
        </button>
        <div className="flex shrink-0 items-center gap-1">
          <IconButton label="Mover para cima" disabled={isFirst} onClick={() => onMove(-1)}>
            ↑
          </IconButton>
          <IconButton label="Mover para baixo" disabled={isLast} onClick={() => onMove(1)}>
            ↓
          </IconButton>
          <IconButton label="Remover lição" onClick={onRemove}>
            <TrashIcon className="h-3.5 w-3.5" />
          </IconButton>
        </div>
      </div>

      {open && (
        <div className="flex flex-col gap-3 border-t border-border-subtle p-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-text-secondary">Título</span>
              <input value={lesson.title} onChange={(e) => onUpdate({ title: e.target.value })} className={fieldClass()} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-text-secondary">
                Código{" "}
                <button type="button" onClick={onRegenerateId} className="text-brand-yellow hover:underline">
                  gerar do título
                </button>
              </span>
              <input
                value={lesson.id}
                onChange={(e) => onUpdate({ id: slugify(e.target.value) })}
                className={fieldClass()}
              />
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-text-secondary">Tipo</span>
              <select
                value={lesson.kind}
                onChange={(e) => onUpdate({ kind: e.target.value as LearningPathLessonKind })}
                className={fieldClass()}
              >
                <option value="leitura">Leitura</option>
                <option value="pratica">Prática</option>
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-text-secondary">Duração (min)</span>
              <input
                type="number"
                min={0}
                value={lesson.duration_min}
                onChange={(e) => onUpdate({ duration_min: Number(e.target.value) })}
                className={fieldClass()}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-text-secondary">Pontos (EP)</span>
              <input
                type="number"
                min={0}
                value={lesson.points}
                onChange={(e) => onUpdate({ points: Number(e.target.value) })}
                className={fieldClass()}
              />
            </label>
          </div>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-text-secondary">
              Conteúdo (markdown simplificado — ## títulos, parágrafos separados por linha em branco, **negrito**)
            </span>
            <textarea
              value={lesson.content}
              onChange={(e) => onUpdate({ content: e.target.value })}
              rows={8}
              className={`${fieldClass()} font-mono text-xs`}
            />
          </label>

          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium text-text-secondary">Vídeos do Kit Pedagógico</span>
            {(lesson.videos ?? []).map((video, videoIndex) => (
              <div key={videoIndex} className="grid gap-2 sm:grid-cols-[2fr_2fr_auto] sm:items-center">
                <input
                  value={video.title}
                  onChange={(e) => onUpdateVideo(videoIndex, { title: e.target.value })}
                  placeholder="Título do vídeo"
                  className={fieldClass()}
                />
                <input
                  value={video.embed_url}
                  onChange={(e) => onUpdateVideo(videoIndex, { embed_url: e.target.value })}
                  placeholder="https://www.youtube.com/embed/..."
                  className={fieldClass()}
                />
                <IconButton label="Remover vídeo" onClick={() => onRemoveVideo(videoIndex)}>
                  <TrashIcon className="h-4 w-4" />
                </IconButton>
              </div>
            ))}
            <button
              type="button"
              onClick={onAddVideo}
              className="flex w-fit items-center gap-2 rounded-lg border border-dashed border-border-subtle px-3 py-1.5 text-xs font-medium text-text-secondary transition hover:border-brand-yellow hover:text-brand-yellow"
            >
              <PlusIcon className="h-3.5 w-3.5" />
              Adicionar vídeo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function IconButton({
  children,
  label,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className="flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary transition hover:bg-bg-card-hover hover:text-white disabled:pointer-events-none disabled:opacity-30"
    >
      {children}
    </button>
  );
}
