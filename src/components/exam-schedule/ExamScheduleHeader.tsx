import type { ReactNode } from "react";

interface ExamScheduleHeaderProps {
  examName: string;
  disciplineName: string;
  courseName: string | null;
  classId: string | null;
  modalityDescription: string | null;
  deadlineDisplay: string | null;
  situationLabel: ReactNode;
}

function InfoField({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-text-secondary">{label}</dt>
      <dd className="text-sm text-white">{value ?? "Não informado"}</dd>
    </div>
  );
}

export function ExamScheduleHeader({
  examName,
  disciplineName,
  courseName,
  classId,
  modalityDescription,
  deadlineDisplay,
  situationLabel,
}: ExamScheduleHeaderProps) {
  return (
    <div className="rounded-xl bg-bg-card p-4">
      <h2 className="text-base font-semibold text-white">{examName}</h2>
      <p className="mt-1 text-sm text-text-secondary">{disciplineName}</p>

      <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <InfoField label="Curso" value={courseName} />
        <InfoField label="Turma" value={classId} />
        <InfoField label="Modalidade" value={modalityDescription} />
        <InfoField label="Prazo para agendamento" value={deadlineDisplay} />
        <InfoField label="Situação atual" value={situationLabel} />
      </dl>

      <p className="mt-4 text-xs text-text-secondary">
        Revise a data e o local antes de confirmar — o agendamento só é efetivado depois da
        confirmação explícita nesta página.
      </p>
    </div>
  );
}
