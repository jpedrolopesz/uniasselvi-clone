import { describe, expect, it } from "vitest";
import { buildVitruStudentContext } from "@/lib/vitru/build-student-context";

describe("buildVitruStudentContext", () => {
  it("monta o contexto normalizado e um plano para o cenário urgente", async () => {
    const context = await buildVitruStudentContext(
      "usuario-ficticio-prazo-urgente"
    );

    expect(context.referenceDate).toBe("2026-08-16");
    expect(context.disciplines).toHaveLength(5);
    expect(context.assessments.some((item) => item.status === "open")).toBe(true);
    expect(context.schedule.work).toMatchObject({
      startTime: "06:00",
      endTime: "14:00",
    });
    expect(context.suggestedPlan).toMatchObject({
      kind: "exam",
      daysRemaining: 1,
    });
    const pendingSuggestions = context.suggestedPlan?.suggestions.length ?? 0;
    const confirmedPlanActivities = context.schedule.upcomingBusySlots.filter(
      (activity) => activity.id.startsWith("plan-1628554-")
    ).length;
    expect(pendingSuggestions + confirmedPlanActivities).toBeGreaterThan(0);
  });

  it("expõe apenas os dados mínimos do aluno", async () => {
    const context = await buildVitruStudentContext("usuario-ficticio-em-dia");
    const serialized = JSON.stringify(context.student);

    expect(context.student.firstName).toBeTruthy();
    expect(serialized).not.toContain("email");
    expect(serialized).not.toContain("birthday");
    expect(serialized).not.toContain("subscription_code");
  });

  it("normaliza os sinais da Sofia sem alterar a fonte", async () => {
    const context = await buildVitruStudentContext(
      "usuario-ficticio-baixa-frequencia"
    );

    expect(context.sofiaSignals).toMatchObject({
      source: "sofia_dados_aluno",
      participatesActively: false,
      isControlGroup: true,
    });
  });
});

describe("buildVitruStudentContext — calouro", () => {
  it("mantém o cenário inicial com avaliação pendente e plano viável", async () => {
    const context = await buildVitruStudentContext("usuario-ficticio-calouro");
    expect(context.suggestedPlan).not.toBeNull();
    expect(context.suggestedPlan?.suggestions.length).toBeGreaterThan(0);
    expect(context.referenceDate).toBe("2026-08-10");
    expect(context.assessments.every((assessment) => assessment.status !== "completed")).toBe(true);
    expect(context.schedule.availableStudySlots.length).toBeGreaterThan(0);
  });
});
