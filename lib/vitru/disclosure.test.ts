import { describe, expect, it } from "vitest";
import { resolveDisclosure } from "@/lib/vitru/disclosure";

describe("resolveDisclosure", () => {
  it("primeira visita (1) é first_visit", () => {
    expect(resolveDisclosure(1)).toBe("first_visit");
  });

  it("visitas 2 a 4 são returning", () => {
    expect(resolveDisclosure(2)).toBe("returning");
    expect(resolveDisclosure(3)).toBe("returning");
    expect(resolveDisclosure(4)).toBe("returning");
  });

  it("visita 5 em diante é frequent", () => {
    expect(resolveDisclosure(5)).toBe("frequent");
    expect(resolveDisclosure(40)).toBe("frequent");
  });
});
