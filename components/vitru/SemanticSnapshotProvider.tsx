"use client";

import { useEffect, useSyncExternalStore, type ReactNode } from "react";
import type { VitruSemanticSnapshot } from "@/lib/vitru/semantic-snapshot";

let currentSnapshot: VitruSemanticSnapshot | null = null;
const listeners = new Set<() => void>();

export function publishSemanticSnapshot(snapshot: VitruSemanticSnapshot | null) {
  currentSnapshot = snapshot;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function SemanticSnapshotProvider({
  snapshot,
  children,
}: {
  snapshot?: VitruSemanticSnapshot | null;
  children: ReactNode;
}) {
  useEffect(() => {
    publishSemanticSnapshot(snapshot ?? null);
  }, [snapshot]);

  return children;
}

export function useSemanticSnapshot(): VitruSemanticSnapshot | null {
  return useSyncExternalStore(subscribe, () => currentSnapshot, () => null);
}
