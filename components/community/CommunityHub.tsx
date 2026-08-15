"use client";

import { useState, useEffect } from "react";

interface Group {
  id: string;
  name: string;
  category: string;
  description: string;
  memberCount: number;
  maxMembers: number | null;
  skills: string[];
  isActive: boolean;
}

interface Recommendation {
  group: Group;
  matchScore: number;
  matchReasons: string[];
}

interface CommunityHubProps {
  studentId: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  empresa_junior: "Empresa Júnior",
  grupo_pesquisa: "Grupo de Pesquisa",
  atletica: "Atlética",
  networking: "Networking",
  mentoria: "Mentoria",
  voluntariado: "Voluntariado",
  hackathon: "Hackathon",
};

const CATEGORY_ICONS: Record<string, string> = {
  empresa_junior: "💼",
  grupo_pesquisa: "🔬",
  atletica: "⚽",
  networking: "🤝",
  mentoria: "🎓",
  voluntariado: "❤️",
  hackathon: "💻",
};

export function CommunityHub({ studentId }: CommunityHubProps) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [allGroups, setAllGroups] = useState<Group[]>([]);
  const [myGroups, setMyGroups] = useState<{ group: Group; role: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"recommended" | "all" | "my">("recommended");
  const [joining, setJoining] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [studentId]);

  async function loadData() {
    setLoading(true);
    try {
      const [recRes, allRes, myRes] = await Promise.all([
        fetch(`/api/v1/community?studentId=${studentId}`),
        fetch(`/api/v1/community?action=groups`),
        fetch(`/api/v1/community?action=my&studentId=${studentId}`),
      ]);

      const recData = await recRes.json();
      const allData = await allRes.json();
      const myData = await myRes.json();

      if (recData.ok) setRecommendations(recData.recommendations ?? []);
      if (allData.ok) setAllGroups(allData.groups ?? []);
      if (myData.ok) setMyGroups(myData.memberships ?? []);
    } catch (err) {
      console.error("Erro ao carregar comunidade:", err);
    } finally {
      setLoading(false);
    }
  }

  async function joinGroup(groupId: string) {
    setJoining(groupId);
    try {
      const res = await fetch("/api/v1/community", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, groupId, action: "join" }),
      });
      const data = await res.json();
      if (data.ok) {
        await loadData(); // Recarrega
      }
    } catch (err) {
      console.error("Erro ao entrar no grupo:", err);
    } finally {
      setJoining(null);
    }
  }

  async function leaveGroup(groupId: string) {
    try {
      await fetch("/api/v1/community", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, groupId, action: "leave" }),
      });
      await loadData();
    } catch (err) {
      console.error("Erro ao sair do grupo:", err);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-brand-yellow border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Tabs */}
      <div className="flex gap-1 bg-bg-card rounded-lg p-1">
        {[
          { id: "recommended" as const, label: "Recomendados", count: recommendations.length },
          { id: "all" as const, label: "Todos", count: allGroups.length },
          { id: "my" as const, label: "Meus Grupos", count: myGroups.length },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition ${
              activeTab === tab.id
                ? "bg-brand-yellow text-black"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === "recommended" && (
        <div className="flex flex-col gap-3">
          {recommendations.length === 0 ? (
            <div className="rounded-xl bg-bg-card border border-border-subtle p-8 text-center">
              <p className="text-text-secondary">
                Complete seu <a href="/perfil" className="text-brand-yellow hover:underline">perfil</a> para receber recomendações personalizadas.
              </p>
            </div>
          ) : (
            recommendations.map((rec) => (
              <GroupCard
                key={rec.group.id}
                group={rec.group}
                matchScore={rec.matchScore}
                matchReasons={rec.matchReasons}
                isMember={myGroups.some((m) => m.group.id === rec.group.id)}
                onJoin={() => joinGroup(rec.group.id)}
                onLeave={() => leaveGroup(rec.group.id)}
                joining={joining === rec.group.id}
              />
            ))
          )}
        </div>
      )}

      {activeTab === "all" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {allGroups.map((group) => (
            <GroupCard
              key={group.id}
              group={group}
              isMember={myGroups.some((m) => m.group.id === group.id)}
              onJoin={() => joinGroup(group.id)}
              onLeave={() => leaveGroup(group.id)}
              joining={joining === group.id}
            />
          ))}
        </div>
      )}

      {activeTab === "my" && (
        <div className="flex flex-col gap-3">
          {myGroups.length === 0 ? (
            <div className="rounded-xl bg-bg-card border border-border-subtle p-8 text-center">
              <p className="text-text-secondary">
                Você ainda não participa de nenhum grupo.
              </p>
              <button
                onClick={() => setActiveTab("recommended")}
                className="mt-3 px-4 py-2 bg-brand-yellow text-black font-semibold rounded-lg text-sm"
              >
                Ver Recomendações
              </button>
            </div>
          ) : (
            myGroups.map((m) => (
              <GroupCard
                key={m.group.id}
                group={m.group}
                role={m.role}
                isMember={true}
                onLeave={() => leaveGroup(m.group.id)}
                onJoin={() => {}}
                joining={false}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

// --- Group Card Component ---

function GroupCard({
  group,
  matchScore,
  matchReasons,
  role,
  isMember,
  onJoin,
  onLeave,
  joining,
}: {
  group: Group;
  matchScore?: number;
  matchReasons?: string[];
  role?: string;
  isMember: boolean;
  onJoin: () => void;
  onLeave: () => void;
  joining: boolean;
}) {
  return (
    <div className="rounded-xl bg-bg-card border border-border-subtle p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{CATEGORY_ICONS[group.category] ?? "📌"}</span>
          <div>
            <h3 className="font-semibold text-text-primary">{group.name}</h3>
            <p className="text-xs text-text-secondary">
              {CATEGORY_LABELS[group.category] ?? group.category}
              {" · "}
              {group.memberCount} membro{group.memberCount !== 1 ? "s" : ""}
              {group.maxMembers ? ` / ${group.maxMembers}` : ""}
            </p>
          </div>
        </div>

        {matchScore && (
          <span className="px-2 py-0.5 rounded-full bg-accent-green/20 text-accent-green text-xs font-medium">
            {matchScore}% match
          </span>
        )}

        {role && (
          <span className="px-2 py-0.5 rounded-full bg-accent-purple/20 text-accent-purple text-xs font-medium capitalize">
            {role}
          </span>
        )}
      </div>

      <p className="text-sm text-text-secondary line-clamp-2">{group.description}</p>

      {group.skills.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {group.skills.slice(0, 5).map((skill) => (
            <span
              key={skill}
              className="px-2 py-0.5 rounded bg-bg-card-hover text-xs text-text-secondary"
            >
              {skill}
            </span>
          ))}
        </div>
      )}

      {matchReasons && matchReasons.length > 0 && (
        <div className="text-xs text-accent-cyan">
          {matchReasons.slice(0, 2).join(" · ")}
        </div>
      )}

      <div className="flex justify-end">
        {isMember ? (
          <button
            onClick={onLeave}
            className="px-3 py-1.5 text-xs border border-accent-red/30 text-accent-red rounded-lg hover:bg-accent-red/10 transition"
          >
            Sair do grupo
          </button>
        ) : (
          <button
            onClick={onJoin}
            disabled={joining}
            className="px-4 py-1.5 text-xs bg-brand-yellow text-black font-semibold rounded-lg hover:bg-brand-yellow-dark disabled:opacity-50 transition"
          >
            {joining ? "Entrando..." : "Participar"}
          </button>
        )}
      </div>
    </div>
  );
}
