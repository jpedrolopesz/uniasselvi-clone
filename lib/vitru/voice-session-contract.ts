import type { VitruStudentContext } from "@/lib/vitru/build-student-context";
import type { StudentProfile } from "@/lib/vitru/memory/student-profile";

export type VoiceSurface = "portal" | "calendario";

export interface VitruVoiceSession {
  conversationId: string;
  surface: VoiceSurface;
  objectId: string;
  academicContext: VitruStudentContext;
  profile: StudentProfile | null;
  memories: Array<{ kind: string; content: string; subjectCode: string | null }>;
  history: Array<{ role: "user" | "assistant"; text: string }>;
}
