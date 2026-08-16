import { displaySemesterLabel } from "@/lib/selectors/user-selectors";

export function SemesterHeader({ semesterValue }: { semesterValue: string | null }) {
  return (
    <h1 className="text-2xl font-bold tracking-tight text-white">
      {semesterValue ? displaySemesterLabel(semesterValue) : "DISCIPLINAS"}
    </h1>
  );
}
