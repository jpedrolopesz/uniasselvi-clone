/**
 * Risk Score Engine — Calcula a probabilidade de evasão do aluno (0-100).
 */

export interface StudentEngagementData {
  daysSinceLastAccess: number;
  accessesLast14Days: number;
  averageGrade: number | null;
  onTimeSubmissionRate: number;
  vitruInteractionsLast30Days: number;
  communityParticipations: number;
  learningPathProgress: number;
  hasFinancialPending: boolean;
  daysSinceEnrollment: number;
  activeDisciplines: number;
  disciplinesBelowAverage: number;
}

export interface RiskScoreResult {
  score: number;
  level: "low" | "medium" | "high" | "critical";
  factors: { name: string; weight: number; value: number; contribution: number; description: string }[];
}

export function calculateRiskScore(data: StudentEngagementData): RiskScoreResult {
  const factors = [
    { name: "Frequência de Acesso", weight: 0.25, value: calcAccess(data.daysSinceLastAccess, data.accessesLast14Days), description: descAccess(data.daysSinceLastAccess, data.accessesLast14Days) },
    { name: "Desempenho Acadêmico", weight: 0.20, value: calcAcademic(data.averageGrade, data.onTimeSubmissionRate), description: descAcademic(data.averageGrade, data.onTimeSubmissionRate) },
    { name: "Progresso na Trilha", weight: 0.15, value: calcProgress(data.learningPathProgress, data.daysSinceEnrollment), description: `Progresso: ${Math.round(data.learningPathProgress * 100)}%` },
    { name: "Engajamento Social", weight: 0.15, value: calcSocial(data.vitruInteractionsLast30Days, data.communityParticipations), description: descSocial(data.communityParticipations) },
    { name: "Situação Financeira", weight: 0.10, value: data.hasFinancialPending ? 80 : 0, description: data.hasFinancialPending ? "Pendências financeiras" : "Situação regular" },
    { name: "Disciplinas em Risco", weight: 0.15, value: calcDisciplineRisk(data.disciplinesBelowAverage, data.activeDisciplines), description: `${data.disciplinesBelowAverage} de ${data.activeDisciplines} abaixo da média` },
  ];

  const score = Math.round(factors.reduce((sum, f) => sum + f.weight * f.value, 0));
  const level = score >= 75 ? "critical" : score >= 50 ? "high" : score >= 30 ? "medium" : "low";

  return { score, level, factors: factors.map(f => ({ ...f, contribution: Math.round(f.weight * f.value) })) };
}

function calcAccess(days: number, accesses: number): number {
  let s = days >= 14 ? 100 : days >= 7 ? 70 : days >= 3 ? 40 : 10;
  if (accesses <= 1) s = Math.min(100, s + 20);
  else if (accesses <= 3) s = Math.min(100, s + 10);
  return s;
}

function calcAcademic(grade: number | null, rate: number): number {
  let s = grade === null ? 60 : grade < 4 ? 90 : grade < 6 ? 60 : grade < 7 ? 30 : 0;
  if (rate < 0.3) s = Math.min(100, s + 30);
  else if (rate < 0.6) s = Math.min(100, s + 15);
  return s;
}

function calcProgress(progress: number, days: number): number {
  const expected = Math.min(1, days / 180);
  const gap = expected - progress;
  return gap > 0.5 ? 90 : gap > 0.3 ? 60 : gap > 0.15 ? 35 : 10;
}

function calcSocial(vitru: number, community: number): number {
  let s = 50;
  if (vitru >= 10) s -= 30; else if (vitru >= 5) s -= 20; else if (vitru >= 1) s -= 10;
  if (community >= 3) s -= 25; else if (community >= 1) s -= 15;
  return Math.max(0, Math.min(100, s));
}

function calcDisciplineRisk(below: number, total: number): number {
  if (total === 0) return 0;
  const r = below / total;
  return r >= 0.7 ? 90 : r >= 0.5 ? 70 : r >= 0.3 ? 45 : r > 0 ? 20 : 0;
}

function descAccess(days: number, accesses: number): string {
  if (days >= 14) return `Sem acessar há ${days} dias`;
  return `Último acesso há ${days}d, ${accesses} acessos em 14 dias`;
}

function descAcademic(grade: number | null, rate: number): string {
  if (grade === null) return "Sem notas registradas";
  return `Média ${grade.toFixed(1)}, ${Math.round(rate * 100)}% entregas no prazo`;
}

function descSocial(participations: number): string {
  return participations === 0 ? "Sem participação em comunidades" : `${participations} grupo(s)`;
}
