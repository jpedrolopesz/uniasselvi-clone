import { AppShell } from "@/components/layout/AppShell";
import { SubpageHeader } from "@/components/layout/SubpageHeader";
import { EmptyState } from "@/components/layout/EmptyState";
import { ExamScheduleHeader } from "@/components/exam-schedule/ExamScheduleHeader";
import { ExamScheduleView } from "@/components/exam-schedule/ExamScheduleView";
import { ExamScheduleSituationLabel } from "@/components/exam-schedule/ExamScheduleSituationLabel";
import { resolveActiveUserId } from "@/lib/data/resolve-active-user";
import { loadDisciplines, loadUserData } from "@/lib/data/load-user-data";
import { loadSubjectAssessments, loadExamScheduleOptions } from "@/lib/data/load-subject-data";
import { loadClassmates } from "@/lib/data/load-classmates";
import { findDisciplineByCode } from "@/lib/selectors/discipline-selectors";
import {
  buildScheduledSession,
  buildSessionsFromOptions,
  getSchedulingDeadlineDisplay,
  isSchedulingWindowOpen,
  todayIsoDateKey,
} from "@/lib/selectors/exam-schedule-selectors";
import { groupRelatedStudents } from "@/lib/exam-schedule/group-related-students";
import type { ExamScheduleOptionRaw } from "@/lib/types/raw/exam-schedule-options";
import type { RelatedStudentsGroups } from "@/lib/exam-schedule/group-related-students";
import { buildAssessmentSchedulingSnapshot } from "@/lib/vitru/adapters/assessment-scheduling";
import { loadScheduleOverride } from "@/lib/exam-schedule/schedule-repository";

export default async function ExamSchedulePage({
  params,
  searchParams,
}: {
  params: Promise<{ subjectCode: string; testCode: string }>;
  searchParams: Promise<{ u?: string | string[] }>;
}) {
  const { subjectCode, testCode } = await params;
  const { u } = await searchParams;
  const activeUserId = await resolveActiveUserId(u);

  const [disciplines, assessments, userData] = await Promise.all([
    loadDisciplines(activeUserId),
    loadSubjectAssessments(activeUserId, subjectCode),
    loadUserData(activeUserId),
  ]);

  const discipline = disciplines ? findDisciplineByCode(disciplines, subjectCode) : undefined;
  const assessment = assessments?.find((a) => a.test_code === testCode);

  const backHref = `/disciplinas/${subjectCode}/notas-avaliacoes`;

  if (!assessment) {
    return (
      <AppShell activeUserId={activeUserId}>
        <SubpageHeader
          title="Agendamento de Prova"
          disciplineName={discipline?.description ?? subjectCode}
          disciplineCode={subjectCode}
          backHref={backHref}
        />
        <EmptyState message={`Prova "${testCode}" não encontrada para esta disciplina.`} />
      </AppShell>
    );
  }

  if (!assessment.need_schedule) {
    return (
      <AppShell activeUserId={activeUserId}>
        <SubpageHeader
          title="Agendamento de Prova"
          disciplineName={discipline?.description ?? subjectCode}
          disciplineCode={subjectCode}
          backHref={backHref}
        />
        <EmptyState message="Esta avaliação não exige agendamento presencial." />
      </AppShell>
    );
  }

  const hasSeedSchedule = assessment.has_schedule;
  const seedSession = buildScheduledSession(assessment);
  const scheduleOverride = await loadScheduleOverride(activeUserId, subjectCode, testCode);

  let scheduleOptionsRaw: ExamScheduleOptionRaw[] = [];
  let optionsLoadError = false;
  try {
    scheduleOptionsRaw = (await loadExamScheduleOptions(activeUserId, subjectCode, testCode)) ?? [];
  } catch {
    optionsLoadError = true;
  }
  const scheduleOptions = buildSessionsFromOptions(scheduleOptionsRaw);

  const studentCity = userData?.city_name ?? null;
  const studentState = userData?.city_state ?? null;
  const classId = assessment.class || null;

  const classmatesRaw = classId ? await loadClassmates(classId) : null;
  const candidates = classmatesRaw ?? [];

  const groupsBySessionId: Record<string, RelatedStudentsGroups> = {};
  const allSessions = [seedSession, ...scheduleOptions].filter((s): s is NonNullable<typeof s> => s !== null);
  for (const session of allSessions) {
    groupsBySessionId[session.id] = groupRelatedStudents({
      currentStudent: {
        id: activeUserId,
        city: studentCity,
        state: studentState,
        classId: classId ?? "",
        courseCode: userData?.course_code ?? "",
      },
      testCode,
      selectedExamDateId: seedSession?.id === session.id ? null : session.id,
      selectedExamLocationId: session.location.id,
      examCity: session.location.city,
      examState: session.location.state,
      candidates,
    });
  }

  const todayIso = todayIsoDateKey();
  const schedulingWindowOpen = isSchedulingWindowOpen(assessment, todayIso);
  const deadlineDisplay = getSchedulingDeadlineDisplay(assessment);
  const vitruSnapshot = buildAssessmentSchedulingSnapshot(
    { code: subjectCode, name: discipline?.description ?? subjectCode },
    testCode,
    assessment.description,
    scheduleOptions
  );

  return (
    <AppShell activeUserId={activeUserId} vitruSnapshot={vitruSnapshot}>
      <SubpageHeader
        title="Agendamento de Prova"
        disciplineName={discipline?.description ?? subjectCode}
        disciplineCode={subjectCode}
        backHref={backHref}
      />

      <div className="flex flex-col gap-4">
        <ExamScheduleHeader
          examName={assessment.description}
          disciplineName={discipline?.description ?? subjectCode}
          courseName={userData?.course_name ?? null}
          classId={classId}
          modalityDescription={userData?.modality_description ?? null}
          deadlineDisplay={deadlineDisplay}
          situationLabel={
            <ExamScheduleSituationLabel
              subjectCode={subjectCode}
              testCode={testCode}
              hasSeedSchedule={hasSeedSchedule}
              seedSession={seedSession}
              scheduleOptions={scheduleOptions}
              initialOverride={scheduleOverride}
            />
          }
        />

        <ExamScheduleView
          subjectCode={subjectCode}
          testCode={testCode}
          examName={assessment.description}
          hasSeedSchedule={hasSeedSchedule}
          seedSession={seedSession}
          scheduleOptions={scheduleOptions}
          optionsLoadError={optionsLoadError}
          allowCancelSchedule={assessment.allow_cancel_schedule}
          studentCity={studentCity}
          studentState={studentState}
          groupsBySessionId={groupsBySessionId}
          schedulingWindowOpen={schedulingWindowOpen}
          userId={activeUserId}
          initialOverride={scheduleOverride}
        />
      </div>
    </AppShell>
  );
}
