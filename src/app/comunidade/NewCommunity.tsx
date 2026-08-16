"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  Bell,
  BookOpen,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronDown,
  CirclePlus,
  Copy,
  Gift,
  GraduationCap,
  Hash,
  LoaderCircle,
  Mic2,
  Pencil,
  Search,
  Send,
  Smile,
  Sparkles,
  UserPlus,
  Users,
  Volume2,
  WandSparkles,
  X,
} from "lucide-react";

interface NewCommunityProps {
  user: { firstName: string; fullName: string; course: string };
  presentationMode?: boolean;
  guidedTarget?: "community" | "channel" | "room" | "mentor" | "ready";
}

type Community = {
  id: string;
  title: string;
  description: string;
  members: string;
  accent: "yellow" | "green" | "amber" | "blue";
  icon: "rocket" | "people" | "book" | "career";
};

const COMMUNITIES: Community[] = [
  { id: "steps", title: "Primeiros passos no AVA", description: "Dicas essenciais para navegar e aproveitar ao máximo.", members: "1,2 mil", accent: "yellow", icon: "rocket" },
  { id: "class", title: "Calouros da sua turma", description: "Converse com quem está começando a mesma jornada.", members: "2,4 mil", accent: "green", icon: "people" },
  { id: "study", title: "Métodos de estudo", description: "Técnicas, rotinas e ferramentas para estudar melhor.", members: "1,1 mil", accent: "amber", icon: "book" },
  { id: "career", title: "Networking & carreira", description: "Conecte-se, descubra oportunidades e planeje o futuro.", members: "1,5 mil", accent: "blue", icon: "career" },
];

const COMMUNITY_ACCENTS: Record<Community["accent"], string> = {
  yellow: "bg-gradient-to-br from-yellow-200 to-brand-yellow text-yellow-950",
  green: "bg-gradient-to-br from-emerald-200 to-emerald-400 text-emerald-950",
  amber: "bg-gradient-to-br from-amber-200 to-amber-400 text-amber-950",
  blue: "bg-gradient-to-br from-sky-200 to-blue-400 text-blue-950",
};

const AVATAR_COLORS: Record<string, string> = {
  cyan: "bg-cyan-900 text-cyan-100",
  orange: "bg-orange-900 text-orange-100",
  green: "bg-emerald-900 text-emerald-100",
  yellow: "bg-yellow-900 text-brand-yellow",
  pink: "bg-pink-900 text-pink-100",
};

const ONLINE_PEOPLE = [
  { name: "Mariana Alves", course: "Ciência da Computação", initials: "MA", color: "cyan" },
  { name: "Pedro Henrique", course: "Engenharia de Software", initials: "PH", color: "orange" },
  { name: "Letícia Costa", course: "Design Digital", initials: "LC", color: "green" },
  { name: "Rafael Souza", course: "Sistemas de Informação", initials: "RS", color: "yellow" },
  { name: "Beatriz Lima", course: "Ciência de Dados", initials: "BL", color: "pink" },
];

const CHANNELS = ["dúvidas-gerais", "módulo-1", "módulo-2", "carreira", "materiais-compartilhados", "oportunidades"];

const VOICE_ROOMS = [
  { name: "Sala de Estudo 1", count: "12 / 20" },
  { name: "Sala de Estudo 2", count: "06 / 20" },
  { name: "Plantão com Tutor", count: "Ao vivo" },
  { name: "Biblioteca ao Vivo", count: "08 / 50" },
  { name: "Foco & Produtividade", count: "14 / 40" },
];

function CommunityIcon({ icon }: { icon: Community["icon"] }) {
  if (icon === "people") return <Users className="h-10 w-10" />;
  if (icon === "book") return <BookOpen className="h-10 w-10" />;
  if (icon === "career") return <BriefcaseBusiness className="h-10 w-10" />;
  return <Sparkles className="h-10 w-10" />;
}

function Avatar({ initials, color = "yellow", small = false }: { initials: string; color?: string; small?: boolean }) {
  return (
    <span className={`relative grid shrink-0 place-items-center rounded-full border-2 border-border-subtle font-bold ${small ? "h-8 w-8 text-[9px]" : "h-10 w-10 text-xs"} ${AVATAR_COLORS[color] ?? AVATAR_COLORS.yellow}`}>
      {initials}
      <i className="absolute right-0 bottom-0 h-2.5 w-2.5 rounded-full border-2 border-bg-sidebar bg-accent-green" />
    </span>
  );
}

