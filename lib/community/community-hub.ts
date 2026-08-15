/**
 * Community Hub — Matching de grupos para reduzir isolamento.
 */
import type { LearningProfile, CommunityGroup } from "@/lib/profile/learning-profile";

export interface GroupRecommendation {
  group: CommunityGroup;
  matchScore: number;
  matchReasons: string[];
}

const CATEGORY_LABELS: Record<string, string> = {
  empresa_junior: "Empresa Júnior",
  grupo_pesquisa: "Grupo de Pesquisa",
  atletica: "Atlética",
  networking: "Networking",
  mentoria: "Mentoria",
  voluntariado: "Voluntariado",
  hackathon: "Hackathons",
};

export function recommendGroups(profile: LearningProfile, groups: CommunityGroup[], courseCode: string): GroupRecommendation[] {
  return groups
    .map(group => {
      let score = 0;
      const reasons: string[] = [];

      if (profile.interests.categories.includes(group.category)) {
        score += 40;
        reasons.push(`Interesse em ${CATEGORY_LABELS[group.category] ?? group.category}`);
      }

      const common = group.skills.filter(s => profile.interests.skills.some(ps => ps.toLowerCase() === s.toLowerCase()));
      if (common.length > 0) {
        score += Math.min(25, common.length * 10);
        reasons.push(`Skills: ${common.join(", ")}`);
      }

      if (group.courseAffinity.includes(courseCode)) {
        score += 15;
        reasons.push("Alinhado com seu curso");
      }

      if (group.isActive && (group.maxMembers === null || group.memberCount < group.maxMembers)) {
        score += 10;
        reasons.push("Ativo com vagas");
      }

      if (group.meetingSchedule && profile.schedule.preferredStudyTimes.some(p => p.weekday === group.meetingSchedule!.weekday)) {
        score += 10;
        reasons.push("Horário compatível");
      }

      return { group, matchScore: Math.min(100, score), matchReasons: reasons };
    })
    .filter(r => r.matchScore > 20)
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 10);
}
