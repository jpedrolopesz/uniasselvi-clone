"use client";

import { useState } from "react";

interface RiskScoreDashboardProps {
  studentId: string;
}

const MOCK_SCORE = {
  score: 62,
  level: "high" as const,
  factors: [
    { name: "Frequência de Acesso", weight: 0.25, value: 70, contribution: 18, description: "Último acesso há 8 dias, 3 acessos em 14 dias" },
    { name: "Desempenho Acadêmico", weight: 0.20, value: 75, contribution: 15, description: "Média 5.2, 40% entregas no prazo" },
    { name: "Progresso na Trilha", weight: 0.15, value: 60, contribution: 9, description: "Progresso: 30%" },
    { name: "Engajamento Social", weight: 0.15, value: 50, contribution: 8, description: "0 grupo(s), 2 interações Vitru" },
    { name: "Situação Financeira", weight: 0.10, value: 80, contribution: 8, description: "Pendências financeiras" },
    { name: "Disciplinas em Risco", weight: 0.15, value: 45, contribution: 7, description: "2 de 5 abaixo da média" },
  ],
  history: [42, 45, 48, 52, 55, 55, 58, 60, 62, 62],
};

const LEVEL_CONFIG = {
  low: { label: "Baixo", color: "text-accent-green", bg: "bg-accent-green/20" },
  medium: { label: "Moderado", color: "text-brand-yellow", bg: "bg-brand-yellow/20" },
  high: { label: "Alto", color: "text-accent-orange", bg: "bg-accent-orange/20" },
  critical: { label: "Crítico", color: "text-accent-red", bg: "bg-accent-red/20" },
};

export function RiskScoreDashboard({ studentId }: RiskScoreDashboardProps) {
  const [recalculated, setRecalculated] = useState(false);
  const score = MOCK_SCORE;
  const cfg = LEVEL_CONFIG[score.level];

  return (
    <div className="flex flex-col gap-6">
      {/* Score principal */}
      <div className="rounded-xl bg-bg-card border border-border-subtle p-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-text-secondary">Score de Risco de Evasão</p>
          <span className="text-xs text-accent-orange">↘ Atenção necessária</span>
        </div>
        <div className="flex items-end gap-4">
          <div className="text-5xl font-bold text-text-primary">{score.score}</div>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
          <div className="flex-1" />
          <span className="text-xs text-text-secondary">/100</span>
        </div>
        <div className="mt-4 h-2 bg-bg-card-hover rounded-full overflow-hidden">
          <div className="h-full rounded-full bg-accent-orange transition-all duration-500" style={{ width: `${score.score}%` }} />
        </div>
        <div className="flex justify-between mt-1 text-[10px] text-text-secondary">
          <span>Baixo risco</span><span>Alto risco</span>
        </div>
      </div>

      {/* Fatores */}
      <section>
        <h2 className="text-lg font-semibold text-text-primary mb-3">Fatores de Risco</h2>
        <div className="flex flex-col gap-2">
          {score.factors.sort((a, b) => b.contribution - a.contribution).map((f) => (
            <div key={f.name} className="rounded-lg bg-bg-card border border-border-subtle p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-text-primary">{f.name}</span>
                <span className={`text-xs font-medium ${f.value >= 70 ? "text-accent-red" : f.value >= 40 ? "text-accent-orange" : "text-accent-green"}`}>{f.contribution} pts</span>
              </div>
              <p className="text-xs text-text-secondary">{f.description}</p>
              <div className="mt-2 h-1 bg-bg-card-hover rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${f.value >= 70 ? "bg-accent-red" : f.value >= 40 ? "bg-accent-orange" : "bg-accent-green"}`} style={{ width: `${f.value}%` }} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Histórico */}
      <section>
        <h2 className="text-lg font-semibold text-text-primary mb-3">Histórico (últimos 10 dias)</h2>
        <div className="rounded-xl bg-bg-card border border-border-subtle p-4">
          <div className="flex items-end gap-1 h-24">
            {score.history.map((h, i) => (
              <div key={i} className="flex-1 rounded-t transition-all" style={{
                height: `${h}%`,
                backgroundColor: h >= 75 ? "var(--color-accent-red)" : h >= 50 ? "var(--color-accent-orange)" : h >= 30 ? "var(--color-brand-yellow)" : "var(--color-accent-green)",
                opacity: 0.5 + (i / score.history.length) * 0.5,
              }} title={`${h}/100`} />
            ))}
          </div>
          <p className="text-xs text-text-secondary mt-2 text-center">Tendência: subindo (⚠️)</p>
        </div>
      </section>

      {/* Ações */}
      <section>
        <h2 className="text-lg font-semibold text-text-primary mb-3">💡 Como Melhorar</h2>
        <div className="rounded-xl bg-bg-card border border-border-subtle p-4 flex flex-col gap-2">
          <p className="text-sm text-text-secondary flex gap-2"><span className="text-accent-green">-15 pts</span> Entrar em 1 grupo na comunidade</p>
          <p className="text-sm text-text-secondary flex gap-2"><span className="text-accent-green">-10 pts</span> Manter acesso diário ao AVA</p>
          <p className="text-sm text-text-secondary flex gap-2"><span className="text-accent-green">-8 pts</span> Subir nota de Cálculo I acima de 6.0</p>
          <p className="text-sm text-text-secondary flex gap-2"><span className="text-accent-green">-5 pts</span> Completar 2 aulas na trilha esta semana</p>
        </div>
      </section>

      <button onClick={() => setRecalculated(true)} disabled={recalculated}
        className="self-start px-4 py-2 text-sm bg-bg-card border border-border-subtle text-text-primary rounded-lg hover:bg-bg-card-hover disabled:opacity-50 transition">
        {recalculated ? "✓ Recalculado" : "Recalcular Score"}
      </button>
    </div>
  );
}
