import type { MeetingRaw, FrequencyDiaryRaw } from "@/lib/types/raw/attendances";
import { formatDateBr } from "@/lib/formatters/date-formatters";
import { formatHourMinute } from "@/lib/formatters/time-formatters";

interface MeetingsPanelProps {
  selectedIsoDate: string | null;
  meetings: MeetingRaw[];
  diaryEntry: FrequencyDiaryRaw | undefined;
}

export function MeetingsPanel({ selectedIsoDate, meetings, diaryEntry }: MeetingsPanelProps) {
  if (!selectedIsoDate) {
    return (
      <p className="rounded-lg bg-bg-card p-4 text-sm text-text-secondary">
        Selecione uma data para ver os encontros.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg bg-bg-card p-4">
      <p className="text-sm font-semibold text-white">{formatDateBr(selectedIsoDate)}</p>

      {diaryEntry && (
        <div className="rounded-md bg-bg-app p-3">
          <p className="text-xs uppercase text-text-secondary">Registro de frequência</p>
          <p className="mt-1 text-sm text-white">
            {diaryEntry.attendance === "S" ? "Presente" : "Ausente"}
          </p>
        </div>
      )}

      {meetings.length === 0 ? (
        <p className="text-sm text-text-secondary">Nenhum encontro registrado nesta data.</p>
      ) : (
        <div className="flex flex-col gap-2">
          <p className="text-xs uppercase text-text-secondary">Encontros</p>
          {meetings.map((meeting) => (
            <div key={meeting.code} className="rounded-md bg-bg-app p-3">
              <p className="text-sm text-white">{meeting.description}</p>
              <p className="mt-1 text-xs text-text-secondary">
                {formatHourMinute(meeting.begin_hour)} — {formatHourMinute(meeting.end_hour)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
