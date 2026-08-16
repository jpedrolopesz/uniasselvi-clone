import type { VitruPageId } from "@/lib/vitru/page-context";
import type { VitruSemanticSnapshot } from "@/lib/vitru/semantic-snapshot";

const SECTION_PREFIXES: Partial<Record<VitruPageId, readonly string[]>> = {
  assessments: ["discipline:"],
  discipline: ["discipline:"],
  "assessment-scheduling": ["schedule:"],
  "study-calendar": ["calendar:"],
};

export function assertSnapshotVocabulary(snapshot: VitruSemanticSnapshot): void {
  const prefixes = SECTION_PREFIXES[snapshot.page.id];
  if (!prefixes) throw new Error(`No section vocabulary declared for page ${snapshot.page.id}`);

  const actionIds = new Set(snapshot.actions.map((action) => action.id));
  const referencedActionIds = new Set<string>();

  for (const section of snapshot.sections) {
    if (!prefixes.some((prefix) => section.id.startsWith(prefix))) {
      throw new Error(`Section ${section.id} is outside the vocabulary for page ${snapshot.page.id}`);
    }
    for (const item of section.items) {
      for (const actionId of item.actionIds) {
        if (!actionIds.has(actionId)) throw new Error(`Item ${item.id} references missing action ${actionId}`);
        referencedActionIds.add(actionId);
      }
    }
  }

  for (const actionId of actionIds) {
    if (!referencedActionIds.has(actionId)) throw new Error(`Action ${actionId} is not referenced by any item`);
  }
  if (snapshot.destinations.some((destination) => destination.id === snapshot.page.id)) {
    throw new Error(`Page ${snapshot.page.id} cannot be its own destination`);
  }
}
