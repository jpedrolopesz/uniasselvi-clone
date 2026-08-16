"use client";

import { useState } from "react";

interface ProfileOnboardingProps {
  studentId: string;
}

const STEPS = [
  {
    id: "learning_style",
    title: "Como você aprende melhor?",
    description: "Entender seu estilo ajuda a direcionar o formato do conteúdo.",
    questions: [
      { id: "vark_visual", text: "Prefiro diagramas, gráficos e vídeos a textos longos.", type: "scale" as const },
      { id: "vark_auditory", text: "Aprendo melhor ouvindo explicações (podcasts, aulas).", type: "scale" as const },
      { id: "vark_reading", text: "Prefiro ler e fazer anotações escritas para fixar.", type: "scale" as const },
      { id: "vark_kinesthetic", text: "Aprendo fazendo — exercícios práticos me ajudam mais.", type: "scale" as const },
    ],
  },
  {
    id: "routine",
    title: "Sua rotina",
    description: "Para sugerir horários de estudo que funcionem na sua vida.",
    questions: [
      { id: "works_full_time", text: "Você trabalha?", type: "choice" as const, options: ["Sim, integral", "Meio período", "Não trabalho"] },
      { id: "preferred_time", text: "Quando tem mais energia para estudar?", type: "multi" as const, options: ["Cedo (6h-8h)", "Manhã", "Tarde", "Noite (18h-22h)", "Madrugada"] },
      { id: "session_duration", text: "Quanto tempo consegue estudar sem perder o foco?", type: "choice" as const, options: ["25 min", "45 min", "1 hora", "1h30", "2h+"] },
    ],
  },
  {
    id: "goals",
    title: "Seus objetivos",
    description: "Para conectar você com oportunidades relevantes.",
    questions: [
      { id: "motivation", text: "O que te motiva a concluir o curso?", type: "choice" as const, options: ["Crescer na carreira", "Mudar de área", "Desenvolvimento pessoal", "Exigência do trabalho", "Empreender"] },
      { id: "career", text: "Seu objetivo profissional:", type: "text" as const },
    ],
  },
  {
    id: "challenges",
    title: "Suas dificuldades",
    description: "Para oferecer o suporte certo no momento certo.",
    questions: [
      { id: "difficulties", text: "Maiores desafios no EAD:", type: "multi" as const, options: ["Falta de tempo", "Conteúdo difícil", "Falta de motivação", "Tecnologia", "Isolamento", "Financeiro", "Trabalho + estudo"] },
      { id: "formats", text: "Formatos de conteúdo preferidos:", type: "multi" as const, options: ["Vídeos curtos", "Resumos texto", "Infográficos", "Podcasts", "Flashcards", "Mapas mentais", "Quizzes", "Estudos de caso"] },
    ],
  },
  {
    id: "community",
    title: "Interesses além das aulas",
    description: "Para conectar você com pessoas e projetos.",
    questions: [
      { id: "interests", text: "O que te interessa participar?", type: "multi" as const, options: ["Empresa Júnior", "Grupo de Pesquisa", "Atlética", "Networking", "Mentoria", "Voluntariado", "Hackathons"] },
      { id: "mentoring", text: "Mentoria:", type: "choice" as const, options: ["Quero ter um mentor", "Quero mentorar", "Ambos", "Não por enquanto"] },
    ],
  },
];

