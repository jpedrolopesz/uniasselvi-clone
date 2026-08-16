import "server-only";

import { randomBytes } from "node:crypto";
import { ONBOARDING_SCENES } from "./scenes";
import type { OnboardingParticipant, OnboardingSessionSnapshot } from "./types";

interface StoredSession extends OnboardingSessionSnapshot {
  hostKey: string;
}

const PARTICIPANT_TTL_MS = 30_000;

const globalForOnboarding = globalThis as typeof globalThis & {
  __onboardingSessions?: Map<string, StoredSession>;
};

const sessions = globalForOnboarding.__onboardingSessions ?? new Map<string, StoredSession>();
if (process.env.NODE_ENV !== "production") globalForOnboarding.__onboardingSessions = sessions;

function publicSnapshot(session: StoredSession): OnboardingSessionSnapshot {
  const cutoff = Date.now() - PARTICIPANT_TTL_MS;
  session.participants = session.participants.filter((participant) => participant.lastSeenAt >= cutoff);
  return {
    id: session.id,
    professorName: session.professorName,
    status: session.status,
    currentSceneId: session.currentSceneId,
    version: session.version,
    updatedAt: session.updatedAt,
    participants: session.participants.map((participant) => ({ ...participant })),
  };
}

export function createOnboardingSession(professorName: string) {
  const id = randomBytes(4).toString("hex").toUpperCase();
  const hostKey = randomBytes(24).toString("base64url");
  const now = Date.now();
  const session: StoredSession = {
    id,
    hostKey,
    professorName: professorName.trim().slice(0, 80) || "Professor responsável",
    status: "waiting",
    currentSceneId: ONBOARDING_SCENES[0].id,
    version: 1,
    updatedAt: now,
    participants: [],
  };
  sessions.set(id, session);
  return { session: publicSnapshot(session), hostKey };
}

export function getOnboardingSession(id: string) {
  const session = sessions.get(id.toUpperCase());
  return session ? publicSnapshot(session) : null;
}

export function updateOnboardingSession(
  id: string,
  hostKey: string,
  update: { status?: StoredSession["status"]; currentSceneId?: string }
) {
  const session = sessions.get(id.toUpperCase());
  if (!session || session.hostKey !== hostKey) return null;
  if (update.currentSceneId && !ONBOARDING_SCENES.some((scene) => scene.id === update.currentSceneId)) {
    return null;
  }
  if (update.status) session.status = update.status;
  if (update.currentSceneId) session.currentSceneId = update.currentSceneId;
  session.version += 1;
  session.updatedAt = Date.now();
  return publicSnapshot(session);
}

export function heartbeatOnboardingParticipant(
  id: string,
  participant: Omit<OnboardingParticipant, "lastSeenAt">
) {
  const session = sessions.get(id.toUpperCase());
  if (!session) return null;
  const nextParticipant = { ...participant, name: participant.name.slice(0, 80), lastSeenAt: Date.now() };
  const index = session.participants.findIndex((item) => item.id === participant.id);
  if (index >= 0) session.participants[index] = nextParticipant;
  else session.participants.push(nextParticipant);
  return publicSnapshot(session);
}
