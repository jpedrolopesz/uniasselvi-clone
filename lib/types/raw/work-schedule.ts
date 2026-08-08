export interface WorkScheduleRaw {
  label: string;
  startTime: string;
  endTime: string;
  /** 0 = domingo, 1 = segunda, ..., 6 = sábado. */
  weekdays: number[];
  restAfterShift?: {
    label: string;
    startTime: string;
    endTime: string;
  };
}
