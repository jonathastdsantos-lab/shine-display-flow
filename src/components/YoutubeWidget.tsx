import { useEffect, useRef } from "react";

interface YoutubeWidgetProps {
  url?: string;
  videoId?: string;
  autoplay?: boolean;
  mute?: boolean;
  loop?: boolean;
  /** Disparado quando o vídeo termina (YT.PlayerState.ENDED) ou após timeout de segurança. */
  onEnded?: () => void;
  /** Duração máxima esperada do vídeo (em segundos). Usada como timeout de segurança. Default 30s. */
  duracao?: number;
}

// Tipos mínimos da YouTube IFrame API
declare global {
  interface Window {
    YT?: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

const YT_API_SRC = "https://www.youtube.com/iframe_api";
let apiLoadingPromise: Promise<void> | null = null;

function loadYouTubeAPI(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.YT && window.YT.Player) return Promise.resolve();
  if (apiLoadingPromise) return apiLoadingPromise;

  apiLoadingPromise = new Promise<void>((resolve) => {
    // Encadeia com callback existente (se houver)
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      resolve();
    };

    if (!document.querySelector(`script[src="${YT_API_SRC}"]`)) {
      const tag = document.createElement("script");
      tag.src = YT_API_SRC;
      tag.async = true;
      document.head.appendChild(tag);
    }
  });

  return apiLoadingPromise;
}

/**
 * Extrai o ID do vídeo a partir de qualquer formato comum de URL do YouTube.
 * Suporta: youtu.be/{id}, youtube.com/watch?v={id}, /embed/{id}, /shorts/{id},
 * com ou sem parâmetros extras (?t=30, &list=...).
 */
function extractId(input?: string): string {
  if (!input) return "";
  if (/^[\w-]{10,}$/.test(input) && !input.includes("/")) return input;
  try {
    const u = new URL(input);
    if (u.hostname.includes("youtu.be")) {
      return u.pathname.slice(1).split("/")[0] || "";
    }
    const v = u.searchParams.get("v");
    if (v) return v;
    const parts = u.pathname.split("/").filter(Boolean);
    // /embed/{id}, /shorts/{id}, /v/{id}
    const idx = parts.findIndex((p) => ["embed", "shorts", "v"].includes(p));
    if (idx >= 0 && parts[idx + 1]) return parts[idx + 1];
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
  onEnded,
  duracao,
}: YoutubeWidgetProps) {
  const id = videoId || extractId(url);
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const fallbackTimerRef = useRef<number | null>(null);
  const endedFiredRef = useRef(false);

  useEffect(() => {
    if (!id || !containerRef.current) return;

    let cancelled = false;
    endedFiredRef.current = false;

    const fireEnded = (reason: "api" | "timeout") => {
      if (endedFiredRef.current) return;
      endedFiredRef.current = true;
      if (reason === "timeout") {
        console.warn(`[YoutubeWidget] Timeout de segurança disparado para ${id}, avançando.`);
      }
      onEnded?.();
    };

    // Timeout de segurança: se a API não disparar ENDED, avança em (duracao || 30)s + 2s de margem.
    if (onEnded) {
      const safetyMs = ((duracao ?? 30) + 2) * 1000;
      fallbackTimerRef.current = window.setTimeout(() => fireEnded("timeout"), safetyMs);
    }

    loadYouTubeAPI().then(() => {
      if (cancelled || !containerRef.current || !window.YT?.Player) return;

      playerRef.current = new window.YT.Player(containerRef.current, {
        videoId: id,
        playerVars: {
          autoplay: autoplay ? 1 : 0,
          mute: mute ? 1 : 0,
          controls: 0,
          modestbranding: 1,
          rel: 0,
          playsinline: 1,
          enablejsapi: 1,
          ...(loop ? { loop: 1, playlist: id } : {}),
        },
        events: {
          onStateChange: (event: any) => {
            // YT.PlayerState.ENDED === 0
            if (event?.data === 0) {
              // Quando loop=true, o YouTube reinicia sozinho — só avançamos se onEnded foi pedido.
              if (!loop) fireEnded("api");
              else fireEnded("api");
            }
          },
          onError: () => {
            console.error(`[YoutubeWidget] Erro na reprodução do vídeo ${id}, avançando.`);
            fireEnded("api");
          },
        },
      });
    });

    return () => {
      cancelled = true;
      if (fallbackTimerRef.current !== null) {
        clearTimeout(fallbackTimerRef.current);
        fallbackTimerRef.current = null;
      }
      try {
        playerRef.current?.destroy?.();
      } catch (err) {
        console.warn("[YoutubeWidget] Falha ao destruir player:", err);
      }
      playerRef.current = null;
    };
  }, [id, autoplay, mute, loop, onEnded, duracao]);

  if (!id) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-black text-white/40 text-sm">
        Configure um vídeo do YouTube
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-black overflow-hidden">
      {/* O div abaixo é substituído pelo iframe criado pela YT IFrame API. */}
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}
