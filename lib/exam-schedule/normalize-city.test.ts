import { describe, expect, it } from "vitest";
import { compareStudentAndExamCity, isSameCity, normalizeCityText } from "@/lib/exam-schedule/normalize-city";

describe("normalizeCityText", () => {
  it("remove acentos, espaços redundantes e normaliza caixa", () => {
    expect(normalizeCityText("  JUNDIAÍ  ")).toBe("jundiai");
    expect(normalizeCityText("São   Paulo")).toBe("sao paulo");
    expect(normalizeCityText("jundiaí")).toBe(normalizeCityText("Jundiaí"));
  });
});

describe("isSameCity", () => {
  it("considera cidades iguais quando cidade e estado batem, ignorando acento/caixa/espaço", () => {
    expect(isSameCity("Jundiaí", "SP", "JUNDIAÍ ", " sp")).toBe(true);
  });

  it("considera cidades diferentes quando o nome da cidade difere", () => {
    expect(isSameCity("Blumenau", "SC", "Jundiaí", "SP")).toBe(false);
  });

  it("usa o estado para não confundir cidades homônimas de estados diferentes", () => {
    expect(isSameCity("Bom Jesus", "RS", "Bom Jesus", "GO")).toBe(false);
  });

  it("retorna false quando falta cidade ou estado do aluno ou da prova", () => {
    expect(isSameCity(null, "SP", "Jundiaí", "SP")).toBe(false);
    expect(isSameCity("Jundiaí", "SP", undefined, "SP")).toBe(false);
    expect(isSameCity("Jundiaí", "SP", "Jundiaí", null)).toBe(false);
  });
});

describe("compareStudentAndExamCity", () => {
  it("preenche isSameCity e preserva os valores originais para exibição", () => {
    const result = compareStudentAndExamCity("Blumenau", "SC", "Blumenau", "SC");
    expect(result).toEqual({
      isSameCity: true,
      studentCity: "Blumenau",
      studentState: "SC",
      examCity: "Blumenau",
      examState: "SC",
    });
  });

  it("aceita ausência de cidade do aluno sem lançar erro", () => {
    const result = compareStudentAndExamCity(null, null, "Jundiaí", "SP");
    expect(result.isSameCity).toBe(false);
    expect(result.studentCity).toBeNull();
  });
});
