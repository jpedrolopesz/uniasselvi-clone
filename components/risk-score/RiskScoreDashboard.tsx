"use client";

import { useState, useEffect } from "react";

interface Factor {
  name: string;
  weight: number;
  value: number;
  contribution: number;
  description: string;
}

interface ScoreData {
  ok: boolean;
  hasScore: boolean;
  currentScore?: {
    score: number;
    level: string;
    factors: Factor[];
    calculatedAt: string;
    syncedToSalesforce: string | null;
  };
  history?: { score: number; level: string; calculatedAt: string }[];
  trend?: "improving" | "worsening" | "stable";
  message?: string;
}

interface RiskScoreDashboardProps {
  studentId: string;
}

const LEVEL_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  low: { label: "Baixo", color: "text-accent-green", bg: "bg-accent-green/20" },
  medium: { label: "Moderado", color: "text-brand-yellow", bg: "bg-brand-yellow/20" },
  high: { label: "Alto", color: "text-accent-orange", bg: "bg-accent-orange/20" },
  critical: { label: "Crítico", color: "text-accent-red", bg: "bg-accent-red/20" },
};

const TREND_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  improving: { label: "Melhorando", icon: "↗", color: "text-accent-green" },
  worsening: { label: "Atenção necessária", icon: "↘", color: "text-accent-red" },
  stable: { label: "Estável", icon: "→", color: "text-text-secondary" },
};

export function RiskScoreDashboard({ studentId }: RiskScoreDashboardProps) {
  const [data, setData] = useState<ScoreData | null>(null);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);

  useEffect(() => {
    loadScore();
  }, [studentId]);

  async function loadScore() {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/risk-score?studentId=${studentId}`);
      const result = await res.json();
      setData(result);
    } catch (err) {
      console.error("Erro ao carregar score:", err);
    } finally {
      setLoading(false);
    }
  }

  async function recalculate() {
    setRecalculating(true);
    try {
      await fetch("/api/v1/risk-score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId }),
      });
      await loadScore();
    } catch (err) {
      console.error("Erro ao recalcular:", err);
    } finally {
      setRecalculating(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-brand-yellow border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data?.hasScore) {
    return (
      <div className="rounded-xl bg-bg-card border border-border-subtle p-8 text-center">
        <p className="text-text-secondary mb-4">
          Score ainda não calculado para este aluno.
        </p>
        <button
          onClick={recalculate}
          disabled={recalculating}
          className="px-4 py-2 bg-brand-yellow text-black font-semibold rounded-lg disabled:opacity-50"
        >
          {recalculating ? "Calculando..." : "Calcular Agora"}
        </button>
      </div>
    );
  }

  const score = data.currentScore!;
  const levelConfig = LEVEL_CONFIG[score.level] ?? LEVEL_CONFIG.low;
  const trendConfig = TREND_LABELS[data.trend ?? "stable"];

  return (
    <div className="flex flex-col gap-6">
      {/* Score principal */}
      <div className="rounded-xl bg-bg-card border border-border-subtle p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm text-text-secondary">Score de Risco de Evasão</p>
            <p className="text-xs text-text-secondary mt-1">
              Calculado em: {new Date(score.calculatedAt).toLocaleDateString("pt-BR", {
                day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
              })}
            </p>
          </div>
          <div className={`flex items-center gap-1 ${trendConfig.color}`}>
            <span>{trendConfig.icon}</span>
            <span className="text-xs">{trendConfig.label}</span>
          </div>
        </div>

        <div className="flex items-end gap-4">
          <div className="text-5xl font-bold text-text-primary">{score.score}</div>
          <div className="mb-1">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${levelConfig.bg} ${levelConfig.color}`}>
              {levelConfig.label}
            </span>
          </div>
          <div className="flex-1" />
          <span className="text-xs text-text-secondary">/100</span>
        </div>

        {/* Barra visual */}
        <div className="mt-4 h-2 bg-bg-card-hover rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              score.score >= 75 ? "bg-accent-red" :
              score.score >= 50 ? "bg-accent-orange" :
              score.score >= 30 ? "bg-brand-yellow" :
              "bg-accent-green"
            }`}
            style={{ width: `${score.score}%` }}
          />
        </div>
        <div className="flex justify-between mt-1 text-[10px] text-text-secondary">
          <span>Baixo risco</span>
          <span>Alto risco</span>
        </div>
      </div>

      {/* Fatores */}
      <section>
        <h2 className="text-lg font-semibold text-text-primary mb-3">Fatores de Risco</h2>
        <div className="flex flex-col gap-2">
          {score.factors.sort((a, b) => b.contribution - a.contribution).map((factor) => (
            <div key={factor.name} className="rounded-lg bg-bg-card border border-border-subtle p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-text-primary">{factor.name}</span>
                <span className={`text-xs font-medium ${
                  factor.value >= 70 ? "text-accent-red" :
                  factor.value >= 40 ? "text-accent-orange" :
                  "text-accent-green"
                }`}>
                  {factor.contribution} pts
                </span>
              </div>
              <p className="text-xs text-text-secondary">{factor.description}</p>
              <div className="mt-2 h-1 bg-bg-card-hover rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    factor.value >= 70 ? "bg-accent-red" :
                    factor.value >= 40 ? "bg-accent-orange" :
                    "bg-accent-green"
                  }`}
                  style={{ width: `${factor.value}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Histórico */}
      {data.history && data.history.length > 1 && (
        <section>
          <h2 className="text-lg font-semibold text-text-primary mb-3">Histórico</h2>
          <div className="rounded-xl bg-bg-card border border-border-subtle p-4">
            <div className="flex items-end gap-1 h-24">
              {data.history.slice(0, 14).reverse().map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t"
                  style={{
                    height: `${h.score}%`,
                    backgroundColor: h.score >= 75 ? "var(--color-accent-red)" :
                      h.score >= 50 ? "var(--color-accent-orange)" :
                      h.score >= 30 ? "var(--color-brand-yellow)" :
                      "var(--color-accent-green)",
                    opacity: 0.6 + (i / 14) * 0.4,
                  }}
                  title={`${h.score} (${new Date(h.calculatedAt).toLocaleDateString("pt-BR")})`}
                />
              ))}
            </div>
            <p className="text-xs text-text-secondary mt-2 text-center">
              Últimos {Math.min(14, data.history.length)} cálculos
            </p>
          </div>
        </section>
      )}

      {/* Ações */}
      <div className="flex gap-3">
        <button
          onClick={recalculate}
          disabled={recalculating}
          className="px-4 py-2 text-sm bg-bg-card border border-border-subtle text-text-primary rounded-lg hover:bg-bg-card-hover disabled:opacity-50 transition"
        >
          {recalculating ? "Recalculando..." : "Recalcular Score"}
        </button>
        {score.syncedToSalesforce && (
          <span className="flex items-center gap-1 text-xs text-accent-green">
            ✓ Sincronizado com CRM
          </span>
        )}
      </div>
    </div>
  );
}
