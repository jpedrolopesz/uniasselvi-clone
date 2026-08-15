import { describe, expect, it } from "vitest";
import type { Post } from "@/lib/community/mock-feed";
import { sortPosts } from "@/lib/community/sort";

function post(id: string, score: number, comments: number, pinned = false): Post {
  return {
    id,
    communitySlug: "c",
    author: "a",
    age: "há 1 h",
    title: id,
    body: "",
    score,
    comments,
    tag: "Dúvida",
    pinned,
  };
}

const ids = (posts: Post[]) => posts.map((p) => p.id);

describe("sortPosts", () => {
  it("mantém a ordem cronológica do array em 'novos'", () => {
    const posts = [post("a", 1, 0), post("b", 99, 0), post("c", 50, 0)];
    expect(ids(sortPosts(posts, "novos"))).toEqual(["a", "b", "c"]);
  });

  it("ordena por votos em 'top'", () => {
    const posts = [post("a", 1, 0), post("b", 99, 0), post("c", 50, 0)];
    expect(ids(sortPosts(posts, "top"))).toEqual(["b", "c", "a"]);
  });

  it("em 'alta', discussão movimentada supera placar maior", () => {
    const engajado = post("engajado", 50, 30); // 50 + 90 = 140
    const votado = post("votado", 120, 2); //    120 + 6 = 126
    expect(ids(sortPosts([votado, engajado], "alta"))).toEqual(["engajado", "votado"]);
  });

  it("mantém o post fixado no topo em qualquer ordenação", () => {
    const posts = [post("normal", 999, 999), post("fixado", 1, 0, true)];
    for (const sort of ["alta", "novos", "top"] as const) {
      expect(ids(sortPosts(posts, sort))[0]).toBe("fixado");
    }
  });

  it("não muta o array recebido", () => {
    const posts = [post("a", 1, 0), post("b", 99, 0)];
    sortPosts(posts, "top");
    expect(ids(posts)).toEqual(["a", "b"]);
  });
});
