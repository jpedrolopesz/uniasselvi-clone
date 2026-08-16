"use client";

import { useEffect, useSyncExternalStore, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { destinationsForPage } from "@/lib/vitru/destinations";
import { resolveVitruPage, VITRU_NAVIGATION_DESTINATIONS } from "@/lib/vitru/page-context";
import { defaultSnapshotState, type VitruDestination, type VitruSemanticSnapshot } from "@/lib/vitru/semantic-snapshot";

let currentSnapshot: VitruSemanticSnapshot | null = null;
let globalDestinations: VitruDestination[] = [];
let pageSnapshot: VitruSemanticSnapshot | null = null;
let currentPathname = "/";
const listeners = new Set<() => void>();

export function publishSemanticSnapshot(snapshot: VitruSemanticSnapshot | null) {
  currentSnapshot = snapshot;
  listeners.forEach((listener) => listener());
}

function rebuildPublishedSnapshot() {
  const page = resolveVitruPage(currentPathname);
  const inherited = destinationsForPage(currentPathname, [
    ...VITRU_NAVIGATION_DESTINATIONS,
    ...globalDestinations,
  ]);
  if (!pageSnapshot) {
    publishSemanticSnapshot({
      version: 0, status: "ready", page: { id: page.id, name: page.name },
      state: defaultSnapshotState(), sections: [], actions: [], destinations: inherited,
    });
    return;
  }
  const destinations = new Map([...(pageSnapshot.destinations ?? []), ...inherited].map((destination) => [destination.href, destination]));
  publishSemanticSnapshot({ ...pageSnapshot, destinations: [...destinations.values()] });
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function SemanticSnapshotProvider({
  snapshot,
  disciplineDestinations,
  children,
}: {
  snapshot?: VitruSemanticSnapshot | null;
  disciplineDestinations?: VitruDestination[];
  children: ReactNode;
}) {
  const pathname = usePathname();
  useEffect(() => {
    currentPathname = pathname;
    if (disciplineDestinations !== undefined) globalDestinations = disciplineDestinations;
    if (snapshot !== undefined) pageSnapshot = snapshot ?? null;
    else if (disciplineDestinations !== undefined) pageSnapshot = null;
    rebuildPublishedSnapshot();
    return () => {
      if (snapshot !== undefined && pageSnapshot === snapshot) {
        pageSnapshot = null;
        rebuildPublishedSnapshot();
      }
    };
  }, [disciplineDestinations, pathname, snapshot]);

  return children;
}

export function useSemanticSnapshot(): VitruSemanticSnapshot | null {
  return useSyncExternalStore(subscribe, () => currentSnapshot, () => null);
}

export function resetSemanticSnapshotForTests() {
  currentSnapshot = null;
  globalDestinations = [];
  pageSnapshot = null;
  currentPathname = "/";
  listeners.forEach(listener => listener());
}
