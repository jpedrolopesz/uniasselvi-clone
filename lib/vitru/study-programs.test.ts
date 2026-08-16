import { randomUUID } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createTestStudent, deleteTestStudent } from "@/lib/db/test-helpers";
import {
  applyStudySessionDecision,
  createConfirmedVoiceStudySession,
  createStudyProgram,
  getActiveStudyProgram,
} from "@/lib/vitru/study-programs";
import { loadStudyActivities } from "@/lib/data/load-study-planner-data";
import type { StudyProgram } from "@/lib/study-planner/study-program";
import { buildVitruStudentContext } from "@/lib/vitru/build-student-context";

let userId: string;

beforeEach(async () => {
  userId = `user-${randomUUID()}`;
  await createTestStudent(userId);
});

afterEach(async () => {
  await deleteTestStudent(userId);
});

function sampleProgram(): StudyProgram {
  return {
    horizonStart: "2026-08-06",
    horizonEnd: "2026-08-12",
    assessments: [
      {
        assessmentCode: "AV1-GTI03",
        assessmentDescription: "Avaliação I",
        subjectCode: "GTI03",
        subjectName: "Modelagem de Processos",
        kind: "exam",
        deadline: "2026-08-20",
        daysRemaining: 14,
        sessionsPlanned: 2,
      },
    ],
    sessions: [
      {
        id: "plan-AV1-GTI03-1",
        assessmentCode: "AV1-GTI03",
        subjectCode: "GTI03",
        subjectName: "Modelagem de Processos",
        title: "Mapear conteúdos — Modelagem de Processos",
        category: "estudo",
        date: "2026-08-06",
        startTime: "17:30",
        endTime: "18:15",
        notes: "Etapa sugerida.",
      },
      {
        id: "plan-AV1-GTI03-2",
        assessmentCode: "AV1-GTI03",
        subjectCode: "GTI03",
        subjectName: "Modelagem de Processos",
        title: "Estudar conteúdos prioritários — Modelagem de Processos",
        category: "estudo",
        date: "2026-08-07",
        startTime: "17:30",
        endTime: "19:00",
        notes: "Etapa sugerida.",
      },
    ],
    replyText: "Organizei um plano.",
  };
}

describe("createStudyProgram / getActiveStudyProgram", () => {
  it("persiste o programa e devolve as sessões na ordem gerada", async () => {
    const created = await createStudyProgram(userId, sampleProgram());
    expect(created.status).toBe("draft");
    expect(created.sessions).toHaveLength(2);
    expect(created.sessions[0].sourceId).toBe("plan-AV1-GTI03-1");
    expect(created.sessions[0].status).toBe("proposed");
  });

  it("devolve null quando o aluno nunca teve um programa gerado", async () => {
    await expect(getActiveStudyProgram(userId)).resolves.toBeNull();
  });

  it("getActiveStudyProgram enxerga o programa recém-criado", async () => {
    const created = await createStudyProgram(userId, sampleProgram());
    const active = await getActiveStudyProgram(userId);
    expect(active?.id).toBe(created.id);
  });

  it("um novo programa torna o anterior superseded", async () => {
    const first = await createStudyProgram(userId, sampleProgram());
    const second = await createStudyProgram(userId, { ...sampleProgram(), horizonStart: "2026-08-13" });

    const active = await getActiveStudyProgram(userId);
    expect(active?.id).toBe(second.id);
    expect(active?.id).not.toBe(first.id);
  });
});

describe("applyStudySessionDecision", () => {
  it("aceitar materializa a sessão em study_activities", async () => {
    const created = await createStudyProgram(userId, sampleProgram());
    const session = created.sessions[0];

    const updated = await applyStudySessionDecision(userId, session.id, "accepted");
    expect(updated.status).toBe("accepted");

    const activities = await loadStudyActivities(userId);
    expect(activities?.some((a) => a.id === session.sourceId)).toBe(true);
  });

  it("rejeitar muda o status mas não cria atividade no calendário", async () => {
    const created = await createStudyProgram(userId, sampleProgram());
    const session = created.sessions[1];

    await applyStudySessionDecision(userId, session.id, "rejected");

    // Nada foi aceito ainda para este aluno — o dataset study-activities
    // continua genuinamente ausente (null), não uma lista vazia. Ver
    // academic.datasets: presença é explícita, não "sem linhas = vazio".
    await expect(loadStudyActivities(userId)).resolves.toBeNull();
  });

  it("sessão desconhecida lança erro", async () => {
    await expect(
      applyStudySessionDecision(userId, randomUUID(), "accepted")
    ).rejects.toThrow();
  });
});

describe("createConfirmedVoiceStudySession", () => {
  it("revalida uma opção calculada e grava uma linha em studySessions", async () => {
    const context = await buildVitruStudentContext(userId);
    const slot = context.schedule.availableStudySlots[0];
    expect(slot).toBeDefined();
    const session = await createConfirmedVoiceStudySession(userId, slot);
    expect(session).toMatchObject({ date: slot.date, startTime: slot.startTime, endTime: slot.endTime });
    expect((await getActiveStudyProgram(userId))?.sessions).toContainEqual(expect.objectContaining({ id: session?.id }));
  });

  it("recusa uma opção inventada que não pertence ao recálculo atual", async () => {
    await expect(createConfirmedVoiceStudySession(userId, { date: "2099-01-01", startTime: "03:00", endTime: "04:00" }))
      .resolves.toBeNull();
    await expect(getActiveStudyProgram(userId)).resolves.toBeNull();
  });
});
