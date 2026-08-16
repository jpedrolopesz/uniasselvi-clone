import "server-only";

import { buildVitruStudentContext } from "@/lib/vitru/build-student-context";
import { getRecentHistory, resolveConversationId } from "@/lib/vitru/conversation-store";
import { listActiveMemories } from "@/lib/vitru/memory/memories";
import { getStudentProfile } from "@/lib/vitru/memory/student-profile";
import type { VitruVoiceSession, VoiceSurface } from "@/lib/vitru/voice-session-contract";

export async function buildVitruVoiceSession(
  userId: string,
  surface: VoiceSurface,
  objectId: string,
): Promise<VitruVoiceSession> {
  const conversationId = await resolveConversationId(userId, surface, objectId);
  const [academicContext, profile, memories, history] = await Promise.all([
    buildVitruStudentContext(userId),
    getStudentProfile(userId),
    listActiveMemories(userId),
    getRecentHistory(conversationId),
  ]);

  return {
    conversationId,
    surface,
    objectId,
    academicContext,
    profile,
    memories: memories.slice(0, 20).map(({ kind, content, subjectCode }) => ({ kind, content, subjectCode })),
    history: history.map(({ role, text }) => ({ role, text })),
  };
}
