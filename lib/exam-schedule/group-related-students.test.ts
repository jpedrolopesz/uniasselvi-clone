import { describe, expect, it } from "vitest";
import { groupRelatedStudents, type CurrentStudentForGrouping } from "@/lib/exam-schedule/group-related-students";
import type { ClassmateRecordRaw } from "@/lib/types/raw/classmates";

const TEST_CODE = "TST-AV3";

function student(overrides: Partial<ClassmateRecordRaw> & { student_id: string }): ClassmateRecordRaw {
  return {
    display_name: overrides.student_id,
    city_name: "Chapecó",
    city_state: "SC",
    class: "FLD1",
    course_code: "ADM",
    allow_classmates_to_see_me: true,
    allow_students_from_my_city_to_see_me: true,
    allow_travel_connection: true,
    ...overrides,
  };
}

const baseCurrentStudent: CurrentStudentForGrouping = {
  id: "me",
  city: "Chapecó",
  state: "SC",
  classId: "FLD1",
  courseCode: "ADM",
};

describe("groupRelatedStudents", () => {
  it("lista apenas colegas da mesma turma em `classmates`, nunca de outra turma", () => {
    const candidates = [
      student({ student_id: "same-class", class: "FLD1" }),
      student({ student_id: "other-class", class: "FLD2" }),
    ];

    const result = groupRelatedStudents({
      currentStudent: baseCurrentStudent,
      testCode: TEST_CODE,
      selectedExamDateId: null,
      selectedExamLocationId: null,
      examCity: "Chapecó",
      examState: "SC",
      candidates,
    });

    expect(result.classmates.map((s) => s.studentId)).toEqual(["same-class"]);
  });

  it("nunca inclui o próprio usuário em nenhum grupo", () => {
    const candidates = [student({ student_id: "me", class: "FLD1" })];

    const result = groupRelatedStudents({
      currentStudent: baseCurrentStudent,
      testCode: TEST_CODE,
      selectedExamDateId: null,
      selectedExamLocationId: null,
      examCity: "Chapecó",
      examState: "SC",
      candidates,
    });

    expect(result.classmates).toHaveLength(0);
    expect(result.sameCityStudents).toHaveLength(0);
  });

  it("respeita o consentimento por seção — aluno pode aparecer em uma seção e não em outra", () => {
    const candidates = [
      student({
        student_id: "opted-out-of-classmates",
        class: "FLD1",
        allow_classmates_to_see_me: false,
        allow_students_from_my_city_to_see_me: true,
      }),
    ];

    const result = groupRelatedStudents({
      currentStudent: baseCurrentStudent,
      testCode: TEST_CODE,
      selectedExamDateId: null,
      selectedExamLocationId: null,
      examCity: "Chapecó",
      examState: "SC",
      candidates,
    });

    expect(result.classmates).toHaveLength(0);
    expect(result.sameCityStudents.map((s) => s.studentId)).toEqual(["opted-out-of-classmates"]);
  });

  it("só preenche `travelingClassmates` quando o próprio aluno também está se deslocando", () => {
    const candidates = [
      student({ student_id: "traveler", city_name: "Chapecó", city_state: "SC" }),
    ];

    const stayingHome = groupRelatedStudents({
      currentStudent: baseCurrentStudent,
      testCode: TEST_CODE,
      selectedExamDateId: null,
      selectedExamLocationId: "loc-x",
      examCity: "Chapecó", // mesma cidade do aluno -> ele não viaja
      examState: "SC",
      candidates,
    });
    expect(stayingHome.travelingClassmates).toHaveLength(0);
  });

  it("agrupa colegas em deslocamento quando moram na mesma cidade do aluno e vão ao mesmo local", () => {
    const candidates = [
      student({
        student_id: "traveler",
        city_name: "Chapecó",
        city_state: "SC",
        exam_schedule: { [TEST_CODE]: { schedule_option_id: "opt-1", location_id: "loc-blumenau" } },
      }),
    ];

    const result = groupRelatedStudents({
      currentStudent: baseCurrentStudent,
      testCode: TEST_CODE,
      selectedExamDateId: "opt-1",
      selectedExamLocationId: "loc-blumenau",
      examCity: "Blumenau", // diferente da cidade do aluno -> ele viaja
      examState: "SC",
      candidates,
    });

    expect(result.travelingClassmates.map((s) => s.studentId)).toEqual(["traveler"]);
  });

  it("nunca repete o mesmo aluno em mais de um grupo (deduplicação)", () => {
    const candidates = [
      student({
        student_id: "dup",
        class: "FLD1",
        city_name: "Chapecó",
        city_state: "SC",
        exam_schedule: { [TEST_CODE]: { schedule_option_id: "opt-1", location_id: "loc-blumenau" } },
      }),
    ];

    const result = groupRelatedStudents({
      currentStudent: baseCurrentStudent,
      testCode: TEST_CODE,
      selectedExamDateId: "opt-1",
      selectedExamLocationId: "loc-blumenau",
      examCity: "Blumenau",
      examState: "SC",
      candidates,
    });

    const allIds = [
      ...result.classmates,
      ...result.sameCityStudents,
      ...result.travelingClassmates,
      ...result.examCityStudents,
    ].map((s) => s.studentId);

    expect(allIds.filter((id) => id === "dup")).toHaveLength(1);
    // Mais específico (deslocamento) vence sobre "colega de turma" genérico.
    expect(result.travelingClassmates.map((s) => s.studentId)).toEqual(["dup"]);
  });

  it("lista alunos que moram na cidade da prova em `examCityStudents`", () => {
    const candidates = [student({ student_id: "local", city_name: "Blumenau", city_state: "SC", class: "FLD9" })];

    const result = groupRelatedStudents({
      currentStudent: baseCurrentStudent,
      testCode: TEST_CODE,
      selectedExamDateId: null,
      selectedExamLocationId: null,
      examCity: "Blumenau",
      examState: "SC",
      candidates,
    });

    expect(result.examCityStudents.map((s) => s.studentId)).toEqual(["local"]);
  });
});
