const RESOLVED_SHOW_ROUTES = [
  { pageId: "assessment-scheduling", actionId: /^schedule-option:.+:select$/, type: "select_option" as const },
  { pageId: "study-calendar", actionId: /^study-slot:.+:select$/, type: "select_option" as const },
] as const;

export function isScheduleOptionSelection(actionId: string | null | undefined): boolean {
  return typeof actionId === "string" && RESOLVED_SHOW_ROUTES.some(route => route.actionId.test(actionId));
}

export function coerceShowToScheduleSelection(
  pageId: string,
  resolution: { actionId?: string | null; ambiguous?: boolean } | null,
  action: { id: string; referencia: string }
): { id: string; type: "select_option"; referencia: string } | null {
  if (resolution?.ambiguous || !resolution?.actionId) return null;
  const route = RESOLVED_SHOW_ROUTES.find(candidate => candidate.pageId === pageId && candidate.actionId.test(resolution.actionId!));
  return route ? { id: action.id, type: route.type, referencia: action.referencia } : null;
}
