interface YoutubeWidgetProps {
  url?: string;
  videoId?: string;
  autoplay?: boolean;
  mute?: boolean;
  loop?: boolean;
}

/**
 * Extrai o ID do vídeo a partir de qualquer formato comum de URL do YouTube.
 */
function extractId(input?: string): string {
  if (!input) return "";
  // Já é um ID puro
  if (/^[\w-]{10,}$/.test(input) && !input.includes("/")) return input;
  try {
    const u = new URL(input);
    if (u.hostname.includes("youtu.be")) return u.pathname.slice(1);
    const v = u.searchParams.get("v");
    if (v) return v;
    // /embed/{id} ou /shorts/{id}
    const parts = u.pathname.split("/").filter(Boolean);
    return parts[parts.length - 1] || "";
  } catch {
    return input;
  }
}

export default function YoutubeWidget({
  url,
  videoId,
  autoplay = true,
  mute = true,
  loop = true,
}: YoutubeWidgetProps) {
  const id = videoId || extractId(url);

  if (!id) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-black text-white/40 text-sm">
        Configure um vídeo do YouTube
      </div>
    );
  }

  const params = new URLSearchParams({
    autoplay: autoplay ? "1" : "0",
    mute: mute ? "1" : "0",
    controls: "0",
    modestbranding: "1",
    rel: "0",
    playsinline: "1",
    ...(loop ? { loop: "1", playlist: id } : {}),
  });

  return (
    <div className="w-full h-full bg-black overflow-hidden">
      <iframe
        title="YouTube"
        src={`https://www.youtube.com/embed/${id}?${params.toString()}`}
        className="w-full h-full"
        frameBorder={0}
        allow="autoplay; encrypted-media; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}
