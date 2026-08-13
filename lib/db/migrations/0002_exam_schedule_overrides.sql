CREATE TABLE "vitru"."exam_schedule_overrides" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "student_id" uuid NOT NULL REFERENCES "academic"."students"("id") ON DELETE cascade,
  "subject_code" text NOT NULL,
  "test_code" text NOT NULL,
  "kind" text NOT NULL,
  "schedule_option_id" text,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "exam_schedule_overrides_unq" UNIQUE("student_id", "subject_code", "test_code")
);
