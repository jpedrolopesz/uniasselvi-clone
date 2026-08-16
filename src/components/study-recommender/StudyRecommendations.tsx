"use client";

import { useState } from "react";

interface StudyRecommendationsProps {
  studentId: string;
}

const SUBJECTS = [
  { code: "EST01", name: "Estatística Aplicada", score: 85, reasons: ["Avaliação em 3 dias", "Peso 4"], deadline: "2026-08-19", grade: 6.1, hours: 6 },
  { code: "CALC1", name: "Cálculo I", score: 70, reasons: ["Nota atual: 5.2 (abaixo da média)"], deadline: "2026-08-25", grade: 5.2, hours: 4 },
  { code: "ADM200", name: "Administração Estratégica", score: 45, reasons: ["Progresso 30% (esperado ~55%)"], deadline: "2026-09-10", grade: null, hours: 3 },
  { code: "DIR101", name: "Direito Empresarial", score: 25, reasons: ["Em dia ✓"], deadline: "2026-09-20", grade: 7.8, hours: 2 },
];

const METHODS = [
  { type: "mind_mapping", name: "Mapas Mentais", desc: "Organize conceitos em diagrama visual.", efficiency: 0.9 },
  { type: "practice_testing", name: "Exercícios Práticos", desc: "Resolva questões antes de revisar material.", efficiency: 0.85 },
  { type: "flashcards", name: "Flashcards Visuais", desc: "Revisão ativa com cards de pergunta/resposta.", efficiency: 0.8 },
  { type: "feynman", name: "Técnica Feynman", desc: "Explique como se ensinasse a alguém.", efficiency: 0.75 },
  { type: "pomodoro", name: "Pomodoro", desc: "25 min foco + 5 min pausa. A cada 4, pausa longa.", efficiency: 0.7 },
];

const TIPS = [
  "Use cores diferentes para categorizar informações nos seus resumos.",
  "Assista vídeos com diagramas e animações para conceitos complexos.",
  "Resolva exercícios práticos antes de ler a teoria — aprenda fazendo.",
  "Use a técnica Pomodoro (25min foco + 5min pausa) para manter consistência.",
  "Explore o Hub de Comunidade — conectar-se reduz o isolamento.",
];

export function StudyRecommendations({ studentId }: StudyRecommendationsProps) {
  const [showContent, setShowContent] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      {/* Disciplinas priorizadas */}
      <section>
        <h2 className="text-lg font-semibold text-text-primary mb-3">📚 Prioridades da Semana</h2>
        <div className="flex flex-col gap-3">
          {SUBJECTS.map((s, i) => (
            <div key={s.code} className="rounded-xl bg-bg-card border border-border-subtle p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? "bg-accent-red/20 text-accent-red" : i === 1 ? "bg-accent-orange/20 text-accent-orange" : "bg-border-subtle text-text-secondary"}`}>{i + 1}</span>
                  <div>
                    <p className="font-medium text-text-primary">{s.name}</p>
                    <p className="text-xs text-text-secondary">{s.code}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-text-primary">{s.hours}h/sem</p>
                  {s.grade !== null && <p className={`text-xs ${s.grade < 6 ? "text-accent-red" : "text-accent-green"}`}>Nota: {s.grade}</p>}
                </div>
              </div>
              <div className="flex flex-wrap gap-1">
                {s.reasons.map((r, j) => <span key={j} className="px-2 py-0.5 rounded bg-bg-card-hover text-xs text-text-secondary">{r}</span>)}
              </div>
              <p className="text-xs text-accent-orange mt-2">Próxima avaliação: {new Date(s.deadline).toLocaleDateString("pt-BR")}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Métodos */}
      <section>
        <h2 className="text-lg font-semibold text-text-primary mb-3">🧠 Métodos para Você (perfil Visual/Cinestésico)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {METHODS.map((m) => (
            <div key={m.type} className="rounded-xl bg-bg-card border border-border-subtle p-4">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-medium text-text-primary text-sm">{m.name}</h3>
                <span className="text-xs text-accent-green">{Math.round(m.efficiency * 100)}% fit</span>
              </div>
              <p className="text-xs text-text-secondary">{m.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Dicas */}
      <section>
        <h2 className="text-lg font-semibold text-text-primary mb-3">💡 Dicas para Você</h2>
        <div className="rounded-xl bg-bg-card border border-border-subtle p-4">
          <ul className="flex flex-col gap-2">
            {TIPS.map((t, i) => <li key={i} className="text-sm text-text-secondary flex gap-2"><span className="text-brand-yellow">•</span>{t}</li>)}
          </ul>
        </div>
      </section>

      {/* Conteúdo IA */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-text-primary">🤖 Conteúdo Adaptativo (IA)</h2>
          <button onClick={() => setShowContent(true)} disabled={showContent}
            className="px-3 py-1.5 text-xs bg-accent-purple/20 text-accent-purple border border-accent-purple/30 rounded-lg hover:bg-accent-purple/30 disabled:opacity-50 transition">
            {showContent ? "Gerado ✓" : "Gerar com IA"}
          </button>
        </div>
        {showContent ? (
          <div className="rounded-xl bg-bg-card border border-accent-purple/30 p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="px-2 py-0.5 rounded bg-accent-purple/20 text-accent-purple text-xs">flashcards</span>
              <h3 className="font-medium text-text-primary text-sm">Estatística Aplicada — Flashcards</h3>
            </div>
            <div className="text-sm text-text-secondary whitespace-pre-wrap leading-relaxed">{`1. Frente: O que é média aritmética?
   Verso: Soma de todos os valores dividida pela quantidade de observações.

2. Frente: Qual a diferença entre mediana e média?
   Verso: Mediana é o valor central quando os dados estão ordenados. Não é afetada por outliers.

3. Frente: O que é desvio padrão?
   Verso: Mede a dispersão dos dados em relação à média. Quanto maior, mais espalhados.

4. Frente: Quando usar moda?
   Verso: Para dados categóricos ou quando quer o valor mais frequente.

5. Frente: O que é correlação?
   Verso: Mede a força e direção da relação linear entre duas variáveis (-1 a +1).`}</div>
          </div>
        ) : (
          <div className="rounded-xl bg-bg-card border border-border-subtle p-6 text-center">
            <p className="text-text-secondary text-sm">Clique em "Gerar com IA" para criar flashcards personalizados (Amazon Nova Sonic / Bedrock).</p>
          </div>
        )}
      </section>
    </div>
  );
}
