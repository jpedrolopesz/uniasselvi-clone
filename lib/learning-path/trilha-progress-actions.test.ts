import { randomUUID } from "node:crypto";
import { rm } from "node:fs/promises";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

// revalidatePath exige um request context real do Next.js (App Router) — fora dele, lança "static generation store missing". Mockado para testar a ação isoladamente, como o resto do módulo n8n/route já faz para suas próprias dependências externas.
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { markLessonCompleted, markParagraph } from "@/lib/learning-path/trilha-progress-actions";
import { loadTrilhaProgress } from "@/lib/data/load-trilha-progress";

const TEST_SUBJECT = "TESTSUBJ";

async function cleanup(userId: string) {
  await rm(path.join(process.cwd(), "public", "data", "user", userId), {
    recursive: true,
    force: true,
  });
}

describe("trilha-progress-actions", () => {
  afterEach(async () => {
    // cada teste usa um userId novo; nada a limpar por padrão, mas mantém o diretório de teste enxuto.
  });

  it("marca uma lição como concluída e não duplica em chamadas repetidas", async () => {
    const userId = `teste-progresso-${randomUUID()}`;
    try {
      await markLessonCompleted(userId, TEST_SUBJECT, "licao-1");
      await markLessonCompleted(userId, TEST_SUBJECT, "licao-1");

      const progress = await loadTrilhaProgress(userId, TEST_SUBJECT);
      expect(progress.completedLessonIds).toEqual(["licao-1"]);
    } finally {
      await cleanup(userId);
    }
  });

  it("marca um parágrafo, trunca o excerto a 120 caracteres e não duplica a mesma marcação", async () => {
    const userId = `teste-marcas-${randomUUID()}`;
    try {
      const longExcerpt = "x".repeat(200);
      await markParagraph(userId, TEST_SUBJECT, "licao-1", "p0", longExcerpt);
      await markParagraph(userId, TEST_SUBJECT, "licao-1", "p0", "trecho atualizado");

      const progress = await loadTrilhaProgress(userId, TEST_SUBJECT);
      expect(progress.marks).toHaveLength(1);
      expect(progress.marks[0].excerpt).toBe("trecho atualizado");
      expect(progress.marks[0].markedAt).toBeTruthy();
    } finally {
      await cleanup(userId);
    }
  });

  it("trunca o excerto a 120 caracteres quando é longo", async () => {
    const userId = `teste-marcas-truncamento-${randomUUID()}`;
    try {
      const longExcerpt = "y".repeat(200);
      await markParagraph(userId, TEST_SUBJECT, "licao-1", "p0", longExcerpt);

      const progress = await loadTrilhaProgress(userId, TEST_SUBJECT);
      expect(progress.marks[0].excerpt).toHaveLength(120);
    } finally {
      await cleanup(userId);
    }
  });

  it("rejeita userId com caracteres inválidos", async () => {
    await expect(markLessonCompleted("../escape", TEST_SUBJECT, "licao-1")).rejects.toThrow();
  });
});
