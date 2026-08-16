import { beforeEach, describe, expect, it, vi } from "vitest";
import { consumePendingAction, createPendingAction } from "@/lib/vitru/pending-action";

const createSession = vi.fn();
vi.mock("@/lib/vitru/study-programs", () => ({ createConfirmedVoiceStudySession: (...args: unknown[]) => createSession(...args) }));
import { POST } from "@/app/api/v1/vitru/study-session/route";

const slot = { date: "2026-08-14", startTime: "08:00", endTime: "09:00" };
const args = { optionId: "study-slot:2026-08-14:08:00", ...slot };
const request = (body: unknown) => new Request("http://local/api", { method: "POST", body: JSON.stringify(body) });

describe("POST study-session", () => {
  beforeEach(() => createSession.mockReset());

  it("recusa confirmação sem proposta consumida", async () => {
    const response = await POST(request({ userId: "student", slot }));
    expect(response.status).toBe(403);
    expect(createSession).not.toHaveBeenCalled();
  });

  it("recusa quando a janela deixou de estar livre", async () => {
    createSession.mockResolvedValue(null);
    const pending = createPendingAction("schedule_study", args, "study-calendar", 0, "nonce");
    const authorization = consumePendingAction(pending, args, "study-calendar", 1);
    const response = await POST(request({ userId: "student", slot, authorization: authorization.ok ? authorization.pending : null }));
    expect(response.status).toBe(409);
  });

  it("recusa opção inventada que não corresponde à proposta", async () => {
    const pending = createPendingAction("schedule_study", args, "study-calendar", 0, "nonce");
    const authorization = consumePendingAction(pending, args, "study-calendar", 1);
    const invented = { ...slot, startTime: "10:00", endTime: "11:00" };
    const response = await POST(request({ userId: "student", slot: invented, authorization: authorization.ok ? authorization.pending : null }));
    expect(response.status).toBe(403);
    expect(createSession).not.toHaveBeenCalled();
  });
});
