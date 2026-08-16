import { describe, expect, it } from "vitest";
import {
  findOnboardingScene,
  isSceneComplete,
  resolveDestination,
  subjectCodeFromPath,
} from "./scenes";

describe("onboarding scenes", () => {
  it("extracts the student's own subject instead of copying a professor route", () => {
    expect(subjectCodeFromPath("/disciplinas/MAT24/trilha-de-aprendizagem")).toBe("MAT24");
  });

  it("resolves a semantic learning path using the student context", () => {
    expect(resolveDestination(
      { kind: "CURRENT_LEARNING_PATH" },
      { pathname: "/disciplinas/MAT24", subjectCode: "MAT24" }
    )).toBe("/disciplinas/MAT24/trilha-de-aprendizagem");
  });

  it("refuses to invent a subject when the student has not selected one", () => {
    expect(resolveDestination(
      { kind: "CURRENT_SUBJECT" },
      { pathname: "/", subjectCode: null }
    )).toBeNull();
  });

  it("only completes practice after the expected route is reached", () => {
    const scene = findOnboardingScene("open-learning-path");
    expect(isSceneComplete(scene, "/disciplinas/GTI03")).toBe(false);
    expect(isSceneComplete(scene, "/disciplinas/GTI03/trilha-de-aprendizagem")).toBe(true);
    expect(isSceneComplete(scene, "/disciplinas/GTI03/notas-avaliacoes")).toBe(false);
  });

  it("falls back safely when a stale scene id is received", () => {
    expect(findOnboardingScene("unknown-scene").id).toBe("welcome");
  });
});
