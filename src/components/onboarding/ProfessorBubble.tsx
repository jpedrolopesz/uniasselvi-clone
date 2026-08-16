"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import type { OnboardingRole } from "@/lib/onboarding/types";

export function ProfessorBubble({ role, professorName }: { role: OnboardingRole; professorName: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [minimized, setMinimized] = useState(false);
  const [position, setPosition] = useState<"left" | "right">("right");
  const [cameraError, setCameraError] = useState<string | null>(null);

  useEffect(() => {
    if (videoRef.current) videoRef.current.srcObject = stream;
    return () => stream?.getTracks().forEach((track) => track.stop());
  }, [stream]);

  async function enableCamera() {
    try {
      const nextStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setStream(nextStream);
      setCameraError(null);
    } catch {
      setCameraError("Câmera indisponível");
    }
  }

  const initials = professorName
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "PR";

  if (minimized) {
    return (
      <button
        type="button"
        onClick={() => setMinimized(false)}
        className={`fixed bottom-24 z-70 flex items-center gap-2 rounded-full border border-brand-yellow/30 bg-[#141414]/95 px-3 py-2 text-xs font-bold text-white shadow-2xl backdrop-blur-xl transition hover:-translate-y-0.5 ${position === "right" ? "right-4" : "left-4"}`}
        aria-label="Restaurar vídeo do professor"
      >
        <span className="h-2 w-2 rounded-full bg-accent-green shadow-[0_0_9px_#2fb872]" /> Prof. Rafael
      </button>
    );
  }

  return (
    <aside className={`fixed bottom-24 z-70 w-40 sm:w-52 ${position === "right" ? "right-4" : "left-4"}`} aria-label="Professor da apresentação">
      <div className="overflow-hidden rounded-[2rem] border border-brand-yellow/60 bg-[#111] shadow-[0_24px_70px_rgba(0,0,0,.75),0_0_0_5px_rgba(255,204,0,.08)]">
        <div className="relative aspect-square bg-gradient-to-br from-zinc-700 to-black">
          {role === "professor" && stream ? (
            <video ref={videoRef} autoPlay muted playsInline className="h-full w-full object-cover [transform:scaleX(-1)]" />
          ) : (
            <div className="relative h-full w-full">
              <Image src="/assets/onboarding/professor-rafael.png" alt={professorName} fill sizes="208px" className="object-cover" priority />
              <span className="sr-only">{initials}</span>
            </div>
          )}
          <div className="absolute left-2.5 top-2.5 flex items-center gap-1.5 rounded-full border border-white/10 bg-black/70 px-2 py-1 text-[9px] font-bold text-white backdrop-blur-md">
            <span className="h-1.5 w-1.5 rounded-full bg-accent-green shadow-[0_0_8px_#2fb872]" /> AO VIVO
          </div>
        </div>
        <div className="flex items-center justify-between gap-2 border-t border-white/8 px-3 py-2.5">
          <div className="min-w-0">
            <p className="truncate text-xs font-bold text-white">{professorName}</p>
            {!cameraError && <p className="text-[9px] text-text-secondary">Apresentando o novo AVA</p>}
            {cameraError && <p className="truncate text-[10px] text-accent-red">{cameraError}</p>}
          </div>
          <div className="flex shrink-0 gap-1">
            {role === "professor" && !stream && (
              <button type="button" onClick={() => void enableCamera()} className="rounded-full bg-brand-yellow px-2 py-1 text-[10px] font-bold text-black" aria-label="Ativar câmera e microfone">
                Câmera
              </button>
            )}
            <button type="button" onClick={() => setPosition((value) => value === "right" ? "left" : "right")} className="h-7 w-7 rounded-full bg-white/10 text-xs text-white" aria-label="Mover vídeo para o outro lado">↔</button>
            <button type="button" onClick={() => setMinimized(true)} className="h-7 w-7 rounded-full bg-white/10 text-sm text-white" aria-label="Minimizar vídeo">−</button>
          </div>
        </div>
      </div>
    </aside>
  );
}
