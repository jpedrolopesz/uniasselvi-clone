import type { SofiaDadosAlunoData } from "@/lib/types/raw/sofia-dados-aluno";
import type { SofiaParticipationDerived } from "@/lib/types/derived";

/** Interpreta "S"/"N" do raw sem alterar o raw em si. */
export function deriveSofiaParticipation(
  data: SofiaDadosAlunoData
): SofiaParticipationDerived {
  return {
    participatesActively: data.participa_ativamente_sofia === "S",
    isControlGroup: data.participa_grupo_controle_sofia === "S",
  };
}

/** "Joao Pedro Lopes Zamonelo" a partir de full_name; usado nos títulos da UI. */
export function displaySemesterLabel(currentSemesterValue: string): string {
  return `DISCIPLINAS ${currentSemesterValue}`;
}
