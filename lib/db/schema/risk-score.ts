/**
 * Schema para persistência de Risk Scores e intervenções de retenção.
 */
import {
  index,
  integer,
  jsonb,
  real,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { students } from "@/lib/db/schema/academic";
import { vitru } from "@/lib/db/schema/vitru";

// --- Risk Scores ---

export const riskScores = vitru.table(
  "risk_scores",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    studentId: uuid("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    score: real("score").notNull(),
    level: text("level").notNull(), // low, medium, high, critical
    factors: jsonb("factors").$type<{
      name: string;
      weight: number;
      value: number;
      contribution: number;
      description: string;
    }[]>().notNull(),
    calculatedAt: timestamp("calculated_at", { withTimezone: true }).notNull().defaultNow(),
    /** Se já foi sincronizado com Salesforce */
    syncedToSalesforce: timestamp("synced_to_salesforce", { withTimezone: true }),
    salesforceCaseId: text("salesforce_case_id"),
  },
  (table) => [
    index("risk_scores_student_idx").on(table.studentId),
    index("risk_scores_level_idx").on(table.level),
    index("risk_scores_calculated_idx").on(table.calculatedAt),
  ]
);

// --- Intervenções (ações de retenção) ---

export const interventions = vitru.table(
  "interventions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    studentId: uuid("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    source: text("source").notNull(), // salesforce, manual, system
    type: text("type").notNull(), // call, email, mentoring, event_invite, financial_aid
    status: text("status").notNull().default("pending"), // pending, in_progress, completed, cancelled
    description: text("description"),
    salesforceCaseId: text("salesforce_case_id"),
    salesforceCampaignId: text("salesforce_campaign_id"),
    assignedTo: text("assigned_to"), // coordenador
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (table) => [
    index("interventions_student_idx").on(table.studentId),
    index("interventions_status_idx").on(table.status),
  ]
);

// --- Engagement Snapshots (para cálculo do risk score) ---

export const engagementSnapshots = vitru.table(
  "engagement_snapshots",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    studentId: uuid("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    daysSinceLastAccess: integer("days_since_last_access").notNull(),
    accessesLast14Days: integer("accesses_last_14_days").notNull(),
    averageGrade: real("average_grade"),
    onTimeSubmissionRate: real("on_time_submission_rate").notNull(),
    vitruInteractionsLast30Days: integer("vitru_interactions_30d").notNull(),
    communityParticipations: integer("community_participations").notNull(),
    learningPathProgress: real("learning_path_progress").notNull(),
    hasFinancialPending: integer("has_financial_pending").notNull().default(0), // 0=false, 1=true
    snapshotDate: text("snapshot_date").notNull(), // ISO date
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("engagement_student_idx").on(table.studentId),
    index("engagement_date_idx").on(table.snapshotDate),
  ]
);
