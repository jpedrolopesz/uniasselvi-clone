// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it } from "vitest";
import {
  SemanticSnapshotProvider,
  useSemanticSnapshot,
} from "@/components/vitru/SemanticSnapshotProvider";
import type { VitruSemanticSnapshot } from "@/lib/vitru/semantic-snapshot";

const snapshot = (id: string) => ({ page: { id } }) as VitruSemanticSnapshot;

describe("SemanticSnapshotProvider", () => {
  let root: Root | undefined;
  const container = document.createElement("div");

  afterEach(() => {
    act(() => root?.unmount());
    root = undefined;
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
});