export function NewCommunity({ user, presentationMode = false, guidedTarget }: NewCommunityProps) {
  const [channel, setChannel] = useState("dúvidas-gerais");
  const [joined, setJoined] = useState<string[]>(["class"]);
  const [voiceRoom, setVoiceRoom] = useState<string | null>(null);
  const [mentorMode, setMentorMode] = useState<"support" | "mentor">("support");
  const [message, setMessage] = useState("");
  const [sentMessages, setSentMessages] = useState<string[]>([]);
  const [modal, setModal] = useState<"guide" | "invite" | "notifications" | "conversation" | null>(null);
  const [conversationPerson, setConversationPerson] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [mentorRequested, setMentorRequested] = useState(false);
  const [mentorVolunteer, setMentorVolunteer] = useState(false);
  const [aiQuery, setAiQuery] = useState("");
  const [aiSearching, setAiSearching] = useState(false);
  const [aiRecommendations, setAiRecommendations] = useState<string[]>([]);
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const filteredPeople = ONLINE_PEOPLE;
  const displayedCommunities = useMemo(() => {
    if (aiRecommendations.length === 0) return COMMUNITIES;
    return [...COMMUNITIES].sort((first, second) => {
      const firstIndex = aiRecommendations.indexOf(first.id);
      const secondIndex = aiRecommendations.indexOf(second.id);
      if (firstIndex === -1 && secondIndex === -1) return 0;
      if (firstIndex === -1) return 1;
      if (secondIndex === -1) return -1;
      return firstIndex - secondIndex;
    });
  }, [aiRecommendations]);

  function toggleCommunity(id: string) {
    setJoined((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  function sendMessage(event: FormEvent) {
    event.preventDefault();
    const content = message.trim();
    if (!content) return;
    setSentMessages((current) => [...current, content]);
    setMessage("");
  }

  async function copyInvite() {
    await navigator.clipboard.writeText(`${window.location.origin}/comunidade?convite=CALOURO2026`);
    setCopied(true);
  }

  function openConversation(name: string) {
    setConversationPerson(name);
    setModal("conversation");
  }

  async function searchCommunitiesWithAi(event?: FormEvent, suggestedInterest?: string) {
    event?.preventDefault();
    const interest = (suggestedInterest ?? aiQuery).trim();
    if (!interest) {
      setAiRecommendations([]);
      setAiExplanation(null);
      return;
    }

    if (suggestedInterest) setAiQuery(suggestedInterest);
    setAiSearching(true);
    setAiExplanation(null);

    try {
      const [response] = await Promise.all([
        fetch("/api/v1/vitru/community-recommendations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ interest }),
        }),
        new Promise((resolve) => window.setTimeout(resolve, 450)),
      ]);
      if (!response.ok) throw new Error("Não foi possível analisar os interesses.");
      const result = await response.json() as { recommendations?: unknown; explanation?: unknown };
      const recommendations = Array.isArray(result.recommendations)
        ? result.recommendations.filter((id): id is string => typeof id === "string" && COMMUNITIES.some((community) => community.id === id)).slice(0, 2)
        : [];
      if (recommendations.length === 0) throw new Error("A IA não retornou comunidades válidas.");
      setAiRecommendations(recommendations);
      setAiExplanation(typeof result.explanation === "string" ? result.explanation : "Encontrei comunidades alinhadas aos seus interesses.");
    } catch {
      setAiRecommendations(["class", "study"]);
      setAiExplanation("Encontrei duas comunidades populares para começar enquanto aprimoro a análise dos seus interesses.");
    } finally {
      setAiSearching(false);
    }
  }

  return (
    <section data-page-source="/comunidade" aria-label="Comunidade do Calouro" className={`grid h-full min-h-0 w-full min-w-0 overflow-hidden border-y border-border-subtle bg-bg-app text-text-primary ${presentationMode ? "md:grid-cols-[12rem_minmax(0,1fr)] xl:grid-cols-[12rem_minmax(0,1fr)_17rem]" : "md:grid-cols-[18rem_minmax(0,1fr)] xl:grid-cols-[18rem_minmax(0,1fr)_22rem]"} ${guidedTarget === "ready" ? "ring-2 ring-inset ring-accent-green" : ""}`}>
      <aside className="hidden min-w-0 flex-col overflow-y-auto border-r border-border-subtle bg-bg-sidebar md:flex">
        <header className="sticky top-0 z-10 flex h-24 shrink-0 items-center justify-between gap-2 border-b border-border-subtle bg-bg-sidebar/95 px-5 backdrop-blur">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-yellow/10 text-brand-yellow"><GraduationCap className="h-5 w-5" /></span>
            <span className="flex min-w-0 flex-col"><small className="text-[9px] font-black tracking-[.14em] text-brand-yellow">COMUNIDADE</small><strong className="truncate text-sm">Campus de Estudo</strong></span>
            <ChevronDown className="h-3.5 w-3.5 shrink-0 text-text-secondary" />
          </div>
          <button type="button" aria-label="Editar canais" className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-text-secondary hover:bg-bg-card-hover hover:text-text-primary"><Pencil className="h-4 w-4" /></button>
        </header>

        <ChannelSection title="Boas-vindas">
          <ChannelButton label="apresentações" active={channel === "apresentações"} focused={guidedTarget === "channel"} onClick={() => setChannel("apresentações")} suffix="👋" />
          <ChannelButton label="regras" active={channel === "regras"} onClick={() => setChannel("regras")} />
        </ChannelSection>

        <ChannelSection title="Canais de texto">
          {CHANNELS.map((item) => <ChannelButton key={item} label={item} active={channel === item} onClick={() => setChannel(item)} members={item === "dúvidas-gerais"} />)}
        </ChannelSection>

        <ChannelSection title="Salas de voz / estudo">
          {VOICE_ROOMS.map((room) => {
            const active = voiceRoom === room.name;
            return (
              <button key={room.name} type="button" onClick={() => setVoiceRoom(active ? null : room.name)} className={`flex w-full min-w-0 items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs transition ${active ? "bg-accent-green/10 text-accent-green" : "text-text-secondary hover:bg-bg-card-hover hover:text-text-primary"} ${guidedTarget === "room" && room === VOICE_ROOMS[0] ? "ring-2 ring-accent-green" : ""}`}>
                <Volume2 className="h-4 w-4 shrink-0" /><span className="min-w-0 flex-1 truncate">{room.name}</span><small className="shrink-0 text-[9px]">{active ? "Conectado" : room.count}</small>
              </button>
            );
          })}
        </ChannelSection>

        <section className="border-b border-border-subtle px-3 py-4">
          <h2 className="mb-2 px-2 text-[10px] font-black tracking-[.14em] text-text-secondary/70 uppercase">Alunos online · 24</h2>
          <div className="space-y-1.5">{ONLINE_PEOPLE.map((person) => <div key={person.name} className="flex min-w-0 items-center gap-2 rounded-lg px-2 py-1.5"><Avatar initials={person.initials} color={person.color} small /><span className="flex min-w-0 flex-col"><strong className="truncate text-[11px]">{person.name}</strong><small className="truncate text-[9px] text-text-secondary/70">{person.course}</small></span></div>)}</div>
        </section>

        <footer className="sticky bottom-0 mt-auto border-t border-border-subtle bg-bg-sidebar/95 p-3 backdrop-blur"><button type="button" onClick={() => setModal("invite")} className="flex w-full items-center justify-center gap-2 rounded-xl border border-border-subtle bg-bg-card px-3 py-2.5 text-xs font-semibold text-text-primary hover:border-brand-yellow/30 hover:bg-bg-card-hover"><UserPlus className="h-4 w-4" /> Convidar amigos</button></footer>
      </aside>

      <section className="grid min-h-0 min-w-0 grid-rows-[minmax(0,1fr)_auto] bg-bg-app">
        <div className="min-h-0 min-w-0 overflow-y-auto p-4 sm:p-6">
          <section className={`community-hero relative flex min-w-0 flex-col gap-5 overflow-hidden rounded-2xl border border-brand-yellow/20 p-5 transition sm:flex-row sm:items-center sm:p-6 ${guidedTarget === "community" ? "ring-2 ring-accent-green shadow-[0_0_30px_rgba(47,184,114,.18)]" : ""}`}>
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-brand-yellow text-black shadow-lg shadow-brand-yellow/10 sm:h-16 sm:w-16"><GraduationCap className="h-7 w-7" /></span>
            <div className="relative z-10 min-w-0 flex-1"><small className="text-[9px] font-black tracking-[.14em] text-brand-yellow uppercase">Seu campus começa aqui</small><h2 className="mt-1 text-xl font-bold sm:text-2xl">Bem-vindo, {user.firstName}! 👋</h2><p className="mt-1.5 max-w-xl text-xs leading-relaxed text-text-secondary">Explore os canais, participe das conversas e aproveite tudo o que a comunidade oferece.</p><div className="mt-4 flex flex-wrap gap-2"><button type="button" onClick={() => setChannel("dúvidas-gerais")} className="rounded-full bg-brand-yellow px-4 py-2 text-xs font-bold text-black hover:bg-brand-yellow-dark">Explorar canais</button><button type="button" onClick={() => setModal("guide")} className="rounded-full border border-border-subtle px-4 py-2 text-xs font-bold text-text-primary hover:bg-bg-card-hover">Ver guia do calouro</button></div></div>
            <Sparkles className="absolute top-5 right-6 h-6 w-6 text-brand-yellow/60" />
          </section>

          <section className="mt-5 rounded-2xl border border-border-subtle bg-bg-card p-4 sm:p-6" aria-labelledby="ai-community-search-title">
            <div className="mx-auto max-w-3xl text-center">
              <span className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-brand-yellow/10 text-brand-yellow"><WandSparkles className="h-5 w-5" /></span>
              <h2 id="ai-community-search-title" className="mt-3 text-lg font-bold sm:text-xl">Vamos conhecer novas comunidades?</h2>
              <p className="mx-auto mt-1 max-w-xl text-[11px] leading-relaxed text-text-secondary sm:text-xs">Digite seus principais interesses para a IA encontrar as comunidades que mais combinam com você.</p>
              <form onSubmit={(event) => void searchCommunitiesWithAi(event)} className={`mx-auto mt-4 flex max-w-2xl items-center gap-2 rounded-full border bg-bg-app p-1.5 pl-4 transition ${aiSearching ? "border-brand-yellow/50" : "border-border-subtle focus-within:border-brand-yellow/50"}`}>
                <WandSparkles className="h-4 w-4 shrink-0 text-brand-yellow" />
                <input value={aiQuery} onChange={(event) => setAiQuery(event.target.value)} placeholder="Exemplo: Gostaria de trabalhar com pesquisa acadêmica..." className="min-w-0 flex-1 bg-transparent py-2 text-xs text-text-primary outline-none placeholder:text-text-secondary/55" aria-label="Descreva seus interesses" />
                <button type="submit" disabled={!aiQuery.trim() || aiSearching} className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-yellow text-black transition hover:bg-brand-yellow-dark disabled:cursor-not-allowed disabled:opacity-40" aria-label="Buscar comunidades com IA">{aiSearching ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}</button>
              </form>
              <div className="mt-3 flex flex-wrap justify-center gap-2">{["Pesquisa acadêmica", "Conhecer colegas", "Melhorar meus estudos", "Carreira e estágio"].map((interest) => <button type="button" key={interest} onClick={() => void searchCommunitiesWithAi(undefined, interest)} disabled={aiSearching} className="rounded-full border border-border-subtle bg-bg-app px-3 py-1.5 text-[9px] text-text-secondary transition hover:border-brand-yellow/30 hover:text-brand-yellow disabled:opacity-40">{interest}</button>)}</div>
              <div aria-live="polite" className="min-h-8">{aiExplanation && <p className="mt-3 inline-flex items-center gap-2 rounded-xl bg-accent-green/10 px-3 py-2 text-[10px] text-accent-green"><CheckCircle2 className="h-4 w-4 shrink-0" />{aiExplanation}</p>}</div>
            </div>
          </section>

          <div className="mt-6 mb-3 flex items-end justify-between gap-4"><div><small className="text-[9px] font-black tracking-[.14em] text-brand-yellow uppercase">Descubra seu lugar</small><h2 className="mt-1 text-lg font-bold">{aiRecommendations.length > 0 ? "Recomendações da IA para você" : "Comunidades para você"}</h2></div><button type="button" onClick={() => { setAiRecommendations([]); setAiExplanation(null); setAiQuery(""); }} className="shrink-0 text-xs font-semibold text-brand-yellow hover:underline">Ver todas →</button></div>

          <section className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {displayedCommunities.map((community) => {
              const isJoined = joined.includes(community.id);
              const isRecommended = aiRecommendations.includes(community.id);
              return (
                <article key={community.id} className={`min-w-0 overflow-hidden rounded-2xl border bg-bg-card transition hover:-translate-y-0.5 hover:bg-bg-card-hover ${isRecommended ? "border-brand-yellow ring-1 ring-brand-yellow/25 shadow-[0_12px_35px_rgba(255,204,0,.08)]" : "border-border-subtle hover:border-brand-yellow/20"}`}>
                  <div className={`relative grid h-24 place-items-center overflow-hidden ${COMMUNITY_ACCENTS[community.accent]}`}><CommunityIcon icon={community.icon} />{isRecommended && <b className="absolute top-2 left-2 flex items-center gap-1 rounded-full bg-black/75 px-2 py-1 text-[7px] font-black text-brand-yellow backdrop-blur"><WandSparkles className="h-3 w-3" /> IA RECOMENDA</b>}<i className="absolute top-3 right-5 h-6 w-6 rounded-full bg-white/20" /><i className="absolute -bottom-8 left-3 h-20 w-20 rounded-full bg-white/15" /></div>
                  <div className="p-4"><h3 className="min-h-10 text-sm font-bold leading-snug">{community.title}</h3><p className="mt-2 min-h-12 text-[11px] leading-relaxed text-text-secondary">{community.description}</p><footer className="mt-4 flex min-w-0 items-center justify-between gap-2"><div className="flex min-w-0 items-center">{["LA", "PH", "MC"].map((item) => <span key={item} className="-mr-1.5 grid h-6 w-6 place-items-center rounded-full border-2 border-bg-card bg-border-subtle text-[6px]">{item}</span>)}<small className="ml-2.5 truncate text-[9px] text-text-secondary">{community.members}</small></div><button type="button" onClick={() => toggleCommunity(community.id)} className={`shrink-0 rounded-lg px-3 py-2 text-[10px] font-bold ${isJoined ? "bg-accent-green/10 text-accent-green" : "bg-brand-yellow text-black hover:bg-brand-yellow-dark"}`}>{isJoined ? "Participando" : "Entrar"}</button></footer></div>
                </article>
              );
            })}
          </section>

          <section className={`mt-5 overflow-hidden rounded-2xl border border-border-subtle bg-bg-card transition ${guidedTarget === "mentor" ? "ring-2 ring-accent-green shadow-[0_0_30px_rgba(47,184,114,.18)]" : ""}`}>
            <header className="flex items-center justify-between gap-3 px-4 py-4 sm:px-5"><div className="flex min-w-0 items-center gap-3"><Users className="h-5 w-5 shrink-0 text-brand-yellow" /><span className="flex min-w-0 flex-col"><small className="text-[8px] font-black tracking-[.12em] text-brand-yellow uppercase">Apoio entre estudantes</small><strong className="truncate text-sm">Padrinho & Mentoria</strong></span></div><b className="hidden rounded-full bg-accent-green/10 px-3 py-1 text-[9px] text-accent-green sm:block">98% de satisfação</b></header>
            <div className="mx-4 grid grid-cols-2 rounded-xl bg-bg-card-hover p-1 sm:mx-5"><button type="button" onClick={() => setMentorMode("support")} className={`rounded-lg px-3 py-2 text-[11px] font-semibold ${mentorMode === "support" ? "bg-brand-yellow text-black" : "text-text-secondary"}`}>Preciso de apoio</button><button type="button" onClick={() => setMentorMode("mentor")} className={`rounded-lg px-3 py-2 text-[11px] font-semibold ${mentorMode === "mentor" ? "bg-brand-yellow text-black" : "text-text-secondary"}`}>Quero ser padrinho</button></div>
            <div className="grid gap-0 p-4 sm:grid-cols-2 sm:p-5">
              <MentorChoice type="support" active={mentorMode === "support"} emoji="🧑🏽‍🎓" eyebrow="Conte com quem já passou por isso" title="Seu ritmo caiu? Conecte-se com um veterano-padrinho." description="Compartilhe suas dúvidas, receba orientações e volte a ganhar confiança." buttonLabel={mentorRequested ? "Pedido enviado" : "Quero um padrinho"} completed={mentorRequested} onSelect={() => { setMentorMode("support"); setMentorRequested(true); }} />
              <MentorChoice type="mentor" active={mentorMode === "mentor"} emoji="🙋🏻‍♂️" eyebrow="Sua experiência pode transformar alguém" title="Você está indo bem! Seja padrinho de um calouro." description="Ajude alguém a encontrar sua universidade e faça a diferença." buttonLabel={mentorVolunteer ? "Cadastro iniciado" : "Quero ser padrinho"} completed={mentorVolunteer} onSelect={() => { setMentorMode("mentor"); setMentorVolunteer(true); }} />
            </div>
          </section>

          {sentMessages.length > 0 && <section className="mt-4 space-y-2">{sentMessages.map((item, index) => <div key={`${item}-${index}`} className="flex items-start gap-3 rounded-xl border border-border-subtle bg-bg-card p-3"><Avatar initials={user.firstName.slice(0, 2).toUpperCase()} small /><p className="min-w-0 text-xs text-text-secondary"><strong className="mb-1 block text-text-primary">{user.fullName} <small className="ml-1 font-normal text-text-secondary">agora em #{channel}</small></strong>{item}</p></div>)}</section>}
        </div>

        <form onSubmit={sendMessage} className="mx-4 mb-3 flex min-w-0 items-center gap-1.5 rounded-2xl border border-border-subtle bg-bg-card p-2 sm:mx-5 sm:mb-4"><button type="button" aria-label="Adicionar anexo" className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-text-secondary hover:bg-bg-card-hover hover:text-text-primary"><CirclePlus className="h-4 w-4" /></button><input value={message} onChange={(event) => setMessage(event.target.value)} placeholder={`Escreva uma mensagem em #${channel}`} className="min-w-0 flex-1 bg-transparent px-1 text-xs text-text-primary outline-none placeholder:text-text-secondary/60" /><button type="button" onClick={() => setMessage((value) => `${value} 🎁`)} aria-label="Enviar presente" className="hidden h-8 w-8 shrink-0 place-items-center rounded-lg text-text-secondary hover:bg-bg-card-hover hover:text-text-primary sm:grid"><Gift className="h-4 w-4" /></button><button type="button" onClick={() => setMessage((value) => `${value} GIF`)} className="hidden h-8 shrink-0 place-items-center rounded-lg px-2 text-[9px] font-black text-text-secondary hover:bg-bg-card-hover hover:text-text-primary sm:grid">GIF</button><button type="button" onClick={() => setMessage((value) => `${value} 😊`)} aria-label="Adicionar emoji" className="hidden h-8 w-8 shrink-0 place-items-center rounded-lg text-text-secondary hover:bg-bg-card-hover hover:text-text-primary sm:grid"><Smile className="h-4 w-4" /></button><button type="submit" disabled={!message.trim()} aria-label="Enviar mensagem" className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-yellow text-black disabled:opacity-30"><Send className="h-4 w-4" /></button></form>
      </section>

      <aside className="hidden min-h-0 min-w-0 flex-col gap-5 overflow-y-auto border-l border-border-subtle bg-bg-sidebar px-5 pb-5 pt-[7.5rem] xl:flex">
        <section className="rounded-2xl border border-border-subtle bg-bg-card p-5"><header className="flex items-start justify-between gap-2"><div><small className="text-[9px] font-black tracking-[.12em] text-brand-yellow uppercase">Novas conexões</small><h2 className="mt-1 text-base font-bold">Quem quer conversar?</h2></div><button type="button" className="text-[10px] font-semibold text-brand-yellow">Ver todos</button></header><div className="mt-5 space-y-5">{filteredPeople.map((person, index) => <article key={person.name} className="flex min-w-0 items-center gap-3"><Avatar initials={person.initials} color={person.color} /><span className="flex min-w-0 flex-1 flex-col"><strong className="truncate text-xs">{person.name}</strong><small className="truncate text-[9px] text-text-secondary">{person.course}</small><em className="mt-0.5 text-[9px] not-italic text-accent-green">● {index === 3 ? "Disponível às 14h" : "Disponível"}</em></span><button type="button" onClick={() => openConversation(person.name)} className="shrink-0 rounded-lg border border-border-subtle px-3 py-2 text-[9px] text-text-secondary hover:bg-bg-card-hover hover:text-text-primary">Conversar</button></article>)}</div></section>
        <section className="relative overflow-hidden rounded-2xl border border-border-subtle bg-bg-card p-5"><span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-yellow/10 text-brand-yellow"><GraduationCap className="h-5 w-5" /></span><small className="mt-5 block text-[8px] font-black tracking-[.1em] text-brand-yellow uppercase">Uma rede que continua depois da graduação</small><h2 className="mt-1 text-base font-bold">Rede de Egressos</h2><p className="mt-5 text-[9px] text-text-secondary">Junte-se a mais de</p><strong className="mt-1 block text-3xl">1 milhão</strong><span className="mt-1 block max-w-48 text-[10px] leading-relaxed text-text-secondary">de egressos que transformam o mundo todos os dias.</span><div className="mt-5 flex">{["AS", "LM", "RG", "CP", "+995"].map((item) => <b key={item} className="-mr-1 grid h-7 w-7 place-items-center rounded-full border-2 border-bg-card bg-border-subtle text-[6px]">{item}</b>)}</div><i className="absolute -right-10 -bottom-12 h-32 w-32 rounded-full bg-brand-yellow/5" /></section>
        {voiceRoom && <section className="mt-auto flex items-center gap-2 rounded-2xl border border-border-subtle bg-bg-card p-3"><Mic2 className="h-5 w-5 shrink-0 text-accent-green" /><span className="flex min-w-0 flex-1 flex-col"><small className="text-[7px] font-bold text-accent-green">VOCÊ ENTROU EM</small><strong className="truncate text-[9px]">{voiceRoom}</strong></span><button type="button" onClick={() => setVoiceRoom(null)} className="rounded-lg bg-accent-red/10 px-2 py-1.5 text-[8px] text-accent-red">Sair</button></section>}
      </aside>

      {modal && <CommunityModal type={modal} person={conversationPerson} copied={copied} onCopy={() => void copyInvite()} onClose={() => { setModal(null); setCopied(false); }} />}
    </section>
  );
}

function ChannelSection({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="border-b border-border-subtle px-3 py-4"><h2 className="mb-2 px-2 text-[10px] font-black tracking-[.14em] text-text-secondary/70 uppercase">{title}</h2><div className="space-y-0.5">{children}</div></section>;
}

function ChannelButton({ label, active, focused = false, onClick, suffix, members = false }: { label: string; active: boolean; focused?: boolean; onClick: () => void; suffix?: string; members?: boolean }) {
  return <button type="button" onClick={onClick} className={`flex w-full min-w-0 items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs transition ${active ? "bg-brand-yellow/10 text-brand-yellow shadow-[inset_3px_0_0_#ffcc00]" : "text-text-secondary hover:bg-bg-card-hover hover:text-text-primary"} ${focused ? "ring-2 ring-accent-green" : ""}`}><Hash className="h-4 w-4 shrink-0" /><span className="min-w-0 flex-1 truncate">{label}</span>{suffix && <span>{suffix}</span>}{members && <Users className="h-4 w-4 shrink-0" />}</button>;
}

function MentorChoice({
  type,
  active,
  emoji,
  eyebrow,
  title,
  description,
  buttonLabel,
  completed,
  onSelect,
}: {
  type: "support" | "mentor";
  active: boolean;
  emoji: string;
  eyebrow: string;
  title: string;
  description: string;
  buttonLabel: string;
  completed: boolean;
  onSelect: () => void;
}) {
  const isMentor = type === "mentor";

  return (
    <article className={`flex min-w-0 flex-col gap-4 rounded-xl p-4 transition sm:flex-row sm:items-center ${isMentor ? "sm:border-l sm:border-border-subtle sm:pl-6" : "sm:pr-6"} ${active ? "bg-white/[.025]" : "opacity-80 hover:opacity-100"}`}>
      <span className={`grid h-20 w-20 shrink-0 place-items-center rounded-2xl text-5xl ${isMentor ? "bg-emerald-500/15" : "bg-brand-yellow/15"}`} aria-hidden="true">{emoji}</span>
      <div className="min-w-0 flex-1">
        <small className={`text-[8px] font-black tracking-[.11em] uppercase ${isMentor ? "text-accent-green" : "text-brand-yellow"}`}>{eyebrow}</small>
        <h3 className="mt-1 text-sm font-bold leading-snug">{title}</h3>
        <p className="mt-1.5 text-[10px] leading-relaxed text-text-secondary">{description}</p>
        <button type="button" onClick={onSelect} className={`mt-3 inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[10px] font-bold transition ${isMentor ? "bg-accent-green text-emerald-950 hover:brightness-110" : "bg-brand-yellow text-black hover:bg-brand-yellow-dark"}`}>
          {completed && <CheckCircle2 className="h-3.5 w-3.5" />}
          {buttonLabel}
        </button>
      </div>
    </article>
  );
}

function CommunityModal({
  type,
  person,
  copied,
  onCopy,
  onClose,
}: {
  type: "guide" | "invite" | "notifications" | "conversation";
  person: string | null;
  copied: boolean;
  onCopy: () => void;
  onClose: () => void;
}) {
  const titles = {
    guide: "Guia do calouro",
    invite: "Convidar amigos",
    notifications: "Suas notificações",
    conversation: `Conversar com ${person ?? "um colega"}`,
  };

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-black/75 p-4 backdrop-blur-sm" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="community-modal-title" className="w-full max-w-md overflow-hidden rounded-2xl border border-border-subtle bg-bg-card text-text-primary shadow-2xl">
        <header className="flex items-center justify-between gap-3 border-b border-border-subtle px-5 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-yellow text-black">
              {type === "invite" ? <UserPlus className="h-4 w-4" /> : type === "notifications" ? <Bell className="h-4 w-4" /> : type === "conversation" ? <Users className="h-4 w-4" /> : <GraduationCap className="h-4 w-4" />}
            </span>
            <h2 id="community-modal-title" className="truncate text-base font-bold">{titles[type]}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Fechar" className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-text-secondary hover:bg-bg-card-hover hover:text-text-primary"><X className="h-4 w-4" /></button>
        </header>

        <div className="p-5">
          {type === "guide" && (
            <div className="space-y-3">
              <p className="text-xs leading-relaxed text-text-secondary">Três passos rápidos para aproveitar a comunidade desde o primeiro dia.</p>
              {[
                ["1", "Apresente-se à turma", "Conte seu curso, cidade e o que espera desta jornada."],
                ["2", "Entre nos seus canais", "Acompanhe avisos, módulos e materiais compartilhados."],
                ["3", "Estude acompanhado", "Participe das salas de estudo e peça apoio a um padrinho."],
              ].map(([number, title, description]) => (
                <article key={number} className="flex gap-3 rounded-xl border border-border-subtle bg-bg-app p-3">
                  <b className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-yellow text-[10px] text-black">{number}</b>
                  <span><strong className="block text-xs">{title}</strong><small className="mt-1 block text-[10px] leading-relaxed text-text-secondary">{description}</small></span>
                </article>
              ))}
              <button type="button" onClick={onClose} className="w-full rounded-xl bg-brand-yellow px-4 py-3 text-xs font-bold text-black hover:bg-brand-yellow-dark">Começar a explorar</button>
            </div>
          )}

          {type === "invite" && (
            <div>
              <p className="text-xs leading-relaxed text-text-secondary">Compartilhe o convite da Comunidade do Calouro com seus colegas.</p>
              <div className="mt-4 flex min-w-0 items-center gap-2 rounded-xl border border-border-subtle bg-bg-app p-2">
                <code className="min-w-0 flex-1 truncate px-2 text-[10px] text-text-secondary">/comunidade?convite=CALOURO2026</code>
                <button type="button" onClick={onCopy} className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-brand-yellow px-3 py-2 text-[10px] font-bold text-black">
                  {copied ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? "Copiado" : "Copiar"}
                </button>
              </div>
            </div>
          )}

          {type === "notifications" && (
            <div className="space-y-2">
              <article className="flex gap-3 rounded-xl border border-brand-yellow/20 bg-brand-yellow/5 p-3"><span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand-yellow" /><span><strong className="block text-xs">Plantão com Tutor começou</strong><small className="mt-1 block text-[10px] text-text-secondary">Entre na sala de voz para acompanhar ao vivo.</small></span></article>
              <article className="flex gap-3 rounded-xl border border-border-subtle bg-bg-app p-3"><span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-accent-green" /><span><strong className="block text-xs">Nova resposta em #dúvidas-gerais</strong><small className="mt-1 block text-[10px] text-text-secondary">Mariana respondeu uma pergunta sobre o primeiro módulo.</small></span></article>
            </div>
          )}

          {type === "conversation" && (
            <div className="text-center">
              <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-brand-yellow text-lg font-black text-black">{(person ?? "CO").split(" ").map((part) => part[0]).slice(0, 2).join("")}</span>
              <h3 className="mt-3 text-sm font-bold">{person}</h3>
              <p className="mt-1 text-[10px] text-accent-green">● Disponível agora</p>
              <button type="button" onClick={onClose} className="mt-5 w-full rounded-xl bg-brand-yellow px-4 py-3 text-xs font-bold text-black hover:bg-brand-yellow-dark">Abrir conversa privada</button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
