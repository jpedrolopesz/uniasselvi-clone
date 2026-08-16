import { readFile } from "node:fs/promises";
import path from "node:path";
import { findSubject } from "./subjects";
import type { Assessment, AttendanceFile, CalendarEvent, LearningPath, Recording, TestFile } from "./types";

const DATA_ROOT = path.join(process.cwd(), "src", "data", "subjects");

async function readSubjectJson<T>(subjectCode: string, ...segments: string[]): Promise<T | null> {
  if (!findSubject(subjectCode)) return null;
  try {
    const raw = await readFile(path.join(DATA_ROOT, subjectCode, ...segments), "utf8");
    return JSON.parse(raw) as T;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}

export const getCalendarEvents = (code: string) => readSubjectJson<CalendarEvent[]>(code, "calendar-events.json");
export const getRecordings = (code: string) => readSubjectJson<Recording[]>(code, "recordings.json");
export const getAssessments = (code: string) => readSubjectJson<Assessment[]>(code, "assessments.json");
export const getLearningPath = (code: string) => readSubjectJson<LearningPath>(code, "learning-path.json");
export const getTest = (code: string, testCode: string) => readSubjectJson<TestFile>(code, "tests", `${testCode}.json`);
export const getAttendances = (code: string) => readSubjectJson<AttendanceFile>(code, "attendances.json");
