"use client";

import Image from "next/image";
import Link from "next/link";
import { PointerEvent as ReactPointerEvent, useRef, useState } from "react";
import {
  ArrowRight,
  Check,
  ChevronUp,
  ExternalLink,
  GraduationCap,
  Maximize2,
  Minimize2,
  MousePointer2,
  Move,
} from "lucide-react";

interface Props {
  activeUserId: string;
}

type Position = { x: number; y: number };

const PRESENTATION_PAGES = [
  { id: "community", title: "Comunidade do Calouro", route: "/comunidade", instruction: "Apresente os canais, salas de estudo, conexões e o programa de padrinhos da comunidade." },
  { id: "home", title: "Início do AVA", route: "/", instruction: "Explique os atalhos principais, os avisos e como o aluno encontra sua jornada acadêmica." },
  { id: "calendar", title: "Calendário de Estudos", route: "/calendario-de-estudos", instruction: "Mostre como visualizar compromissos, prazos e organizar a rotina de estudos." },
  { id: "campus", title: "Campus Vitru", route: "/campus-vitru", instruction: "Apresente os ambientes do campus digital e as formas de acessar os serviços acadêmicos." },
  { id: "welcome", title: "Boas-vindas", route: "/boas-vindas", instruction: "Finalize reforçando os primeiros passos e os canais de apoio disponíveis ao calouro." },
] as const;

