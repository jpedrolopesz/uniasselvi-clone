import Link from "next/link";
import { MessageIcon, SendIcon } from "@/components/icons";
import { VoteControl } from "@/components/community/VoteControl";
import type { Community, Post, PostTag } from "@/lib/community/mock-feed";

const TAG_STYLE: Record<PostTag, string> = {
  Dúvida: "border-sky-500/40 bg-sky-500/10 text-sky-300",
  Material: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
  Discussão: "border-violet-500/40 bg-violet-500/10 text-violet-300",
  Aviso: "border-brand-yellow/40 bg-brand-yellow/10 text-brand-yellow",
};

interface PostCardProps {
  post: Post;
  community: Community | undefined;
}

export function PostCard({ post, community }: PostCardProps) {
  return (
    <article className="flex gap-3 rounded-xl border border-border-subtle bg-bg-card p-3 transition hover:border-border-subtle hover:bg-bg-card-hover">
      <VoteControl score={post.score} />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-text-secondary">
          <span className="font-semibold text-white">r/{post.communitySlug}</span>
          <span aria-hidden="true">•</span>
          <span>u/{post.author}</span>
          <span aria-hidden="true">•</span>
          <span>{post.age}</span>
          {post.pinned && (
            <span className="font-semibold uppercase tracking-wide text-brand-yellow">Fixado</span>
          )}
          <span
            className={`ml-auto shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-medium ${TAG_STYLE[post.tag]}`}
          >
            {post.tag}
          </span>
        </div>

        <h3 className="mt-1.5 text-base font-semibold leading-snug text-white">{post.title}</h3>
        <p className="mt-1 line-clamp-3 text-sm leading-relaxed text-text-secondary">{post.body}</p>

        <div className="mt-3 flex items-center gap-1 text-xs font-medium text-text-secondary">
          <span className="flex items-center gap-1.5 rounded-full px-2 py-1.5">
            <MessageIcon className="h-4 w-4" aria-hidden="true" />
            {post.comments} comentários
          </span>
          <button
            type="button"
            disabled
            title="Disponível em breve"
            className="flex cursor-not-allowed items-center gap-1.5 rounded-full px-2 py-1.5 transition hover:bg-bg-card hover:text-white"
          >
            <SendIcon className="h-4 w-4" aria-hidden="true" />
            Compartilhar
          </button>
          {/* Comunidades transversais não têm disciplina para linkar. */}
          {community?.subjectCode && (
            <Link
              href={`/disciplinas/${community.subjectCode}`}
              className="ml-auto shrink-0 rounded-full px-2 py-1.5 transition hover:bg-bg-card hover:text-white"
            >
              Ir para a disciplina
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
