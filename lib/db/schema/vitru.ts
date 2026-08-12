import {
  index,
  integer,
  jsonb,
  pgSchema,
  real,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { students } from "@/lib/db/schema/academic";
import type {
  ActivityCategory,
  ActivitySource,
} from "@/lib/types/study-activity";
import type { WorkScheduleRaw } from "@/lib/types/raw/work-schedule";

/**
 * Dados de propriedade do Vitru: memória, preferências, planos e telemetria.
 * Diferente do schema `academic`, aqui o produto é a fonte da verdade — nada
 * vem de fora e nada é sobrescrito por sincronização com a instituição.
 */
export const vitru = pgSchema("vitru");

/** Superfícies do assistente. Espelha `Surface` em lib/vitru/surfaces.ts. */
export const SURFACES = ["trilha", "calendario"] as const;

/**
 * Preferências duráveis do aluno. Só é criado quando há algo a lembrar —
 * ausência de linha significa "nada declarado ainda", não "padrão zerado".
 */
export const studentProfiles = vitru.table("student_profiles", {
  studentId: uuid("student_id")
    .primaryKey()
    .references(() => students.id, { onDelete: "cascade" }),
  /** Sobrepõe a jornada vinda da instituição quando o aluno corrige. Null = usar a do schema academic. */
  workScheduleOverride: jsonb("work_schedule_override").$type<WorkScheduleRaw>(),
  /** Janelas em que o aluno prefere estudar, ex.: [{ weekday: 2, start: "19:00", end: "21:00" }]. */
  preferredWindows: jsonb("preferred_windows")
    .$type<{ weekday: number; start: string; end: string }[]>()
    .notNull()
    .default([]),
  sessionMinutes: integer("session_minutes"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * O que faz a explicação encolher a cada visita.
 *
 * `visitCount` alimenta `resolveDisclosure`, que decide entre explicar tudo
 * (primeira vez), retomar em uma linha (retornando) ou ir direto ao ponto
 * (frequente). O nível é calculado aqui, não pedido ao modelo — assim é
 * determinístico, testável, e não se gasta token instruindo brevidade.
 */
export const surfaceVisits = vitru.table(
  "surface_visits",
  {
    studentId: uuid("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    surface: text("surface").notNull(),
    visitCount: integer("visit_count").notNull().default(0),
    firstSeenAt: timestamp("first_seen_at", { withTimezone: true }).notNull().defaultNow(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).notNull().defaultNow(),
    /** Marcado quando o aluno já passou pela explicação inicial completa. */
    onboardedAt: timestamp("onboarded_at", { withTimezone: true }),
  },
  (table) => [
    unique("surface_visits_unq").on(table.studentId, table.surface),
  ]
);

/**
 * Memória episódica. Um fato por linha, com procedência explícita.
 *
 * `source` existe para nunca confundir o que o aluno disse com o que o
 * sistema inferiu: uma preferência inferida errada precisa poder ser
 * localizada e removida sem apagar o que foi declarado. Correções não
 * apagam — apontam `supersededBy`, preservando o histórico.
 */
export const memories = vitru.table(
  "memories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    studentId: uuid("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    /** preference | constraint | decision | fact */
    kind: text("kind").notNull(),
    /** stated (o aluno disse) | inferred (o sistema deduziu) | system (o produto registrou) */
    source: text("source").notNull(),
    content: text("content").notNull(),
    /** Disciplina a que o fato se refere, quando aplicável. */
    subjectCode: text("subject_code"),
    confidence: real("confidence"),
    /** Fatos com validade, ex.: "está de férias até 20/09". Null = sem prazo. */
    validUntil: timestamp("valid_until", { withTimezone: true }),
    supersededBy: uuid("superseded_by"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("memories_student_idx").on(table.studentId),
    index("memories_student_kind_idx").on(table.studentId, table.kind),
  ]
);

/**
 * Substitui `.vitru/conversation-sessions.local.json`, que não sobrevive a
 * deploy serverless. A chave de verdade continua sendo
 * (aluno, superfície, objeto), como em conversation-store.ts — recarregar a
 * página resolve para a mesma sessão sem depender de nada no cliente.
 */
export const conversations = vitru.table(
  "conversations",
  {
    /**
     * Texto, não uuid: o formato de sempre é `conv-<uuid>` (gerado pelo
     * loader, não pelo banco), tratado como opaco em toda a aplicação — o
     * cliente recebe essa string e nunca a interpreta. Uma coluna `uuid`
     * rejeitaria com erro de tipo qualquer string que não seja um UUID
     * puro, inclusive um conversationId desconhecido bem formado — o que
     * deveria ser um "não encontrado" comum vira exceção.
     */
    id: text("id").primaryKey(),
    studentId: uuid("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    surface: text("surface").notNull(),
    objectId: text("object_id").notNull(),
    /** O TTL de 24h de inatividade vira uma data explícita, varrida por job. */
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique("conversations_key_unq").on(table.studentId, table.surface, table.objectId),
    index("conversations_expires_idx").on(table.expiresAt),
  ]
);

export const conversationMessages = vitru.table(
  "conversation_messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    conversationId: text("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    /** user | assistant */
    role: text("role").notNull(),
    text: text("text").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("conversation_messages_conv_idx").on(table.conversationId, table.createdAt),
  ]
);

/**
 * Atividades confirmadas no Calendário de Estudos. Substitui
 * study-activities.json — este dado é gerado pelo produto, não pela
 * instituição, e por isso vive aqui e não em `academic`.
 */
export const studyActivities = vitru.table(
  "study_activities",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    studentId: uuid("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    /** Identificador estável usado pela UI (ex.: "ai-...", "manual-..."). */
    externalId: text("external_id").notNull(),
    title: text("title").notNull(),
    category: text("category").$type<ActivityCategory>().notNull(),
    subjectCode: text("subject_code"),
    subjectName: text("subject_name"),
    date: text("date").notNull(),
    startTime: text("start_time").notNull(),
    endTime: text("end_time").notNull(),
    notes: text("notes").notNull().default(""),
    source: text("source").$type<ActivitySource>().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique("study_activities_unq").on(table.studentId, table.externalId),
    index("study_activities_student_date_idx").on(table.studentId, table.date),
  ]
);

/**
 * Progresso do aluno na trilha. Vive aqui e não em `academic` porque quem
 * escreve é o próprio aluno pela interface (Server Actions em
 * lib/learning-path/trilha-progress-actions.ts), não a instituição.
 *
 * `markLessonCompleted` tem semântica de conjunto — marcar duas vezes não
 * duplica —, então a unicidade fica na tabela e a inserção é
 * `onConflictDoNothing`.
 */
export const trilhaCompletions = vitru.table(
  "trilha_completions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    studentId: uuid("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    subjectCode: text("subject_code").notNull(),
    lessonId: text("lesson_id").notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique("trilha_completions_unq").on(table.studentId, table.subjectCode, table.lessonId),
    index("trilha_completions_student_subject_idx").on(table.studentId, table.subjectCode),
  ]
);

/**
 * Trechos marcados pelo aluno. `markParagraph` substitui a marcação
 * anterior do mesmo parágrafo, então a unicidade é por
 * (aluno, disciplina, lição, parágrafo) e a escrita é upsert.
 *
 * O código atual mantém no máximo 200 marcações por disciplina, descartando
 * as mais antigas — a poda continua sendo responsabilidade de quem escreve,
 * não uma restrição do schema.
 */
export const trilhaMarks = vitru.table(
  "trilha_marks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    studentId: uuid("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    subjectCode: text("subject_code").notNull(),
    lessonId: text("lesson_id").notNull(),
    paragraphId: text("paragraph_id").notNull(),
    excerpt: text("excerpt").notNull(),
    markedAt: timestamp("marked_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique("trilha_marks_unq").on(
      table.studentId,
      table.subjectCode,
      table.lessonId,
      table.paragraphId
    ),
    index("trilha_marks_student_subject_idx").on(table.studentId, table.subjectCode),
  ]
);

/**
 * Plano de estudos de vários dias. Gerado deterministicamente por
 * `buildStudyProgram` a partir de disciplinas pendentes, prazos e janelas
 * livres — o modelo narra e negocia, mas nunca inventa a data.
 */
export const studyPrograms = vitru.table(
  "study_programs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    studentId: uuid("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    horizonStart: text("horizon_start").notNull(),
    horizonEnd: text("horizon_end").notNull(),
    /** draft | active | superseded */
    status: text("status").notNull().default("draft"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("study_programs_student_idx").on(table.studentId, table.status)]
);

export const studySessions = vitru.table(
  "study_sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    programId: uuid("program_id")
      .notNull()
      .references(() => studyPrograms.id, { onDelete: "cascade" }),
    /**
     * Mesmo esquema de id que StudyPlanSuggestion usa (`plan-<code>-<n>`) —
     * é o que liga esta sessão de volta à etapa que a gerou e a
     * study_activities.externalId quando aceita. Único só dentro do
     * programa (ver unique abaixo), não da tabela inteira: dois programas
     * gerados em dias diferentes podem repetir o passo da mesma avaliação.
     */
    sourceId: text("source_id").notNull(),
    assessmentCode: text("assessment_code"),
    subjectCode: text("subject_code"),
    subjectName: text("subject_name"),
    title: text("title").notNull(),
    category: text("category").$type<ActivityCategory>().notNull(),
    date: text("date").notNull(),
    startTime: text("start_time").notNull(),
    endTime: text("end_time").notNull(),
    notes: text("notes").notNull().default(""),
    /** proposed | accepted | rejected | done */
    status: text("status").notNull().default("proposed"),
    ordinal: integer("ordinal").notNull(),
  },
  (table) => [
    unique("study_sessions_source_unq").on(table.programId, table.sourceId),
    index("study_sessions_program_date_idx").on(table.programId, table.date),
  ]
);

/**
 * Substitui `.vitru/interactions.local.log`. Mantido como tabela e não como
 * arquivo para permitir medir o que motivou este trabalho: com que
 * frequência o assistente ainda pergunta algo que já estava no contexto.
 */
export const interactions = vitru.table(
  "interactions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    conversationId: text("conversation_id"),
    studentId: uuid("student_id").references(() => students.id, {
      onDelete: "set null",
    }),
    surface: text("surface").notNull(),
    objectId: text("object_id").notNull(),
    lessonId: text("lesson_id"),
    entryEventId: text("entry_event_id"),
    intent: text("intent"),
    confidence: real("confidence"),
    resolution: text("resolution").notNull(),
    /** Nível de explicação servido nesta interação — permite medir se a divulgação progressiva está funcionando. */
    disclosureLevel: text("disclosure_level"),
    /** Campos que o manifesto declarou ausentes, para auditar perguntas redundantes. */
    missingFields: jsonb("missing_fields").$type<string[]>(),
    latencyMs: integer("latency_ms").notNull(),
    inputTokens: integer("input_tokens"),
    outputTokens: integer("output_tokens"),
    cacheReadTokens: integer("cache_read_tokens"),
    actionReturned: text("action_returned"),
    actionClicked: text("action_clicked"),
    model: text("model"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("interactions_student_idx").on(table.studentId, table.createdAt),
    index("interactions_surface_idx").on(table.surface, table.createdAt),
  ]
);

/** Chave-valor para configuração do catálogo (ex.: aluno padrão do seletor de dev). */
export const appSettings = vitru.table("app_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
