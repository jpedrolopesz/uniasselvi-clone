/**
 * Espelha https://api-ava.uniasselvi.com.br/calendar/event/get
 */
export interface CalendarEventRaw {
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
