import type { AssistantSuggestion } from "@/lib/study-planner/ai-assistant";

export type SuggestionStatus =
  | "pending"
  | "saving"
  | "accepted"
  | "rejected"
  | "error";

export interface DisplayedSuggestion {
  suggestion: AssistantSuggestion;
  status: SuggestionStatus;
}

export interface ChatMessage {
  id: number;
  role: "assistant" | "user";
  text: string;
  suggestions?: DisplayedSuggestion[];
}
