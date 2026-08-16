import { describe, expect, it } from "vitest";
import { HIT_THRESHOLD, normalizeTokens, resolveLocally, scoreOverlap } from "@/lib/vitru/trilha-resolution";
import type { LearningPathLessonRaw } from "@/lib/types/raw/learning-path";

const currentLesson: LearningPathLessonRaw = {
  id: "u1-fatorial",
  title: "Fatorial",
  kind: "pratica",
  duration_min: 6,
  points: 25,
  completed: false,
  content:
    "## Fatorial\n\nO fatorial de um número natural n, indicado por n!, é o produto de todos os inteiros positivos menores ou iguais a n.\n\n## Sua prática\n\nCalcule o fatorial dos números propostos e simplifique expressões antes de multiplicar.",
  faq: [
    {
      question: "O que é fatorial de zero?",
      answer: "Por convenção, 0! = 1.",
    },
  ],
};

const previousLesson: LearningPathLessonRaw = {
  id: "u1-combinatoria-probabilidade",
  title: "Combinatória e probabilidade",
  kind: "leitura",
  duration_min: 8,
  points: 40,
  completed: true,
  content:
    "## O que você vai estudar\n\nNa Unidade 1 você estudará a combinatória e a probabilidade, usando o Teorema de Bayes.",
};

describe("resolveLocally", () => {
  it("resolve pela FAQ quando a pergunta bate com uma dúvida pré-cadastrada", () => {
    const result = resolveLocally("o que é fatorial de zero?", currentLesson, null);
    expect(result.resolution).toBe("faq");
    expect(result.reply).toBe("Por convenção, 0! = 1.");
    expect(result.confidence).toBeGreaterThanOrEqual(HIT_THRESHOLD);
  });

  it("resolve pelo conteúdo da aula atual quando não há FAQ correspondente", () => {
    const result = resolveLocally(
      "o que é o fatorial de um número natural n?",
      currentLesson,
      null
    );
    expect(result.resolution).toBe("retrieval");
    expect(result.matchedLessonId).toBe("u1-fatorial");
  });

  it("busca na aula anterior só quando a mensagem pede revisão", () => {
    const result = resolveLocally(
      "revisar: você estudará a combinatória e a probabilidade",
      currentLesson,
      previousLesson
    );
    expect(result.resolution).toBe("retrieval");
    expect(result.matchedLessonId).toBe("u1-combinatoria-probabilidade");
  });

  it("nunca busca na aula anterior se ela não foi passada", () => {
    const result = resolveLocally(
      "revisar: você estudará a combinatória e a probabilidade",
      currentLesson,
      null
    );
    expect(result.matchedLessonId).not.toBe("u1-combinatoria-probabilidade");
  });

  it("responde out_of_scope antes de gerar, para perguntas sobre nota", () => {
    const result = resolveLocally("qual é a minha nota nessa disciplina?", currentLesson, null);
    expect(result.resolution).toBe("out_of_scope");
    expect(result.confidence).toBeGreaterThanOrEqual(HIT_THRESHOLD);
  });

  it("a ordem é FAQ -> conteúdo -> fora de escopo -> geração: um hit de FAQ decide antes de o denylist de fora-de-escopo ser sequer checado", () => {
    // A pergunta bate na FAQ (score >= 0.6) mesmo mencionando "nota" de passagem — resolveLocally nunca chega a checar out-of-scope.
    const result = resolveLocally("fatorial de zero, isso tem nota?", currentLesson, null);
    expect(result.resolution).toBe("faq");
  });

  it("responde low_confidence só quando a mensagem não tem nenhum token reconhecível (vazia, pontuação, só stopwords)", () => {
    const result = resolveLocally("? ! ...", currentLesson, null);
    expect(result.resolution).toBe("low_confidence");
    expect(result.confidence).toBe(0);
  });

  it("uma pergunta real mas sem vocabulário literal da aula cai para geração, não para low_confidence", () => {
    // Regressão: pontuação de sobreposição de palavras não deve decidir "isso faz sentido?" — só decide hit de FAQ/conteúdo.
    for (const message of [
      "não entendi essa parte",
      "pode explicar melhor?",
      "por que isso funciona assim?",
    ]) {
      const result = resolveLocally(message, currentLesson, null);
      expect(result.resolution).toBe("generation");
    }
  });

  it("cai para geração quando há sinal fraco mas real, sem hit local", () => {
    const result = resolveLocally("fatorial números positivos algo diferente disso tudo aqui", currentLesson, null);
    expect(["generation", "retrieval"]).toContain(result.resolution);
  });

  it("nunca produz faq/retrieval abaixo do HIT_THRESHOLD", () => {
    const weakMessage = "fatorial";
    const result = resolveLocally(weakMessage, currentLesson, null);
    if (result.resolution === "faq" || result.resolution === "retrieval") {
      expect(result.confidence).toBeGreaterThanOrEqual(HIT_THRESHOLD);
    }
  });
});

describe("scoreOverlap", () => {
  it("é 0 quando a mensagem não tem tokens relevantes", () => {
    expect(scoreOverlap("", "qualquer coisa")).toBe(0);
  });

  it("é 1 quando todos os tokens da mensagem aparecem no candidato", () => {
    expect(scoreOverlap("fatorial zero", "o fatorial de zero é um por convenção")).toBe(1);
  });
});

describe("normalizeTokens para transcrição de voz", () => {
  it("normaliza avaliação e avaliações para o mesmo token", () => {
    expect(normalizeTokens("avaliação")).toEqual(["avaliacao"]);
    expect(normalizeTokens("avaliações")).toEqual(["avaliacao"]);
  });

  it.each([
    ["AV um", ["avaliacao", "virtual", "1"]],
    ["a vê dois", ["avaliacao", "virtual", "2"]],
    ["avaliação três", ["avaliacao", "3"]],
    ["unidade dez", ["unidade", "10"]],
    ["dia sete", ["dia", "7"]],
  ])("normaliza número falado em %s", (speech, expected) => {
    expect(normalizeTokens(speech)).toEqual(expected);
  });

  it("remove fillers sem diluir o recall", () => {
    expect(normalizeTokens("tipo né aí onde eu respondo a AV um")).toEqual([
      "onde", "respondo", "avaliacao", "virtual", "1",
    ]);
  });
});
