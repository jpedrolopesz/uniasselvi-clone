import type { ReactNode } from "react";
import type { ExamCityComparison, ExamSession } from "@/lib/types/derived";

interface ExamScheduleSummaryProps {
  examName: string;
  session: ExamSession;
  comparison: ExamCityComparison;
  children?: ReactNode;
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <dt className="text-text-secondary">{label}</dt>
      <dd className="text-right text-white">{value}</dd>
    </div>
  );
}

export function ExamScheduleSummary({ examName, session, comparison, children }: ExamScheduleSummaryProps) {
  const addressLine = [session.location.address, session.location.number]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="flex flex-col gap-4 rounded-xl bg-bg-card p-4">
      <h3 className="text-sm font-semibold text-white">Resumo do agendamento</h3>
      <dl className="flex flex-col gap-2">
        <SummaryRow label="Prova" value={examName} />
        <SummaryRow label="Data" value={session.displayDate} />
        <SummaryRow
          label="Horário"
          value={session.startTime ? `${session.startTime}${session.endTime ? ` às ${session.endTime}` : ""}` : "-"}
        />
        <SummaryRow label="Local" value={session.location.name} />
        <SummaryRow label="Endereço" value={addressLine || "-"} />
        <SummaryRow
          label="Cidade da prova"
          value={comparison.examCity ? `${comparison.examCity}/${comparison.examState}` : "-"}
        />
        <SummaryRow
          label="Cidade do aluno"
          value={comparison.studentCity ? `${comparison.studentCity}/${comparison.studentState}` : "-"}
        />
      </dl>

      {!comparison.isSameCity && comparison.studentCity && comparison.examCity && (
        <p className="rounded-lg bg-accent-orange/10 p-3 text-xs text-white">
          Atenção: você precisará se deslocar até {comparison.examCity}/{comparison.examState}.
        </p>
      )}

      {children}
    </div>
  );
}
