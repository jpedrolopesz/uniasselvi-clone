"use client";

import { useState } from "react";

interface CommunityHubProps {
  studentId: string;
}

const MOCK_GROUPS = [
  { id: "1", name: "EJ Admin UNIASSELVI", category: "empresa_junior", description: "Empresa Júnior de Administração. Projetos reais de consultoria para empresas locais.", memberCount: 23, maxMembers: 40, skills: ["marketing", "gestão", "finanças"], matchScore: 75, reasons: ["Interesse em EJ", "Skills: marketing, gestão", "Alinhado com ADM"] },
  { id: "2", name: "Networking Profissional", category: "networking", description: "Encontros quinzenais para troca de experiências e oportunidades de carreira.", memberCount: 45, maxMembers: null, skills: ["liderança", "comunicação", "carreira"], matchScore: 60, reasons: ["Objetivo: crescer na carreira", "Eventos online"] },
  { id: "3", name: "Pesquisa em Empreendedorismo", category: "grupo_pesquisa", description: "Grupo de pesquisa em inovação e empreendedorismo digital. Publica artigos semestrais.", memberCount: 12, maxMembers: 20, skills: ["pesquisa", "inovação", "startups"], matchScore: 55, reasons: ["Interesse: empreender", "Curso compatível"] },
  { id: "4", name: "Atlética Unicesumar", category: "atletica", description: "Esportes, campeonatos interuniversitários e integração social.", memberCount: 80, maxMembers: null, skills: ["esportes", "trabalho em equipe"], matchScore: 40, reasons: ["Grupo ativo com vagas"] },
  { id: "5", name: "Mentoria Veteranos", category: "mentoria", description: "Veteranos de 7o+ semestre mentoram calouros. Encontros mensais 1-on-1.", memberCount: 15, maxMembers: 30, skills: ["mentoria", "orientação", "carreira"], matchScore: 65, reasons: ["Interesse em mentoria", "Mesmo curso"] },
  { id: "6", name: "Hackathon Club", category: "hackathon", description: "Participa de hackathons nacionais e organiza competições internas.", memberCount: 18, maxMembers: 25, skills: ["programação", "design", "pitch"], matchScore: 35, reasons: ["Grupo ativo"] },
];

const ICONS: Record<string, string> = { empresa_junior: "💼", grupo_pesquisa: "🔬", atletica: "⚽", networking: "🤝", mentoria: "🎓", voluntariado: "❤️", hackathon: "💻" };
const LABELS: Record<string, string> = { empresa_junior: "Empresa Júnior", grupo_pesquisa: "Pesquisa", atletica: "Atlética", networking: "Networking", mentoria: "Mentoria", voluntariado: "Voluntariado", hackathon: "Hackathon" };

export function CommunityHub({ studentId }: CommunityHubProps) {
  const [joined, setJoined] = useState<Set<string>>(new Set());
  const [tab, setTab] = useState<"recommended" | "all" | "my">("recommended");

  const myGroups = MOCK_GROUPS.filter((g) => joined.has(g.id));
  const displayGroups = tab === "my" ? myGroups : tab === "all" ? MOCK_GROUPS : MOCK_GROUPS.filter((g) => g.matchScore >= 50);

  return (
    <div className="flex flex-col gap-4">
      {/* Tabs */}
      <div className="flex gap-1 bg-bg-card rounded-lg p-1">
        {([["recommended", "Recomendados"], ["all", "Todos"], ["my", "Meus Grupos"]] as const).map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition ${tab === id ? "bg-brand-yellow text-black" : "text-text-secondary hover:text-text-primary"}`}>
            {label} ({id === "my" ? myGroups.length : id === "recommended" ? MOCK_GROUPS.filter(g => g.matchScore >= 50).length : MOCK_GROUPS.length})
          </button>
        ))}
      </div>

      {/* Groups */}
      {displayGroups.length === 0 ? (
        <div className="rounded-xl bg-bg-card border border-border-subtle p-8 text-center">
          <p className="text-text-secondary">Você ainda não participa de nenhum grupo.</p>
          <button onClick={() => setTab("recommended")} className="mt-3 px-4 py-2 bg-brand-yellow text-black font-semibold rounded-lg text-sm">Ver Recomendações</button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {displayGroups.map((g) => (
            <div key={g.id} className="rounded-xl bg-bg-card border border-border-subtle p-4 flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{ICONS[g.category] ?? "📌"}</span>
                  <div>
                    <h3 className="font-semibold text-text-primary">{g.name}</h3>
                    <p className="text-xs text-text-secondary">{LABELS[g.category]} · {g.memberCount} membros{g.maxMembers ? ` / ${g.maxMembers}` : ""}</p>
                  </div>
                </div>
                {tab !== "my" && (
                  <span className="px-2 py-0.5 rounded-full bg-accent-green/20 text-accent-green text-xs font-medium">{g.matchScore}%</span>
                )}
              </div>
              <p className="text-sm text-text-secondary">{g.description}</p>
              <div className="flex flex-wrap gap-1">
                {g.skills.map((s) => <span key={s} className="px-2 py-0.5 rounded bg-bg-card-hover text-xs text-text-secondary">{s}</span>)}
              </div>
              {tab === "recommended" && (
                <p className="text-xs text-accent-cyan">{g.reasons.slice(0, 2).join(" · ")}</p>
              )}
              <div className="flex justify-end">
                {joined.has(g.id) ? (
                  <button onClick={() => setJoined((s) => { const n = new Set(s); n.delete(g.id); return n; })}
                    className="px-3 py-1.5 text-xs border border-accent-red/30 text-accent-red rounded-lg hover:bg-accent-red/10 transition">Sair</button>
                ) : (
                  <button onClick={() => setJoined((s) => new Set(s).add(g.id))}
                    className="px-4 py-1.5 text-xs bg-brand-yellow text-black font-semibold rounded-lg hover:bg-brand-yellow-dark transition">Participar</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