export function CommunityIntroduction({ activeUserId }: Props) {
  const [sceneIndex, setSceneIndex] = useState(0);
  const [completedPageIds, setCompletedPageIds] = useState<string[]>([]);
  const [following, setFollowing] = useState(true);
  const [bubbleSide, setBubbleSide] = useState<"left" | "right">("right");
  const [bubblePosition, setBubblePosition] = useState<Position | null>(null);
  const [dragging, setDragging] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const bubbleRef = useRef<HTMLElement>(null);
  const dragOffsetRef = useRef<Position>({ x: 0, y: 0 });
  const scene = PRESENTATION_PAGES[sceneIndex];
  const progress = Math.round((completedPageIds.length / PRESENTATION_PAGES.length) * 100);
  const embeddedPageUrl = `${scene.route}${scene.route.includes("?") ? "&" : "?"}u=${encodeURIComponent(activeUserId)}&presentation=1`;

  function advance() {
    setSceneIndex((current) => Math.min(PRESENTATION_PAGES.length - 1, current + 1));
  }

  function togglePageCompleted(pageId: string) {
    setCompletedPageIds((current) => current.includes(pageId) ? current.filter((id) => id !== pageId) : [...current, pageId]);
  }

  function beginProfessorDrag(event: ReactPointerEvent<HTMLElement>) {
    if ((event.target as HTMLElement).closest("button")) return;
    const stage = stageRef.current;
    const bubble = bubbleRef.current;
    if (!stage || !bubble) return;
    const stageRect = stage.getBoundingClientRect();
    const bubbleRect = bubble.getBoundingClientRect();
    dragOffsetRef.current = { x: event.clientX - bubbleRect.left, y: event.clientY - bubbleRect.top };
    setBubblePosition({ x: bubbleRect.left - stageRect.left, y: bubbleRect.top - stageRect.top });
    setDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function moveProfessor(event: ReactPointerEvent<HTMLElement>) {
    if (!dragging) return;
    const stage = stageRef.current;
    const bubble = bubbleRef.current;
    if (!stage || !bubble) return;
    const stageRect = stage.getBoundingClientRect();
    const maxX = Math.max(8, stageRect.width - bubble.offsetWidth - 8);
    const maxY = Math.max(8, stageRect.height - bubble.offsetHeight - 8);
    setBubblePosition({
      x: Math.min(maxX, Math.max(8, event.clientX - stageRect.left - dragOffsetRef.current.x)),
      y: Math.min(maxY, Math.max(8, event.clientY - stageRect.top - dragOffsetRef.current.y)),
    });
  }

  function endProfessorDrag(event: ReactPointerEvent<HTMLElement>) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    setDragging(false);
  }

  function moveProfessorToOtherSide() {
    setBubblePosition(null);
    setBubbleSide((side) => side === "right" ? "left" : "right");
  }

  return (
    <main className="h-full min-h-0 overflow-y-auto bg-bg-app text-text-primary">
      <header className="sticky top-0 z-30 flex min-h-16 items-center justify-between gap-4 border-b border-border-subtle bg-bg-sidebar/95 px-4 py-3 backdrop-blur sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Link href={`/boas-vindas?u=${encodeURIComponent(activeUserId)}`} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-yellow text-black"><GraduationCap className="h-5 w-5" /></Link>
          <span className="min-w-0"><small className="block text-[9px] font-black tracking-[.14em] text-brand-yellow uppercase">Jornada do calouro</small><strong className="block truncate text-sm sm:text-base">Professor apresentando a página real</strong></span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="hidden items-center gap-2 rounded-full border border-accent-red/25 bg-accent-red/5 px-3 py-2 text-[9px] font-black tracking-[.08em] text-accent-red sm:flex"><i className="h-2 w-2 animate-pulse rounded-full bg-accent-red" /> DEMONSTRAÇÃO AO VIVO</span>
          <Link href={`${scene.route}${scene.route.includes("?") ? "&" : "?"}u=${encodeURIComponent(activeUserId)}`} className="flex items-center gap-2 rounded-full border border-border-subtle bg-bg-card px-3 py-2 text-[9px] text-text-secondary hover:border-brand-yellow/30 hover:text-brand-yellow">Abrir {scene.route} <ExternalLink className="h-3 w-3" /></Link>
        </div>
      </header>

      <div className="mx-auto w-full max-w-[1760px] p-3 sm:p-5">
        <section className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_20rem]">
          <div ref={stageRef} className="relative h-[760px] min-w-0 overflow-hidden rounded-3xl border border-border-subtle bg-bg-app shadow-2xl">
            <iframe key={scene.id} src={embeddedPageUrl} title={`Página real: ${scene.title}`} className="h-full w-full border-0 bg-bg-app" />



            <aside className={`absolute bottom-5 z-10 w-[min(23rem,calc(100%_-_2rem))] rounded-2xl border border-border-subtle bg-bg-sidebar/95 p-4 shadow-2xl backdrop-blur-xl ${bubbleSide === "left" ? "right-4" : "left-4"}`}>
              <header className="flex items-center justify-between text-[9px] text-text-secondary"><span>Página {sceneIndex + 1} de {PRESENTATION_PAGES.length}</span><ChevronUp className="h-4 w-4" /></header>
              <h2 className="mt-3 text-base font-bold">{scene.title}</h2>
              <p className="mt-1 text-[10px] leading-relaxed text-text-secondary">{scene.instruction}</p>
              <div className="mt-4 flex items-center gap-3"><div className="h-1.5 flex-1 overflow-hidden rounded-full bg-border-subtle"><i className="block h-full rounded-full bg-accent-green transition-all" style={{ width: `${progress}%` }} /></div><span className="text-[9px] text-text-secondary">{progress}%</span></div>
              <footer className="mt-4 grid grid-cols-2 gap-2"><button type="button" onClick={() => setFollowing(false)} className="rounded-xl border border-brand-yellow/20 px-3 py-2 text-[9px] font-bold text-brand-yellow">Explorar sozinho</button>{sceneIndex < PRESENTATION_PAGES.length - 1 ? <button type="button" onClick={advance} className="flex items-center justify-center gap-1 rounded-xl bg-brand-yellow px-3 py-2 text-[9px] font-bold text-black">Próxima página <ArrowRight className="h-3.5 w-3.5" /></button> : <Link href={`${scene.route}?u=${encodeURIComponent(activeUserId)}`} className="flex items-center justify-center gap-1 rounded-xl bg-brand-yellow px-3 py-2 text-[9px] font-bold text-black">Abrir página <ArrowRight className="h-3.5 w-3.5" /></Link>}</footer>
            </aside>

            {!following && <button type="button" onClick={() => setFollowing(true)} className="absolute top-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full border border-brand-yellow/30 bg-bg-sidebar/95 px-4 py-2 text-[10px] font-bold text-brand-yellow shadow-xl"><MousePointer2 className="h-3.5 w-3.5" /> Voltar a seguir o professor</button>}

            <aside
              ref={bubbleRef}
              style={bubblePosition ? { left: bubblePosition.x, top: bubblePosition.y } : undefined}
              onPointerDown={beginProfessorDrag}
              onPointerMove={moveProfessor}
              onPointerUp={endProfessorDrag}
              onPointerCancel={endProfessorDrag}
              className={`absolute z-20 touch-none select-none overflow-hidden rounded-full border-2 border-brand-yellow bg-black shadow-[0_0_12px_rgba(255,204,0,.8),0_0_45px_rgba(255,204,0,.15),0_25px_65px_rgba(0,0,0,.55)] transition-[width,height] ${bubblePosition ? "" : bubbleSide === "right" ? "top-5 right-5" : "top-5 left-5"} ${minimized ? "h-20 w-20" : "h-40 w-40 sm:h-56 sm:w-56"} ${dragging ? "cursor-grabbing" : "cursor-grab"}`}
              aria-label="Professor Rafael. Clique e arraste para mover durante a apresentação."
            >
              <Image src="/assets/onboarding/professor-rafael.png" alt="Professor Rafael apresentando a comunidade" fill sizes="(max-width: 640px) 160px, 224px" className="pointer-events-none object-cover" priority />
              <div className="absolute top-3 right-3 z-10 flex gap-1.5"><button type="button" onPointerDown={(event) => event.stopPropagation()} onClick={() => setMinimized((value) => !value)} aria-label={minimized ? "Restaurar professor" : "Minimizar professor"} className="grid h-8 w-8 place-items-center rounded-full border border-white/10 bg-black/65 text-white backdrop-blur">{minimized ? <Maximize2 className="h-3.5 w-3.5" /> : <Minimize2 className="h-3.5 w-3.5" />}</button><button type="button" onPointerDown={(event) => event.stopPropagation()} onClick={moveProfessorToOtherSide} aria-label="Mover professor para o outro lado" className="grid h-8 w-8 place-items-center rounded-full border border-white/10 bg-black/65 text-white backdrop-blur"><Move className="h-3.5 w-3.5" /></button></div>
              {!minimized && <><span className="absolute bottom-14 left-1/2 flex -translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded-full border border-white/15 bg-black/65 px-2.5 py-1.5 text-[8px] font-black text-white backdrop-blur"><i className="h-2 w-2 animate-pulse rounded-full bg-accent-red" /> AO VIVO</span><div className="absolute right-0 bottom-5 left-0 text-center text-white"><strong className="block text-xs">Prof. Rafael Mendes</strong><small className="text-[8px] text-zinc-300">Arraste para mover</small></div></>}
            </aside>
          </div>

          <TeacherPanel sceneIndex={sceneIndex} setSceneIndex={setSceneIndex} completedPageIds={completedPageIds} togglePageCompleted={togglePageCompleted} />
        </section>


      </div>
    </main>
  );
}

