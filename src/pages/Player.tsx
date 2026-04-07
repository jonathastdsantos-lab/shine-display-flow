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

const mockNews: Record<string, string[]> = {
  technology: [
    "Tecnologia: IA generativa redefine processos industriais em 2026",
    "Tecnologia: Computação quântica atinge novo marco de estabilidade",
    "Tecnologia: Startups brasileiras captam US$ 2 bi no primeiro trimestre",
  ],
  sports: [
    "Esportes: Brasil lidera eliminatórias sul-americanas",
    "Esportes: NBA anuncia expansão para novas cidades",
    "Esportes: Liga dos Campeões define semifinalistas",
  ],
  business: [
    "Economia: Bolsa atinge máxima histórica com otimismo do mercado",
    "Economia: Banco Central mantém taxa Selic em 11,25%",
    "Economia: Exportações do agro crescem 18% no trimestre",
  ],
};

export default function Player() {
  const { id_cliente } = useParams<{ id_cliente: string }>();
  const [searchParams] = useSearchParams();
  const playlistId = searchParams.get("playlist");
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fading, setFading] = useState(false);
  const [city, setCity] = useState("São Paulo");
  const [template, setTemplate] = useState("corporativo");
  const [newsCategory, setNewsCategory] = useState("technology");
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!id_cliente) return;

    const fetchData = async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("config_clima, config_noticias, template")
        .eq("user_id", id_cliente)
        .single();
      if (profile) {
        setCity(profile.config_clima || "São Paulo");
        setTemplate((profile as any).template || "corporativo");
        setNewsCategory(profile.config_noticias || "technology");
      }

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
    document.documentElement.requestFullscreen?.().catch(() => {});
  }, [id_cliente, playlistId]);

  const goToNext = useCallback(() => {
    setFading(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % mediaItems.length);
      setFading(false);
    }, 600);
  }, [mediaItems.length]);

  useEffect(() => {
    if (mediaItems.length === 0) return;
    const current = mediaItems[currentIndex];
    if (!current) return;

    if (current.tipo === "video") {
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
  }, [currentIndex, mediaItems, goToNext]);

  const headlines = mockNews[newsCategory] || mockNews.technology;

  if (mediaItems.length === 0) {
    return (
      <div className="flex h-screen w-screen items-center justify-center" style={{ background: "#000" }}>
        <div className="text-center space-y-3">
          <div className="mx-auto h-16 w-16 animate-pulse rounded-full" style={{ background: "rgba(255,255,255,0.05)" }} />
          <p className="font-display" style={{ color: "rgba(255,255,255,0.4)" }}>Aguardando conteúdo...</p>
        </div>
      </div>
    );
  }

  const current = mediaItems[currentIndex];

  // ── RETAIL MODE: fullscreen ──
  if (template === "varejo") {
    return (
      <div className="h-screen w-screen flex flex-col overflow-hidden" style={{ background: "#000" }}>
        <div className="flex-1 relative">
          <div className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${fading ? "opacity-0" : "opacity-100"}`}>
            {current?.tipo === "video" ? (
              <video ref={videoRef} key={current.id} src={current.url_arquivo} className="h-full w-full object-cover" muted autoPlay playsInline />
            ) : (
              <img key={current?.id} src={current?.url_arquivo} alt="" className="h-full w-full object-cover" />
            )}
          </div>
          {/* Progress dots */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {mediaItems.map((_, i) => (
              <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === currentIndex ? "w-6 bg-primary" : "w-1.5 bg-player-text/30"}`} />
            ))}
          </div>
        </div>
        <NewsTicker headlines={headlines} />
      </div>
    );
  }

  // ── CORPORATE MODE: zoned layout ──
  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden" style={{ background: "#000" }}>
      <div className="flex-1 flex min-h-0">
        {/* Main Zone */}
        <div className="flex-1 relative player-zone-main">
          <div className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${fading ? "opacity-0" : "opacity-100"}`}>
            {current?.tipo === "video" ? (
              <video ref={videoRef} key={current.id} src={current.url_arquivo} className="h-full w-full object-cover" muted autoPlay playsInline />
            ) : (
              <img key={current?.id} src={current?.url_arquivo} alt="" className="h-full w-full object-cover" />
            )}
          </div>
          {/* Progress bar */}
          <div className="absolute top-0 left-0 right-0 flex gap-0.5 p-2 z-10">
            {mediaItems.map((_, i) => (
              <div key={i} className={`h-0.5 flex-1 rounded-full transition-all duration-500 ${i === currentIndex ? "bg-primary" : "bg-player-text/10"}`} />
            ))}
          </div>
        </div>

        {/* Sidebar Zone */}
        <div className="w-[200px] flex flex-col player-zone-sidebar border-l" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
          <ClockWidget />
          <div className="w-full h-px" style={{ background: "rgba(255,255,255,0.05)" }} />
          <WeatherWidget city={city} />
          <div className="flex-1" />
          <div className="px-4 py-3 text-center">
            <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.2)" }}>SignageOS</p>
          </div>
        </div>
      </div>

      {/* Footer Zone: Ticker */}
      <NewsTicker headlines={headlines} />
    </div>
  );
}
