export type Surface = "trilha" | "calendario";

export type SurfaceFocus =
  | { kind: "trilha"; lessonId: string; markCount: number; lastMarkAt: string | null }
  | { kind: "calendario"; weekOf: string };

export type ActionType = "open_lesson" | "navigate" | "confirm_plan" | "dismiss";

export interface AssistantAction {
  type: ActionType;
  label: string;
  [key: string]: unknown;
}

export type Resolution =
  | "retrieval"
  | "faq"
  | "generation"
  | "out_of_scope"
  | "low_confidence";
