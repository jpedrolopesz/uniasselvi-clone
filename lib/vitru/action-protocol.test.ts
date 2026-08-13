import { describe, expect, it } from "vitest";
import { acceptsEventVersion, navigationCanComplete } from "@/lib/vitru/action-protocol";

describe("protocolo de ações do Vitru", () => {
  it("confirma navegação somente em page_ready", () => {
    expect(navigationCanComplete({ type: "page_loading", actionId: "a1", version: 2 })).toBe(false);
    expect(navigationCanComplete({ type: "page_ready", actionId: "a1", version: 3 })).toBe(true);
  });

  it("descarta versões mais antigas", () => {
    expect(acceptsEventVersion(4, 3)).toBe(false);
    expect(acceptsEventVersion(4, 4)).toBe(true);
  });
});
