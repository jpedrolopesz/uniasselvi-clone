"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  CalendarDays,
  CircleUserRound,
  GraduationCap,
  Library,
  MapPin,
  MessageCircle,
  Plus,
  Search,
  SlidersHorizontal,
  Sparkles,
  Users,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";
import campusImage from "@/public/assets/campus-vitru-novo/campus-isometrico.png";

interface CampusDiscipline {
  code: string;
  name: string;
  schedule: string;
  instructor: string;
  current: boolean;
}

interface Props {
  activeUserId: string;
  user: { firstName: string; fullName: string; courseName: string };
  disciplines: CampusDiscipline[];
}

interface CampusPlace {
  id: string;
  name: string;
  people: number;
  kind: string;
  x: number;
  y: number;
  icon: LucideIcon;
  featured?: boolean;
}

const PLACES: readonly CampusPlace[] = [
  { id: "biblioteca", name: "Biblioteca", people: 24, kind: "Acadêmico", x: 17, y: 72, icon: Library },
  { id: "design", name: "Design", people: 12, kind: "Acadêmico", x: 25, y: 30, icon: Zap },
  { id: "secretaria", name: "Secretaria", people: 3, kind: "Serviços", x: 46, y: 17, icon: CircleUserRound },
  { id: "auditorio", name: "Auditório", people: 18, kind: "Eventos", x: 70, y: 19, icon: Users },
  { id: "informatica", name: "Informática", people: 32, kind: "Acadêmico", x: 57, y: 47, icon: GraduationCap, featured: true },
  { id: "engenharias", name: "Engenharias", people: 18, kind: "Acadêmico", x: 51, y: 73, icon: GraduationCap },
  { id: "laboratorios", name: "Laboratórios", people: 6, kind: "Acadêmico", x: 79, y: 65, icon: BookOpen },
  { id: "gramado", name: "Gramado", people: 8, kind: "Social", x: 84, y: 37, icon: Users },
];

const FILTERS = ["Agora", "Hoje", "Minhas disciplinas", "Eventos", "Pessoas", "Serviços"];

function withUser(path: string, userId: string) {
  return `${path}${path.includes("?") ? "&" : "?"}u=${encodeURIComponent(userId)}`;
}

