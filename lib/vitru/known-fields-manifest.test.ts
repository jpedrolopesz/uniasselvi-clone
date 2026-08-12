import { describe, expect, it } from "vitest";
import { buildKnownFieldsManifest } from "@/lib/vitru/known-fields-manifest";
import type { VitruStudentContext } from "@/lib/vitru/build-student-context";
import type { StudentProfile } from "@/lib/vitru/memory/student-profile";

/**
 * Fixture mínima: só os campos que buildKnownFieldsManifest lê. O cast
 * evita manter aqui uma cópia inteira da forma de VitruStudentContext
 * (student, suggestedPlan, sofiaSignals etc.) que a função nunca toca.
 */
function context(overrides: {
  work?: VitruStudentContext["schedule"]["work"];
  disciplines?: VitruStudentContext["disciplines"];
  availableStudySlots?: unknown[];
  assessments?: VitruStudentContext["assessments"];
}): VitruStudentContext {
  return {
    schedule: {
      work: overrides.work ?? null,
      upcomingBusySlots: [],
      availableStudySlots: overrides.availableStudySlots ?? [],
    },
    disciplines: overrides.disciplines ?? [],
    assessments: overrides.assessments ?? [],
  } as unknown as VitruStudentContext;
}

describe("buildKnownFieldsManifest", () => {
  it("jornada de trabalho presente nunca aparece como ausente", () => {
    const manifest = buildKnownFieldsManifest(
      context({
        work: { label: "Trabalho", startTime: "08:00", endTime: "17:30", weekdays: [1, 2, 3, 4, 5] },
      }),
      null
    );
    expect(manifest).toContain("jornada de trabalho: seg, ter, qua, qui, sex, 08:00–17:30");
    expect(manifest).not.toMatch(/AUSENTES[\s\S]*jornada/);
  });

  it("sem jornada registrada, ainda é tratado como conhecido (não perguntável)", () => {
    const manifest = buildKnownFieldsManifest(context({ work: null }), null);
    expect(manifest).toContain("jornada de trabalho: aluno não tem jornada de trabalho registrada");
    expect(manifest).not.toMatch(/AUSENTES[\s\S]*jornada/);
  });

  it("perfil ausente lista duração de sessão e janela preferida como ausentes", () => {
    const manifest = buildKnownFieldsManifest(context({}), null);
    expect(manifest).toContain("DADOS AUSENTES");
    expect(manifest).toContain("duração de sessão de estudo preferida");
    expect(manifest).toContain("horário do dia em que o aluno prefere estudar");
  });

  it("perfil preenchido move os campos de ausente para conhecido", () => {
    const profile: StudentProfile = {
      workScheduleOverride: null,
      preferredWindows: [{ weekday: 2, start: "19:00", end: "21:00" }],
      sessionMinutes: 45,
      updatedAt: new Date().toISOString(),
    };
    const manifest = buildKnownFieldsManifest(context({}), profile);
    expect(manifest).toContain("duração de sessão de estudo preferida: 45 minutos");
    expect(manifest).not.toMatch(/AUSENTES[\s\S]*duração de sessão/);
  });

  it("sem nenhum dado ausente, instrui a não perguntar nada", () => {
    const profile: StudentProfile = {
      workScheduleOverride: null,
      preferredWindows: [{ weekday: 2, start: "19:00", end: "21:00" }],
      sessionMinutes: 45,
      updatedAt: new Date().toISOString(),
    };
    const manifest = buildKnownFieldsManifest(
      context({ work: { label: "T", startTime: "08:00", endTime: "17:00", weekdays: [1] } }),
      profile
    );
    expect(manifest).toContain("Não há dados ausentes");
  });

  it("lista avaliações abertas e agendadas, mas não as concluídas", () => {
    const manifest = buildKnownFieldsManifest(
      context({
        assessments: [
          { code: "AV1", subjectCode: "MAT24", status: "open", daysRemaining: 5 },
          { code: "AV2", subjectCode: "GTI03", status: "scheduled", daysRemaining: 2 },
          { code: "AV0", subjectCode: "MAT24", status: "completed", daysRemaining: null },
        ] as unknown as VitruStudentContext["assessments"],
      }),
      null
    );
    expect(manifest).toContain("AV1 (MAT24, 5 dias restantes)");
    expect(manifest).toContain("AV2 (GTI03, 2 dias restantes)");
    expect(manifest).not.toContain("AV0");
  });
});
