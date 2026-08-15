/**
 * Schema para o Learning Profile (perfil inteligente do aluno).
 * Armazena dados de onboarding, VARK, rotina, objetivos, dificuldades e interesses.
 */
import {
  integer,
  jsonb,
  real,
  text,
  timestamp,
  uuid,
  boolean,
} from "drizzle-orm/pg-core";
import { students } from "@/lib/db/schema/academic";
import { vitru } from "@/lib/db/schema/vitru";
import type { LearningProfile } from "@/lib/profile/learning-profile";

// --- Learning Profiles (perfil completo) ---

export const learningProfiles = vitru.table("learning_profiles", {
  studentId: uuid("student_id")
    .primaryKey()
    .references(() => students.id, { onDelete: "cascade" }),

  // VARK scores
  varkVisual: real("vark_visual").notNull().default(0),
  varkAuditory: real("vark_auditory").notNull().default(0),
  varkReading: real("vark_reading").notNull().default(0),
  varkKinesthetic: real("vark_kinesthetic").notNull().default(0),
  primaryStyle: text("primary_style"), // visual, auditory, reading, kinesthetic

  // Rotina
  worksFullTime: boolean("works_full_time"),
  workDays: jsonb("work_days").$type<number[]>().notNull().default([]),
  workStartTime: text("work_start_time"),
  workEndTime: text("work_end_time"),
  preferredStudyTimes: jsonb("preferred_study_times")
    .$type<{ weekday: number; startTime: string; endTime: string }[]>()
    .notNull()
    .default([]),
  sessionDurationMinutes: integer("session_duration_minutes"),

  // Objetivos
  primaryMotivation: text("primary_motivation"),
  careerObjective: text("career_objective"),
  shortTermGoal: text("short_term_goal"),
  expectedGraduationYear: integer("expected_graduation_year"),

  // Dificuldades
  reportedDifficulties: jsonb("reported_difficulties").$type<string[]>().notNull().default([]),
  strongSubjects: jsonb("strong_subjects").$type<string[]>().notNull().default([]),
  weakSubjects: jsonb("weak_subjects").$type<string[]>().notNull().default([]),
  preferredContentFormats: jsonb("preferred_content_formats").$type<string[]>().notNull().default([]),

  // Interesses de comunidade
  communityInterests: jsonb("community_interests").$type<string[]>().notNull().default([]),
  skills: jsonb("skills").$type<string[]>().notNull().default([]),
  openToMentoring: boolean("open_to_mentoring").notNull().default(false),
  openToNetworking: boolean("open_to_networking").notNull().default(false),

  // Meta
  completeness: real("completeness").notNull().default(0),
  onboardingCompletedAt: timestamp("onboarding_completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