export function CampusVirtualClient({ activeUserId, user, disciplines }: Props) {
  const [filter, setFilter] = useState("Agora");
  const [search, setSearch] = useState("");
  const [selectedPlace, setSelectedPlace] = useState<CampusPlace | null>(null);
  const [roomTab, setRoomTab] = useState<"open" | "mine">("open");

  useEffect(() => {
    if (!selectedPlace) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedPlace(null);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [selectedPlace]);

  const visiblePlaces = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("pt-BR");
    return PLACES.filter((place) => {
      const matchesSearch = !query || place.name.toLocaleLowerCase("pt-BR").includes(query);
      const matchesFilter = filter === "Agora" || filter === "Hoje" || filter === "Pessoas" ||
        (filter === "Minhas disciplinas" && place.kind === "Acadêmico") ||
        (filter === "Eventos" && place.kind === "Eventos") ||
        (filter === "Serviços" && place.kind === "Serviços");
      return matchesSearch && matchesFilter;
    });
  }, [filter, search]);

  const today = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  }).format(new Date());
  const onlineCount = PLACES.reduce((sum, place) => sum + place.people, 0);
  const primaryDiscipline = disciplines.find((discipline) => discipline.current) || disciplines[0];
  const roomDisciplines = disciplines.slice(0, 4);
  const featuredDiscipline = primaryDiscipline || roomDisciplines[0];

  return (
    <section data-page-source="/campus-vitru" className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden bg-bg-app text-text-primary">
      <header className="shrink-0 border-b border-border-subtle bg-bg-sidebar/95 px-4 py-3 backdrop-blur sm:px-5">
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          <div className="mr-auto flex min-w-0 items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-yellow text-black shadow-lg shadow-brand-yellow/10"><MapPin className="h-5 w-5" /></span>
            <span className="min-w-0"><small className="block text-[9px] font-black tracking-[.14em] text-brand-yellow uppercase">Vida universitária</small><h1 className="truncate text-base font-bold sm:text-lg">Campus Vitru</h1></span>
          </div>
          <label className="flex h-10 min-w-[15rem] flex-1 items-center gap-2 rounded-xl border border-border-subtle bg-bg-card px-3 text-text-secondary transition focus-within:border-brand-yellow/50 sm:max-w-sm">
            <Search className="h-4 w-4 shrink-0" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar espaço no campus..." className="min-w-0 flex-1 bg-transparent text-xs text-text-primary outline-none placeholder:text-text-secondary/60" />
            <kbd className="hidden rounded border border-border-subtle bg-bg-app px-1.5 py-1 text-[8px] sm:inline">⌘ K</kbd>
          </label>
        </div>
        <nav className="mt-3 flex gap-2 overflow-x-auto pb-0.5" aria-label="Filtros do campus">
          {FILTERS.map((item) => <button key={item} type="button" onClick={() => setFilter(item)} aria-pressed={filter === item} className={`shrink-0 rounded-full border px-3 py-1.5 text-[10px] font-bold transition ${filter === item ? "border-brand-yellow bg-brand-yellow text-black" : "border-border-subtle bg-bg-card text-text-secondary hover:bg-bg-card-hover hover:text-text-primary"}`}>{item}</button>)}
        </nav>
      </header>

      <div className="grid min-h-0 min-w-0 flex-1 gap-4 overflow-y-auto p-3 sm:p-4 xl:grid-cols-[minmax(0,1fr)_20rem] xl:overflow-hidden">
        <main className="relative min-h-[34rem] min-w-0 overflow-hidden rounded-2xl border border-border-subtle bg-bg-card shadow-xl xl:min-h-0">
          <video
            className="absolute inset-0 h-full w-full object-cover"
            poster={campusImage.src}
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
            aria-label="Apresentação em vídeo do Campus Virtual Vitru"
          >
            <source src="/assets/campus-vitru-novo/apresentacao-campus-vitru.mp4" type="video/mp4" />
            Seu navegador não oferece suporte à reprodução de vídeo.
          </video>
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/20" />

          <section className="absolute top-4 left-4 z-10 max-w-[15rem] rounded-2xl border border-white/10 bg-black/75 p-4 text-white shadow-2xl backdrop-blur-xl sm:top-5 sm:left-5">
            <small className="text-[8px] font-black tracking-[.14em] text-brand-yellow uppercase">Explore o campus</small>
            <h2 className="mt-1 text-xl font-bold">Olá, {user.firstName}! 👋</h2>
            <p className="mt-2 flex items-center gap-2 text-[10px] text-zinc-300"><i className="h-2 w-2 rounded-full bg-accent-green shadow-[0_0_0_4px_rgba(47,184,114,.16)]" /> {onlineCount} pessoas online</p>
            <p className="mt-3 text-[10px] leading-relaxed text-zinc-300">Clique em um espaço para conhecer salas, pessoas e atividades acontecendo agora.</p>
          </section>

          {visiblePlaces.map((place) => {
            const Icon = place.icon;
            return <button key={place.id} type="button" style={{ left: `${place.x}%`, top: `${place.y}%` }} onClick={() => setSelectedPlace(place)} className={`group absolute z-10 flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-xl border bg-black/80 p-2 text-left text-white shadow-xl backdrop-blur transition hover:-translate-y-[58%] hover:border-brand-yellow ${place.featured ? "border-brand-yellow ring-4 ring-brand-yellow/25" : "border-white/15"}`}><span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-yellow/15 text-brand-yellow"><Icon className="h-4 w-4" /></span><span className="hidden min-w-0 flex-col pr-1 sm:flex"><strong className="whitespace-nowrap text-[10px]">{place.name}</strong><small className="whitespace-nowrap text-[8px] text-zinc-300">{place.featured ? "Aulas acontecendo" : `${place.people} pessoas`}</small></span></button>;
          })}

          {visiblePlaces.length === 0 && <div className="absolute inset-0 z-20 grid place-items-center bg-black/40 p-5 backdrop-blur-sm"><p className="rounded-2xl border border-white/10 bg-black/75 px-5 py-4 text-sm font-semibold text-white">Nenhum espaço encontrado para esse filtro.</p></div>}

          <nav className="absolute top-4 right-4 z-10 hidden flex-col gap-1 rounded-2xl border border-white/10 bg-black/75 p-2 text-white shadow-xl backdrop-blur lg:flex" aria-label="Categorias do mapa">
            {[[GraduationCap, "Acadêmico"], [CircleUserRound, "Serviços"], [Users, "Social"], [CalendarDays, "Eventos"]].map(([Icon, label]) => <button key={String(label)} type="button" className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-[9px] text-zinc-300 hover:bg-white/10 hover:text-white"><Icon className="h-4 w-4 text-brand-yellow" /><span>{String(label)}</span></button>)}
            <div className="my-1 h-px bg-white/10" />
            <button type="button" className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-[9px] text-zinc-300 hover:bg-white/10 hover:text-white"><SlidersHorizontal className="h-4 w-4 text-brand-yellow" /> Filtros</button>
          </nav>

          <div className="absolute right-4 bottom-4 z-10 flex gap-2 sm:flex-col">
            {[<MapPin key="pin" className="h-4 w-4" />, "+", "−"].map((content, index) => <button key={index} type="button" aria-label={["Centralizar mapa", "Aproximar mapa", "Afastar mapa"][index]} className="grid h-10 w-10 place-items-center rounded-xl border border-border-subtle bg-bg-card text-sm font-bold text-text-primary shadow-lg hover:bg-bg-card-hover">{content}</button>)}
          </div>
        </main>

        <AgendaPanel activeUserId={activeUserId} user={user} disciplines={disciplines} primaryDiscipline={primaryDiscipline} today={today} />
      </div>

      {selectedPlace && <CampusRoomsPanel place={selectedPlace} activeUserId={activeUserId} featuredDiscipline={featuredDiscipline} roomDisciplines={roomDisciplines} roomTab={roomTab} setRoomTab={setRoomTab} onClose={() => setSelectedPlace(null)} />}
    </section>
  );
}

function AgendaPanel({ activeUserId, user, disciplines, primaryDiscipline, today }: { activeUserId: string; user: Props["user"]; disciplines: CampusDiscipline[]; primaryDiscipline?: CampusDiscipline; today: string }) {
  return (
    <aside className="min-w-0 rounded-2xl border border-border-subtle bg-bg-sidebar p-4 xl:min-h-0 xl:overflow-y-auto" aria-label="Minha agenda no Campus Vitru">
      <header className="flex items-start justify-between gap-3"><span><small className="text-[8px] font-black tracking-[.12em] text-brand-yellow uppercase">Minha agenda</small><h2 className="mt-1 text-base font-bold">Olá, {user.firstName}!</h2><p className="mt-1 text-[9px] text-text-secondary capitalize">{today}</p></span><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-yellow/10 text-brand-yellow"><CalendarDays className="h-4 w-4" /></span></header>
      <section className="mt-4 rounded-xl border border-border-subtle bg-bg-card p-3">
        <div className="flex items-center justify-between"><strong className="text-[10px]">Aulas de hoje</strong><span className="rounded-full bg-accent-green/10 px-2 py-1 text-[8px] font-bold text-accent-green">Ao vivo</span></div>
        <div className="mt-3 space-y-3">{disciplines.slice(0, 2).map((discipline, index) => <article key={discipline.code} className="flex min-w-0 gap-2.5"><time className="h-fit shrink-0 rounded-lg bg-brand-yellow px-2 py-1.5 text-[9px] font-black text-black">{index === 0 ? "19:00" : "20:40"}</time><span className="min-w-0 flex-1"><strong className="block truncate text-[10px]">{discipline.name}</strong><small className="mt-1 block truncate text-[8px] text-text-secondary">{discipline.instructor}</small><small className="mt-0.5 flex items-center gap-1 text-[8px] text-text-secondary"><Users className="h-3 w-3" /> {5 + index * 3} colegas</small></span></article>)}</div>
      </section>
      <section className="mt-3 rounded-xl border border-border-subtle bg-bg-card p-3">
        <div className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-brand-yellow" /><strong className="text-[10px]">Continuar estudando</strong></div>
        <ul className="mt-3 space-y-2.5">{disciplines.slice(0, 3).map((discipline, index) => <li key={discipline.code} className="flex min-w-0 items-center gap-2"><span className={`grid h-6 w-6 shrink-0 place-items-center rounded-lg border text-[8px] ${index === 0 ? "border-brand-yellow/40 bg-brand-yellow/10 text-brand-yellow" : "border-border-subtle text-text-secondary"}`}>{index + 1}</span><span className="min-w-0 flex-1"><strong className="block truncate text-[9px]">{discipline.name}</strong><small className="text-[7px] text-text-secondary">Trilha de aprendizagem</small></span></li>)}</ul>
      </section>
      {primaryDiscipline && <Link href={withUser(`/disciplinas/${primaryDiscipline.code}`, activeUserId)} className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-brand-yellow px-3 py-3 text-[10px] font-black text-black transition hover:bg-brand-yellow-dark"><MapPin className="h-4 w-4" /> Ir para minha disciplina</Link>}
    </aside>
  );
}

function CampusRoomsPanel({ place, activeUserId, featuredDiscipline, roomDisciplines, roomTab, setRoomTab, onClose }: { place: CampusPlace; activeUserId: string; featuredDiscipline?: CampusDiscipline; roomDisciplines: CampusDiscipline[]; roomTab: "open" | "mine"; setRoomTab: (tab: "open" | "mine") => void; onClose: () => void }) {
  const PlaceIcon = place.icon;
  return (
    <div className="fixed inset-0 z-[100] flex justify-end bg-black/65 p-3 backdrop-blur-sm" role="presentation" onMouseDown={onClose}>
      <aside className="flex h-full w-full max-w-md flex-col overflow-hidden rounded-2xl border border-border-subtle bg-bg-sidebar text-text-primary shadow-2xl" aria-label={`Salas de ${place.name}`} onMouseDown={(event) => event.stopPropagation()}>
        <header className="flex items-start justify-between gap-3 border-b border-border-subtle p-5"><span className="flex min-w-0 items-center gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-yellow text-black"><PlaceIcon className="h-5 w-5" /></span><span className="min-w-0"><small className="text-[8px] font-black text-brand-yellow uppercase">Espaço do campus</small><h2 className="truncate text-lg font-bold">{place.name}</h2><p className="mt-1 flex items-center gap-1.5 text-[9px] text-accent-green"><i className="h-2 w-2 rounded-full bg-accent-green" /> {place.people} pessoas agora</p></span></span><button type="button" onClick={onClose} aria-label="Fechar painel" className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-border-subtle text-text-secondary hover:bg-bg-card-hover hover:text-text-primary"><X className="h-4 w-4" /></button></header>
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {featuredDiscipline && <section className="rounded-2xl border border-brand-yellow/25 bg-brand-yellow/5 p-4"><small className="text-[8px] font-black tracking-[.1em] text-brand-yellow uppercase">Sala em destaque</small><article className="mt-3 flex min-w-0 items-center gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-yellow text-black"><GraduationCap className="h-5 w-5" /></span><span className="min-w-0 flex-1"><strong className="block truncate text-xs">{featuredDiscipline.name}</strong><small className="mt-1 flex items-center gap-1 text-[9px] text-text-secondary"><Users className="h-3 w-3" /> 12 participantes</small></span><Link href={withUser(`/disciplinas/${featuredDiscipline.code}`, activeUserId)} className="rounded-lg bg-brand-yellow px-3 py-2 text-[9px] font-black text-black">Entrar</Link></article></section>}
          <section className="mt-4 rounded-2xl border border-border-subtle bg-bg-card p-3">
            <div className="grid grid-cols-2 rounded-xl bg-bg-app p-1" role="tablist" aria-label="Tipos de sala"><button type="button" role="tab" aria-selected={roomTab === "open"} onClick={() => setRoomTab("open")} className={`rounded-lg px-3 py-2 text-[9px] font-bold ${roomTab === "open" ? "bg-brand-yellow text-black" : "text-text-secondary"}`}>Salas abertas</button><button type="button" role="tab" aria-selected={roomTab === "mine"} onClick={() => setRoomTab("mine")} className={`rounded-lg px-3 py-2 text-[9px] font-bold ${roomTab === "mine" ? "bg-brand-yellow text-black" : "text-text-secondary"}`}>Minhas salas</button></div>
            <div className="mt-3 space-y-2">{roomDisciplines.filter((discipline) => roomTab === "open" || discipline.current).map((discipline, index) => <article key={discipline.code} className="flex min-w-0 items-center gap-2 rounded-xl border border-border-subtle bg-bg-sidebar p-2.5"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-accent-green/10 text-accent-green"><Users className="h-4 w-4" /></span><span className="min-w-0 flex-1"><strong className="block truncate text-[9px]">{discipline.name}</strong><small className="mt-0.5 block text-[8px] text-text-secondary">{[24, 18, 15, 10][index] || 8} participantes</small></span><Link href={withUser(`/disciplinas/${discipline.code}`, activeUserId)} className="rounded-lg border border-brand-yellow/30 px-2.5 py-1.5 text-[8px] font-bold text-brand-yellow">Entrar</Link></article>)}{roomTab === "mine" && !roomDisciplines.some((discipline) => discipline.current) && <p className="py-5 text-center text-[9px] text-text-secondary">Você ainda não entrou em nenhuma sala.</p>}</div>
          </section>
          <section className="mt-4"><h3 className="text-[8px] font-black tracking-[.1em] text-text-secondary uppercase">Conversas recentes</h3><div className="mt-2 space-y-1">{[["MA", "Marina Alves", "Você: Obrigada! Ajudou muito.", "14:32"], ["LF", "Lucas Ferreira", "Vamos estudar juntos sim!", "11:45"], ["M3", "Grupo · MAPA Unidade 3", "Alguém já fez a parte 2?", "09:18"]].map(([initials, name, message, time], index) => <button key={name} type="button" className="flex w-full min-w-0 items-center gap-2 rounded-xl p-2 text-left hover:bg-bg-card-hover"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-border-subtle text-[8px] font-bold">{index === 2 ? <MessageCircle className="h-4 w-4" /> : initials}</span><span className="min-w-0 flex-1"><strong className="block truncate text-[9px]">{name}</strong><small className="mt-0.5 block truncate text-[8px] text-text-secondary">{message}</small></span><time className="shrink-0 text-[7px] text-text-secondary">{time}</time></button>)}</div></section>
        </div>
        <footer className="border-t border-border-subtle p-4"><button type="button" className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-yellow px-4 py-3 text-[10px] font-black text-black"><Plus className="h-4 w-4" /> Criar nova sala</button></footer>
      </aside>
    </div>
  );
}
