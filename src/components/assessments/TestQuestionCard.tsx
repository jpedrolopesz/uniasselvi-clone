import type { TestQuestionRaw } from "@/lib/types/raw/test-content";

interface TestQuestionCardProps {
  question: TestQuestionRaw;
  selectedAlternativeCode: string | undefined;
  onSelectAlternative: (alternativeCode: string) => void;
}

/**
 * `description` e as alternativas vêm como HTML do dado original (ex.: <p>).
 * Conteúdo local e confiável (não é entrada de usuário em tempo de execução),
 * por isso é renderizado com dangerouslySetInnerHTML em vez de reescrito
 * como texto plano — reescrever perderia formatação do conteúdo original.
 */
export function TestQuestionCard({
  question,
  selectedAlternativeCode,
  onSelectAlternative,
}: TestQuestionCardProps) {
  return (
    <div className="flex flex-col gap-4">
      <div
        className="prose-invert text-sm leading-relaxed text-white [&_p]:mb-2"
        dangerouslySetInnerHTML={{ __html: question.description }}
      />

      <div className="flex flex-col gap-2">
        {question.alternatives.map((alternative) => {
          const isSelected = alternative.alternative_code === selectedAlternativeCode;
          return (
            <label
              key={alternative.alternative_code}
              className="flex cursor-pointer items-start gap-3 rounded-lg p-2 transition hover:bg-bg-card-hover"
            >
              <input
                type="radio"
                name={`question-${question.question_code}`}
                checked={isSelected}
                onChange={() => onSelectAlternative(alternative.alternative_code)}
                className="mt-1 h-4 w-4 accent-accent-cyan"
              />
              <span className="text-sm text-white">
                <strong>{alternative.letter})</strong>{" "}
                <span
                  className="[&_p]:inline"
                  dangerouslySetInnerHTML={{ __html: alternative.description }}
                />
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
