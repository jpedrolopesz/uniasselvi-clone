import type { Post } from "@/lib/community/mock-feed";

export type SortKey = "alta" | "novos" | "top";

/**
 * `POSTS` já vem em ordem cronológica, então "Novos" é a ordem natural do
 * array — por isso não há critério de data aqui (ver o campo `age` em
 * mock-feed.ts, que é texto pré-formatado e não ordenável).
 *
 * "Em alta" pondera comentários acima de votos: discussão viva vale mais que
 * placar alto. Posts fixados sobem ao topo em qualquer ordenação, como no
 * Reddit.
 */
export function sortPosts(posts: Post[], sort: SortKey): Post[] {
  const ordered = [...posts];
  if (sort === "alta") ordered.sort((a, b) => b.score + b.comments * 3 - (a.score + a.comments * 3));
  if (sort === "top") ordered.sort((a, b) => b.score - a.score);
  return ordered.sort((a, b) => Number(b.pinned ?? false) - Number(a.pinned ?? false));
}
