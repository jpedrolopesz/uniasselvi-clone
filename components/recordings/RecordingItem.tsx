import type { RecordingRaw } from "@/lib/types/raw/recordings";
import { formatDateBr } from "@/lib/formatters/date-formatters";

export function RecordingItem({ recording, subjectCode }: { recording: RecordingRaw; subjectCode: string }) {
  return (
    <a
      data-vitru-id={`recording:${subjectCode}:${recording.date_recording}`}
      href={recording.link_youtube}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-between gap-4 rounded-lg bg-bg-app px-4 py-3 transition hover:bg-bg-card-hover"
    >
      <div>
        <p className="text-sm font-medium text-white">{recording.title}</p>
        <p className="text-xs text-text-secondary">{formatDateBr(recording.date_recording)}</p>
      </div>
      <span className="shrink-0 text-xs font-semibold text-brand-yellow">Assistir ▸</span>
    </a>
  );
}
