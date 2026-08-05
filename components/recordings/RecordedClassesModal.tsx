"use client";

import { useState } from "react";
import type { RecordingRaw } from "@/lib/types/raw/recordings";
import { RecordingItem } from "@/components/recordings/RecordingItem";

export function RecordedClassesModal({ recordings }: { recordings: RecordingRaw[] | null }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
            className="rounded-full border border-border-subtle bg-bg-card px-5 py-2.5 text-sm font-medium text-white transition hover:bg-bg-card-hover"
      >
        Aulas gravadas
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="recordings-modal-title"
        >
          <div className="flex max-h-[80vh] w-full max-w-lg flex-col gap-4 rounded-xl bg-bg-card p-6">
            <div className="flex items-center justify-between">
              <h2 id="recordings-modal-title" className="text-lg font-bold uppercase text-white">
                Aulas gravadas
              </h2>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Fechar"
                className="text-text-secondary hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-2 overflow-y-auto">
              {recordings === null && (
                <p className="text-sm text-text-secondary">
                  Nenhum dado de aulas gravadas disponível para esta disciplina.
                </p>
              )}
              {recordings !== null && recordings.length === 0 && (
                <p className="text-sm text-text-secondary">Nenhuma aula gravada encontrada.</p>
              )}
              {recordings?.map((recording) => (
                <RecordingItem key={recording.title + recording.date_recording} recording={recording} />
              ))}
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="mt-2 self-end rounded-full bg-bg-app px-4 py-2 text-sm font-medium text-white hover:bg-bg-card-hover"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </>
  );
}
