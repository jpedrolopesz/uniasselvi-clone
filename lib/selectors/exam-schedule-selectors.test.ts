import { describe, expect, it } from "vitest";
import {
  buildScheduledSession,
  buildSessionsFromOptions,
  isSessionFull,
  isSessionInPast,
  isSessionSelectable,
} from "@/lib/selectors/exam-schedule-selectors";
import type { AssessmentRaw } from "@/lib/types/raw/assessments";
import type { ExamScheduleOptionRaw } from "@/lib/types/raw/exam-schedule-options";

function baseAssessment(overrides: Partial<AssessmentRaw>): AssessmentRaw {
  return {
    allow_after_period: false,
    allow_cancel_schedule: true,
    assessment_reset: false,
    begin_date: "2026-08-21",
    can_answer: false,
    can_answer_2_opportunity: false,
    can_request_2_opportunity: false,
    can_scan: false,
    can_scan_batch: false,
    can_schedule_2_opportunity: false,
    can_see_answers: false,
    can_try_again: false,
    canceled_schedules: 0,
    class: "FLD1",
    code: "1",
    description: "Prova",
    end_date: "2026-08-21",
    exam_made: 0,
    has_schedule: false,
    have_accessibility_video: false,
    have_individual_extension: false,
    have_request_second_oportunity: false,
    is_online: false,
    max_free_test_reposition: 2,
    monitored_disabled: "N",
    need_2_opportunity: false,
    need_schedule: true,
    new_exam: false,
    new_oportunity: false,
    new_oportunity_msg: "",
    parameter: "",
    realization_1_oportunity_end: "",
    realization_1_oportunity_start: "",
    realization_date: "",
    realization_way: "1",
    realization_window_2_oportunity_end: "",
    realization_window_2_oportunity_start: "",
    realization_window_end: "",
    realization_window_start: "",
    request_window_2_oportunity_end: "",
    request_window_2_oportunity_start: "",
    response_method: "S",
    schedule: [],
    schedule_window_2_oportunity_end: "",
    schedule_window_2_oportunity_start: "",
    schedule_window_end: "",
    schedule_window_start: "",
    semester: "2026/2",
    show_button: true,
    subject: "GTI03",
    subject_type: "N",
    test_class: "FLD1",
    test_code: "T1",
    test_type_code: "6",
    type_code: "P",
    weight: "1",
    ...overrides,
  };
}

describe("buildScheduledSession", () => {
  it("retorna null quando a prova ainda não tem local/data (schedule vazio)", () => {
    const assessment = baseAssessment({ has_schedule: false, schedule: [] });
    expect(buildScheduledSession(assessment)).toBeNull();
  });

  it("monta a sessão a partir de ScheduleDetailRaw quando já agendada", () => {
    const assessment = baseAssessment({
      has_schedule: true,
      schedule: {
        data: "21/08/2026",
        hora_inicio: "13:00:00",
        hora_fim: "13:30:00",
        ambiente: "Sala 1",
        id: "s1",
        cep: "13201-840",
        endereco: "Rua X",
        numero: "191",
        complemento: "",
        bairro: "Centro",
        cidade: "Jundiaí",
        sigla: "SP",
      },
    });

    const session = buildScheduledSession(assessment);
    expect(session).not.toBeNull();
    expect(session?.isoDate).toBe("2026-08-21");
    expect(session?.location.city).toBe("Jundiaí");
    expect(session?.location.state).toBe("SP");
  });
});

describe("buildSessionsFromOptions / disponibilidade", () => {
  const options: ExamScheduleOptionRaw[] = [
    {
      id: "opt-1",
      data: "01/01/2020",
      hora_inicio: "08:00:00",
      hora_fim: "10:00:00",
      available_slots: 5,
      location: { id: "loc-1", nome: "Polo A", endereco: "Rua A", cidade: "Chapecó", sigla: "SC" },
    },
    {
      id: "opt-2",
      data: "01/01/2099",
      hora_inicio: "08:00:00",
      hora_fim: "10:00:00",
      capacity: 10,
      available_slots: 0,
      location: { id: "loc-1", nome: "Polo A", endereco: "Rua A", cidade: "Chapecó", sigla: "SC" },
    },
    {
      id: "opt-3",
      data: "01/01/2099",
      hora_inicio: "14:00:00",
      hora_fim: "16:00:00",
      capacity: 10,
      available_slots: 4,
      location: { id: "loc-1", nome: "Polo A", endereco: "Rua A", cidade: "Chapecó", sigla: "SC" },
    },
  ];

  const sessions = buildSessionsFromOptions(options);
  const todayIso = "2026-08-05";

  it("bloqueia datas passadas", () => {
    const past = sessions.find((s) => s.id === "opt-1")!;
    expect(isSessionInPast(past, todayIso)).toBe(true);
    expect(isSessionSelectable(past, todayIso)).toBe(false);
  });

  it("bloqueia datas lotadas (available_slots = 0)", () => {
    const full = sessions.find((s) => s.id === "opt-2")!;
    expect(isSessionFull(full)).toBe(true);
    expect(isSessionSelectable(full, todayIso)).toBe(false);
  });

  it("permite selecionar datas futuras com vaga disponível", () => {
    const open = sessions.find((s) => s.id === "opt-3")!;
    expect(isSessionSelectable(open, todayIso)).toBe(true);
  });
});