function TeacherPanel({
  sceneIndex,
  setSceneIndex,
  completedPageIds,
  togglePageCompleted,
}: {
  sceneIndex: number;
  setSceneIndex: (index: number) => void;
  completedPageIds: string[];
  togglePageCompleted: (pageId: string) => void;
}) {
  const scene = PRESENTATION_PAGES[sceneIndex];
  const currentCompleted = completedPageIds.includes(scene.id);

  return (
    <aside className="flex min-w-0 flex-col gap-3 rounded-3xl border border-border-subtle bg-bg-sidebar p-4">
      <header className="px-1 pb-1"><small className="text-[8px] font-black tracking-[.12em] text-brand-yellow uppercase">Visão do professor / Padrinho</small><h2 className="mt-1 text-sm font-bold">Roteiro de páginas do AVA.</h2></header>

      <section className="rounded-2xl border border-border-subtle bg-bg-card p-4">
        <div className="flex items-center justify-between gap-3"><span className="text-[9px] font-semibold">TODO da apresentação</span><small className="text-[8px] text-text-secondary">{completedPageIds.length}/{PRESENTATION_PAGES.length} concluídas</small></div>
        <div className="mt-3 space-y-1.5">{PRESENTATION_PAGES.map((page, index) => {
          const completed = completedPageIds.includes(page.id);
          const current = index === sceneIndex;
          return <button type="button" key={page.id} onClick={() => setSceneIndex(index)} className={`flex w-full items-center gap-2 rounded-xl border p-2.5 text-left transition ${current ? "border-brand-yellow/40 bg-brand-yellow/5" : "border-transparent bg-bg-app hover:border-border-subtle"}`}><span className={`grid h-6 w-6 shrink-0 place-items-center rounded-lg border ${completed ? "border-accent-green bg-accent-green text-emerald-950" : current ? "border-brand-yellow text-brand-yellow" : "border-border-subtle text-text-secondary"}`}>{completed ? <Check className="h-3.5 w-3.5" /> : <span className="text-[8px]">{index + 1}</span>}</span><span className="min-w-0 flex-1"><strong className={`block truncate text-[9px] ${completed ? "text-accent-green" : "text-text-primary"}`}>{page.title}</strong><small className="block truncate text-[7px] text-text-secondary">{page.route}</small></span>{current && <i className="h-2 w-2 shrink-0 rounded-full bg-brand-yellow" />}</button>;
        })}</div>
        <button type="button" onClick={() => togglePageCompleted(scene.id)} className={`mt-3 flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-[9px] font-bold ${currentCompleted ? "border border-accent-green/30 bg-accent-green/10 text-accent-green" : "bg-brand-yellow text-black"}`}><Check className="h-3.5 w-3.5" />{currentCompleted ? "Página concluída · desfazer" : "Marcar página como concluída"}</button>
      </section>
    </aside>
  );
}
