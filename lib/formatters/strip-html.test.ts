import { describe, expect, it } from "vitest";
import { stripHtml } from "@/lib/formatters/strip-html";

describe("stripHtml", () => {
  it("remove tags", () => {
    expect(stripHtml("<p>Olá <strong>mundo</strong></p>")).toBe("Olá mundo");
  });

  it("decodifica entidades nomeadas comuns em PT-BR", () => {
    expect(stripHtml("M&eacute;todo etnogr&aacute;fico e popula&ccedil;&atilde;o")).toBe(
      "Método etnográfico e população"
    );
  });

  it("decodifica entidades numéricas", () => {
    expect(stripHtml("A&#231;&#227;o")).toBe("Ação");
  });

  it("colapsa espaços em branco extras", () => {
    expect(stripHtml("<p>  a  </p>\n<p>b</p>")).toBe("a b");
  });
});
