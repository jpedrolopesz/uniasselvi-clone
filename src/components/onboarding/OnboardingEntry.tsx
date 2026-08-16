"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";

type DemoRole = "professor" | "student";

export function OnboardingEntry({ activeUserId }: { activeUserId: string; userName: string }) {
  const router = useRouter();
  const [sessionCode, setSessionCode] = useState("");
  const [loadingRole, setLoadingRole] = useState<DemoRole | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function createSession(role: DemoRole) {
    setLoadingRole(role);
    setError(null);
    try {
      const response = await fetch("/api/v1/onboarding/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ professorName: "Prof. Rafael Mendes" }),
      });
      if (!response.ok) throw new Error("Não foi possível iniciar a experiência.");
      const data = (await response.json()) as { session: { id: string }; hostKey: string };

      if (role === "student") {
        await fetch(`/api/v1/onboarding/sessions/${data.session.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ hostKey: data.hostKey, status: "active", currentSceneId: "welcome" }),
        });
      }

      const params = new URLSearchParams({
        tour: role,
        sessao: data.session.id,
        chave: data.hostKey,
        demo: "investidor",
        u: activeUserId,
      });
      router.push(`${role === "student" ? "/" : "/boas-vindas"}?${params}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível iniciar a experiência.");
      setLoadingRole(null);
    }
  }

  function joinSession() {
    const normalized = sessionCode.trim().toUpperCase();
    if (!/^[A-F0-9]{8}$/.test(normalized)) {
      setError("Digite o código de 8 caracteres informado pelo professor.");
      return;
    }
    const params = new URLSearchParams({ tour: "student", sessao: normalized, u: activeUserId });
    router.push(`/?${params}`);
  }

  return (
    <div className="relative mx-auto w-full max-w-7xl pb-10">
      <div className="pointer-events-none absolute -left-30 -top-28 h-96 w-96 rounded-full bg-brand-yellow/12 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 top-40 h-80 w-80 rounded-full bg-accent-purple/10 blur-3xl" />

      <section className="relative grid min-h-[34rem] overflow-hidden rounded-[2.25rem] border border-white/10 bg-[#11110f] shadow-2xl shadow-black/40 lg:grid-cols-[.92fr_1.08fr]">
        <div className="relative z-10 flex flex-col justify-center p-7 sm:p-10 lg:p-14">
          <div className="mb-7 flex w-fit items-center gap-2 rounded-full border border-brand-yellow/25 bg-brand-yellow/8 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-brand-yellow">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-yellow shadow-[0_0_12px_#ffcc00]" />
            Experiência de boas-vindas
          </div>
          <h1 className="max-w-xl text-4xl font-black leading-[1.02] tracking-[-0.04em] text-white sm:text-5xl lg:text-6xl">
            O primeiro dia de aula começa <span className="text-brand-yellow">aqui.</span>
          </h1>
          <p className="mt-6 max-w-lg text-base leading-7 text-zinc-400 sm:text-lg">
            Um professor dentro do AVA, conduzindo cada calouro em uma jornada interativa, humana e personalizada.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button type="button" onClick={() => void createSession("student")} disabled={loadingRole !== null} className="group inline-flex items-center justify-center gap-3 rounded-full bg-brand-yellow px-6 py-3.5 text-sm font-black text-black shadow-[0_12px_36px_rgba(255,204,0,.18)] transition hover:-translate-y-0.5 hover:bg-[#ffda3d] disabled:opacity-60">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-black text-[10px] text-brand-yellow">▶</span>
              {loadingRole === "student" ? "Preparando experiência…" : "Ver experiência do aluno"}
            </button>
            <button type="button" onClick={() => void createSession("professor")} disabled={loadingRole !== null} className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 px-6 py-3.5 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-white/10 disabled:opacity-60">
              Abrir estúdio do professor <span aria-hidden>↗</span>
            </button>
          </div>

          <div className="mt-10 flex flex-wrap gap-x-7 gap-y-3 border-t border-white/8 pt-6 text-xs text-zinc-500">
            <span className="inline-flex items-center gap-2"><strong className="text-base text-white">6</strong> cenas interativas</span>
            <span className="inline-flex items-center gap-2"><strong className="text-base text-white">100%</strong> dentro do AVA</span>
            <span className="inline-flex items-center gap-2"><strong className="text-base text-white">1:1</strong> sensação de presença</span>
          </div>
        </div>

        <div className="relative flex min-h-[31rem] items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_55%_42%,rgba(255,204,0,.15),transparent_34%),linear-gradient(145deg,#191913,#090909)] p-5 sm:p-9 lg:min-h-full">
          <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.05)_1px,transparent_1px)] [background-size:36px_36px]" />
          <div className="relative w-full max-w-xl rotate-[-1.5deg] overflow-hidden rounded-2xl border border-white/15 bg-[#161616] shadow-[0_35px_90px_rgba(0,0,0,.65)]">
            <div className="flex h-10 items-center gap-2 border-b border-white/8 bg-[#202020] px-4">
              <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" /><span className="h-2.5 w-2.5 rounded-full bg-yellow-400/80" /><span className="h-2.5 w-2.5 rounded-full bg-green-400/80" />
              <div className="mx-auto h-5 w-44 rounded-md bg-white/5" />
            </div>
            <div className="p-5 sm:p-7">
              <div className="mb-6 flex items-center justify-between"><div><div className="h-2 w-20 rounded bg-brand-yellow/60" /><div className="mt-2 h-5 w-44 rounded bg-white/80" /></div><div className="h-8 w-8 rounded-full bg-brand-yellow" /></div>
              <div className="grid grid-cols-2 gap-3">
                {["Trilha de aprendizagem", "Notas e avaliações", "Calendário de estudos", "Fale com o mediador"].map((label, index) => (
                  <div key={label} className={`rounded-xl border p-4 ${index === 0 ? "border-brand-yellow bg-brand-yellow/10 shadow-[0_0_28px_rgba(255,204,0,.14)]" : "border-white/8 bg-white/4"}`}>
                    <div className={`mb-8 h-7 w-7 rounded-lg ${index === 0 ? "bg-brand-yellow" : "bg-white/10"}`} />
                    <p className={`text-[10px] font-bold ${index === 0 ? "text-brand-yellow" : "text-zinc-400"}`}>{label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="absolute -bottom-5 -right-2 h-35 w-35 overflow-hidden rounded-full border-4 border-brand-yellow bg-black shadow-[0_18px_45px_rgba(0,0,0,.75)] sm:h-43 sm:w-43">
              <Image src="/assets/onboarding/professor-rafael.png" alt="Professor Rafael apresentando o AVA" fill sizes="172px" className="object-cover" priority />
              <span className="absolute bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-black/75 px-2 py-1 text-[8px] font-bold text-white backdrop-blur">Prof. Rafael · ao vivo</span>
            </div>
          </div>

          <div className="absolute bottom-7 left-5 max-w-55 rounded-2xl border border-white/10 bg-black/80 p-3 text-white shadow-xl backdrop-blur-xl sm:left-9">
            <div className="flex items-center gap-2 text-[10px] font-bold text-accent-green"><span className="h-2 w-2 rounded-full bg-accent-green" /> SEGUINDO O PROFESSOR</div>
            <p className="mt-1.5 text-[11px] text-zinc-400">A trilha foi destacada na tela do aluno.</p>
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-3">
        {[
          ["01", "Presença humana", "O professor permanece visível enquanto o aluno conhece a plataforma."],
          ["02", "Aprender fazendo", "Cada demonstração vira uma pequena ação realizada pelo próprio calouro."],
          ["03", "Visão da turma", "O professor acompanha quem avançou e identifica quem precisa de ajuda."],
        ].map(([number, title, description]) => (
          <article key={number} className="group rounded-2xl border border-white/8 bg-bg-card p-6 transition hover:-translate-y-1 hover:border-brand-yellow/25 hover:bg-[#222]">
            <span className="text-xs font-black text-brand-yellow">{number}</span>
            <h2 className="mt-5 text-lg font-bold text-white">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-text-secondary">{description}</p>
          </article>
        ))}
      </section>

      <section className="mt-6 flex flex-col items-center justify-between gap-4 rounded-2xl border border-white/8 bg-white/[.025] px-6 py-5 sm:flex-row">
        <div><p className="text-sm font-bold text-white">Já está em uma apresentação ao vivo?</p><p className="mt-1 text-xs text-text-secondary">Entre com o código exibido pelo professor.</p></div>
        <div className="flex w-full max-w-sm gap-2">
          <input value={sessionCode} onChange={(event) => setSessionCode(event.target.value.toUpperCase())} onKeyDown={(event) => event.key === "Enter" && joinSession()} maxLength={8} aria-label="Código da sessão" placeholder="CÓDIGO DA SESSÃO" className="min-w-0 flex-1 rounded-full border border-white/10 bg-black/40 px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-white outline-none placeholder:tracking-normal placeholder:text-zinc-600 focus:border-brand-yellow/60" />
          <button type="button" onClick={joinSession} className="rounded-full border border-white/15 px-5 py-2.5 text-xs font-bold text-white hover:bg-white/10">Entrar</button>
        </div>
      </section>

      {error && <p role="alert" className="mt-4 rounded-xl border border-accent-red/30 bg-accent-red/10 px-4 py-3 text-sm text-red-200">{error}</p>}
    </div>
  );
}
