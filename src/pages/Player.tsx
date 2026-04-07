import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import ClockWidget from "@/components/ClockWidget";
import WeatherWidget from "@/components/WeatherWidget";
import NewsTicker from "@/components/NewsTicker";

interface MediaItem {
  id: string;
  url_arquivo: string;
  tipo: string;
  duracao: number;
}

const mockNews = [
  "Tecnologia: IA revoluciona a indústria de mídia digital",
  "Economia: Mercado financeiro em alta nesta semana",
  "Ciência: Nova descoberta sobre energia renovável",
  "Esportes: Brasil avança nas eliminatórias",
  "Saúde: Estudo revela benefícios de exercícios regulares",
];

export default function Player() {
  const { id_cliente } = useParams<{ id_cliente: string }>();
  const [searchParams] = useSearchParams();
  const playlistId = searchParams.get("playlist");
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fading, setFading] = useState(false);
  const [city, setCity] = useState("São Paulo");
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!id_cliente) return;

    const fetchData = async () => {
      // Fetch profile for widget config
      const { data: profile } = await supabase
        .from("profiles")
        .select("config_clima, config_noticias")
        .eq("user_id", id_cliente)
        .single();
      if (profile) setCity(profile.config_clima || "São Paulo");

      // Fetch media
      let mediaIds: string[] | null = null;
      if (playlistId) {
        const { data: playlist } = await supabase
          .from("playlists")
          .select("ordem_arquivos")
          .eq("id", playlistId)
          .single();
        if (playlist) mediaIds = playlist.ordem_arquivos as string[];
      }

      const { data: allMedia } = await supabase
        .from("media_library")
        .select("*")
        .eq("client_id", id_cliente);

      if (allMedia) {
        if (mediaIds && mediaIds.length > 0) {
          const ordered = mediaIds
            .map((mid) => allMedia.find((m: any) => m.id === mid))
            .filter(Boolean) as MediaItem[];
          setMediaItems(ordered);
        } else {
          setMediaItems(allMedia as any);
        }
      }
    };

    fetchData();

    // Enter fullscreen
    document.documentElement.requestFullscreen?.().catch(() => {});
  }, [id_cliente, playlistId]);

  const goToNext = useCallback(() => {
    setFading(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % mediaItems.length);
      setFading(false);
    }, 500);
  }, [mediaItems.length]);

  useEffect(() => {
    if (mediaItems.length === 0) return;
    const current = mediaItems[currentIndex];
    if (!current) return;

    if (current.tipo === "video") {
      // Video: wait for it to end
      const video = videoRef.current;
      if (video) {
        video.play().catch(() => {});
        const onEnded = () => goToNext();
        video.addEventListener("ended", onEnded);
        return () => video.removeEventListener("ended", onEnded);
      }
    } else {
      // Image: show for duracao seconds (default 10)
      const timer = setTimeout(goToNext, (current.duracao || 10) * 1000);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, mediaItems, goToNext]);

  if (mediaItems.length === 0) {
    return (
      <div className="dark flex h-screen w-screen items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <div className="mx-auto h-16 w-16 animate-pulse rounded-full bg-primary/20" />
          <p className="text-muted-foreground font-display">Aguardando conteúdo...</p>
        </div>
      </div>
    );
  }

  const current = mediaItems[currentIndex];

  return (
    <div className="dark relative h-screen w-screen overflow-hidden bg-background">
      {/* Media Content */}
      <div className={`absolute inset-0 transition-opacity duration-500 ${fading ? "opacity-0" : "opacity-100"}`}>
        {current?.tipo === "video" ? (
          <video
            ref={videoRef}
            key={current.id}
            src={current.url_arquivo}
            className="h-full w-full object-cover"
            muted
            autoPlay
            playsInline
          />
        ) : (
          <img
            key={current?.id}
            src={current?.url_arquivo}
            alt=""
            className="h-full w-full object-cover"
          />
        )}
      </div>

      {/* Overlay */}
      <div className="player-overlay absolute inset-0 pointer-events-none" />

      {/* Top-right widgets */}
      <div className="absolute top-6 right-6 flex flex-col items-end gap-3 z-10">
        <ClockWidget />
        <WeatherWidget city={city} />
      </div>

      {/* Progress indicator */}
      <div className="absolute top-0 left-0 right-0 flex gap-1 p-2 z-10">
        {mediaItems.map((_, i) => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i === currentIndex ? "bg-primary" : "bg-primary-foreground/20"}`} />
        ))}
      </div>

      {/* News Ticker */}
      <NewsTicker headlines={mockNews} />
    </div>
  );
}
