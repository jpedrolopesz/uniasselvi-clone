import { describe, expect, it } from "vitest";
import { sanitizeSnapshotText } from "@/lib/vitru/sanitize-snapshot-text";

describe("sanitizeSnapshotText", () => {
  it("remove marcação do banco preservando o nome", () => {
    expect(sanitizeSnapshotText("**Avaliação Final** (Objetiva / Individual)"))
      .toBe("Avaliação Final (Objetiva / Individual)");
  });

  it("não altera texto sem marcação", () => {
    expect(sanitizeSnapshotText("Avaliação Discursiva Individual")).toBe("Avaliação Discursiva Individual");
  });
});
