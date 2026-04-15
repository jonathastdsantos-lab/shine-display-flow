import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import ClockWidget from "@/components/ClockWidget";
import WeatherWidget from "@/components/WeatherWidget";
import NewsTicker from "@/components/NewsTicker";
import FinanceWidget from "@/components/FinanceWidget";
import SocialWidget from "@/components/SocialWidget";
import QRWidget from "@/components/QRWidget";
import CameraWidget from "@/components/CameraWidget";
import { AlertTriangle, Megaphone } from "lucide-react";

interface MediaItem {
  id: string;
  url_arquivo: string;
  tipo: string;
  duracao: number;
  qr_link?: string;
}

const mockNews: Record<string, string[]> = {
  technology: [
    "Tecnologia: IA generativa redefine processos industriais em 2026",
    "Tecnologia: Startups captam US$ 2 bi no 1º trimestre",
  ],
  sports: [
    "Esportes: Brasil lidera eliminatórias sul-americanas",
    "Esportes: NBA anuncia expansão para novas cidades",
  ],
  business: [
    "Economia: Mercado otimista com nova pauta de importações",
    "Economia: Banco Central traça metas rigorosas pro semestre",
  ],
};

// Componente helper para "Intervenções Remotas" do Desenvolvedor
function RemoteAlertOverlay({ active, message, type }: { active: boolean, message: string, type: 'alert' | 'media' | null }) {
  if (!active || type !== 'alert') return null;
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-red-900/90 backdrop-blur-md animate-in fade-in zoom-in duration-500">
      <div className="flex flex-col items-center p-12 text-center animate-pulse">
        <AlertTriangle className="w-24 h-24 text-white mb-6 drop-shadow-lg" />
        <h1 className="text-5xl font-black text-white tracking-widest uppercase shadow-black drop-shadow-md">Atenção!</h1>
        <p className="text-2xl text-white mt-4 font-medium max-w-2xl leading-relaxed">{message || "Mensagem de Alerta da Administração Master"}</p>
      </div>
    </div>
  );
}

// Helper to check if widget is enabled
function isWidgetEnabled(wc: any, key: string): boolean {
  if (!wc) return true; // default: all enabled
  return wc[key]?.enabled !== false;
}

// Sidebar compartilhada do modo Corporativo / L-Bar
function PlayerSidebar({ city, currentQrLink, wc }: { city: string; currentQrLink?: string; wc?: any }) {
  const qrDefaultUrl = wc?.qr?.default_url || "";
  const qrUrl = currentQrLink || qrDefaultUrl;

  return (
    <div className="w-[300px] flex flex-col player-zone-sidebar bg-[#0A0D14] border-l border-white/5 z-20 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-600/5 rounded-full blur-[80px] translate-y-1/3 -translate-x-1/2 pointer-events-none" />
      {isWidgetEnabled(wc, "clock") && (
        <div className="p-4 bg-gradient-to-b from-white/5 to-transparent">
          <ClockWidget />
        </div>
      )}
      <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-2" />
      <div className="flex-1 overflow-hidden relative">
        <div className="absolute inset-0 p-4 space-y-5 overflow-hidden">
          {isWidgetEnabled(wc, "weather") && city && (
            <div className="bg-white/5 rounded-2xl border border-white/5 backdrop-blur-sm shadow-xl p-2 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-tr from-sky-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <WeatherWidget city={city} />
            </div>
          )}
          {isWidgetEnabled(wc, "finance") && (
            <div className="bg-white/5 rounded-2xl border border-white/5 backdrop-blur-sm shadow-xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <FinanceWidget />
            </div>
          )}
          {isWidgetEnabled(wc, "social") && (
            <div className="bg-white/5 rounded-2xl border border-white/5 backdrop-blur-sm shadow-xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-tr from-pink-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <SocialWidget />
            </div>
          )}
          {isWidgetEnabled(wc, "qr") && (
            <div className="bg-white/5 rounded-2xl border border-white/5 backdrop-blur-sm shadow-xl relative overflow-hidden group">
              <QRWidget url={qrUrl} />
            </div>
          )}
          {isWidgetEnabled(wc, "camera") && (
            <div className="bg-white/5 rounded-2xl border border-white/5 backdrop-blur-sm shadow-xl relative overflow-hidden group">
              <CameraWidget />
            </div>
          )}
        </div>
      </div>
      <div className="px-6 py-4 text-center border-t border-white/5 bg-black/20">
        <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-indigo-500/60 pb-1">Powered By</p>
        <p className="text-xs font-display font-bold text-white/50 tracking-widest">SIGNAGE OS</p>
      </div>
    </div>
  );
}

