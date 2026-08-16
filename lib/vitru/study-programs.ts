import { and, desc, eq, inArray } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import * as s from "@/lib/db/schema";
import { requireStudentBySlug } from "@/lib/data/db-helpers";
import { saveStudyActivities } from "@/lib/data/save-study-activities";
import type { StudyProgram } from "@/lib/study-planner/study-program";
import type { ActivityCategory } from "@/lib/types/study-activity";
import type { FreeSlot } from "@/lib/study-planner/calendar-logic";
import { buildVitruStudentContext } from "@/lib/vitru/build-student-context";

export async function createConfirmedVoiceStudySession(userId: string, slot: FreeSlot): Promise<PersistedStudySession | null> {
  const current = await buildVitruStudentContext(userId);
  const stillAvailable = current.schedule.availableStudySlots.some((candidate) =>
    candidate.date === slot.date && candidate.startTime === slot.startTime && candidate.endTime === slot.endTime
  );
  if (!stillAvailable) return null;
  const program = await createStudyProgram(userId, {
    horizonStart: slot.date,
    horizonEnd: slot.date,
    assessments: [],
    sessions: [{
      id: `voice-study-${slot.date}-${slot.startTime}`,
      assessmentCode: "VOICE-STUDY",
      subjectCode: "GENERAL",
      subjectName: "Estudos",
      title: "Sessão de estudo",
      category: "estudo",
      date: slot.date,
      startTime: slot.startTime,
      endTime: slot.endTime,
      notes: "Agendada por voz após confirmação explícita.",
    }],
    replyText: "Sessão de estudo proposta por voz.",
  });
  return program.sessions[0] ?? null;
}

export type StudySessionStatus = "proposed" | "accepted" | "rejected" | "done";
export type StudyProgramStatus = "draft" | "active" | "superseded";

export interface PersistedStudySession {
  id: string;
  sourceId: string;
  assessmentCode: string | null;
  subjectCode: string | null;
  subjectName: string | null;
  title: string;
  category: ActivityCategory;
  date: string;
  startTime: string;
  endTime: string;
  notes: string;
  status: StudySessionStatus;
}

export interface PersistedStudyProgram {
  id: string;
  horizonStart: string;
  horizonEnd: string;
  status: StudyProgramStatus;
  createdAt: string;
  sessions: PersistedStudySession[];
}

function toPersistedSession(row: typeof s.studySessions.$inferSelect): PersistedStudySession {
  return {
    id: row.id,
    sourceId: row.sourceId,
    assessmentCode: row.assessmentCode,
    subjectCode: row.subjectCode,
    subjectName: row.subjectName,
    title: row.title,
    category: row.category as ActivityCategory,
    date: row.date,
    startTime: row.startTime,
    endTime: row.endTime,
    notes: row.notes,
    status: row.status as StudySessionStatus,
  };
}

async function loadProgramWithSessions(programId: string): Promise<PersistedStudyProgram> {
  const db = await getDb();
  const [[program], sessionRows] = await Promise.all([
    db.select().from(s.studyPrograms).where(eq(s.studyPrograms.id, programId)).limit(1),
    db
      .select()
      .from(s.studySessions)
      .where(eq(s.studySessions.programId, programId))
      .orderBy(s.studySessions.ordinal),
  ]);

  return {
    id: program.id,
    horizonStart: program.horizonStart,
    horizonEnd: program.horizonEnd,
    status: program.status as StudyProgramStatus,
    createdAt: program.createdAt.toISOString(),
    sessions: sessionRows.map(toPersistedSession),
  };
}

/**
 * Persiste um StudyProgram recém-gerado por `buildStudyProgram` como
 * rascunho — todas as sessões nascem "proposed". Qualquer programa
 * draft/active anterior do aluno vira "superseded": só um programa é o
 * atual por vez (ver comentário no schema).
 */
export async function createStudyProgram(
  userId: string,
  program: StudyProgram
): Promise<PersistedStudyProgram> {
  const student = await requireStudentBySlug(userId);
  const db = await getDb();

  await db
    .update(s.studyPrograms)
    .set({ status: "superseded" })
    .where(
      and(
        eq(s.studyPrograms.studentId, student.id),
        inArray(s.studyPrograms.status, ["draft", "active"])
      )
    );

  const [created] = await db
    .insert(s.studyPrograms)
    .values({
      studentId: student.id,
      horizonStart: program.horizonStart,
      horizonEnd: program.horizonEnd,
    })
    .returning();

  if (program.sessions.length > 0) {
    await db.insert(s.studySessions).values(
      program.sessions.map((session, ordinal) => ({
        programId: created.id,
        sourceId: session.id,
        assessmentCode: session.assessmentCode,
        subjectCode: session.subjectCode,
        subjectName: session.subjectName,
        title: session.title,
        category: session.category,
        date: session.date,
        startTime: session.startTime,
        endTime: session.endTime,
        notes: session.notes,
        ordinal,
      }))
    );
  }

  return loadProgramWithSessions(created.id);
}

/** O programa em rascunho/ativo mais recente do aluno, se houver — null quando nunca foi gerado nenhum, ou o último foi superseded. */
export async function getActiveStudyProgram(userId: string): Promise<PersistedStudyProgram | null> {
  const student = await requireStudentBySlug(userId);
  const db = await getDb();
  const [program] = await db
    .select()
    .from(s.studyPrograms)
    .where(
      and(eq(s.studyPrograms.studentId, student.id), inArray(s.studyPrograms.status, ["draft", "active"]))
    )
    .orderBy(desc(s.studyPrograms.createdAt))
    .limit(1);

  return program ? loadProgramWithSessions(program.id) : null;
}

/**
 * Aplica a decisão do aluno sobre uma sessão do programa. É este código —
 * não o texto que o modelo gera — quem grava a mudança de estado; o modelo
 * narra e negocia, mas nunca inventa uma data ou confirma algo sozinho.
 *
 * Aceitar materializa a sessão em vitru.study_activities, o mesmo caminho
 * que o plano de avaliação única já usa (saveStudyActivities) — é dali que
 * o Calendário de Estudos realmente lê, então "aceitar" precisa terminar
 * lá, não só mudar o status interno do programa.
 */
export async function applyStudySessionDecision(
  userId: string,
  sessionId: string,
  decision: Extract<StudySessionStatus, "accepted" | "rejected">
): Promise<PersistedStudySession> {
  const student = await requireStudentBySlug(userId);
  const db = await getDb();

  const [row] = await db
    .select({ session: s.studySessions, program: s.studyPrograms })
    .from(s.studySessions)
    .innerJoin(s.studyPrograms, eq(s.studySessions.programId, s.studyPrograms.id))
    .where(and(eq(s.studySessions.id, sessionId), eq(s.studyPrograms.studentId, student.id)))
    .limit(1);
  if (!row) throw new Error(`Sessão de plano não encontrada: "${sessionId}".`);

  const [updated] = await db
    .update(s.studySessions)
    .set({ status: decision })
    .where(eq(s.studySessions.id, sessionId))
    .returning();

  if (decision === "accepted") {
    await saveStudyActivities(userId, [
      {
        id: updated.sourceId,
        title: updated.title,
        category: updated.category as ActivityCategory,
        subjectCode: updated.subjectCode,
        subjectName: updated.subjectName,
        date: updated.date,
        startTime: updated.startTime,
        endTime: updated.endTime,
        notes: updated.notes,
        source: "ai",
      },
    ]);
  }

  return toPersistedSession(updated);
}
