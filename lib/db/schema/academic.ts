import {
  boolean,
  index,
  integer,
  jsonb,
  pgSchema,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import type { AssessmentRaw } from "@/lib/types/raw/assessments";
import type { AttendancesRaw } from "@/lib/types/raw/attendances";
import type { CalendarEventRaw } from "@/lib/types/raw/calendar-events";
import type { ClassmateRecordRaw } from "@/lib/types/raw/classmates";
import type { DisciplineRaw } from "@/lib/types/raw/disciplines";
import type { ExamScheduleOptionRaw } from "@/lib/types/raw/exam-schedule-options";
import type { FinancialTitleRaw } from "@/lib/types/raw/financial-titles";
import type { LearningPathRaw } from "@/lib/types/raw/learning-path";
import type { UserManifest } from "@/lib/types/raw/local";
import type { RecordingRaw } from "@/lib/types/raw/recordings";
import type { SofiaDadosAlunoRaw } from "@/lib/types/raw/sofia-dados-aluno";
import type { TestContentRaw, TestInfoRaw } from "@/lib/types/raw/test-content";
import type { UserDataRaw } from "@/lib/types/raw/user-data";
import type { WorkScheduleRaw } from "@/lib/types/raw/work-schedule";

/**
 * Dados de propriedade da instituição: espelham as APIs da UNIASSELVI
 * (SOFIA/AVA). Leitura predominante — o Vitru nunca é a fonte da verdade
 * aqui, apenas mantém uma réplica consultável. O que o Vitru gera fica em
 * `lib/db/schema/vitru.ts`.
 *
 * Cada tabela de item guarda o objeto bruto da API em `payload` e promove a
 * coluna apenas os campos que a aplicação filtra ou ordena. O levantamento
 * que motivou isso: das ~55 chaves de AssessmentRaw a aplicação lê 19, e das
 * ~45 de DisciplineRaw lê 12. Fragmentar o resto seria manter o formato de
 * uma API de terceiro sem ganhar consulta nenhuma — e quebraria invariantes
 * documentadas nos tipos (`mediator: DisciplinePersonRaw | boolean`,
 * `schedule: unknown[] | ScheduleDetailRaw`), que só sobrevivem intactas
 * em jsonb.
 */
export const academic = pgSchema("academic");

/** Sentinela para datasets de nível aluno em `datasets.subjectCode`. Evita a armadilha de NULL não ser único em UNIQUE. */
export const STUDENT_LEVEL = "";

/**
 * Presença de dataset — não confundir com "dataset vazio".
 *
 * Os loaders distinguem `null` (arquivo ausente) de `[]` (arquivo presente e
 * vazio), e a interface depende disso: notas-avaliacoes/page.tsx mostra
 * "Nenhum dado de avaliações disponível" para `null` e "Nenhuma avaliação
 * encontrada" para `[]`. Um schema puramente relacional não consegue
 * distinguir os dois casos (ausência de linhas é ambígua), então a presença
 * é registrada explicitamente aqui.
 */
export const datasets = academic.table(
  "datasets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    studentId: uuid("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    /** Código da disciplina, ou STUDENT_LEVEL para datasets do aluno. */
    subjectCode: text("subject_code").notNull().default(STUDENT_LEVEL),
    /** Ex.: "assessments", "recordings", "disciplines", "learning-path". */
    kind: text("kind").notNull(),
  },
  (table) => [
    unique("datasets_unq").on(table.studentId, table.subjectCode, table.kind),
    index("datasets_student_idx").on(table.studentId),
  ]
);

/**
 * Raiz do schema. `slug` é o identificador que toda a aplicação já usa como
 * `userId` (ex.: "usuario-ficticio-em-dia") — mantê-lo como chave externa é o
 * que permite reimplementar os loaders sem alterar nenhuma assinatura.
 *
 * Por decisão de projeto o CPF não existe neste sistema: a identificação é
 * `personId` + `subscriptionCode`, alinhada à guardrail que já está no prompt
 * universal do Vitru.
 */
