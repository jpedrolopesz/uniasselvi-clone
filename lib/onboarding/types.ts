export type OnboardingRole = "professor" | "student";

export type OnboardingSceneMode = "observe" | "practice" | "explore";

export type SemanticDestination =
  | { kind: "HOME" }
  | { kind: "CURRENT_SUBJECT" }
  | { kind: "CURRENT_LEARNING_PATH" };

export type CompletionRule =
  | { kind: "IMMEDIATE" }
  | { kind: "PATH_MATCH"; pattern: string };

export interface OnboardingScene {
  id: string;
  eyebrow: string;
  title: string;
  instruction: string;
  professorNote: string;
  mode: OnboardingSceneMode;
  destination: SemanticDestination;
  highlightId?: string;
  completion: CompletionRule;
}

export type OnboardingSessionStatus = "waiting" | "active" | "ended";

export interface OnboardingParticipant {
  id: string;
  name: string;
  following: boolean;
  completedSceneId: string | null;
  lastSeenAt: number;
}

export interface OnboardingSessionSnapshot {
  id: string;
  professorName: string;
  status: OnboardingSessionStatus;
  currentSceneId: string;
  version: number;
  updatedAt: number;
  participants: OnboardingParticipant[];
}

export interface OnboardingClientContext {
  pathname: string;
  subjectCode: string | null;
}
