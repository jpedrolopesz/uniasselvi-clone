import {
  isEnvelopedTestContent,
  loadSubjectAssessments,
  loadSubjectTestContent,
} from "@/lib/data/load-subject-data";
import { stripHtml } from "@/lib/formatters/strip-html";
import { getInboxEvent, saveInboxEvent } from "@/lib/vitru/inbox-events";
import { HIT_THRESHOLD, scoreOverlap } from "@/lib/vitru/trilha-resolution";

const NUDGE_REASON =
  "Vi que você teve dificuldade em uma questão relacionada a esse assunto antes. Quer revisar?";

interface WrongQuestion {
  testCode: string;
  questionCode: string;
  text: string;
}

async function listWrongQuestions(
  userId: string,
  subjectCode: string
): Promise<WrongQuestion[]> {
  const assessments = (await loadSubjectAssessments(userId, subjectCode)) ?? [];
  const completedTestCodes = [
    ...new Set(
      assessments.filter((assessment) => assessment.exam_made > 0).map((assessment) => assessment.test_code)
    ),
  ];

  const wrongQuestions: WrongQuestion[] = [];
  for (const testCode of completedTestCodes) {
    const testData = await loadSubjectTestContent(userId, subjectCode, testCode);
    if (!testData || !isEnvelopedTestContent(testData) || testData.info.completed !== "S") continue;

    for (const question of testData.questions) {
      if (question.got_right === false) {
        wrongQuestions.push({
          testCode,
          questionCode: question.question_code,
          text: stripHtml(question.description),
        });
      }
    }
  }
  return wrongQuestions;
}

/**
 * Só decide, localmente, se uma questão errada é relevante o bastante para
 * esta aula específica — nunca manda o conteúdo da questão, a resposta ou a
 * nota para lugar nenhum. `reason` fica fixo, sem citar a questão (mesmo
 * cuidado de invariante já aplicado a grade/frequência/dados da Sofia no
 * contexto da trilha, aqui aplicado à mensagem de retomada).
 *
 * Idempotente por construção: o id do evento é determinístico
 * (testCode+questionCode+lessonId), então uma vez consumido nunca volta a
 * ser sugerido para essa combinação específica de questão e aula.
 */
export async function ensureWrongAnswerNudge(
  userId: string,
  subjectCode: string,
  lessonId: string,
  lessonContent: string
): Promise<string | null> {
  const wrongQuestions = await listWrongQuestions(userId, subjectCode);
  if (wrongQuestions.length === 0) return null;

  let best: (WrongQuestion & { score: number }) | null = null;
  for (const question of wrongQuestions) {
    const score = scoreOverlap(question.text, lessonContent);
    if (!best || score > best.score) best = { ...question, score };
  }
  if (!best || best.score < HIT_THRESHOLD) return null;

  const eventId = `wrongq-${best.testCode}-${best.questionCode}-${lessonId}`;
  const existing = await getInboxEvent(eventId);
  if (existing) {
    return existing.consumedAt ? null : eventId;
  }

  await saveInboxEvent({
    id: eventId,
    userId,
    surface: "trilha",
    objectId: subjectCode,
    lessonId,
    reason: NUDGE_REASON,
  });
  return eventId;
}
