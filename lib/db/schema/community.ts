/**
 * Schema do módulo de comunidade: grupos, memberships, eventos, mentoria e badges.
 * Parte do schema vitru (produto é fonte da verdade).
 */
import {
  boolean,
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

export const community = pgSchema("community");

// --- Grupos de Comunidade ---

export const communityGroups = community.table("groups", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  category: text("category").notNull(), // empresa_junior, grupo_pesquisa, atletica, networking, mentoria, voluntariado, hackathon
  description: text("description").notNull(),
  institution: text("institution").notNull().default("both"), // unicesumar, uniasselvi, both
  courseAffinity: jsonb("course_affinity").$type<string[]>().notNull().default([]),
  memberCount: integer("member_count").notNull().default(0),
  maxMembers: integer("max_members"), // null = sem limite
  meetingSchedule: jsonb("meeting_schedule").$type<{
    frequency: string;
    weekday: number;
    startTime: string;
    endTime: string;
    modality: string;
    platform?: string;
  }>(),
  skills: jsonb("skills").$type<string[]>().notNull().default([]),
  isActive: boolean("is_active").notNull().default(true),
  imageUrl: text("image_url"),
  contactEmail: text("contact_email"),
  socialLinks: jsonb("social_links").$type<{ platform: string; url: string }[]>().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// --- Memberships ---

export const communityMemberships = community.table(
  "memberships",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    studentId: uuid("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    groupId: uuid("group_id")
      .notNull()
      .references(() => communityGroups.id, { onDelete: "cascade" }),
    role: text("role").notNull().default("member"), // member, leader, mentor, mentee
    isActive: boolean("is_active").notNull().default(true),
    joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique("membership_unq").on(table.studentId, table.groupId),
    index("membership_student_idx").on(table.studentId),
    index("membership_group_idx").on(table.groupId),
  ]
);

// --- Eventos ---

export const communityEvents = community.table(
  "events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    groupId: uuid("group_id")
      .notNull()
      .references(() => communityGroups.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description").notNull(),
    date: text("date").notNull(), // ISO date
    startTime: text("start_time").notNull(),
    endTime: text("end_time").notNull(),
    modality: text("modality").notNull().default("online"),
    location: text("location"),
    link: text("link"),
    maxParticipants: integer("max_participants"),
    registeredCount: integer("registered_count").notNull().default(0),
    tags: jsonb("tags").$type<string[]>().notNull().default([]),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("events_group_idx").on(table.groupId)]
);

// --- Mentoria ---

export const mentorshipMatches = community.table(
  "mentorship_matches",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    mentorId: uuid("mentor_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    menteeId: uuid("mentee_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    matchScore: real("match_score").notNull(),
    matchReasons: jsonb("match_reasons").$type<string[]>().notNull().default([]),
    status: text("status").notNull().default("pending"), // pending, active, completed, cancelled
    startedAt: timestamp("started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("mentorship_mentor_idx").on(table.mentorId),
    index("mentorship_mentee_idx").on(table.menteeId),
  ]
);

// --- Badges (gamificação) ---

export const studentBadges = community.table(
  "student_badges",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    studentId: uuid("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    badgeId: text("badge_id").notNull(), // referencia AVAILABLE_BADGES em community-hub.ts
    earnedAt: timestamp("earned_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique("badge_unq").on(table.studentId, table.badgeId),
    index("badges_student_idx").on(table.studentId),
  ]
);
