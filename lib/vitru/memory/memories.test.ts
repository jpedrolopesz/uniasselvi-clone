import { randomUUID } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createTestStudent, deleteTestStudent } from "@/lib/db/test-helpers";
import { addMemory, listActiveMemories, supersedeMemory } from "@/lib/vitru/memory/memories";

let userId: string;

beforeEach(async () => {
  userId = `user-${randomUUID()}`;
  await createTestStudent(userId);
});

afterEach(async () => {
  await deleteTestStudent(userId);
});

describe("addMemory / listActiveMemories", () => {
  it("uma memória recém-criada aparece na listagem", async () => {
    await addMemory(userId, {
      kind: "preference",
      source: "stated",
      content: "prefere estudar à noite",
    });
    const memories = await listActiveMemories(userId);
    expect(memories).toHaveLength(1);
    expect(memories[0].content).toBe("prefere estudar à noite");
  });

  it("filtra por kind", async () => {
    await addMemory(userId, { kind: "preference", source: "stated", content: "à noite" });
    await addMemory(userId, { kind: "constraint", source: "stated", content: "não pode sábado" });
    const preferences = await listActiveMemories(userId, "preference");
    expect(preferences).toHaveLength(1);
    expect(preferences[0].kind).toBe("preference");
  });

  it("exclui memórias com validUntil no passado", async () => {
    await addMemory(userId, {
      kind: "fact",
      source: "stated",
      content: "está de férias",
      validUntil: "2020-01-01T00:00:00.000Z",
    });
    await expect(listActiveMemories(userId)).resolves.toEqual([]);
  });

  it("mantém memórias com validUntil no futuro", async () => {
    await addMemory(userId, {
      kind: "fact",
      source: "stated",
      content: "está de férias até semana que vem",
      validUntil: "2099-01-01T00:00:00.000Z",
    });
    const memories = await listActiveMemories(userId);
    expect(memories).toHaveLength(1);
  });
});

describe("supersedeMemory", () => {
  it("a memória antiga some da listagem e a nova aparece", async () => {
    const original = await addMemory(userId, {
      kind: "preference",
      source: "inferred",
      content: "trabalha de manhã",
    });

    await supersedeMemory(userId, original.id, {
      kind: "preference",
      source: "stated",
      content: "na verdade trabalha à tarde",
    });

    const active = await listActiveMemories(userId);
    expect(active).toHaveLength(1);
    expect(active[0].content).toBe("na verdade trabalha à tarde");
    expect(active[0].source).toBe("stated");
  });
});