// Zona de mídia principal
function MediaZone({ current, fading, videoRef }: {
  current: MediaItem | undefined;
  fading: boolean;
  videoRef: React.RefObject<HTMLVideoElement>;
}) {
  return (
    <div className={`absolute inset-0 transition-all duration-1000 ease-in-out ${fading ? "opacity-0 blur-sm scale-105" : "opacity-100 blur-0 scale-100"}`}>
      {current?.tipo === "video" ? (
        <video ref={videoRef} key={current.id} src={current.url_arquivo} className="h-full w-full object-cover" muted autoPlay playsInline />
      ) : (
        <img key={current?.id} src={current?.url_arquivo} alt="" className="h-full w-full object-contain bg-black" />
      )}
    </div>
  );
}

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
  const [widgetConfig, setWidgetConfig] = useState<any>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Estado de intervenção remota do Master
  const [remoteIntervention, setRemoteIntervention] = useState<{active: boolean, message: string, type: 'alert'|'media'|null}>({active: false, message: '', type: null});

  // Heartbeat – envia sinalização ao Supabase a cada 60s
  useEffect(() => {
    if (!id_cliente) return;
    const sendHeartbeat = async () => {
      try {
        await supabase
          .from("profiles")
          .update({ last_seen: new Date().toISOString() } as any)
          .eq("user_id", id_cliente);
      } catch { /* silently ignore if column doesn't exist yet */ }
    };
    sendHeartbeat(); // Envia imediatamente ao carregar
    const hbInterval = setInterval(sendHeartbeat, 60000);
    return () => clearInterval(hbInterval);
  }, [id_cliente]);

  // Proof of Play – loga toda vez que uma mídia terminar
  const logPlay = useCallback(async (mediaItem: MediaItem) => {
    if (!id_cliente || !mediaItem) return;
    try {
      await (supabase as any)
        .from("play_logs")
        .insert({
          player_id: id_cliente,
          media_id: mediaItem.id,
          media_name: mediaItem.url_arquivo.split("/").pop() || "unknown",
          media_type: mediaItem.tipo,
          played_at: new Date().toISOString(),
          duration_sec: mediaItem.duracao || 10,
        });
    } catch { /* silently ignore if table doesn't exist yet */ }
  }, [id_cliente]);

  useEffect(() => {
    if (!id_cliente) return;

    const fetchData = async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("config_clima, config_noticias, template, widget_config")
        .eq("user_id", id_cliente)
        .single();
        
      if (profile) {
        setCity(profile.config_clima || "São Paulo");
        setTemplate((profile as any).template || "corporativo");
        setNewsCategory(profile.config_noticias || "technology");
        setWidgetConfig((profile as any).widget_config || null);
      }

      let mediaIds: string[] | null = null;
      if (playlistId) {
        const { data: playlist } = await supabase
          .from("playlists").select("ordem_arquivos").eq("id", playlistId).single();
        if (playlist) mediaIds = playlist.ordem_arquivos as string[];
      }

      const { data: allMedia } = await supabase
        .from("media_library").select("*").eq("client_id", id_cliente);

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

    // Escuta Broadcast via Supabase Realtime
    const channel = supabase
      .channel(`player-${id_cliente}`)
      .on("broadcast", { event: "remote-intervention" }, ({ payload }) => {
        if (payload) {
          setRemoteIntervention({ active: payload.active, message: payload.message, type: payload.type });
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [id_cliente, playlistId]);

  const goToNext = useCallback(() => {
    if (remoteIntervention.active) return;
    // Log da mídia atual antes de avançar
    const currentItem = mediaItems[currentIndex];
    if (currentItem) logPlay(currentItem);

    setFading(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % mediaItems.length);
      setFading(false);
    }, 800);
  }, [mediaItems, currentIndex, remoteIntervention.active, logPlay]);

  useEffect(() => {
    if (mediaItems.length === 0 || remoteIntervention.active) return;
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
  }, [currentIndex, mediaItems, goToNext, remoteIntervention.active]);

  const headlines = mockNews[newsCategory] || mockNews.technology;
  const current = mediaItems[currentIndex];
  const currentQrLink = current?.qr_link;

  if (mediaItems.length === 0) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-black">
        <div className="text-center space-y-6">
          <div className="mx-auto h-20 w-20 animate-pulse rounded-full border-4 border-indigo-500/30 flex items-center justify-center shadow-[0_0_50px_rgba(99,102,241,0.2)]">
            <Megaphone className="h-8 w-8 text-indigo-500 opacity-50" />
          </div>
          <div>
            <p className="font-display text-2xl font-bold tracking-widest uppercase text-white/40">Signage OS</p>
            <p className="text-xs text-white/20 mt-1 uppercase tracking-widest">Aguardando Programação Local</p>
          </div>
        </div>
      </div>
    );
  }

  // ── RETAIL MODE: Tela Cheia de Impacto ──
  if (template === "varejo") {
    return (
      <div className="h-screen w-screen flex flex-col overflow-hidden bg-black relative">
        <RemoteAlertOverlay active={remoteIntervention.active} message={remoteIntervention.message} type={remoteIntervention.type} />
        
        <div className="flex-1 relative bg-black">
          <div className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${fading ? "opacity-0 scale-105" : "opacity-100 scale-100"}`}>
            {current?.tipo === "video" ? (
              <video ref={videoRef} key={current.id} src={current.url_arquivo} className="h-full w-full object-cover" muted autoPlay playsInline />
            ) : (
              <img key={current?.id} src={current?.url_arquivo} alt="" className="h-full w-full object-contain bg-black" />
            )}
          </div>

          {/* QR Overlay dinâmico - flutua no canto quando há link */}
          {currentQrLink && (
            <div className="absolute bottom-16 right-6 z-20 bg-white/10 backdrop-blur-md rounded-2xl p-2 border border-white/20 shadow-2xl animate-in fade-in duration-500">
              <QRWidget url={currentQrLink} compact />
            </div>
          )}
          
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/80 to-transparent z-10 pointer-events-none" />
          
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20">
            {mediaItems.map((_, i) => (
              <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${i === currentIndex ? "w-8 bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]" : "w-2 bg-white/20"}`} />
            ))}
          </div>
        </div>
        
        <div className="z-20 relative shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
           <NewsTicker headlines={headlines} />
        </div>
      </div>
    );
  }

  // ── L-BAR MODE: Vídeo + Sidebar Vertical + Ticker ──
  if (template === "lbar") {
    return (
      <div className="h-screen w-screen flex flex-col overflow-hidden bg-[#0A0D14] relative">
        <RemoteAlertOverlay active={remoteIntervention.active} message={remoteIntervention.message} type={remoteIntervention.type} />
        
        <div className="flex-1 flex min-h-0">
          {/* Zona Principal */}
          <div className="flex-1 relative bg-black overflow-hidden">
            <MediaZone current={current} fading={fading} videoRef={videoRef} />
            <div className="absolute top-0 left-0 right-0 h-1 bg-black/20 z-20">
              <div
                className="h-full bg-amber-500 transition-all duration-1000 ease-linear"
                style={{ width: `${((currentIndex + 1) / mediaItems.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Sidebar compacta (L-bar lateral) */}
          <div className="w-52 flex flex-col bg-[#0A0D14] border-l border-white/5 relative overflow-hidden z-20">
            <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 to-transparent pointer-events-none" />
            <div className="p-3 bg-gradient-to-b from-white/5 to-transparent">
              <ClockWidget compact />
            </div>
            <div className="w-full h-px bg-white/10" />
            <div className="flex-1 p-3 space-y-3 overflow-hidden">
              {city && (
                <div className="bg-white/5 rounded-xl border border-white/5 p-1">
                  <WeatherWidget city={city} compact />
                </div>
              )}
              <div className="bg-white/5 rounded-xl border border-white/5 overflow-hidden">
                <QRWidget url={currentQrLink} compact />
              </div>
            </div>
            <div className="px-3 py-3 text-center border-t border-white/5">
              <p className="text-[9px] uppercase font-bold tracking-[0.2em] text-amber-500/50">SignageOS</p>
            </div>
          </div>
        </div>

        {/* Rodapé Ticker */}
        <div className="z-30 shadow-[0_-5px_30px_rgba(0,0,0,0.5)] border-t border-white/10">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-amber-500/0 via-amber-500/50 to-amber-500/0" />
          <NewsTicker headlines={headlines} accentColor="amber" />
        </div>
      </div>
    );
  }

  // ── SPLIT MODE: 60/40 Dual Zone ──
  if (template === "split") {
    return (
      <div className="h-screen w-screen flex flex-col overflow-hidden bg-[#0A0D14] relative">
        <RemoteAlertOverlay active={remoteIntervention.active} message={remoteIntervention.message} type={remoteIntervention.type} />

        <div className="flex-1 flex min-h-0">
          {/* Zona Principal 60% */}
          <div className="flex-[3] relative bg-black overflow-hidden">
            <MediaZone current={current} fading={fading} videoRef={videoRef} />
            <div className="absolute top-0 left-0 right-0 h-1 bg-black/20 z-20">
              <div
                className="h-full bg-orange-500 transition-all duration-1000 ease-linear"
                style={{ width: `${((currentIndex + 1) / mediaItems.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Divisor */}
          <div className="w-px bg-white/10 z-10" />

          {/* Zona Widget 40% */}
          <div className="flex-[2] flex flex-col bg-[#0D111A] relative overflow-hidden z-20">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent pointer-events-none" />
            
            <div className="p-5 bg-gradient-to-b from-white/5 to-transparent border-b border-white/5">
              <ClockWidget />
            </div>

            <div className="flex-1 p-4 space-y-4 overflow-hidden">
              {city && (
                <div className="bg-white/5 rounded-2xl border border-white/5 backdrop-blur-sm p-2">
                  <WeatherWidget city={city} />
                </div>
              )}
              <div className="bg-white/5 rounded-2xl border border-white/5 backdrop-blur-sm overflow-hidden">
                <SocialWidget />
              </div>
              <div className="bg-white/5 rounded-2xl border border-white/5 backdrop-blur-sm overflow-hidden">
                <QRWidget url={currentQrLink} />
              </div>
            </div>

            <div className="px-5 py-4 text-center border-t border-white/5">
              <p className="text-[9px] uppercase font-bold tracking-[0.2em] text-orange-500/50">SignageOS</p>
            </div>
          </div>
        </div>

        {/* Ticker */}
        <div className="z-30 shadow-[0_-5px_30px_rgba(0,0,0,0.5)] border-t border-white/10">
          <NewsTicker headlines={headlines} accentColor="orange" />
        </div>
      </div>
    );
  }

  // ── CORPORATE MODE: Layout de Zonas Inteligentes e Premium ──
  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-slate-900 relative">
      <RemoteAlertOverlay active={remoteIntervention.active} message={remoteIntervention.message} type={remoteIntervention.type} />
      
      <div className="flex-1 flex min-h-0 relative">
        {/* Zona 1: Main Media */}
        <div className="flex-1 relative player-zone-main bg-black shadow-[10px_0_30px_rgba(0,0,0,0.5)] z-10 overflow-hidden">
          <MediaZone current={current} fading={fading} videoRef={videoRef} />
          {/* Progress Overlay bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-black/20 z-20 flex">
             <div 
               className="h-full bg-indigo-500 transition-all duration-1000 ease-linear" 
               style={{ width: `${((currentIndex + 1) / mediaItems.length) * 100}%` }} 
             />
          </div>
        </div>

        {/* Zona 2: Sidebar Widgets */}
        <PlayerSidebar city={city} currentQrLink={currentQrLink} />
      </div>

      {/* Zona 3: Footer Ticker */}
      <div className="z-30 shadow-[0_-5px_30px_rgba(0,0,0,0.5)] border-t border-white/10 relative">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-indigo-500/0 via-indigo-500/50 to-indigo-500/0" />
        <NewsTicker headlines={headlines} />
      </div>
    </div>
  );
}
