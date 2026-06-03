import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MediaItem, isYoutubeUrl } from "@/pages/player/shared";

interface UseMediaPlaybackArgs {
  playlistId: string | undefined;
  mediaItems: MediaItem[];
  paused: boolean;
  remoteActive: boolean;
  adWidgetEnabled: boolean;
  /** Sinal incrementado pelo usePlayerSync quando chega comando remoto "next". */
  nextCommandSignal: number;
}

export interface MediaPlaybackState {
  currentIndex: number;
  current: MediaItem | undefined;
  fading: boolean;
  videoRef: React.RefObject<HTMLVideoElement>;
  showAdOverlay: boolean;
  mediaPlayCount: number;
  goToNext: () => void;
}

/**
 * Hook responsável por:
 *  - Carrossel de mídias + timer de duração
 *  - Transição com fade
 *  - Reprodução de vídeo (listener "ended")
 *  - Preload da próxima mídia
 *  - Proof of Play (logPlay) ao final de cada mídia
 *  - Controle do AdOverlay (a cada 3 mídias quando habilitado)
 *  - Reage ao comando remoto "next"
 */
export function useMediaPlayback({
  playlistId,
  mediaItems,
  paused,
  remoteActive,
  adWidgetEnabled,
  nextCommandSignal,
}: UseMediaPlaybackArgs): MediaPlaybackState {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fading, setFading] = useState(false);
  const [showAdOverlay, setShowAdOverlay] = useState(false);
  const [mediaPlayCount, setMediaPlayCount] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  // ── Proof of Play ──
  const logPlay = useCallback(
    async (mediaItem: MediaItem) => {
      if (!playlistId || !mediaItem) return;
      try {
        await (supabase as any).from("play_logs").insert({
          player_id: playlistId,
          media_id: mediaItem.id,
          media_name:
            (mediaItem as any).nome ||
            mediaItem.url_arquivo.split("/").pop() ||
            "unknown",
          media_type: mediaItem.tipo,
          played_at: new Date().toISOString(),
          duration_sec: mediaItem.duracao || 10,
        });
      } catch (e) {
        console.warn("play_logs insert falhou:", e);
      }
    },
    [playlistId]
  );

  const goToNext = useCallback(() => {
    if (remoteActive || paused) return;
    const currentItem = mediaItems[currentIndex];
    if (currentItem) logPlay(currentItem);

    setFading(true);
    setTimeout(() => {
      const newCount = mediaPlayCount + 1;
      setMediaPlayCount(newCount);

      if (adWidgetEnabled && newCount > 0 && newCount % 3 === 0) {
        setShowAdOverlay(true);
        setTimeout(() => {
          setShowAdOverlay(false);
          setCurrentIndex((prev) => (prev + 1) % Math.max(1, mediaItems.length));
          setFading(false);
        }, 8000);
      } else {
        setCurrentIndex((prev) => (prev + 1) % Math.max(1, mediaItems.length));
        setFading(false);
      }
    }, 800);
  }, [
    mediaItems,
    currentIndex,
    remoteActive,
    paused,
    logPlay,
    mediaPlayCount,
    adWidgetEnabled,
  ]);

  // ── Timer / vídeo "ended" ──
  useEffect(() => {
    if (mediaItems.length === 0 || remoteActive || paused || showAdOverlay) return;
    const current = mediaItems[currentIndex];
    if (!current) return;

    if (current.tipo === "video" && !isYoutubeUrl(current.url_arquivo)) {
      const video = videoRef.current;
      if (video) {
        video.play().catch(() => {});
        const onEnded = () => goToNext();
        video.addEventListener("ended", onEnded);
        return () => video.removeEventListener("ended", onEnded);
      }
    } else {
      const timer = setTimeout(goToNext, (current.duracao || 10) * 1000);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, mediaItems, goToNext, remoteActive, paused, showAdOverlay]);

  // ── Preload da próxima mídia ──
  useEffect(() => {
    if (mediaItems.length < 2) return;
    const next = mediaItems[(currentIndex + 1) % mediaItems.length];
    if (!next) return;
    if (next.tipo === "video") {
      const v = document.createElement("video");
      v.src = next.url_arquivo;
      v.preload = "auto";
      v.muted = true;
    } else {
      const img = new Image();
      img.src = next.url_arquivo;
    }
  }, [currentIndex, mediaItems]);

  // ── Comando remoto "next" ──
  useEffect(() => {
    if (nextCommandSignal === 0) return;
    if (mediaItems.length === 0) return;
    setFading(true);
    const t = setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % Math.max(1, mediaItems.length));
      setFading(false);
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nextCommandSignal]);

  const current = mediaItems[currentIndex];

  return {
    currentIndex,
    current,
    fading,
    videoRef,
    showAdOverlay,
    mediaPlayCount,
    goToNext,
  };
}
