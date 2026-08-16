import type { AssistantSuggestion } from "@/lib/study-planner/ai-assistant";

export const VITRU_PLAN_CONFIRMED_EVENT = "vitru:plan-confirmed";
export const VITRU_PLAN_PREVIEW_EVENT = "vitru:plan-preview";
export const VITRU_PLAN_PREVIEW_REMOVED_EVENT = "vitru:plan-preview-removed";

export function announcePlanPreviews(suggestions: AssistantSuggestion[]) {
  window.dispatchEvent(new CustomEvent(VITRU_PLAN_PREVIEW_EVENT, { detail: suggestions }));
}

export function removePlanPreview(suggestionId: string) {
  window.dispatchEvent(new CustomEvent(VITRU_PLAN_PREVIEW_REMOVED_EVENT, { detail: suggestionId }));
}

export function announceConfirmedPlan(activity: AssistantSuggestion & { source: "ai" }) {
  window.dispatchEvent(
    new CustomEvent(VITRU_PLAN_CONFIRMED_EVENT, { detail: activity })
  );
}
