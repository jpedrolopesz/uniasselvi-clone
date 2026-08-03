import { readUserJsonFileOptional } from "@/lib/data/read-json-file";
import type { UserDataRaw } from "@/lib/types/raw/user-data";
import type { CurrentSemesterRaw } from "@/lib/types/raw/current-semester";
import type { SofiaDadosAlunoRaw } from "@/lib/types/raw/sofia-dados-aluno";
import type { DisciplineRaw } from "@/lib/types/raw/disciplines";
import type { FinancialTitleRaw } from "@/lib/types/raw/financial-titles";

export function loadUserData(userId: string): Promise<UserDataRaw | null> {
  return readUserJsonFileOptional<UserDataRaw>(userId, "user-data.json");
}

export function loadCurrentSemester(
  userId: string
): Promise<CurrentSemesterRaw | null> {
  return readUserJsonFileOptional<CurrentSemesterRaw>(
    userId,
    "current-semester.json"
  );
}

export function loadSofiaDadosAluno(
  userId: string
): Promise<SofiaDadosAlunoRaw | null> {
  return readUserJsonFileOptional<SofiaDadosAlunoRaw>(
    userId,
    "sofia-dados-aluno.json"
  );
}

export function loadDisciplines(
  userId: string
): Promise<DisciplineRaw[] | null> {
  return readUserJsonFileOptional<DisciplineRaw[]>(userId, "disciplines.json");
}

export function loadFinancialTitles(
  userId: string
): Promise<FinancialTitleRaw[] | null> {
  return readUserJsonFileOptional<FinancialTitleRaw[]>(
    userId,
    "financial-titles.json"
  );
}
