/**
 * Conversão entre a linha de vitru.study_activities e o StudyActivity que a
 * aplicação consome — compartilhada por load-study-planner-data.ts (leitura)
 * e save-study-activities.ts (escrita), para não duplicar o mapeamento.
 */
import type { StudyActivity } from "@/lib/types/study-activity";
import type * as s from "@/lib/db/schema";

type StudyActivityRow = typeof s.studyActivities.$inferSelect;

export function rowToStudyActivity(row: StudyActivityRow): StudyActivity {
  return {
    id: row.externalId,
    title: row.title,
    category: row.category,
    subjectCode: row.subjectCode,
    subjectName: row.subjectName,
    date: row.date,
    startTime: row.startTime,
    endTime: row.endTime,
    notes: row.notes,
    source: row.source,
  };
}
