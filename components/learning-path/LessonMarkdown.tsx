import type { ReactNode } from "react";

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

/** Renderizador minimalista para o subconjunto de markdown usado em learning-path.json: `## título`, parágrafos e `**negrito**`. */
export function LessonMarkdown({ content }: { content: string }) {
  const blocks = content.trim().split(/\n\n+/);

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
        return (
          <p key={i} className="text-sm leading-relaxed text-text-secondary">
            {renderInline(block)}
          </p>
        );
      })}
    </div>
  );
}
