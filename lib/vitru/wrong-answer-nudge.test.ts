import { beforeEach, describe, expect, it } from "vitest";
import { ensureWrongAnswerNudge } from "@/lib/vitru/wrong-answer-nudge";
import { deleteInboxEvent, getInboxEvent } from "@/lib/vitru/inbox-events";
import { loadSubjectLearningPath } from "@/lib/data/load-subject-data";

const USER_ID = "usuario-ficticio-em-dia";
const SUBJECT_CODE = "MAT24";
// id determinístico (ver wrong-answer-nudge.ts) — reseta antes de cada teste para não depender do estado deixado por execuções anteriores da suíte.
const FATORIAL_EVENT_ID = "wrongq-AV1-MAT24-MAT24Q1-u1-fatorial";

beforeEach(async () => {
  await deleteInboxEvent(FATORIAL_EVENT_ID);
});

async function lessonContentFor(lessonId: string): Promise<string> {
  const path = await loadSubjectLearningPath(USER_ID, SUBJECT_CODE);
  const lesson = path!.sections.flatMap((s) => s.lessons).find((l) => l.id === lessonId)!;
  return lesson.content;
}

describe("ensureWrongAnswerNudge", () => {
  it("cria e devolve um evento quando há questão errada relevante para a aula", async () => {
    const content = await lessonContentFor("u1-fatorial");
    const eventId = await ensureWrongAnswerNudge(USER_ID, SUBJECT_CODE, "u1-fatorial", content);

    expect(eventId).toBe("wrongq-AV1-MAT24-MAT24Q1-u1-fatorial");
    const stored = await getInboxEvent(eventId!);
    expect(stored).toMatchObject({ surface: "trilha", objectId: SUBJECT_CODE, lessonId: "u1-fatorial" });
    expect(stored!.reason).not.toMatch(/fatorial|MAT24Q1|nota|grade/i);
  });

  it("não repete depois que o evento já foi consumido", async () => {
    const content = await lessonContentFor("u1-fatorial");
    const first = await ensureWrongAnswerNudge(USER_ID, SUBJECT_CODE, "u1-fatorial", content);
    expect(first).not.toBeNull();

    const { consumeInboxEvent } = await import("@/lib/vitru/inbox-events");
    await consumeInboxEvent(first!);

    const second = await ensureWrongAnswerNudge(USER_ID, SUBJECT_CODE, "u1-fatorial", content);
    expect(second).toBeNull();
  });

  it("não sugere nada para uma aula sem relação com a questão errada", async () => {
    const content = await lessonContentFor("u2-variaveis-aleatorias");
    const eventId = await ensureWrongAnswerNudge(USER_ID, SUBJECT_CODE, "u2-variaveis-aleatorias", content);
    expect(eventId).toBeNull();
  });

  it("devolve null quando o aluno não tem nenhuma avaliação corrigida na disciplina", async () => {
    const eventId = await ensureWrongAnswerNudge(
      "usuario-ficticio-sem-horario-livre",
      SUBJECT_CODE,
      "u1-fatorial",
      await lessonContentFor("u1-fatorial")
    );
    expect(eventId).toBeNull();
  });
});
