import type { AssistantSuggestion } from "@/lib/study-planner/ai-assistant";

export const VITRU_PLAN_CONFIRMED_EVENT = "vitru:plan-confirmed";

export function announceConfirmedPlan(activity: AssistantSuggestion & { source: "ai" }) {
  window.dispatchEvent(
    new CustomEvent(VITRU_PLAN_CONFIRMED_EVENT, { detail: activity })
  );
}
