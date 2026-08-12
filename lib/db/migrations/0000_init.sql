CREATE SCHEMA "academic";
--> statement-breakpoint
CREATE SCHEMA "vitru";
--> statement-breakpoint
CREATE TABLE "academic"."assessments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"subject_code" text NOT NULL,
	"ordinal" integer NOT NULL,
	"code" text NOT NULL,
	"test_code" text,
	"test_type_code" text,
	"description" text,
	"begin_date" text,
	"end_date" text,
	"weight" text,
	"exam_made" integer,
	"need_schedule" boolean,
	"has_schedule" boolean,
	"can_answer" boolean,
	"payload" jsonb NOT NULL,
	CONSTRAINT "assessments_unq" UNIQUE("student_id","subject_code","code")
);
--> statement-breakpoint
CREATE TABLE "academic"."attendances" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"subject_code" text NOT NULL,
	"frequency" integer,
	"payload" jsonb NOT NULL,
	CONSTRAINT "attendances_unq" UNIQUE("student_id","subject_code")
);
--> statement-breakpoint
CREATE TABLE "academic"."calendar_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"subject_code" text NOT NULL,
	"ordinal" integer NOT NULL,
	"code" text NOT NULL,
	"begin_date" text,
	"end_date" text,
	"payload" jsonb NOT NULL,
	CONSTRAINT "calendar_events_unq" UNIQUE("student_id","subject_code","code")
);
--> statement-breakpoint
CREATE TABLE "academic"."classmates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"class_code" text NOT NULL,
	"ordinal" integer NOT NULL,
	"payload" jsonb NOT NULL,
	CONSTRAINT "classmates_unq" UNIQUE("class_code","ordinal")
);
--> statement-breakpoint
CREATE TABLE "academic"."datasets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"subject_code" text DEFAULT '' NOT NULL,
	"kind" text NOT NULL,
	CONSTRAINT "datasets_unq" UNIQUE("student_id","subject_code","kind")
);
--> statement-breakpoint
CREATE TABLE "academic"."disciplines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"ordinal" integer NOT NULL,
	"code" text NOT NULL,
	"class_code" text,
	"description" text,
	"current_subject" boolean,
	"payload" jsonb NOT NULL,
	CONSTRAINT "disciplines_unq" UNIQUE("student_id","code","class_code")
);
--> statement-breakpoint
CREATE TABLE "academic"."exam_schedule_options" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"subject_code" text NOT NULL,
	"test_code" text NOT NULL,
	"ordinal" integer NOT NULL,
	"payload" jsonb NOT NULL,
	CONSTRAINT "exam_schedule_options_unq" UNIQUE("student_id","subject_code","test_code","ordinal")
);
--> statement-breakpoint
CREATE TABLE "academic"."financial_titles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"ordinal" integer NOT NULL,
	"our_number" text,
	"due_date" text,
	"status" text,
	"paid" text,
	"payload" jsonb NOT NULL,
	CONSTRAINT "financial_titles_unq" UNIQUE("student_id","ordinal")
);
--> statement-breakpoint
CREATE TABLE "academic"."learning_paths" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"subject_code" text NOT NULL,
	"payload" jsonb NOT NULL,
	CONSTRAINT "learning_paths_unq" UNIQUE("student_id","subject_code")
);
--> statement-breakpoint
CREATE TABLE "academic"."recordings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"subject_code" text NOT NULL,
	"ordinal" integer NOT NULL,
	"title" text,
	"date_recording" text,
	"payload" jsonb NOT NULL,
	CONSTRAINT "recordings_unq" UNIQUE("student_id","subject_code","ordinal")
);
--> statement-breakpoint
CREATE TABLE "academic"."students" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"person_id" text,
	"subscription_code" text,
	"username" text,
	"email" text,
	"full_name" text,
	"first_name" text,
	"course_code" text,
	"course_name" text,
	"modality" text,
	"status_description" text,
	"pole" text,
	"headquarter" text,
	"display_label" text NOT NULL,
	"is_fictional" boolean DEFAULT false NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"scenario" text,
	"scenario_code" text,
	"simulation_date" text,
	"cohort_base_slug" text,
	"notes" text,
	"subjects" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"screens" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"manifest_datasets" jsonb,
	"user_data" jsonb,
	"current_semester" text,
	"sofia" jsonb,
	"work_schedule" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "students_slug_unq" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "academic"."test_contents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"subject_code" text NOT NULL,
	"test_code" text NOT NULL,
	"payload" jsonb NOT NULL,
	CONSTRAINT "test_contents_unq" UNIQUE("student_id","subject_code","test_code")
);
--> statement-breakpoint
CREATE TABLE "vitru"."app_settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vitru"."conversation_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" text NOT NULL,
	"role" text NOT NULL,
	"text" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vitru"."conversations" (
	"id" text PRIMARY KEY NOT NULL,
	"student_id" uuid NOT NULL,
	"surface" text NOT NULL,
	"object_id" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "conversations_key_unq" UNIQUE("student_id","surface","object_id")
);
--> statement-breakpoint
CREATE TABLE "vitru"."interactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" text,
	"student_id" uuid,
	"surface" text NOT NULL,
	"object_id" text NOT NULL,
	"lesson_id" text,
	"entry_event_id" text,
	"intent" text,
	"confidence" real,
	"resolution" text NOT NULL,
	"disclosure_level" text,
	"missing_fields" jsonb,
	"latency_ms" integer NOT NULL,
	"input_tokens" integer,
	"output_tokens" integer,
	"cache_read_tokens" integer,
	"action_returned" text,
	"action_clicked" text,
	"model" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vitru"."memories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"source" text NOT NULL,
	"content" text NOT NULL,
	"subject_code" text,
	"confidence" real,
	"valid_until" timestamp with time zone,
	"superseded_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vitru"."student_profiles" (
	"student_id" uuid PRIMARY KEY NOT NULL,
	"work_schedule_override" jsonb,
	"preferred_windows" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"session_minutes" integer,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vitru"."study_activities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"external_id" text NOT NULL,
	"title" text NOT NULL,
	"category" text NOT NULL,
	"subject_code" text,
	"subject_name" text,
	"date" text NOT NULL,
	"start_time" text NOT NULL,
	"end_time" text NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"source" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "study_activities_unq" UNIQUE("student_id","external_id")
);
--> statement-breakpoint
CREATE TABLE "vitru"."study_programs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"horizon_start" text NOT NULL,
	"horizon_end" text NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vitru"."study_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"program_id" uuid NOT NULL,
	"source_id" text NOT NULL,
	"assessment_code" text,
	"subject_code" text,
	"subject_name" text,
	"title" text NOT NULL,
	"category" text NOT NULL,
	"date" text NOT NULL,
	"start_time" text NOT NULL,
	"end_time" text NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"status" text DEFAULT 'proposed' NOT NULL,
	"ordinal" integer NOT NULL,
	CONSTRAINT "study_sessions_source_unq" UNIQUE("program_id","source_id")
);
--> statement-breakpoint
CREATE TABLE "vitru"."surface_visits" (
	"student_id" uuid NOT NULL,
	"surface" text NOT NULL,
	"visit_count" integer DEFAULT 0 NOT NULL,
	"first_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"onboarded_at" timestamp with time zone,
	CONSTRAINT "surface_visits_unq" UNIQUE("student_id","surface")
);
--> statement-breakpoint
CREATE TABLE "vitru"."trilha_completions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"subject_code" text NOT NULL,
	"lesson_id" text NOT NULL,
	"completed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "trilha_completions_unq" UNIQUE("student_id","subject_code","lesson_id")
);
--> statement-breakpoint
CREATE TABLE "vitru"."trilha_marks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"subject_code" text NOT NULL,
	"lesson_id" text NOT NULL,
	"paragraph_id" text NOT NULL,
	"excerpt" text NOT NULL,
	"marked_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "trilha_marks_unq" UNIQUE("student_id","subject_code","lesson_id","paragraph_id")
);
--> statement-breakpoint
ALTER TABLE "academic"."assessments" ADD CONSTRAINT "assessments_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "academic"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academic"."attendances" ADD CONSTRAINT "attendances_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "academic"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academic"."calendar_events" ADD CONSTRAINT "calendar_events_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "academic"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academic"."datasets" ADD CONSTRAINT "datasets_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "academic"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academic"."disciplines" ADD CONSTRAINT "disciplines_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "academic"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academic"."exam_schedule_options" ADD CONSTRAINT "exam_schedule_options_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "academic"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academic"."financial_titles" ADD CONSTRAINT "financial_titles_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "academic"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academic"."learning_paths" ADD CONSTRAINT "learning_paths_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "academic"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academic"."recordings" ADD CONSTRAINT "recordings_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "academic"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academic"."test_contents" ADD CONSTRAINT "test_contents_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "academic"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vitru"."conversation_messages" ADD CONSTRAINT "conversation_messages_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "vitru"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vitru"."conversations" ADD CONSTRAINT "conversations_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "academic"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vitru"."interactions" ADD CONSTRAINT "interactions_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "academic"."students"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vitru"."memories" ADD CONSTRAINT "memories_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "academic"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vitru"."student_profiles" ADD CONSTRAINT "student_profiles_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "academic"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vitru"."study_activities" ADD CONSTRAINT "study_activities_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "academic"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vitru"."study_programs" ADD CONSTRAINT "study_programs_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "academic"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vitru"."study_sessions" ADD CONSTRAINT "study_sessions_program_id_study_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "vitru"."study_programs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vitru"."surface_visits" ADD CONSTRAINT "surface_visits_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "academic"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vitru"."trilha_completions" ADD CONSTRAINT "trilha_completions_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "academic"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vitru"."trilha_marks" ADD CONSTRAINT "trilha_marks_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "academic"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "assessments_student_subject_idx" ON "academic"."assessments" USING btree ("student_id","subject_code");--> statement-breakpoint
CREATE INDEX "assessments_end_date_idx" ON "academic"."assessments" USING btree ("student_id","end_date");--> statement-breakpoint
CREATE INDEX "calendar_events_student_subject_idx" ON "academic"."calendar_events" USING btree ("student_id","subject_code");--> statement-breakpoint
CREATE INDEX "classmates_class_idx" ON "academic"."classmates" USING btree ("class_code");--> statement-breakpoint
CREATE INDEX "datasets_student_idx" ON "academic"."datasets" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "disciplines_student_idx" ON "academic"."disciplines" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "financial_titles_student_idx" ON "academic"."financial_titles" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "recordings_student_subject_idx" ON "academic"."recordings" USING btree ("student_id","subject_code");--> statement-breakpoint
CREATE INDEX "students_subscription_idx" ON "academic"."students" USING btree ("subscription_code");--> statement-breakpoint
CREATE INDEX "students_person_idx" ON "academic"."students" USING btree ("person_id");--> statement-breakpoint
CREATE INDEX "conversation_messages_conv_idx" ON "vitru"."conversation_messages" USING btree ("conversation_id","created_at");--> statement-breakpoint
CREATE INDEX "conversations_expires_idx" ON "vitru"."conversations" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "interactions_student_idx" ON "vitru"."interactions" USING btree ("student_id","created_at");--> statement-breakpoint
CREATE INDEX "interactions_surface_idx" ON "vitru"."interactions" USING btree ("surface","created_at");--> statement-breakpoint
CREATE INDEX "memories_student_idx" ON "vitru"."memories" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "memories_student_kind_idx" ON "vitru"."memories" USING btree ("student_id","kind");--> statement-breakpoint
CREATE INDEX "study_activities_student_date_idx" ON "vitru"."study_activities" USING btree ("student_id","date");--> statement-breakpoint
CREATE INDEX "study_programs_student_idx" ON "vitru"."study_programs" USING btree ("student_id","status");--> statement-breakpoint
CREATE INDEX "study_sessions_program_date_idx" ON "vitru"."study_sessions" USING btree ("program_id","date");--> statement-breakpoint
CREATE INDEX "trilha_completions_student_subject_idx" ON "vitru"."trilha_completions" USING btree ("student_id","subject_code");--> statement-breakpoint
CREATE INDEX "trilha_marks_student_subject_idx" ON "vitru"."trilha_marks" USING btree ("student_id","subject_code");