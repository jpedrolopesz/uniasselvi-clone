import type { ClassmateRecordRaw } from "@/lib/types/raw/classmates";
import type { PublicStudentConnection } from "@/lib/types/derived";
import { isSameCity } from "@/lib/exam-schedule/normalize-city";

export interface CurrentStudentForGrouping {
  id: string;
  city: string | null;
  state: string | null;
  classId: string;
  courseCode: string;
}

export interface RelatedStudentsGroups {
  classmates: PublicStudentConnection[];
  sameCityStudents: PublicStudentConnection[];
  travelingClassmates: PublicStudentConnection[];
  examCityStudents: PublicStudentConnection[];
}

function toPublicConnection(
  candidate: ClassmateRecordRaw,
  flags: {
    classmate: boolean;
    sameCity: boolean;
    sameExamDate: boolean;
    sameExamLocation: boolean;
    connectionAllowed: boolean;
  }
): PublicStudentConnection {
  return {
    studentId: candidate.student_id,
    displayName: candidate.display_name,
    avatarUrl: candidate.avatar_url,
    city: candidate.city_name,
    state: candidate.city_state,
    ...flags,
  };
}

/**
 * Roda inteiramente no servidor (Server Component). Nunca deve receber o
 * request diretamente do cliente — quem chama esta função já validou que
 * `currentStudent` tem vínculo com `testCode`/`classId`. Retorna apenas o
 * formato reduzido `PublicStudentConnection`; o registro completo
 * (`ClassmateRecordRaw`) nunca sai desta função.
 *
 * Dedup: cada aluno aparece em, no máximo, um dos quatro grupos. Prioridade
 * (mais específico primeiro): colegas em deslocamento > colegas de turma >
 * mesma cidade do usuário > mesma cidade da prova. Isso evita repetir a
 * mesma pessoa em "Colegas da sua turma" e em "Colegas que também sairão de
 * <cidade>", por exemplo.
 */
export function groupRelatedStudents({
  currentStudent,
  testCode,
  selectedExamDateId,
  selectedExamLocationId,
  examCity,
  examState,
  candidates,
}: {
  currentStudent: CurrentStudentForGrouping;
  testCode: string;
  selectedExamDateId: string | null;
  selectedExamLocationId: string | null;
  examCity: string | null;
  examState: string | null;
  candidates: ClassmateRecordRaw[];
}): RelatedStudentsGroups {
  const claimed = new Set<string>();
  const others = candidates.filter((c) => c.student_id !== currentStudent.id);

  const withExamState = (candidate: ClassmateRecordRaw) => {
    const schedule = candidate.exam_schedule?.[testCode];
    return {
      sameExamDate: Boolean(
        selectedExamDateId && schedule?.schedule_option_id === selectedExamDateId
      ),
      sameExamLocation: Boolean(
        selectedExamLocationId && schedule?.location_id === selectedExamLocationId
      ),
    };
  };

  const studentLivesWithUser = (candidate: ClassmateRecordRaw) =>
    isSameCity(currentStudent.city, currentStudent.state, candidate.city_name, candidate.city_state);

  const studentLivesInExamCity = (candidate: ClassmateRecordRaw) =>
    isSameCity(examCity, examState, candidate.city_name, candidate.city_state);

  const userTravels = !isSameCity(currentStudent.city, currentStudent.state, examCity, examState);

  // 1. Colegas em deslocamento (seção 8): só faz sentido quando o próprio aluno também está se deslocando.
  const travelingClassmates: PublicStudentConnection[] = [];
  if (userTravels) {
    for (const candidate of others) {
      if (claimed.has(candidate.student_id)) continue;
      if (!candidate.allow_travel_connection) continue;
      if (!studentLivesWithUser(candidate)) continue;
      const examState_ = withExamState(candidate);
      if (!examState_.sameExamLocation && !examState_.sameExamDate) continue;

      claimed.add(candidate.student_id);
      travelingClassmates.push(
        toPublicConnection(candidate, {
          classmate: candidate.class === currentStudent.classId,
          sameCity: true,
          ...examState_,
          connectionAllowed: true,
        })
      );
    }
  }

  // 2. Colegas da mesma turma.
  const classmates: PublicStudentConnection[] = [];
  for (const candidate of others) {
    if (claimed.has(candidate.student_id)) continue;
    if (candidate.class !== currentStudent.classId) continue;
    if (!candidate.allow_classmates_to_see_me) continue;

    claimed.add(candidate.student_id);
    const examState_ = withExamState(candidate);
    classmates.push(
      toPublicConnection(candidate, {
        classmate: true,
        sameCity: studentLivesWithUser(candidate),
        ...examState_,
        connectionAllowed: true,
      })
    );
  }

  // 3. Mesma cidade do aluno (fora da turma, ou turma mas sem consentimento de turma — ainda assim respeitando o consentimento específico desta seção).
  const sameCityStudents: PublicStudentConnection[] = [];
  for (const candidate of others) {
    if (claimed.has(candidate.student_id)) continue;
    if (!candidate.allow_students_from_my_city_to_see_me) continue;
    if (!studentLivesWithUser(candidate)) continue;

    claimed.add(candidate.student_id);
    sameCityStudents.push(
      toPublicConnection(candidate, {
        classmate: candidate.class === currentStudent.classId,
        sameCity: true,
        ...withExamState(candidate),
        connectionAllowed: true,
      })
    );
  }

  // 4. Mesma cidade da prova.
  const examCityStudents: PublicStudentConnection[] = [];
  for (const candidate of others) {
    if (claimed.has(candidate.student_id)) continue;
    if (!candidate.allow_students_from_my_city_to_see_me) continue;
    if (!studentLivesInExamCity(candidate)) continue;

    claimed.add(candidate.student_id);
    examCityStudents.push(
      toPublicConnection(candidate, {
        classmate: candidate.class === currentStudent.classId,
        sameCity: false,
        ...withExamState(candidate),
        connectionAllowed: true,
      })
    );
  }

  return { classmates, sameCityStudents, travelingClassmates, examCityStudents };
}
