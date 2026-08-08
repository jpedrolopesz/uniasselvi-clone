import { loadUserManifest } from "@/lib/data/load-user-index";
import {
  loadDisciplines,
  loadSofiaDadosAluno,
  loadUserData,
} from "@/lib/data/load-user-data";
import {
  loadAllSubjectAssessments,
  loadAllSubjectCalendarEvents,
  loadStudyActivities,
  loadWorkSchedule,
} from "@/lib/data/load-study-planner-data";
import { deriveSofiaParticipation } from "@/lib/selectors/user-selectors";
import { toIsoDateKey } from "@/lib/formatters/date-formatters";
import {
  buildNextAssessmentPlan,
  isAssignmentAssessment,
} from "@/lib/study-planner/assessment-plan";
import {
  buildSeedActivities,
  buildWorkScheduleActivities,
} from "@/lib/study-planner/seed-activities";
import { findFreeSlots, getActivitiesInRange } from "@/lib/study-planner/calendar-logic";
import { addDays, getTodayIsoDate } from "@/lib/study-planner/date-utils";

function daysBetween(from: string, to: string): number {
  return Math.floor(
    (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) /
      86_400_000
  );
}

function assessmentStatus(
  beginDate: string | null,
  endDate: string | null,
  examMade: number,
  needSchedule: boolean,
  hasSchedule: boolean,
  referenceDate: string
) {
  if (examMade > 0) return "completed" as const;
  if (needSchedule && hasSchedule) return "scheduled" as const;
  if (needSchedule && !hasSchedule) return "scheduling_required" as const;
  if (beginDate && beginDate > referenceDate) return "upcoming" as const;
  if (endDate && endDate < referenceDate) return "expired" as const;
  return "open" as const;
}

export async function buildVitruStudentContext(userId: string) {
  const [manifest, user, disciplines, sofia] = await Promise.all([
    loadUserManifest(userId),
    loadUserData(userId),
    loadDisciplines(userId),
    loadSofiaDadosAluno(userId),
  ]);

  const referenceDate = manifest.simulationDate ?? getTodayIsoDate();
  const safeDisciplines = disciplines ?? [];
  const [assessments, events, personalActivities, workSchedule] = await Promise.all([
    loadAllSubjectAssessments(userId, safeDisciplines),
    loadAllSubjectCalendarEvents(userId, safeDisciplines),
    loadStudyActivities(userId),
    loadWorkSchedule(userId),
  ]);

  const activities = [
    ...buildSeedActivities(events),
    ...(workSchedule
      ? buildWorkScheduleActivities(
          workSchedule,
          addDays(referenceDate, -7),
          addDays(referenceDate, 90)
        )
      : []),
    ...(personalActivities ?? []),
  ];
  const plan = buildNextAssessmentPlan(assessments, activities, referenceDate);
  const availableSlots = findFreeSlots(activities, {
    fromIsoDate: referenceDate,
    days: 7,
    durationMinutes: 60,
    maxSlots: 7,
  });
  const upcomingActivities = getActivitiesInRange(
    activities,
    referenceDate,
    addDays(referenceDate, 14)
  );

  return {
    student: {
      id: userId,
      firstName: user?.first_name ?? manifest.displayLabel,
      courseCode: user?.course_code ?? null,
      courseName: user?.course_name ?? null,
      modality: user?.modality ?? null,
      academicStatus: user?.status_description ?? null,
      isFictional: manifest.isFictional,
    },
    referenceDate,
    scenario: manifest.scenarioCode ?? null,
    disciplines: safeDisciplines.map((discipline) => ({
      code: discipline.code,
      name: discipline.description,
      classCode: discipline.class,
      beginDate: toIsoDateKey(discipline.begin_date),
      endDate: toIsoDateKey(discipline.end_date),
    })),
    assessments: assessments.map(({ assessment, subjectCode, subjectName }) => {
      const beginDate = toIsoDateKey(assessment.begin_date);
      const endDate = toIsoDateKey(assessment.end_date);
      return {
        code: assessment.code,
        description: assessment.description,
        subjectCode,
        subjectName,
        kind: isAssignmentAssessment(
          assessment.description,
          assessment.test_type_code
        )
          ? ("assignment" as const)
          : ("exam" as const),
        beginDate,
        endDate,
        daysRemaining: endDate ? daysBetween(referenceDate, endDate) : null,
        weight: Number(assessment.weight || 0),
        status: assessmentStatus(
          beginDate,
          endDate,
          assessment.exam_made,
          assessment.need_schedule,
          assessment.has_schedule,
          referenceDate
        ),
        canAnswer: assessment.can_answer,
        needsScheduling: assessment.need_schedule,
        hasSchedule: assessment.has_schedule,
      };
    }),
    schedule: {
      work: workSchedule,
      upcomingBusySlots: upcomingActivities.map((activity) => ({
        id: activity.id,
        title: activity.title,
        category: activity.category,
        date: activity.date,
        startTime: activity.startTime,
        endTime: activity.endTime,
      })),
      availableStudySlots: availableSlots,
    },
    suggestedPlan: plan,
    sofiaSignals: sofia
      ? {
          source: sofia.endpoint,
          observedAt: sofia.timestamp,
          ...deriveSofiaParticipation(sofia.data),
        }
      : null,
  };
}
