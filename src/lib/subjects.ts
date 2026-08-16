import type { SubjectRow } from "@/lib/db/academic";

export interface SubjectSchedule { day: string; time: string }
export type SubjectStatus = "em_andamento" | "em_breve";

export interface SubjectDisplay {
  imageSlug: string | null;
  status: SubjectStatus;
  schedule: SubjectSchedule | null;
}

function isSchedule(value: unknown): value is SubjectSchedule {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return typeof v.day === "string" && typeof v.time === "string";
}

export function getSubjectDisplay(subject: SubjectRow): SubjectDisplay {
  const metadata = subject.metadata ?? {};
  return {
    imageSlug: typeof metadata.image_slug === "string" ? metadata.image_slug : null,
    status: metadata.status === "em_andamento" ? "em_andamento" : "em_breve",
    schedule: isSchedule(metadata.schedule) ? metadata.schedule : null,
  };
}

export const SUBJECT_STATUS_LABEL: Record<SubjectStatus, string> = {
  em_andamento: "Em andamento",
  em_breve: "Em breve",
};
