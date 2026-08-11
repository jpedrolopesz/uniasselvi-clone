const NAMED_ENTITIES: Record<string, string> = {
  aacute: "á", Aacute: "Á",
  eacute: "é", Eacute: "É",
  iacute: "í", Iacute: "Í",
  oacute: "ó", Oacute: "Ó",
  uacute: "ú", Uacute: "Ú",
  atilde: "ã", Atilde: "Ã",
  otilde: "õ", Otilde: "Õ",
  ntilde: "ñ", Ntilde: "Ñ",
  acirc: "â", Acirc: "Â",
  ecirc: "ê", Ecirc: "Ê",
  ocirc: "ô", Ocirc: "Ô",
  agrave: "à", Agrave: "À",
  ccedil: "ç", Ccedil: "Ç",
  quot: '"',
  amp: "&",
  nbsp: " ",
  ldquo: "“",
  rdquo: "”",
  lsquo: "‘",
  rsquo: "’",
  hellip: "…",
};

/**
 * Remove tags e decodifica só as entidades nomeadas que aparecem de fato nos
 * dados reais de test-content.ts (question.description vem em HTML — ver
 * TestQuestionCard.tsx, que usa dangerouslySetInnerHTML pra exibir). Usado
 * só para pontuação de relevância (lib/vitru/wrong-answer-nudge.ts) e um
 * trecho curto em mensagens — não precisa de fidelidade perfeita, por isso
 * nenhuma dependência nova de parsing de HTML.
 */
export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&(#\d+|#x[0-9a-fA-F]+|[a-zA-Z]+);/g, (match, code: string) => {
      if (code.startsWith("#x") || code.startsWith("#X")) {
        return String.fromCodePoint(parseInt(code.slice(2), 16));
      }
      if (code.startsWith("#")) {
        return String.fromCodePoint(parseInt(code.slice(1), 10));
      }
      return NAMED_ENTITIES[code] ?? match;
    })
    .replace(/\s+/g, " ")
    .trim();
}