export const students = academic.table(
  "students",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull(),
    personId: text("person_id"),
    subscriptionCode: text("subscription_code"),
    username: text("username"),
    email: text("email"),
    fullName: text("full_name"),
    firstName: text("first_name"),
    courseCode: text("course_code"),
    courseName: text("course_name"),
    modality: text("modality"),
    statusDescription: text("status_description"),
    pole: text("pole"),
    headquarter: text("headquarter"),

    // --- metadados do catálogo local (index.json / manifest.json) ---
    displayLabel: text("display_label").notNull(),
    isFictional: boolean("is_fictional").notNull().default(false),
    isDefault: boolean("is_default").notNull().default(false),
    scenario: text("scenario"),
    scenarioCode: text("scenario_code"),
    /** Congela "hoje" para os cenários fictícios. Texto ISO, não `date`, para preservar o valor exatamente como no fixture. */
    simulationDate: text("simulation_date"),
    cohortBaseSlug: text("cohort_base_slug"),
    notes: text("notes"),
    subjects: jsonb("subjects").$type<string[]>().notNull().default([]),
    screens: jsonb("screens").$type<string[]>().notNull().default([]),
    manifestDatasets: jsonb("manifest_datasets").$type<UserManifest["datasets"]>(),

    // --- documentos 1:1 com o aluno ---
    /** user-data.json na íntegra: ~50 campos dos quais a aplicação lê 8. */
    userData: jsonb("user_data").$type<UserDataRaw>(),
    /** CurrentSemesterRaw.value, ex.: "2026/2". */
    currentSemester: text("current_semester"),
    sofia: jsonb("sofia").$type<SofiaDadosAlunoRaw>(),
    workSchedule: jsonb("work_schedule").$type<WorkScheduleRaw>(),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique("students_slug_unq").on(table.slug),
    index("students_subscription_idx").on(table.subscriptionCode),
    index("students_person_idx").on(table.personId),
  ]
);

export const disciplines = academic.table(
  "disciplines",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    studentId: uuid("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    /** Ordem no fixture. Preserva a ordenação original, que a UI usa como desempate. */
    ordinal: integer("ordinal").notNull(),
    code: text("code").notNull(),
    classCode: text("class_code"),
    description: text("description"),
    currentSubject: boolean("current_subject"),
    payload: jsonb("payload").$type<DisciplineRaw>().notNull(),
  },
  (table) => [
    unique("disciplines_unq").on(table.studentId, table.code, table.classCode),
    index("disciplines_student_idx").on(table.studentId),
  ]
);

export const assessments = academic.table(
  "assessments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    studentId: uuid("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    subjectCode: text("subject_code").notNull(),
    ordinal: integer("ordinal").notNull(),
    code: text("code").notNull(),
    testCode: text("test_code"),
    testTypeCode: text("test_type_code"),
    description: text("description"),
    /** Strings cruas da API — o formato varia e `toIsoDateKey` normaliza a jusante. Guardar como texto preserva o valor exato. */
    beginDate: text("begin_date"),
    endDate: text("end_date"),
    weight: text("weight"),
    examMade: integer("exam_made"),
    needSchedule: boolean("need_schedule"),
    hasSchedule: boolean("has_schedule"),
    canAnswer: boolean("can_answer"),
    payload: jsonb("payload").$type<AssessmentRaw>().notNull(),
  },
  (table) => [
    unique("assessments_unq").on(table.studentId, table.subjectCode, table.code),
    index("assessments_student_subject_idx").on(table.studentId, table.subjectCode),
    index("assessments_end_date_idx").on(table.studentId, table.endDate),
  ]
);

export const calendarEvents = academic.table(
  "calendar_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    studentId: uuid("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    subjectCode: text("subject_code").notNull(),
    ordinal: integer("ordinal").notNull(),
    code: text("code").notNull(),
    beginDate: text("begin_date"),
    endDate: text("end_date"),
    payload: jsonb("payload").$type<CalendarEventRaw>().notNull(),
  },
  (table) => [
    unique("calendar_events_unq").on(table.studentId, table.subjectCode, table.code),
    index("calendar_events_student_subject_idx").on(table.studentId, table.subjectCode),
  ]
);

