import "server-only";
import { query, queryOne } from "./client";

export interface SubjectRow { id: string; subject_code: string; name: string; description: string | null; semester: string | null; metadata: Record<string, unknown> }
export interface UserProfileRow { id: string; name: string; email: string }
export interface StudyEventRow { id: string; title: string; description: string | null; event_type: string; starts_at: Date | null; ends_at: Date | null; due_at: Date | null; status: string; subject_code: string | null; subject_name: string | null }
export interface GradeRow { test_code: string; title: string; weight: string | null; grade: string | null; status: "pending" | "submitted" | "graded" | "missed"; subject_code: string }
export interface MaterialRow { id: string; title: string; material_type: string; source_uri: string | null; is_placeholder: boolean }

export function getUserProfile(userId: string) {
  return queryOne<UserProfileRow>(`SELECT id,name,email FROM academic.users WHERE id=$1`,[userId]);
}
export function listSubjectsForUser(userId: string) {
  return query<SubjectRow>(`SELECT s.id,s.subject_code,s.name,s.description,s.semester,s.metadata FROM academic.subjects s JOIN academic.enrollments e ON e.subject_id=s.id WHERE e.user_id=$1 AND e.status='active' ORDER BY s.name`,[userId]);
}
export function getSubjectByCode(institutionId: string, subjectCode: string) {
  return queryOne<SubjectRow>(`SELECT id,subject_code,name,description,semester,metadata FROM academic.subjects WHERE institution_id=$1 AND subject_code=$2`,[institutionId,subjectCode]);
}
export function listStudyEventsInRange(userId: string, fromDays: number, toDays: number) {
  return query<StudyEventRow>(`WITH hoje AS (SELECT (now() AT TIME ZONE 'America/Sao_Paulo')::date d) SELECT se.id,se.title,se.description,se.event_type,se.starts_at,se.ends_at,se.due_at,se.status,s.subject_code,s.name subject_name FROM academic.study_events se CROSS JOIN hoje LEFT JOIN academic.subjects s ON s.id=se.subject_id WHERE se.user_id=$1 AND se.status='pending' AND ((se.starts_at AT TIME ZONE 'America/Sao_Paulo')::date BETWEEN hoje.d+$2::int AND hoje.d+$3::int OR (se.due_at AT TIME ZONE 'America/Sao_Paulo')::date BETWEEN hoje.d+$2::int AND hoje.d+$3::int) ORDER BY coalesce(se.starts_at,se.due_at)`,[userId,fromDays,toDays]);
}
export function getNextLiveClass(userId: string) {
  return queryOne<StudyEventRow>(`SELECT se.id,se.title,se.description,se.event_type,se.starts_at,se.ends_at,se.due_at,se.status,s.subject_code,s.name subject_name FROM academic.study_events se LEFT JOIN academic.subjects s ON s.id=se.subject_id WHERE se.user_id=$1 AND se.event_type IN ('live_class','recorded_class') AND se.starts_at>now() ORDER BY se.starts_at LIMIT 1`,[userId]);
}
export function listPendingAssessments(userId: string) {
  return query(`SELECT a.id,a.test_code,a.title,a.due_at,a.max_score,s.subject_code,s.name subject_name FROM academic.assessments a JOIN academic.subjects s ON s.id=a.subject_id JOIN academic.enrollments e ON e.subject_id=s.id AND e.user_id=$1 LEFT JOIN academic.assessment_results r ON r.assessment_id=a.id AND r.user_id=$1 WHERE e.status='active' AND (a.due_at IS NULL OR a.due_at>now()) AND (r.id IS NULL OR r.status='pending') ORDER BY a.due_at NULLS LAST`,[userId]);
}
export function listMaterials(subjectCode: string) {
  return query<MaterialRow>(`SELECT m.id,m.title,m.material_type,coalesce((m.metadata->>'placeholder_uri')::boolean,false) is_placeholder,CASE WHEN coalesce((m.metadata->>'placeholder_uri')::boolean,false) THEN NULL ELSE m.source_uri END source_uri FROM academic.materials m LEFT JOIN academic.lessons l ON l.id=m.lesson_id JOIN academic.subjects s ON s.id=coalesce(m.subject_id,l.subject_id) WHERE s.subject_code=$1 ORDER BY m.material_type,m.title`,[subjectCode]);
}
export function listGrades(userId: string, subjectCode?: string) {
  return query<GradeRow>(`SELECT a.test_code,a.title,a.weight,r.grade,coalesce(r.status,'pending') status,s.subject_code FROM academic.assessments a JOIN academic.subjects s ON s.id=a.subject_id JOIN academic.enrollments e ON e.subject_id=s.id AND e.user_id=$1 LEFT JOIN academic.assessment_results r ON r.assessment_id=a.id AND r.user_id=$1 WHERE e.status='active' AND ($2::text IS NULL OR s.subject_code=$2) ORDER BY s.subject_code,a.weight DESC NULLS LAST`,[userId,subjectCode??null]);
}
export function getPartialAverage(userId: string, subjectCode: string) {
  return queryOne<{media_parcial:string|null;peso_avaliado:string;peso_total:string}>(`SELECT round(sum(r.grade*a.weight) FILTER (WHERE r.status='graded')/nullif(sum(a.weight) FILTER (WHERE r.status='graded'),0),2) media_parcial,round(coalesce(sum(a.weight) FILTER (WHERE r.status='graded'),0),2) peso_avaliado,round(coalesce(sum(a.weight),0),2) peso_total FROM academic.assessments a JOIN academic.subjects s ON s.id=a.subject_id LEFT JOIN academic.assessment_results r ON r.assessment_id=a.id AND r.user_id=$1 WHERE s.subject_code=$2`,[userId,subjectCode]);
}
export function getAttendance(userId: string, subjectCode?: string) {
  return query<{subject_code:string;aulas:number;presencas:number;percentual:string}>(`SELECT s.subject_code,count(*)::int aulas,count(*) FILTER (WHERE ar.present)::int presencas,round(100.0*count(*) FILTER (WHERE ar.present)/count(*),1) percentual FROM academic.attendance_records ar JOIN academic.subjects s ON s.id=ar.subject_id WHERE ar.user_id=$1 AND ($2::text IS NULL OR s.subject_code=$2) GROUP BY s.subject_code ORDER BY s.subject_code`,[userId,subjectCode??null]);
}
export function getLearningProgress(userId: string, subjectCode: string) {
  return queryOne<{licoes:number;concluidas:number;pontos_ganhos:number;pontos_possiveis:number}>(`SELECT count(*)::int licoes,count(lp.id) FILTER (WHERE lp.completed)::int concluidas,coalesce(sum(lp.points_earned),0)::int pontos_ganhos,coalesce(sum((l.metadata->>'points')::int),0)::int pontos_possiveis FROM academic.lessons l JOIN academic.subjects s ON s.id=l.subject_id LEFT JOIN academic.lesson_progress lp ON lp.lesson_id=l.id AND lp.user_id=$1 WHERE s.subject_code=$2`,[userId,subjectCode]);
}
export function listLessonProgress(userId: string, subjectCode: string) {
  return query<{lesson_code:string;completed:boolean}>(`SELECT l.lesson_code,coalesce(lp.completed,false) completed FROM academic.lessons l JOIN academic.subjects s ON s.id=l.subject_id LEFT JOIN academic.lesson_progress lp ON lp.lesson_id=l.id AND lp.user_id=$1 WHERE s.subject_code=$2 ORDER BY l.position`,[userId,subjectCode]);
}
