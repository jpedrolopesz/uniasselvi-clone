"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { markParagraph } from "@/lib/learning-path/trilha-progress-actions";

function renderInline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

interface LessonMarkdownProps {
  content: string;
  userId: string;
  subjectCode: string;
  lessonId: string;
  /** paragraphId ("p0", "p1", ...) dos trechos já marcados nesta lição — mesma indexação usada em lib/vitru/trilha-resolution.ts. */
  markedParagraphIds: ReadonlySet<string>;
}

/** Renderizador minimalista para o subconjunto de markdown usado em learning-path.json: `## título`, parágrafos e `**negrito**`. */
export function LessonMarkdown({
  content,
  userId,
  subjectCode,
  lessonId,
  markedParagraphIds,
}: LessonMarkdownProps) {
  const router = useRouter();
  const blocks = content.trim().split(/\n\n+/);

  async function handleMark(paragraphId: string, excerpt: string) {
    await markParagraph(userId, subjectCode, lessonId, paragraphId, excerpt);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      {blocks.map((block, i) => {
        if (block.startsWith("## ")) {
          return (
            <h2 key={i} className="mt-2 text-lg font-bold text-white first:mt-0">
              {block.slice(3)}
            </h2>
          );
        }

        // Índice só entre os parágrafos (não-título) até aqui — mesma regra de lib/vitru/trilha-resolution.ts#lessonParagraphs, sem mutar variável nenhuma durante o render.
        const paragraphId = `p${blocks.slice(0, i).filter((b) => !b.startsWith("## ")).length}`;
        const marked = markedParagraphIds.has(paragraphId);

        return (
          <div key={i}>
            <p className="text-sm leading-relaxed text-text-secondary">{renderInline(block)}</p>
            <button
              type="button"
              onClick={() => void handleMark(paragraphId, block.replace(/\*\*/g, ""))}
              disabled={marked}
              className={`mt-1 text-xs font-medium transition ${
                marked ? "text-brand-yellow" : "text-text-secondary/50 hover:text-brand-yellow"
              }`}
            >
              {marked ? "✓ marcado para o Vitru" : "marcar trecho"}
            </button>
          </div>
        );
      })}
    </div>
  );
}
