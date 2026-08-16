"use client";

import { useState } from "react";
import type { TestContentRaw } from "@/lib/types/raw/test-content";
import { TestInfoCard } from "@/components/assessments/TestInfoCard";
import { TestToolbar } from "@/components/assessments/TestToolbar";
import { TestStepper } from "@/components/assessments/TestStepper";
import { TestQuestionCard } from "@/components/assessments/TestQuestionCard";

/**
 * Estado de resposta é local à sessão do navegador (não há endpoint real de
 * envio) — nada aqui é persistido ou enviado para qualquer lugar.
 */
export function TestRunner({ testContent }: { testContent: TestContentRaw }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [fontScale, setFontScale] = useState(1);

  const totalQuestions = testContent.questions.length;
  const currentQuestion = testContent.questions[currentIndex];
  const answeredIndexes = new Set(
    testContent.questions
      .map((question, index) => (answers[question.question_code] ? index : -1))
      .filter((index) => index >= 0)
  );

  function selectAlternative(alternativeCode: string) {
    setAnswers((prev) => ({ ...prev, [currentQuestion.question_code]: alternativeCode }));
  }

  return (
    <div className="flex flex-col gap-4" style={{ fontSize: `${fontScale}rem` }}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h1 className="text-xl font-bold uppercase tracking-tight text-white">
          Responder Avaliação
        </h1>
        <TestToolbar onIncreaseFontSize={() => setFontScale((s) => Math.min(1.4, s + 0.1))} />
      </div>

      <TestInfoCard info={testContent.info} />

      {totalQuestions === 0 ? (
        <p className="rounded-xl bg-bg-card p-6 text-center text-sm text-text-secondary">
          Nenhuma questão disponível para esta avaliação.
        </p>
      ) : (
        <>
          <TestStepper
            totalQuestions={totalQuestions}
            currentIndex={currentIndex}
            answeredIndexes={answeredIndexes}
            onSelect={setCurrentIndex}
          />

          <div className="rounded-xl bg-bg-card p-5">
            <TestQuestionCard
              question={currentQuestion}
              selectedAlternativeCode={answers[currentQuestion.question_code]}
              onSelectAlternative={selectAlternative}
            />
          </div>

          <div className="flex justify-between">
            <button
              type="button"
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
              className="rounded-full bg-bg-card px-5 py-2 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-40 hover:not-disabled:bg-bg-card-hover"
            >
              Anterior
            </button>
            <button
              type="button"
              disabled={currentIndex === totalQuestions - 1}
              onClick={() => setCurrentIndex((i) => Math.min(totalQuestions - 1, i + 1))}
              className="rounded-full bg-accent-cyan px-5 py-2 text-sm font-semibold text-black transition disabled:cursor-not-allowed disabled:opacity-40 hover:not-disabled:brightness-110"
            >
              Próxima
            </button>
          </div>
        </>
      )}
    </div>
  );
}
