export type SubjectCode = string;

export interface CalendarEvent {
  code: string;
  acts_ndis: string;
  acts_orde: string;
  begin_date: string;
  begin_hour: string;
  class: string;
  description: string;
  end_date: string;
  end_hour: string;
  subject: string;
  subject_code: string;
  subject_name: string;
  year_month: string;
}

export interface Recording {
  date_recording: string;
  date_end_recording: string;
  duration: string;
  link_youtube: string;
  title: string;
}

export interface Assessment {
  subject: string;
  subject_type: string;
  semester: string;
  class: string;
  test_class: string;
  test_code: string;
  parameter: string;
  description: string;
  type_code: string;
  test_type_code: string;
  need_schedule: boolean;
  has_schedule: boolean;
  schedule: unknown[];
  realization_way: string;
  show_button: boolean;
  schedule_window_start: string;
  schedule_window_end: string;
  realization_window_start: string;
  realization_window_end: string;
  [key: string]: unknown;
}

export interface LearningPath {
  subject_code: string;
  title: string;
  subtitle: string;
  source: string;
  sections: LearningPathSection[];
}

export interface LearningPathSection {
  id: string;
  title: string;
  summary: string;
  lessons: Lesson[];
}

export interface Lesson {
  id: string;
  title: string;
  kind: string;
  duration_min: number;
  points: number;
  completed: boolean;
  content: string;
}

export interface TestFile {
  info: {
    description: string;
    weigth: string;
    subject_name: string;
    subject_code: string;
    test_code: string;
    specialization: string;
    created_at?: string;
    updated_at?: string;
    completed: string;
    week_day: string;
    shift: string;
    type: string;
    status_semester?: string;
  };
  questions: TestQuestion[];
}

export interface TestQuestion {
  question_code: string;
  number: string;
  description: string;
  alternatives?: Array<{ alternative_code: string; description: string; letter: string }>;
  [key: string]: unknown;
}

export interface AttendanceFile {
  frequency: number;
  frequency_diary: AttendanceRecord[];
  meetings: CalendarEvent[];
}

export interface AttendanceRecord {
  alun_codi: string;
  attendance: string;
  code: string;
  discipline: string;
  discipline_name: string;
  event_date: string;
  realeased_date: string;
  specialization: string;
  turn: string;
}
