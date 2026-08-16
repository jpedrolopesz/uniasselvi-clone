// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { vi } from "vitest";
import {
  SemanticSnapshotProvider,
  resetSemanticSnapshotForTests,
  useSemanticSnapshot,
} from "@/components/vitru/SemanticSnapshotProvider";
import type { VitruSemanticSnapshot } from "@/lib/vitru/semantic-snapshot";

vi.mock("next/navigation", () => ({ usePathname: () => "/disciplinas/GTI03" }));

const snapshot = (id: string): VitruSemanticSnapshot => ({
  version: 0, status: "ready", page: { id: id as VitruSemanticSnapshot["page"]["id"], name: id },
  state: { now: "2026-08-13T12:00:00-03:00", timezone: "America/Sao_Paulo", focus: null, temporal: { view: null, visibleStart: "2026-08-13", visibleEnd: "2026-08-13" }, filters: {}, permissions: [] },
  sections: [], actions: [], destinations: [],
});

describe("SemanticSnapshotProvider", () => {
  let root: Root | undefined;
  const container = document.createElement("div");

  beforeEach(() => resetSemanticSnapshotForTests());

  afterEach(() => {
    act(() => root?.unmount());
    root = undefined;
    resetSemanticSnapshotForTests();
  });

  it("atualiza um consumidor persistente fora da árvore da página", () => {
    function PersistentConsumer() {
      return <output>{useSemanticSnapshot()?.page.id ?? "sem-snapshot"}</output>;
    }
    function Page({ pageId }: { pageId: string }) {
      return <SemanticSnapshotProvider snapshot={snapshot(pageId)}><div>Página</div></SemanticSnapshotProvider>;
    }

    root = createRoot(container);
    act(() => root?.render(<><Page pageId="home" /><PersistentConsumer /></>));
    expect(container.querySelector("output")?.textContent).toBe("home");

    act(() => root?.render(<><Page pageId="assessments" /><PersistentConsumer /></>));
    expect(container.querySelector("output")?.textContent).toBe("assessments");
  });

  it("publica snapshot mínimo e mantém as outras disciplinas do catálogo global", () => {
    function Consumer() {
      const value = useSemanticSnapshot();
      return <output>{JSON.stringify(value)}</output>;
    }
    root = createRoot(container);
    act(() => root?.render(
      <SemanticSnapshotProvider disciplineDestinations={[
        { id: "GTI03", name: "Modelagem", href: "/disciplinas/GTI03" },
        { id: "RH01", name: "Gestão de Pessoas", href: "/disciplinas/RH01" },
      ]}><Consumer /></SemanticSnapshotProvider>
    ));
    const value = JSON.parse(container.querySelector("output")?.textContent ?? "null") as VitruSemanticSnapshot;
    expect(value).toMatchObject({ page: { id: "discipline" }, sections: [], actions: [] });
    expect(value.destinations.map(({ id }) => id)).toContain("RH01");
    expect(value.destinations.map(({ id }) => id)).not.toContain("GTI03");
  });
});
