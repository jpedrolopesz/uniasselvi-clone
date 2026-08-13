import type { VitruPageId } from "@/lib/vitru/page-context";

export interface VitruSemanticSnapshot {
  version: number;
  status: "loading" | "ready" | "error";
  page: { id: VitruPageId; name: string; subject?: { code: string; name: string } };
  state: VitruSnapshotState;
  sections: VitruSection[];
  actions: VitruAction[];
  destinations: VitruDestination[];
}

export interface VitruSnapshotState {
  now: string;
  timezone: string;
  focus: { type: string; id: string } | null;
  temporal: { view: "day" | "week" | "month" | null; visibleStart: string; visibleEnd: string };
  filters: Record<string, string>;
  permissions: string[];
}

export function defaultSnapshotState(now = new Date().toISOString()): VitruSnapshotState {
  return {
    now,
    timezone: "America/Sao_Paulo",
    focus: null,
    temporal: { view: null, visibleStart: now.slice(0, 10), visibleEnd: now.slice(0, 10) },
    filters: {},
    permissions: [],
  };
}

export interface VitruSection {
  id: string;
  name: string;
  items: VitruItem[];
}

export interface VitruItem {
  id: string;
  name: string;
  status?: string;
  facts?: Record<string, string>;
  actionIds: string[];
}

export interface VitruAction {
  id: string;
  label: string;
  kind: "navigate" | "read";
}

export interface VitruDestination {
  id: string;
  name: string;
  href: string;
}

export type VitruPageSnapshot =
  | { mode: "semantic"; snapshot: VitruSemanticSnapshot }
  | { mode: "dom"; context: unknown };
