import type { CSSProperties } from "react";
import { timeToMinutes } from "@/lib/study-planner/date-utils";

export const GRID_START_HOUR = 6;
export const GRID_END_HOUR = 24;
export const ROW_HEIGHT_PX = 56;

export function buildHourRows(): number[] {
  return Array.from({ length: GRID_END_HOUR - GRID_START_HOUR }, (_, i) => GRID_START_HOUR + i);
}

export function computeBlockStyle(startTime: string, endTime: string): CSSProperties {
  const gridStartMinutes = GRID_START_HOUR * 60;
  const startMinutes = Math.max(timeToMinutes(startTime), gridStartMinutes);
  const endMinutes = Math.max(timeToMinutes(endTime), startMinutes + 20);
  const top = ((startMinutes - gridStartMinutes) / 60) * ROW_HEIGHT_PX;
  const height = ((endMinutes - startMinutes) / 60) * ROW_HEIGHT_PX;
  return { top: `${top}px`, height: `${Math.max(height, 24)}px` };
}
