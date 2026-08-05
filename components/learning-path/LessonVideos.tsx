import type { LearningPathVideoRaw } from "@/lib/types/raw/learning-path";
import { PlayCircleIcon } from "@/components/icons";

const IFRAME_ALLOW =
  "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";

function VideoPlayer({ video, fill = false }: { video: LearningPathVideoRaw; fill?: boolean }) {
  return (
    <div className={fill ? "h-full w-full bg-black" : "aspect-video overflow-hidden rounded-xl bg-black"}>
      <iframe
        src={video.embed_url}
        title={video.title}
        loading="lazy"
        allow={IFRAME_ALLOW}
        allowFullScreen
        className="h-full w-full"
      />
    </div>
  );
}

/**
 * Vídeos do Kit Pedagógico associados à lição — mesmos embeds da página real
 * "Vídeos da Disciplina". Cada lição normalmente tem exatamente um vídeo, e
 * nesse caso ele ocupa a largura toda (player grande). Múltiplos vídeos na
 * mesma lição caem numa grade menor, só como fallback.
 *
 * `fill`: modo leitor imersivo — sem título/legenda, o player ocupa 100% do
 * espaço disponível do contêiner pai (ver LessonView em modo fullBleed).
 */
export function LessonVideos({
  videos,
  fill = false,
}: {
  videos: LearningPathVideoRaw[];
  fill?: boolean;
}) {
  if (videos.length === 0) return null;

  if (videos.length === 1) {
    const [video] = videos;
    if (fill) return <VideoPlayer video={video} fill />;
    return (
      <div className="mt-8 flex flex-col gap-3 border-t border-border-subtle pt-6">
        <h2 className="flex items-center gap-2 text-lg font-bold text-white">
          <PlayCircleIcon className="h-5 w-5 text-brand-yellow" />
          Vídeo da aula
        </h2>
        <VideoPlayer video={video} />
        <p className="text-sm font-medium text-text-secondary">{video.title}</p>
      </div>
    );
  }

  if (fill) {
    return (
      <div className="grid h-full w-full gap-px sm:grid-cols-2">
        {videos.map((video) => (
          <VideoPlayer key={video.embed_url} video={video} fill />
        ))}
      </div>
    );
  }

  return (
    <div className="mt-8 flex flex-col gap-4 border-t border-border-subtle pt-6">
      <h2 className="flex items-center gap-2 text-lg font-bold text-white">
        <PlayCircleIcon className="h-5 w-5 text-brand-yellow" />
        Vídeos desta lição
      </h2>

      <div className="grid gap-4 sm:grid-cols-2">
        {videos.map((video) => (
          <div key={video.embed_url} className="flex flex-col gap-2">
            <VideoPlayer video={video} />
            <p className="text-sm font-medium text-text-secondary">{video.title}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
