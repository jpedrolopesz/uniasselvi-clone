"use client";

import { useMemo, useState } from "react";
import type { SVGProps } from "react";
import { BarChartIcon, ClockIcon, SparklesIcon, UsersIcon } from "@/components/icons";
import { PostCard } from "@/components/community/PostCard";
import { CommunitySidebar } from "@/components/community/CommunitySidebar";
import { formatCompact } from "@/lib/community/format";
import { COMMUNITIES, POSTS } from "@/lib/community/mock-feed";
import { sortPosts, type SortKey } from "@/lib/community/sort";

const SORTS: { key: SortKey; label: string; icon: (props: SVGProps<SVGSVGElement>) => React.JSX.Element }[] = [
  { key: "alta", label: "Em alta", icon: SparklesIcon },
  { key: "novos", label: "Novos", icon: ClockIcon },
  { key: "top", label: "Top", icon: BarChartIcon },
];

export function CommunityFeed() {
  const [sort, setSort] = useState<SortKey>("alta");
  const [activeSlug, setActiveSlug] = useState<string | null>(null);

  const posts = useMemo(() => {
    const filtered = activeSlug ? POSTS.filter((p) => p.communitySlug === activeSlug) : POSTS;
    return sortPosts(filtered, sort);
  }, [sort, activeSlug]);

  const activeCommunity = COMMUNITIES.find((c) => c.slug === activeSlug);

  return (
    <div className="flex gap-6">
      <div className="min-w-0 flex-1">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <nav
            className="flex items-center gap-1 rounded-full border border-border-subtle bg-bg-card p-1.5"
            aria-label="Ordenar publicações"
          >
            {SORTS.map(({ key, label, icon: Icon }) => {
              const active = sort === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSort(key)}
                  aria-pressed={active}
                  className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition ${
                    active
                      ? "bg-brand-yellow text-black"
                      : "text-text-secondary/80 hover:bg-bg-card-hover hover:text-white"
                  }`}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {label}
                </button>
              );
            })}
          </nav>

          {activeCommunity && (
            <button
              type="button"
              onClick={() => setActiveSlug(null)}
              className="flex items-center gap-2 rounded-full border border-brand-yellow/40 bg-brand-yellow/10 px-3 py-2 text-sm font-medium text-brand-yellow transition hover:bg-brand-yellow/20"
            >
              r/{activeCommunity.slug}
              <span aria-hidden="true">✕</span>
              <span className="sr-only">Remover filtro de comunidade</span>
            </button>
          )}
        </div>

        {activeCommunity && (
          <div className="mb-4 rounded-xl border border-border-subtle bg-bg-card p-4">
            <h2 className="text-sm font-bold uppercase tracking-tight text-white">
              {activeCommunity.name}
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-text-secondary">
              {activeCommunity.description}
            </p>
            <p className="mt-2 flex items-center gap-1.5 text-xs text-text-secondary">
              <UsersIcon className="h-4 w-4" aria-hidden="true" />
              {formatCompact(activeCommunity.members)} membros • {activeCommunity.online} online
            </p>
          </div>
        )}

        <div className="flex flex-col gap-3">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              community={COMMUNITIES.find((c) => c.slug === post.communitySlug)}
            />
          ))}
        </div>
      </div>

      <CommunitySidebar activeSlug={activeSlug} onSelect={setActiveSlug} />
    </div>
  );
}
