"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  findOnboardingScene,
  isSceneComplete,
  ONBOARDING_SCENES,
  resolveDestination,
  sceneIndex,
  subjectCodeFromPath,
} from "@/lib/onboarding/scenes";
import type { OnboardingRole, OnboardingSessionSnapshot } from "@/lib/onboarding/types";
import { ProfessorBubble } from "@/components/onboarding/ProfessorBubble";

interface TourConfig {
  role: OnboardingRole;
  sessionId: string;
  hostKey?: string;
  demo?: boolean;
}

const STORAGE_KEY = "uniasselvi:onboarding-session";

function configFromLocation(): TourConfig | null {
  const params = new URLSearchParams(window.location.search);
  const role = params.get("tour");
  const sessionId = params.get("sessao")?.toUpperCase();
  if ((role !== "professor" && role !== "student") || !sessionId) return null;
  return {
    role,
    sessionId,
    hostKey: params.get("chave") ?? undefined,
    demo: params.get("demo") === "investidor",
  };
}

async function readSession(sessionId: string): Promise<OnboardingSessionSnapshot> {
  const response = await fetch(`/api/v1/onboarding/sessions/${encodeURIComponent(sessionId)}`, {
    cache: "no-store",
  });
  if (!response.ok) throw new Error(response.status === 404 ? "Sessão não encontrada ou expirada." : "Falha ao atualizar a sessão.");
  return response.json() as Promise<OnboardingSessionSnapshot>;
}

