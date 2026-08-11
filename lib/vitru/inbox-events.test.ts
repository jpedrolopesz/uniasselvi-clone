import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { consumeInboxEvent, getInboxEvent, saveInboxEvent } from "@/lib/vitru/inbox-events";

describe("inbox-events", () => {
  it("evento inexistente: get e consume retornam null, sem erro", async () => {
    const id = `evt-${randomUUID()}`;
    await expect(getInboxEvent(id)).resolves.toBeNull();
    await expect(consumeInboxEvent(id)).resolves.toBeNull();
  });

  it("consome um evento válido uma única vez (idempotente)", async () => {
    const id = `evt-${randomUUID()}`;
    await saveInboxEvent({
      id,
      userId: "usuario-ficticio-em-dia",
      surface: "trilha",
      objectId: "MAT24",
      lessonId: "u1-fatorial",
      reason: "vi que você marcou três trechos na aula de fatorial",
    });

    const first = await consumeInboxEvent(id);
    expect(first).toMatchObject({ id, reason: "vi que você marcou três trechos na aula de fatorial" });
    expect(first?.consumedAt).toBeTruthy();

    const second = await consumeInboxEvent(id);
    expect(second).toBeNull();
  });

  it("getInboxEvent reflete o estado consumido depois de consumeInboxEvent", async () => {
    const id = `evt-${randomUUID()}`;
    await saveInboxEvent({
      id,
      userId: "usuario-ficticio-em-dia",
      surface: "trilha",
      objectId: "MAT24",
      lessonId: "u1-fatorial",
      reason: "retomada de teste",
    });

    await consumeInboxEvent(id);
    const stored = await getInboxEvent(id);
    expect(stored?.consumedAt).toBeTruthy();
  });
});
