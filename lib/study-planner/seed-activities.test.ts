import { describe, expect, it } from "vitest";
import { buildWorkScheduleActivities } from "@/lib/study-planner/seed-activities";

describe("buildWorkScheduleActivities", () => {
  it("cria um bloco para um turno no mesmo dia", () => {
    const activities = buildWorkScheduleActivities(
      {
        label: "Trabalho",
        startTime: "08:00",
        endTime: "17:30",
        weekdays: [1],
      },
      "2026-08-10",
      "2026-08-10"
    );

    expect(activities).toHaveLength(1);
    expect(activities[0]).toMatchObject({
      date: "2026-08-10",
      startTime: "08:00",
      endTime: "17:30",
      category: "trabalho",
    });
  });

  it("divide o turno noturno e adiciona o descanso no dia seguinte", () => {
    const activities = buildWorkScheduleActivities(
      {
        label: "Trabalho noturno",
        startTime: "22:00",
        endTime: "06:00",
        weekdays: [1],
        restAfterShift: {
          label: "Descanso pós-turno",
          startTime: "06:00",
          endTime: "14:00",
        },
      },
      "2026-08-10",
      "2026-08-10"
    );

    expect(activities).toHaveLength(3);
    expect(activities).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ date: "2026-08-10", startTime: "22:00", endTime: "24:00" }),
        expect.objectContaining({ date: "2026-08-11", startTime: "00:00", endTime: "06:00" }),
        expect.objectContaining({ date: "2026-08-11", startTime: "06:00", endTime: "14:00" }),
      ])
    );
  });
});
