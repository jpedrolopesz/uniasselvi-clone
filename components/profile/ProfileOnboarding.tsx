"use client";

import { useState } from "react";
import { ONBOARDING_STEPS } from "@/lib/profile/learning-profile";

interface ProfileOnboardingProps {
  studentId: string;
  initialProfile: Record<string, unknown> | null;
}

export function ProfileOnboarding({ studentId, initialProfile }: ProfileOnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [saving, setSaving] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [completeness, setCompleteness] = useState(
    (initialProfile as { completeness?: number } | null)?.completeness ?? 0
  );

  const steps = ONBOARDING_STEPS;
  const step = steps[currentStep];

  async function saveStep(stepId: string, data: Record<string, unknown>) {
    setSaving(true);
    try {
      const res = await fetch("/api/v1/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, step: stepId, data }),
      });
      const result = await res.json();
      if (result.ok) {
        setCompleteness(result.completeness ?? completeness);
      }
    } catch (err) {
      console.error("Erro ao salvar perfil:", err);
    } finally {
      setSaving(false);
    }
  }

  function handleAnswer(questionId: string, value: unknown) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }

  async function handleNext() {
    // Mapeia respostas para o formato do step
    const stepData = mapAnswersToStepData(step.id, answers);
    await saveStep(step.id, stepData);

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
      setAnswers({});
    } else {
      setCompleted(true);
    }
  }

  if (completed) {
    return (
      <div className="rounded-xl bg-bg-card border border-accent-green/30 p-8 text-center">
        <div className="text-4xl mb-4">🎉</div>
        <h2 className="text-xl font-bold text-text-primary mb-2">Perfil completo!</h2>
        <p className="text-text-secondary mb-4">
          Suas recomendações de estudo e comunidades já estão personalizadas.
        </p>
        <div className="flex gap-3 justify-center">
          <a
            href="/calendario-de-estudos"
            className="px-4 py-2 bg-brand-yellow text-black font-semibold rounded-lg hover:bg-brand-yellow-dark transition"
          >
            Ver Recomendações
          </a>
          <a
            href="/comunidade"
            className="px-4 py-2 bg-bg-card-hover border border-border-subtle text-text-primary rounded-lg hover:bg-border-subtle transition"
          >
            Explorar Comunidade
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Progress bar */}
      <div className="flex items-center gap-2">
        {steps.map((s, i) => (
          <div
            key={s.id}
            className={`h-1.5 flex-1 rounded-full transition ${
              i <= currentStep ? "bg-brand-yellow" : "bg-border-subtle"
            }`}
          />
        ))}
        <span className="text-xs text-text-secondary ml-2">
          {Math.round(completeness)}%
        </span>
      </div>

      {/* Step card */}
      <div className="rounded-xl bg-bg-card border border-border-subtle p-6">
        <h2 className="text-lg font-semibold text-text-primary mb-1">{step.title}</h2>
        <p className="text-sm text-text-secondary mb-6">{step.description}</p>

        <div className="flex flex-col gap-5">
          {step.questions.map((question) => (
            <div key={question.id}>
              <label className="text-sm font-medium text-text-primary mb-2 block">
                {question.text}
              </label>

              {question.type === "scale" && (
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((v) => (
                    <button
                      key={v}
                      onClick={() => handleAnswer(question.id, v * 20)}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
                        answers[question.id] === v * 20
                          ? "bg-brand-yellow text-black"
                          : "bg-bg-card-hover text-text-secondary hover:bg-border-subtle"
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              )}

              {question.type === "single_choice" && question.options && (
                <div className="flex flex-col gap-2">
                  {question.options.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => handleAnswer(question.id, opt.value)}
                      className={`px-4 py-2.5 rounded-lg text-left text-sm transition ${
                        answers[question.id] === opt.value
                          ? "bg-brand-yellow/20 border border-brand-yellow text-text-primary"
                          : "bg-bg-card-hover border border-border-subtle text-text-secondary hover:border-text-secondary"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}

              {question.type === "multiple_choice" && question.options && (
                <div className="flex flex-wrap gap-2">
                  {question.options.map((opt) => {
                    const selected = Array.isArray(answers[question.id])
                      ? (answers[question.id] as string[]).includes(opt.value)
                      : false;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => {
                          const current = (answers[question.id] as string[]) ?? [];
                          const next = selected
                            ? current.filter((v) => v !== opt.value)
                            : [...current, opt.value];
                          handleAnswer(question.id, next);
                        }}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                          selected
                            ? "bg-brand-yellow/20 border border-brand-yellow text-text-primary"
                            : "bg-bg-card-hover border border-border-subtle text-text-secondary hover:border-text-secondary"
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              )}

              {question.type === "text" && (
                <input
                  type="text"
                  placeholder="Digite aqui..."
                  onChange={(e) => handleAnswer(question.id, e.target.value)}
                  className="w-full px-4 py-2.5 bg-bg-card-hover border border-border-subtle rounded-lg text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-brand-yellow"
                />
              )}
            </div>
          ))}
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <button
            onClick={() => {
              setCurrentStep(Math.max(0, currentStep - 1));
              setAnswers({});
            }}
            disabled={currentStep === 0}
            className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary disabled:opacity-30 transition"
          >
            ← Anterior
          </button>

          <button
            onClick={handleNext}
            disabled={saving}
            className="px-6 py-2 bg-brand-yellow text-black font-semibold rounded-lg hover:bg-brand-yellow-dark disabled:opacity-50 transition"
          >
            {saving ? "Salvando..." : currentStep === steps.length - 1 ? "Concluir" : "Próximo →"}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Mapeia as respostas coletadas para o formato esperado pelo PATCH /api/v1/profile
 */
function mapAnswersToStepData(stepId: string, answers: Record<string, unknown>): Record<string, unknown> {
  switch (stepId) {
    case "learning_style":
      return {
        visual: answers.vark_visual ?? 0,
        auditory: answers.vark_auditory ?? 0,
        reading: answers.vark_reading ?? 0,
        kinesthetic: answers.vark_kinesthetic ?? 0,
      };
    case "routine":
      return {
        worksFullTime: answers.works_full_time === "yes",
        preferredStudyTimes: mapStudyTimes(answers.preferred_study_time),
        sessionDurationMinutes: Number(answers.session_duration) || 45,
      };
    case "goals":
      return {
        primaryMotivation: answers.primary_motivation ?? null,
        careerObjective: answers.career_objective ?? null,
      };
    case "challenges":
      return {
        reportedDifficulties: answers.difficulties ?? [],
        preferredContentFormats: answers.content_formats ?? [],
      };
    case "community":
      return {
        categories: answers.community_interests ?? [],
        openToMentoring: answers.open_to_mentoring !== "no",
      };
    default:
      return answers;
  }
}

function mapStudyTimes(value: unknown): { weekday: number; startTime: string; endTime: string }[] {
  if (!Array.isArray(value)) return [];
  const timeMap: Record<string, { start: string; end: string }> = {
    early_morning: { start: "06:00", end: "08:00" },
    morning: { start: "08:00", end: "12:00" },
    afternoon: { start: "12:00", end: "18:00" },
    evening: { start: "18:00", end: "22:00" },
    night: { start: "22:00", end: "00:00" },
  };
  // Gera para dias úteis
  return value.flatMap((period: string) => {
    const time = timeMap[period];
    if (!time) return [];
    return [1, 2, 3, 4, 5].map((weekday) => ({
      weekday,
      startTime: time.start,
      endTime: time.end,
    }));
  });
}
