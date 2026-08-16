interface TestStepperProps {
  totalQuestions: number;
  currentIndex: number;
  answeredIndexes: Set<number>;
  onSelect: (index: number) => void;
}

export function TestStepper({
  totalQuestions,
  currentIndex,
  answeredIndexes,
  onSelect,
}: TestStepperProps) {
  return (
    <div className="flex items-center gap-3 overflow-x-auto py-2">
      {Array.from({ length: totalQuestions }, (_, index) => {
        const isCurrent = index === currentIndex;
        const isAnswered = answeredIndexes.has(index);

        return (
          <button
            key={index}
            type="button"
            onClick={() => onSelect(index)}
            aria-label={`Pergunta ${index + 1}`}
            aria-current={isCurrent ? "step" : undefined}
            className={[
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition",
              isCurrent
                ? "bg-accent-cyan text-black"
                : isAnswered
                  ? "bg-accent-cyan/20 text-accent-cyan"
                  : "bg-bg-card text-text-secondary hover:bg-bg-card-hover",
            ].join(" ")}
          >
            {isAnswered && !isCurrent ? "✎" : index + 1}
          </button>
        );
      })}
    </div>
  );
}
