import { describe, expect, it } from "vitest";
import type { AssessmentRaw } from "@/lib/types/raw/assessments";
import type { AssessmentWithSubject } from "@/lib/data/load-study-planner-data";
import type { StudyActivity } from "@/lib/types/study-activity";
import { buildNextAssessmentPlan } from "@/lib/study-planner/assessment-plan";

function assessment(
  overrides: Partial<AssessmentRaw> & Pick<AssessmentRaw, "code" | "description" | "end_date">
): AssessmentWithSubject {
  return {
    subjectCode: "GTI03",
    subjectName: "Modelagem e Gestão de Processos de Negócios",
    assessment: {
      begin_date: "2026-08-01",
      exam_made: 0,
      test_type_code: "6",
      weight: "1.5",
      ...overrides,
    } as AssessmentRaw,
  };
}

function occupiedWorkDay(date: string): StudyActivity {
  return {
    id: `work-${date}`,
    title: "Trabalho",
    category: "trabalho",
    subjectCode: null,
    subjectName: null,
    date,
    startTime: "08:00",
    endTime: "17:30",
    notes: "",
    source: "seed",
  };
}

describe("buildNextAssessmentPlan", () => {
  it("prioriza o trabalho aberto e cria etapas até dois dias antes do prazo", () => {
    const plan = buildNextAssessmentPlan(
      [
        assessment({
          code: "AV2",
          description: "Avaliação II - Individual",
          end_date: "2026-08-17",
        }),
        assessment({
          code: "AV3",
          description: "Avaliação III - Desafio Profissional - Individual",
          end_date: "2026-08-15",
          test_type_code: "1525",
          weight: "3",
        }),
      ],
      [occupiedWorkDay("2026-08-06")],
      "2026-08-06"
    );

    expect(plan).toMatchObject({
      assessmentCode: "AV3",
      kind: "assignment",
      deadline: "2026-08-15",
    });
    expect(plan?.suggestions).toHaveLength(5);
    expect(plan?.suggestions.every((item) => item.date <= "2026-08-13")).toBe(true);
    expect(plan?.suggestions[0].startTime).toBe("17:30");
  });

  it("ignora avaliações concluídas", () => {
    const plan = buildNextAssessmentPlan(
      [
        assessment({
          code: "AV1",
          description: "Avaliação I",
          end_date: "2026-08-10",
          exam_made: 1,
        }),
      ],
      [],
      "2026-08-06"
    );

    expect(plan).toBeNull();
  });

  it("não recria uma etapa confirmada e mantém a próxima estável", () => {
    const confirmed: StudyActivity = {
      id: "plan-AV2-1",
      title: "Mapear conteúdos da avaliação",
      category: "estudo",
      subjectCode: "GTI03",
      subjectName: "Modelagem e Gestão de Processos de Negócios",
      date: "2026-08-06",
      startTime: "08:00",
      endTime: "08:45",
      notes: "",
      source: "ai",
    };
    const plan = buildNextAssessmentPlan(
      [
        assessment({
          code: "AV2",
          description: "Avaliação II - Individual",
          end_date: "2026-08-17",
        }),
      ],
      [confirmed],
      "2026-08-06"
    );

    expect(plan?.suggestions.some((item) => item.id === "plan-AV2-1")).toBe(false);
    expect(plan?.suggestions[0]).toMatchObject({
      id: "plan-AV2-2",
      date: "2026-08-06",
      startTime: "08:45",
      endTime: "10:15",
    });
  });

  it("reduz a margem quando o prazo é urgente", () => {
    const plan = buildNextAssessmentPlan(
      [
        assessment({
          code: "URGENTE",
          description: "Avaliação objetiva",
          end_date: "2026-08-06",
        }),
      ],
      [],
      "2026-08-06"
    );

    expect(plan?.urgency).toBe("critical");
    expect(plan?.replyText).toContain("não há margem de segurança completa");
  });
});
