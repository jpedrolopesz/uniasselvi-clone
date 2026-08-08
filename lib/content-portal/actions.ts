"use server";

import { revalidatePath } from "next/cache";
import { writeUserJsonFile } from "@/lib/data/read-json-file";
import type {
  LearningPathLessonKind,
  LearningPathRaw,
} from "@/lib/types/raw/learning-path";

export interface SaveLearningPathResult {
  ok: boolean;
  error?: string;
}

const VALID_KINDS: LearningPathLessonKind[] = ["leitura", "pratica"];

function fail(message: string): SaveLearningPathResult {
  return { ok: false, error: message };
}

/**
 * Recebe o rascunho montado pelo TrilhaEditor (client) e valida a forma
 * antes de gravar — o editor já impede a maioria dos casos inválidos pela
 * UI, mas a action é o único ponto que decide o que vai para o disco.
 */
export async function saveLearningPath(
  userId: string,
  subjectCode: string,
  draft: LearningPathRaw
): Promise<SaveLearningPathResult> {
  if (!userId || !subjectCode) return fail("Usuário ou disciplina inválidos.");
  if (draft.subject_code !== subjectCode) return fail("Código da disciplina não confere.");
  if (!draft.title.trim()) return fail("Informe o título da trilha.");
  if (draft.sections.length === 0) return fail("Adicione ao menos uma seção.");

  const seenSectionIds = new Set<string>();
  const seenLessonIds = new Set<string>();

  for (const section of draft.sections) {
    if (!section.id.trim() || !section.title.trim()) {
      return fail("Toda seção precisa de identificador e título.");
    }
    if (seenSectionIds.has(section.id)) {
      return fail(`Identificador de seção duplicado: "${section.id}".`);
    }
    seenSectionIds.add(section.id);

    if (section.lessons.length === 0) {
      return fail(`A seção "${section.title}" precisa de ao menos uma lição.`);
    }

    for (const lesson of section.lessons) {
      if (!lesson.id.trim() || !lesson.title.trim()) {
        return fail("Toda lição precisa de identificador e título.");
      }
      if (seenLessonIds.has(lesson.id)) {
        return fail(`Identificador de lição duplicado: "${lesson.id}".`);
      }
      seenLessonIds.add(lesson.id);

      if (!VALID_KINDS.includes(lesson.kind)) {
        return fail(`Tipo de lição inválido em "${lesson.title}".`);
      }
      if (!Number.isFinite(lesson.duration_min) || lesson.duration_min < 0) {
        return fail(`Duração inválida em "${lesson.title}".`);
      }
      if (!Number.isFinite(lesson.points) || lesson.points < 0) {
        return fail(`Pontuação inválida em "${lesson.title}".`);
      }
      if (!lesson.content.trim()) {
        return fail(`Adicione o conteúdo da lição "${lesson.title}".`);
      }
      for (const video of lesson.videos ?? []) {
        if (!video.title.trim() || !video.embed_url.trim()) {
          return fail(`Vídeo incompleto na lição "${lesson.title}".`);
        }
      }
    }
  }

  const normalized: LearningPathRaw = {
    subject_code: draft.subject_code,
    title: draft.title.trim(),
    subtitle: draft.subtitle.trim(),
    sections: draft.sections.map((section) => ({
      id: section.id.trim(),
      title: section.title.trim(),
      summary: section.summary.trim(),
      lessons: section.lessons.map((lesson) => ({
        id: lesson.id.trim(),
        title: lesson.title.trim(),
        kind: lesson.kind,
        duration_min: Math.round(lesson.duration_min),
        points: Math.round(lesson.points),
        completed: lesson.completed,
        content: lesson.content.trim(),
        ...(lesson.videos && lesson.videos.length > 0
          ? {
              videos: lesson.videos.map((video) => ({
                title: video.title.trim(),
                embed_url: video.embed_url.trim(),
              })),
            }
          : {}),
      })),
    })),
  };

  try {
    await writeUserJsonFile(
      normalized,
      userId,
      "subjects",
      subjectCode,
      "learning-path.json"
    );
  } catch {
    return fail("Não foi possível salvar o arquivo. Tente novamente.");
  }

  revalidatePath(`/disciplinas/${subjectCode}/trilha-de-aprendizagem`);
  revalidatePath(`/portal-responsavel/${subjectCode}/trilha-de-aprendizagem`);

  return { ok: true };
}
