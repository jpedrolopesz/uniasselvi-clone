import { describe, expect, it } from "vitest";
import {
  loadStudyActivities,
  loadWorkSchedule,
} from "@/lib/data/load-study-planner-data";

describe("loadStudyActivities", () => {
  it("carrega a agenda pessoal de um cenário fictício", async () => {
    const activities = await loadStudyActivities(
      "usuario-ficticio-conflito-horarios"
    );

    expect(activities).toHaveLength(2);
    expect(activities?.[0]).toMatchObject({
      category: "pessoal",
      date: "2026-08-06",
      startTime: "18:00",
      endTime: "22:00",
    });
  });

  it("retorna null quando o perfil não possui agenda pessoal", async () => {
    await expect(
      loadStudyActivities("joao-pedro-lopes-zamonelo")
    ).resolves.toBeNull();
  });
});

describe("loadWorkSchedule", () => {
  it("carrega o turno de trabalho do aluno fictício", async () => {
    await expect(
      loadWorkSchedule("usuario-ficticio-prazo-urgente")
    ).resolves.toMatchObject({
      startTime: "06:00",
      endTime: "14:00",
      weekdays: [1, 2, 3, 4, 5],
    });
  });

  it("mantém o perfil-base sem jornada fictícia", async () => {
    await expect(
      loadWorkSchedule("joao-pedro-lopes-zamonelo")
    ).resolves.toBeNull();
  });
});
