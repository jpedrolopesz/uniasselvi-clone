import type { VitruStudentContext } from "@/lib/vitru/build-student-context";
import type { StudentProfile } from "@/lib/vitru/memory/student-profile";

const WEEKDAY_LABELS_PT = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

function formatWeekdays(weekdays: number[]): string {
  return [...weekdays]
    .sort((a, b) => a - b)
    .map((day) => WEEKDAY_LABELS_PT[day] ?? String(day))
    .join(", ");
}

/**
 * Duas listas explícitas para o prompt: o que já está no contexto (nunca
 * perguntar) e o que genuinamente falta (só isso pode ser perguntado).
 *
 * Isto é o que resolve as "perguntas bestas" de verdade — não a prosa do
 * prompt, que o modelo em uso (amazon.nova-micro-v1:0) tende a ignorar
 * quando é uma instrução negativa. O modelo só pode perguntar o que está na
 * segunda lista porque a primeira lista mostra, campo a campo, que a
 * resposta já está ali.
 */
export function buildKnownFieldsManifest(
  context: VitruStudentContext,
  profile: StudentProfile | null
): string {
  const known: string[] = [];
  const missing: string[] = [];

  if (context.schedule.work) {
    const work = context.schedule.work;
    known.push(
      `jornada de trabalho: ${formatWeekdays(work.weekdays)}, ${work.startTime}–${work.endTime}`
    );
  } else {
    known.push("jornada de trabalho: aluno não tem jornada de trabalho registrada");
  }

  known.push(
    context.disciplines.length > 0
      ? `disciplinas ativas: ${context.disciplines.map((d) => d.code).join(", ")}`
      : "disciplinas ativas: nenhuma"
  );

  known.push(
    `horários livres nos próximos 7 dias: ${context.schedule.availableStudySlots.length} janelas`
  );

  const openAssessments = context.assessments.filter(
    (assessment) => assessment.status === "open" || assessment.status === "scheduled"
  );
  known.push(
    openAssessments.length > 0
      ? `avaliações em aberto: ${openAssessments
          .map(
            (assessment) =>
              `${assessment.code} (${assessment.subjectCode}, ${
                assessment.daysRemaining ?? "?"
              } dias restantes)`
          )
          .join("; ")}`
      : "avaliações em aberto: nenhuma"
  );

  if (profile?.sessionMinutes != null) {
    known.push(`duração de sessão de estudo preferida: ${profile.sessionMinutes} minutos`);
  } else {
    missing.push("duração de sessão de estudo preferida (quantos minutos por bloco)");
  }

  if (profile?.preferredWindows && profile.preferredWindows.length > 0) {
    known.push(
      `janelas de horário preferidas: ${profile.preferredWindows
        .map((w) => `${WEEKDAY_LABELS_PT[w.weekday] ?? w.weekday} ${w.start}–${w.end}`)
        .join("; ")}`
    );
  } else {
    missing.push("horário do dia em que o aluno prefere estudar");
  }

  const lines = [
    "DADOS QUE VOCÊ JÁ TEM (nunca pergunte por eles — use o que está listado):",
    ...known.map((item) => `- ${item}`),
  ];

  lines.push("");
  if (missing.length > 0) {
    lines.push(
      "DADOS AUSENTES (só estes podem ser perguntados, e só se fizerem diferença real para o plano):",
      ...missing.map((item) => `- ${item}`)
    );
  } else {
    lines.push("Não há dados ausentes. Não pergunte nada — monte o plano direto com o que está acima.");
  }

  return lines.join("\n");
}
