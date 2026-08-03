/**
 * Espelha https://api-ava.uniasselvi.com.br/attendance/calendar/getAttendances
 */
export interface FrequencyDiaryRaw {
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

export interface MeetingRaw {
  acts_ndis: string;
  acts_orde: string;
  begin_date: string;
  begin_hour: string;
  class: string;
  code: string;
  description: string;
  end_date: string;
  end_hour: string;
  subject: string;
  subject_code: string;
  subject_name: string;
  year_month: string;
}

export interface AttendancesRaw {
  frequency: number;
  frequency_diary: FrequencyDiaryRaw[];
  meetings: MeetingRaw[];
}
