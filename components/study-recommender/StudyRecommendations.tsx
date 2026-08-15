"use client";

import { useState, useEffect } from "react";

interface SubjectPriority {
  subjectCode: string;
  subjectName: string;
  score: number;
  reasons: string[];
  nextDeadline: string | null;
  currentGrade: number | null;
  suggestedHoursPerWeek: number;
}

interface StudyMethod {
  type: string;
  name: string;
  description: string;
  estimatedEfficiency: number;
}

interface RecommendationsData {
  ok: boolean;
  hasProfile: boolean;
  prioritizedSubjects: SubjectPriority[];
  suggestedMethods: StudyMethod[];
  contentFormats: string[];
  adaptiveContent: { format: string; title: string; content: string } | null;
  tips: string[];
  message?: string;
}

interface StudyRecommendationsProps {
  studentId: string;
}

export function StudyRecommendations({ studentId }: StudyRecommendationsProps) {
  const [data, setData] = useState<RecommendationsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadRecommendations(false);
  }, [studentId]);

  async function loadRecommendations(withGeneration: boolean) {
    if (withGeneration) setGenerating(true);
    else setLoading(true);

    try {
      const url = `/api/v1/recommend?studentId=${studentId}${withGeneration ? "&generate=true" : ""}`;
      const res = await fetch(url);
      const result = await res.json();
      setData(result);
    } catch (err) {
      console.error("Erro ao carregar recomendações:", err);
    } finally {
      setLoading(false);
      setGenerating(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-brand-yellow border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data?.hasProfile) {
    return (
      <div className="rounded-xl bg-bg-card border border-border-subtle p-8 text-center">
        <p className="text-text-secondary mb-4">
          Complete seu perfil para receber recomendações personalizadas.
        </p>
        <a
          href="/perfil"
          className="px-4 py-2 bg-brand-yellow text-black font-semibold rounded-lg"
        >
          Completar Perfil
        </a>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Disciplinas priorizadas */}
      <section>
        <h2 className="text-lg font-semibold text-text-primary mb-3">
          📚 Prioridades da Semana
        </h2>
        <div className="flex flex-col gap-3">
          {data.prioritizedSubjects.map((subject, i) => (
            <div
              key={subject.subjectCode}
              className="rounded-xl bg-bg-card border border-border-subtle p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    i === 0 ? "bg-accent-red/20 text-accent-red" :
                    i === 1 ? "bg-accent-orange/20 text-accent-orange" :
                    "bg-border-subtle text-text-secondary"
                  }`}>
                    {i + 1}
                  </span>
                  <div>
                    <p className="font-medium text-text-primary">{subject.subjectName}</p>
                    <p className="text-xs text-text-secondary">{subject.subjectCode}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-text-primary">
                    {subject.suggestedHoursPerWeek}h/sem
                  </p>
                  {subject.currentGrade !== null && (
                    <p className={`text-xs ${subject.currentGrade < 6 ? "text-accent-red" : "text-accent-green"}`}>
                      Nota: {subject.currentGrade.toFixed(1)}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-1">
                {subject.reasons.map((reason, j) => (
                  <span key={j} className="px-2 py-0.5 rounded bg-bg-card-hover text-xs text-text-secondary">
                    {reason}
                  </span>
                ))}
              </div>
              {subject.nextDeadline && (
                <p className="text-xs text-accent-orange mt-2">
                  Próxima avaliação: {new Date(subject.nextDeadline).toLocaleDateString("pt-BR")}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Métodos de estudo */}
      <section>
        <h2 className="text-lg font-semibold text-text-primary mb-3">
          🧠 Métodos Recomendados para Você
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {data.suggestedMethods.map((method) => (
            <div
              key={method.type}
              className="rounded-xl bg-bg-card border border-border-subtle p-4"
            >
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-medium text-text-primary text-sm">{method.name}</h3>
                <span className="text-xs text-accent-green">
                  {Math.round(method.estimatedEfficiency * 100)}% fit
                </span>
              </div>
              <p className="text-xs text-text-secondary">{method.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Dicas */}
      {data.tips && data.tips.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-text-primary mb-3">
            💡 Dicas para Você
          </h2>
          <div className="rounded-xl bg-bg-card border border-border-subtle p-4">
            <ul className="flex flex-col gap-2">
              {data.tips.map((tip, i) => (
                <li key={i} className="text-sm text-text-secondary flex gap-2">
                  <span className="text-brand-yellow">•</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Conteúdo gerado por IA */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-text-primary">
            🤖 Conteúdo Adaptativo (IA)
          </h2>
          <button
            onClick={() => loadRecommendations(true)}
            disabled={generating}
            className="px-3 py-1.5 text-xs bg-accent-purple/20 text-accent-purple border border-accent-purple/30 rounded-lg hover:bg-accent-purple/30 disabled:opacity-50 transition"
          >
            {generating ? "Gerando..." : "Gerar com IA"}
          </button>
        </div>

        {data.adaptiveContent ? (
          <div className="rounded-xl bg-bg-card border border-accent-purple/30 p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="px-2 py-0.5 rounded bg-accent-purple/20 text-accent-purple text-xs">
                {data.adaptiveContent.format}
              </span>
              <h3 className="font-medium text-text-primary text-sm">
                {data.adaptiveContent.title}
              </h3>
            </div>
            <div className="text-sm text-text-secondary whitespace-pre-wrap leading-relaxed">
              {data.adaptiveContent.content}
            </div>
          </div>
        ) : (
          <div className="rounded-xl bg-bg-card border border-border-subtle p-6 text-center">
            <p className="text-text-secondary text-sm">
              Clique em "Gerar com IA" para criar conteúdo adaptativo (resumos, flashcards, mapas mentais)
              personalizado para seu estilo de aprendizagem.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