export function GuidedOnboardingLayer({ activeUserId, userName }: { activeUserId: string; userName: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [config, setConfig] = useState<TourConfig | null>(null);
  const [session, setSession] = useState<OnboardingSessionSnapshot | null>(null);
  const [following, setFollowing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const participantIdRef = useRef<string>("");
  const navigatedVersionRef = useRef<number>(0);

  useEffect(() => {
    const fromLocation = configFromLocation();
    const fromStorage = sessionStorage.getItem(STORAGE_KEY);
    let nextConfig = fromLocation;
    if (!nextConfig && fromStorage) {
      try {
        nextConfig = JSON.parse(fromStorage) as TourConfig;
      } catch {
        sessionStorage.removeItem(STORAGE_KEY);
      }
    }
    if (nextConfig) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(nextConfig));
    const participantKey = `uniasselvi:onboarding-participant:${activeUserId}`;
    participantIdRef.current = sessionStorage.getItem(participantKey) ?? crypto.randomUUID();
    sessionStorage.setItem(participantKey, participantIdRef.current);
    const timer = window.setTimeout(() => setConfig(nextConfig), 0);
    return () => window.clearTimeout(timer);
  }, [activeUserId]);

  const subjectFromPath = subjectCodeFromPath(pathname);
  const knownSubjectCode = subjectFromPath ?? (
    typeof window === "undefined" ? null : sessionStorage.getItem("uniasselvi:onboarding-subject")
  );

  useEffect(() => {
    if (subjectFromPath) sessionStorage.setItem("uniasselvi:onboarding-subject", subjectFromPath);
  }, [subjectFromPath]);

  const refresh = useCallback(async () => {
    if (!config) return;
    try {
      const nextSession = await readSession(config.sessionId);
      setSession(nextSession);
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Falha ao atualizar a sessão.");
    }
  }, [config]);

  useEffect(() => {
    if (!config) return;
    const initialTimer = window.setTimeout(() => void refresh(), 0);
    const timer = window.setInterval(() => void refresh(), 1_500);
    return () => {
      window.clearTimeout(initialTimer);
      window.clearInterval(timer);
    };
  }, [config, refresh]);

  const scene = useMemo(
    () => session ? findOnboardingScene(session.currentSceneId) : ONBOARDING_SCENES[0],
    [session]
  );
  const complete = isSceneComplete(scene, pathname);

  useEffect(() => {
    if (!config || config.role !== "student" || !session || session.status === "ended") return;
    const heartbeat = () => {
      void fetch(`/api/v1/onboarding/sessions/${encodeURIComponent(config.sessionId)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participantId: participantIdRef.current,
          name: userName,
          following,
          completedSceneId: complete ? scene.id : null,
        }),
      });
    };
    heartbeat();
    const timer = window.setInterval(heartbeat, 5_000);
    return () => window.clearInterval(timer);
  }, [complete, config, following, scene.id, session, userName]);

  useEffect(() => {
    if (!config || !session || session.status !== "active") return;
    if (config.role === "student" && !following) return;
    if (navigatedVersionRef.current === session.version) return;
    navigatedVersionRef.current = session.version;
    const destination = resolveDestination(scene.destination, {
      pathname,
      subjectCode: subjectCodeFromPath(pathname) ?? knownSubjectCode,
    });
    if (destination && destination !== pathname) {
      router.push(`${destination}?u=${encodeURIComponent(activeUserId)}`);
    }
  }, [activeUserId, config, following, knownSubjectCode, pathname, router, scene.destination, session]);

  useEffect(() => {
    document.querySelectorAll("[data-onboarding-highlight]").forEach((element) => {
      element.removeAttribute("data-onboarding-highlight");
    });
    if (!config || !session || session.status !== "active" || !scene.highlightId) return;

    const applyHighlight = () => {
      const target = document.querySelector<HTMLElement>(`[data-tour-id="${scene.highlightId}"]`);
      if (!target) return;
      target.setAttribute("data-onboarding-highlight", "true");
      target.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
    };
    const timer = window.setTimeout(applyHighlight, 250);
    return () => {
      window.clearTimeout(timer);
      document.querySelectorAll("[data-onboarding-highlight]").forEach((element) => {
        element.removeAttribute("data-onboarding-highlight");
      });
    };
  }, [config, pathname, scene.highlightId, session]);

  async function updateSession(update: { status?: OnboardingSessionSnapshot["status"]; currentSceneId?: string }) {
    if (!config?.hostKey) return;
    const response = await fetch(`/api/v1/onboarding/sessions/${encodeURIComponent(config.sessionId)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...update, hostKey: config.hostKey }),
    });
    if (!response.ok) {
      setError("Não foi possível enviar o comando da apresentação.");
      return;
    }
    setSession(await response.json() as OnboardingSessionSnapshot);
  }

  function leaveTour() {
    sessionStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem("uniasselvi:onboarding-subject");
    setConfig(null);
    setSession(null);
    router.push(`/boas-vindas?u=${encodeURIComponent(activeUserId)}`);
  }

  async function copyInvite() {
    if (!config) return;
    const url = new URL("/", window.location.origin);
    url.searchParams.set("tour", "student");
    url.searchParams.set("sessao", config.sessionId);
    url.searchParams.set("u", activeUserId);
    await navigator.clipboard.writeText(url.toString());
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1_800);
  }

  if (!config) return null;

  if (!session) {
    return (
      <div className="fixed left-1/2 top-20 z-80 -translate-x-1/2 rounded-full border border-border-subtle bg-black/90 px-5 py-3 text-sm text-white shadow-2xl">
        {error ?? "Conectando à apresentação…"}
      </div>
    );
  }

  const index = sceneIndex(scene.id);
  const completedParticipants = session.participants.filter((participant) => participant.completedSceneId === scene.id).length;

  return (
    <>
      <ProfessorBubble role={config.role} professorName={session.professorName} />

      {config.role === "professor" ? (
        <aside className="fixed bottom-22 left-4 z-70 w-[min(23rem,calc(100vw-2rem))] overflow-hidden rounded-3xl border border-border-subtle bg-black/95 text-white shadow-2xl backdrop-blur-xl" aria-label="Estúdio da apresentação">
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-yellow">Estúdio do professor</p>
              <p className="mt-0.5 text-xs text-text-secondary">Sessão <strong className="text-white">{session.id}</strong></p>
            </div>
            <button type="button" onClick={leaveTour} className="rounded-full px-3 py-1.5 text-xs text-text-secondary hover:bg-white/10 hover:text-white">Sair</button>
          </div>

          <div className="p-5">
            {session.status === "waiting" ? (
              <>
                <h2 className="text-lg font-bold">Convide os calouros</h2>
                <p className="mt-2 text-sm text-text-secondary">Compartilhe o código ou copie o link da sessão.</p>
                <div className="mt-4 flex items-center justify-between rounded-2xl bg-white/8 px-4 py-3">
                  <span className="text-xl font-black tracking-[0.22em] text-brand-yellow">{session.id}</span>
                  <button type="button" onClick={() => void copyInvite()} className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold hover:bg-white/20">{copied ? "Copiado!" : "Copiar link"}</button>
                </div>
                <p className="mt-3 text-xs text-text-secondary">{session.participants.length} aluno(s) conectado(s)</p>
                <button type="button" onClick={() => void updateSession({ status: "active", currentSceneId: ONBOARDING_SCENES[0].id })} className="mt-5 w-full rounded-full bg-brand-yellow px-5 py-3 text-sm font-bold text-black hover:bg-brand-yellow-dark">Iniciar apresentação</button>
              </>
            ) : session.status === "ended" ? (
              <div className="py-3 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent-green/15 text-xl text-accent-green">✓</div>
                <h2 className="mt-3 font-bold">Apresentação encerrada</h2>
                <p className="mt-1 text-sm text-text-secondary">Os alunos já podem explorar o AVA.</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between text-xs text-text-secondary">
                  <span>Etapa {index + 1} de {ONBOARDING_SCENES.length}</span>
                  <span>{session.participants.length} acompanhando · {completedParticipants} concluíram</span>
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-brand-yellow transition-all" style={{ width: `${((index + 1) / ONBOARDING_SCENES.length) * 100}%` }} /></div>
                <p className="mt-4 text-xs font-bold uppercase tracking-wider text-brand-yellow">{scene.eyebrow} · {scene.mode === "practice" ? "Prática" : scene.mode === "explore" ? "Exploração" : "Demonstração"}</p>
                <h2 className="mt-1 text-lg font-bold">{scene.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-text-secondary">{scene.professorNote}</p>
                {scene.destination.kind !== "HOME" && !knownSubjectCode && (
                  <p role="alert" className="mt-3 rounded-xl bg-accent-orange/15 px-3 py-2 text-xs text-orange-200">Abra uma disciplina antes de avançar para esta etapa.</p>
                )}
                <div className="mt-5 grid grid-cols-2 gap-2">
                  <button type="button" disabled={index === 0} onClick={() => void updateSession({ currentSceneId: ONBOARDING_SCENES[index - 1].id })} className="rounded-full border border-white/15 px-4 py-2.5 text-sm font-bold disabled:opacity-30">← Anterior</button>
                  {index < ONBOARDING_SCENES.length - 1 ? (
                    <button type="button" onClick={() => void updateSession({ currentSceneId: ONBOARDING_SCENES[index + 1].id })} className="rounded-full bg-brand-yellow px-4 py-2.5 text-sm font-bold text-black">Próxima →</button>
                  ) : (
                    <button type="button" onClick={() => void updateSession({ status: "ended" })} className="rounded-full bg-accent-green px-4 py-2.5 text-sm font-bold text-black">Concluir</button>
                  )}
                </div>
              </>
            )}
          </div>
          {error && <p role="alert" className="border-t border-accent-red/30 bg-accent-red/10 px-5 py-2 text-xs text-red-200">{error}</p>}
        </aside>
      ) : (
        <aside className="fixed left-1/2 top-18 z-70 w-[min(42rem,calc(100vw-2rem))] -translate-x-1/2 overflow-hidden rounded-[1.4rem] border border-white/12 bg-[#101010]/94 text-white shadow-[0_24px_80px_rgba(0,0,0,.65)] backdrop-blur-2xl" aria-live="polite">
          {session.status === "waiting" ? (
            <div className="flex items-center gap-4 px-5 py-4">
              <span className="h-3 w-3 animate-pulse rounded-full bg-brand-yellow" />
              <div className="min-w-0 flex-1"><p className="font-bold">Você entrou na apresentação</p><p className="text-xs text-text-secondary">Aguardando {session.professorName} começar…</p></div>
              <button type="button" onClick={leaveTour} className="text-xs text-text-secondary hover:text-white">Sair</button>
            </div>
          ) : session.status === "ended" ? (
            <div className="flex items-center gap-4 px-5 py-4">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-green/15 text-accent-green">✓</span>
              <div className="min-w-0 flex-1"><p className="font-bold">Boas-vindas concluídas!</p><p className="text-xs text-text-secondary">Agora você pode explorar o AVA.</p></div>
              <button type="button" onClick={leaveTour} className="rounded-full bg-brand-yellow px-4 py-2 text-xs font-bold text-black">Finalizar</button>
            </div>
          ) : (
            <div>
              <div className="h-1 w-full bg-white/6"><div className="h-full bg-brand-yellow transition-all duration-500" style={{ width: `${((index + 1) / ONBOARDING_SCENES.length) * 100}%` }} /></div>
              <div className="p-4 sm:p-5">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-brand-yellow/25 bg-brand-yellow/10 text-sm font-black text-brand-yellow">{String(index + 1).padStart(2, "0")}</div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-yellow">{scene.eyebrow}</p>{scene.mode === "practice" && <span className="rounded-full border border-accent-cyan/20 bg-accent-cyan/10 px-2 py-0.5 text-[9px] font-bold text-accent-cyan">AGORA É COM VOCÊ</span>}{config.demo && <span className="rounded-full bg-white/8 px-2 py-0.5 text-[9px] font-bold text-zinc-400">MODO DEMO</span>}</div>
                  <h2 className="mt-0.5 font-bold sm:text-lg">{scene.title}</h2>
                  <p className="mt-1 text-xs leading-relaxed text-text-secondary sm:text-sm">{scene.instruction}</p>
                </div>
                <button type="button" onClick={leaveTour} aria-label="Sair da apresentação" className="h-8 w-8 shrink-0 rounded-full text-text-secondary hover:bg-white/10 hover:text-white">×</button>
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/8 pt-3">
                <div className="flex items-center gap-2 text-xs"><span className={`h-2 w-2 rounded-full ${complete ? "bg-accent-green shadow-[0_0_8px_#2fb872]" : "bg-brand-yellow shadow-[0_0_8px_#ffcc00]"}`} /><span className={complete ? "text-accent-green" : "text-text-secondary"}>{complete ? "Etapa concluída" : scene.mode === "practice" ? "Aguardando sua ação" : "Apresentação sincronizada"}</span></div>
                <div className="flex items-center gap-2">
                  {config.demo && config.hostKey && (
                    index < ONBOARDING_SCENES.length - 1 ? (
                      <button type="button" onClick={() => void updateSession({ currentSceneId: ONBOARDING_SCENES[index + 1].id })} className="rounded-full border border-white/12 bg-white/6 px-3 py-2 text-[10px] font-bold text-white transition hover:bg-white/12">Avançar demo →</button>
                    ) : (
                      <button type="button" onClick={() => void updateSession({ status: "ended" })} className="rounded-full bg-brand-yellow px-3 py-2 text-[10px] font-black text-black">Concluir demo</button>
                    )
                  )}
                  {following ? (
                    <button type="button" onClick={() => setFollowing(false)} className="group inline-flex items-center gap-2 rounded-full border border-accent-green/25 bg-accent-green/8 py-1.5 pl-2.5 pr-2 text-[10px] font-bold text-accent-green transition hover:bg-accent-green/14">
                      <span>Seguindo o professor</span><span className="relative h-5 w-9 rounded-full bg-accent-green"><span className="absolute right-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow" /></span>
                    </button>
                  ) : (
                    <button type="button" onClick={() => { setFollowing(true); navigatedVersionRef.current = 0; }} className="group inline-flex items-center gap-2 rounded-full border border-brand-yellow/30 bg-brand-yellow/10 py-1.5 pl-3 pr-2 text-[10px] font-bold text-brand-yellow transition hover:bg-brand-yellow/18">
                      <span>Voltar ao professor</span><span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-yellow text-[9px] text-black">↗</span>
                    </button>
                  )}
                </div>
              </div>
              </div>
            </div>
          )}
          {error && <p role="alert" className="border-t border-accent-red/30 bg-accent-red/10 px-5 py-2 text-xs text-red-200">{error}</p>}
        </aside>
      )}
    </>
  );
}
