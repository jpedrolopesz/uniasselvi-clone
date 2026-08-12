import { describe, expect, it } from "vitest";
import type { AssessmentRaw } from "@/lib/types/raw/assessments";
import type { AssessmentWithSubject } from "@/lib/data/load-study-planner-data";
import { buildStudyProgram } from "@/lib/study-planner/study-program";

function assessment(
  subjectCode: string,
  subjectName: string,
  overrides: Partial<AssessmentRaw> & Pick<AssessmentRaw, "code" | "description" | "end_date">
): AssessmentWithSubject {
  return {
    subjectCode,
    subjectName,
    assessment: {
      begin_date: "2026-08-01",
      exam_made: 0,
      test_type_code: "6",
      weight: "1.5",
      ...overrides,
    } as AssessmentRaw,
  };
}

describe("buildStudyProgram", () => {
  it("devolve null quando não há nenhuma avaliação pendente", () => {
    const plan = buildStudyProgram([], [], "2026-08-06", { horizonDays: 7 });
    expect(plan).toBeNull();
  });

  it("cobre mais de uma avaliação dentro do horizonte, priorizando a mais urgente", () => {
    const plan = buildStudyProgram(
      [
        assessment("MAT24", "Probabilidade e Estatística", {
          code: "AV1-MAT24",
          description: "Avaliação I",
          end_date: "2026-08-20",
        }),
        assessment("GTI03", "Modelagem de Processos", {
          code: "AV1-GTI03",
          description: "Avaliação I",
          end_date: "2026-08-10",
        }),
      ],
      [],
      "2026-08-06",
      { horizonDays: 14 }
    );

    expect(plan).not.toBeNull();
    expect(plan!.assessments).toHaveLength(2);
    // GTI03 vence primeiro — entra antes na lista de prioridade.
    expect(plan!.assessments[0].assessmentCode).toBe("AV1-GTI03");
    expect(plan!.assessments.every((a) => a.sessionsPlanned > 0)).toBe(true);
    expect(plan!.sessions.length).toBeGreaterThan(0);
  });

  it("nunca agenda duas sessões no mesmo horário — a segunda avaliação respeita o que a primeira já ocupou", () => {
    const plan = buildStudyProgram(
      [
        assessment("GTI03", "Modelagem de Processos", {
          code: "AV1-GTI03",
          description: "Avaliação I",
          end_date: "2026-08-25",
        }),
        assessment("MAT24", "Probabilidade e Estatística", {
          code: "AV1-MAT24",
          description: "Avaliação I",
          end_date: "2026-08-25",
        }),
      ],
      [],
      "2026-08-06",
      { horizonDays: 14 }
    );

    const seen = new Set<string>();
    for (const session of plan!.sessions) {
      const key = `${session.date}|${session.startTime}`;
      expect(seen.has(key)).toBe(false);
      seen.add(key);
    }
  });

  it("uma prova com prazo muito além do horizonte ainda entra, mas com prioridade menor", () => {
    const plan = buildStudyProgram(
      [
        assessment("GTI03", "Modelagem de Processos", {
          code: "URGENTE",
          description: "Avaliação I",
          end_date: "2026-08-08",
        }),
        assessment("MAT24", "Probabilidade e Estatística", {
          code: "DISTANTE",
          description: "Avaliação Final",
          end_date: "2026-11-01",
        }),
      ],
      [],
      "2026-08-06",
      { horizonDays: 7 }
    );

    expect(plan!.assessments[0].assessmentCode).toBe("URGENTE");
    // A avaliação distante entra na lista (é pendente), mas suas sessões
    // ficam limitadas ao horizonte de 7 dias, não aos 3 meses reais de prazo.
    const distante = plan!.assessments.find((a) => a.assessmentCode === "DISTANTE")!;
    expect(distante).toBeDefined();
    for (const session of plan!.sessions.filter((s) => s.assessmentCode === "DISTANTE")) {
      expect(session.date <= plan!.horizonEnd).toBe(true);
    }
  });

  it("replyText avisa quando não há horário livre suficiente", () => {
    const busyEveryDay = Array.from({ length: 14 }, (_, i) => ({
      id: `busy-${i}`,
      title: "Ocupado",
      category: "trabalho" as const,
      subjectCode: null,
      subjectName: null,
      date: `2026-08-${String(6 + i).padStart(2, "0")}`,
      startTime: "00:00",
      endTime: "23:59",
      notes: "",
      source: "seed" as const,
    }));

    const plan = buildStudyProgram(
      [
        assessment("GTI03", "Modelagem de Processos", {
          code: "AV1-GTI03",
          description: "Avaliação I",
          end_date: "2026-08-20",
        }),
      ],
      busyEveryDay,
      "2026-08-06",
      { horizonDays: 7 }
    );

    expect(plan!.sessions).toHaveLength(0);
    expect(plan!.replyText).toContain("Não encontrei horários livres suficientes");
  });
});
