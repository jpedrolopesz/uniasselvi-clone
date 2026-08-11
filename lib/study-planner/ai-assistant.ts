/**
 * Tipos compartilhados entre o painel do assistente e a rota de chat.
 * A geração de sugestões vive em lib/study-planner/assessment-plan.ts.
 */
import type { ActivityCategory } from "@/lib/types/study-activity";

export interface SubjectOption {
  code: string;
  name: string;
}

export interface AssistantSuggestion {
  id: string;
  title: string;
  category: ActivityCategory;
  subjectCode: string | null;
  subjectName: string | null;
  date: string;
  startTime: string;
  endTime: string;
  notes: string;
}

export interface AssistantResponse {
  replyText: string;
  suggestions: AssistantSuggestion[];
}
