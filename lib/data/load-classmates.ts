import { readSharedJsonFileOptional } from "@/lib/data/read-shared-json-file";
import type { ClassmateRecordRaw } from "@/lib/types/raw/classmates";

/**
 * Só deve ser chamado a partir de um Server Component/Server Action que já
 * validou que `classId` é a turma do usuário ativo (ver
 * lib/exam-schedule/group-related-students.ts) — o registro completo
 * (incluindo cidade) nunca deve ser repassado ao cliente sem passar por
 * `groupRelatedStudents`, que reduz para `PublicStudentConnection`.
 */
export function loadClassmates(classId: string): Promise<ClassmateRecordRaw[] | null> {
  return readSharedJsonFileOptional<ClassmateRecordRaw[]>("classmates", `${classId}.json`);
}