export function ProfileOnboarding({ studentId }: ProfileOnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [completed, setCompleted] = useState(false);

  const step = STEPS[currentStep];
  const completeness = Math.round(((currentStep) / STEPS.length) * 100);

  function handleAnswer(questionId: string, value: unknown) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }

  function handleNext() {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setCompleted(true);
    }
  }

  if (completed) {
    return (
      <div className="rounded-xl bg-bg-card border border-accent-green/30 p-8 text-center">
        <div className="text-4xl mb-4">🎉</div>
        <h2 className="text-xl font-bold text-text-primary mb-2">Perfil completo!</h2>
        <p className="text-text-secondary mb-4">Suas recomendações já estão personalizadas.</p>
        <div className="flex gap-3 justify-center flex-wrap">
          <a href="/recomendacoes" className="px-4 py-2 bg-brand-yellow text-black font-semibold rounded-lg">Ver Recomendações</a>
          <a href="/comunidade" className="px-4 py-2 bg-bg-card-hover border border-border-subtle text-text-primary rounded-lg">Explorar Comunidade</a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Progress */}
      <div className="flex items-center gap-2">
        {STEPS.map((_, i) => (
          <div key={i} className={`h-1.5 flex-1 rounded-full transition ${i <= currentStep ? "bg-brand-yellow" : "bg-border-subtle"}`} />
        ))}
        <span className="text-xs text-text-secondary ml-2">{completeness}%</span>
      </div>

      {/* Step */}
      <div className="rounded-xl bg-bg-card border border-border-subtle p-6">
        <h2 className="text-lg font-semibold text-text-primary mb-1">{step.title}</h2>
        <p className="text-sm text-text-secondary mb-6">{step.description}</p>

        <div className="flex flex-col gap-5">
          {step.questions.map((q) => (
            <div key={q.id}>
              <label className="text-sm font-medium text-text-primary mb-2 block">{q.text}</label>

              {q.type === "scale" && (
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((v) => (
                    <button key={v} onClick={() => handleAnswer(q.id, v * 20)}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${answers[q.id] === v * 20 ? "bg-brand-yellow text-black" : "bg-bg-card-hover text-text-secondary hover:bg-border-subtle"}`}>
                      {v}
                    </button>
                  ))}
                </div>
              )}

              {q.type === "choice" && (
                <div className="flex flex-col gap-2">
                  {q.options?.map((opt) => (
                    <button key={opt} onClick={() => handleAnswer(q.id, opt)}
                      className={`px-4 py-2.5 rounded-lg text-left text-sm transition ${answers[q.id] === opt ? "bg-brand-yellow/20 border border-brand-yellow text-text-primary" : "bg-bg-card-hover border border-border-subtle text-text-secondary hover:border-text-secondary"}`}>
                      {opt}
                    </button>
                  ))}
                </div>
              )}

              {q.type === "multi" && (
                <div className="flex flex-wrap gap-2">
                  {q.options?.map((opt) => {
                    const sel = Array.isArray(answers[q.id]) ? (answers[q.id] as string[]).includes(opt) : false;
                    return (
                      <button key={opt} onClick={() => {
                        const cur = (answers[q.id] as string[]) ?? [];
                        handleAnswer(q.id, sel ? cur.filter((v) => v !== opt) : [...cur, opt]);
                      }}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${sel ? "bg-brand-yellow/20 border border-brand-yellow text-text-primary" : "bg-bg-card-hover border border-border-subtle text-text-secondary hover:border-text-secondary"}`}>
                        {opt}
                      </button>
                    );
                  })}
                </div>
              )}

              {q.type === "text" && (
                <input type="text" onChange={(e) => handleAnswer(q.id, e.target.value)} placeholder="Digite aqui..."
                  className="w-full px-4 py-2.5 bg-bg-card-hover border border-border-subtle rounded-lg text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-brand-yellow" />
              )}
            </div>
          ))}
        </div>

        <div className="flex justify-between mt-8">
          <button onClick={() => setCurrentStep(Math.max(0, currentStep - 1))} disabled={currentStep === 0}
            className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary disabled:opacity-30">
            ← Anterior
          </button>
          <button onClick={handleNext}
            className="px-6 py-2 bg-brand-yellow text-black font-semibold rounded-lg hover:bg-brand-yellow-dark transition">
            {currentStep === STEPS.length - 1 ? "Concluir" : "Próximo →"}
          </button>
        </div>
      </div>
    </div>
  );
}
