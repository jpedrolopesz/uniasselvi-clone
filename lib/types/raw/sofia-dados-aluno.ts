/**
 * Espelha https://api-menuatendimento.uniasselvi.com.br/v1/repositories/sofia_dados_aluno
 * `participa_ativamente_sofia` e `participa_grupo_controle_sofia` são strings "S"/"N"
 * no raw — nunca converter para boolean aqui (ver lib/types/derived).
 */
export interface SofiaDadosAlunoData {
  participa_ativamente_sofia: string;
  participa_grupo_controle_sofia: string;
}

export interface SofiaDadosAlunoRaw {
  endpoint: string;
  timestamp: string;
  data: SofiaDadosAlunoData;
}
