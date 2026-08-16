import { describe, expect, it } from "vitest";
import { buildStudyCalendarSnapshot } from "@/lib/vitru/adapters/study-calendar";

describe("buildStudyCalendarSnapshot", () => {
  it("publica somente as janelas calculadas como opções fechadas", () => {
    const snapshot = buildStudyCalendarSnapshot({
      activities: [], selectedIsoDate: "2026-08-13", view: "day",
      now: "2026-08-13T12:00:00-03:00",
      availableStudySlots: [{ date: "2026-08-14", startTime: "08:00", endTime: "09:00" }],
    });
    expect(snapshot.state.permissions).toEqual(["read_calendar", "show_options", "select_option", "confirm_write"]);
    expect(snapshot.sections.find(({ id }) => id === "calendar:study-options")?.items).toEqual([expect.objectContaining({
      id: "study-slot:2026-08-14:08:00",
      actionIds: ["study-slot:2026-08-14:08:00:select"],
    })]);
    expect(JSON.stringify(snapshot)).not.toContain("prepare_calendar_event");
  });
});