export const recordings = academic.table(
  "recordings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    studentId: uuid("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    subjectCode: text("subject_code").notNull(),
    /** RecordingRaw não tem chave natural — a ordem do fixture é a identidade. */
    ordinal: integer("ordinal").notNull(),
    title: text("title"),
    dateRecording: text("date_recording"),
    payload: jsonb("payload").$type<RecordingRaw>().notNull(),
  },
  (table) => [
    unique("recordings_unq").on(table.studentId, table.subjectCode, table.ordinal),
    index("recordings_student_subject_idx").on(table.studentId, table.subjectCode),
  ]
);

/**
 * `AttendancesRaw` é um objeto composto (`frequency`, `frequency_diary[]`,
 * `meetings[]`) lido sempre inteiro por disciplina — uma linha por
 * (aluno, disciplina), com a frequência promovida por ser o único campo
 * que a UI exibe isoladamente.
 */
export const attendances = academic.table(
  "attendances",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    studentId: uuid("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    subjectCode: text("subject_code").notNull(),
    frequency: integer("frequency"),
    payload: jsonb("payload").$type<AttendancesRaw>().notNull(),
  },
  (table) => [
    unique("attendances_unq").on(table.studentId, table.subjectCode),
  ]
);

export const financialTitles = academic.table(
  "financial_titles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    studentId: uuid("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    ordinal: integer("ordinal").notNull(),
    ourNumber: text("our_number"),
    dueDate: text("due_date"),
    status: text("status"),
    paid: text("paid"),
    payload: jsonb("payload").$type<FinancialTitleRaw>().notNull(),
  },
  (table) => [
    unique("financial_titles_unq").on(table.studentId, table.ordinal),
    index("financial_titles_student_idx").on(table.studentId),
  ]
);

/** Documento inteiro por disciplina; nunca consultado por campo interno. */
export const learningPaths = academic.table(
  "learning_paths",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    studentId: uuid("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    subjectCode: text("subject_code").notNull(),
    payload: jsonb("payload").$type<LearningPathRaw>().notNull(),
  },
  (table) => [unique("learning_paths_unq").on(table.studentId, table.subjectCode)]
);

/**
 * Conteúdo de uma prova. O fixture vem em dois formatos reais — envelope
 * `{info, questions}` ou `TestInfoRaw` achatado (ver comentário em
 * lib/types/raw/test-content.ts). O tipo da coluna preserva a união; quem lê
 * decide com `isEnvelopedTestContent`.
 */
export const testContents = academic.table(
  "test_contents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    studentId: uuid("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    subjectCode: text("subject_code").notNull(),
    testCode: text("test_code").notNull(),
    payload: jsonb("payload").$type<TestContentRaw | TestInfoRaw>().notNull(),
  },
  (table) => [
    unique("test_contents_unq").on(table.studentId, table.subjectCode, table.testCode),
  ]
);

export const examScheduleOptions = academic.table(
  "exam_schedule_options",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    studentId: uuid("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    subjectCode: text("subject_code").notNull(),
    testCode: text("test_code").notNull(),
    ordinal: integer("ordinal").notNull(),
    payload: jsonb("payload").$type<ExamScheduleOptionRaw>().notNull(),
  },
  (table) => [
    unique("exam_schedule_options_unq").on(
      table.studentId,
      table.subjectCode,
      table.testCode,
      table.ordinal
    ),
  ]
);

/**
 * Colegas de turma. Diferente de todo o resto: pertence à turma, não ao
 * aluno — por isso vive fora de `public/data/user/` no fixture e não tem FK
 * para `students` aqui. O registro completo inclui cidade e nunca deve ir ao
 * cliente sem passar por `groupRelatedStudents`.
 */
export const classmates = academic.table(
  "classmates",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    classCode: text("class_code").notNull(),
    ordinal: integer("ordinal").notNull(),
    payload: jsonb("payload").$type<ClassmateRecordRaw>().notNull(),
  },
  (table) => [
    unique("classmates_unq").on(table.classCode, table.ordinal),
    index("classmates_class_idx").on(table.classCode),
  ]
);
