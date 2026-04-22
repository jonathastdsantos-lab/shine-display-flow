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
import ContentFeedWidget from "@/components/ContentFeedWidget";
import MotivationalWidget from "@/components/MotivationalWidget";
import CryptoProWidget from "@/components/CryptoProWidget";
import KPIDashboard from "@/components/KPIDashboard";
import TransitWidget from "@/components/TransitWidget";
import CountdownWidget from "@/components/CountdownWidget";
import { AlertTriangle, Megaphone, Pause } from "lucide-react";
import AdvertiseHereWidget from "@/components/AdvertiseHereWidget";
import type { Zone } from "@/utils/AILayoutAssistant";
import type { BusinessSegment } from "@/utils/ContentFeed";

// Wrapper for content_feed zone in custom layouts
function ContentFeedZone({ segment }: { segment: string }) {
  return <ContentFeedWidget segment={segment as BusinessSegment} />;
}

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
function PlayerSidebar({ city, currentQrLink, wc, igHandle }: { city: string; currentQrLink?: string; wc?: any; igHandle?: string }) {
  const qrDefaultUrl = wc?.qr?.default_url || "";
  const qrUrl = currentQrLink || qrDefaultUrl;

  return (
    <div className="w-[300px] flex flex-col player-zone-sidebar bg-[#0A0D14] border-l border-white/5 z-20 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-600/5 rounded-full blur-[80px] translate-y-1/3 -translate-x-1/2 pointer-events-none" />
      {isWidgetEnabled(wc, "clock") && (
        <div className="p-4 bg-gradient-to-b from-white/5 to-transparent">
          <ClockWidget 
            weatherCity={isWidgetEnabled(wc, "weather") && wc?.clock?.showWeather !== false ? (city || "auto") : undefined}
            showWeather={wc?.clock?.showWeather !== false}
          />
        </div>
      )}
      <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-2" />
      <div className="flex-1 overflow-hidden relative">
        <div className="absolute inset-0 p-4 space-y-5 overflow-hidden">
          {/* Removido WeatherWidget standalone para evitar duplicidade com o relógio integrado */}
          {isWidgetEnabled(wc, "finance") && (
            <div className="bg-white/5 rounded-2xl border border-white/5 backdrop-blur-sm shadow-xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <FinanceWidget />
            </div>
          )}
          {isWidgetEnabled(wc, "social") && (
            <div className="bg-white/5 rounded-2xl border border-white/5 backdrop-blur-sm shadow-xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-tr from-pink-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <SocialWidget instagramHandle={igHandle} />
            </div>
          )}
          {isWidgetEnabled(wc, "qr") && (
            <div className="bg-white/5 rounded-2xl border border-white/5 backdrop-blur-sm shadow-xl relative overflow-hidden group">
              <QRWidget url={qrUrl} />
            </div>
          )}
          {isWidgetEnabled(wc, "camera") && (
            <div className="bg-white/5 rounded-2xl border border-white/5 backdrop-blur-sm shadow-xl relative overflow-hidden group">
              <CameraWidget url={wc?.camera?.url || ""} label={wc?.camera?.label || "Câmera 01"} compact />
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
  const { playlist_id } = useParams<{ playlist_id: string }>();
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [clientId, setClientId] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fading, setFading] = useState(false);
  const [city, setCity] = useState("São Paulo");
  const [template, setTemplate] = useState("corporativo");
  const [newsCategory, setNewsCategory] = useState("technology");
  const [headlines, setHeadlines] = useState<string[]>([]);
  const [widgetConfig, setWidgetConfig] = useState<any>(null);
  const [layoutConfig, setLayoutConfig] = useState<any>(null);
  const [igHandle, setIgHandle] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);

  // Estado de intervenção remota do Master
  const [remoteIntervention, setRemoteIntervention] = useState<{active: boolean, message: string, type: 'alert'|'media'|null}>({active: false, message: '', type: null});

  // Controle remoto: pause/play
  const [paused, setPaused] = useState(false);

  // Anuncie Aqui
  const [adWidgetEnabled, setAdWidgetEnabled] = useState(true);
  const [adWidgetUrl, setAdWidgetUrl] = useState<string | undefined>(undefined);
  const [showAdOverlay, setShowAdOverlay] = useState(false);
  const [mediaPlayCount, setMediaPlayCount] = useState(0);

  // Heartbeat por TELA (playlist) – atualiza last_heartbeat a cada 30s
  useEffect(() => {
    if (!playlist_id) return;
    const sendHeartbeat = async () => {
      try {
        await (supabase as any).rpc("update_playlist_heartbeat", { p_playlist_id: playlist_id });
      } catch (err) {
        console.warn("Heartbeat falhou:", err);
      }
    };
    sendHeartbeat();
    const hbInterval = setInterval(sendHeartbeat, 30000);
    return () => clearInterval(hbInterval);
  }, [playlist_id]);

  // Proof of Play – loga toda vez que uma mídia terminar
  const logPlay = useCallback(async (mediaItem: MediaItem) => {
    if (!clientId || !mediaItem) return;
    try {
      await (supabase as any)
        .from("play_logs")
        .insert({
          player_id: playlist_id,
          media_id: mediaItem.id,
          media_name: mediaItem.url_arquivo.split("/").pop() || "unknown",
          media_type: mediaItem.tipo,
          played_at: new Date().toISOString(),
          duration_sec: mediaItem.duracao || 10,
        });
    } catch { /* silently ignore */ }
  }, [clientId, playlist_id]);

  const fetchNews = useCallback(async (category: string, location?: string) => {
    try {
      console.log(`📡 Buscando notícias reais: ${category}${location ? ' @ ' + location : ''}`);
      const { data, error } = await supabase.functions.invoke('get-news', {
        body: { category, location }
      });
      
      if (error) throw error;
      if (data?.titles) {
        setHeadlines(data.titles);
      }
    } catch (err) {
      console.error("Erro ao buscar notícias:", err);
      // Fallback para mock se falhar
      const fallback = mockNews[category as keyof typeof mockNews] || mockNews.technology;
      setHeadlines(fallback);
    }
  }, []);

  const fetchData = useCallback(async () => {
    if (!playlist_id) return;

    // 1. Buscar as configurações da tela (Playlist)
    const { data: playlist } = await supabase
      .from("playlists")
      .select("*")
      .eq("id", playlist_id)
      .single();
      
    if (playlist) {
      setClientId(playlist.client_id);
      
      // Fallback logic: Screen Config -> Profile Config -> Defaults
      let finalCity = (playlist as any).config_clima;
      let finalNews = (playlist as any).config_noticias;
      let finalIG = (playlist as any).instagram_handle;
      
      if (!finalCity || !finalNews || !finalIG) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("config_clima, config_noticias, instagram_handle")
          .eq("user_id", playlist.client_id)
          .single();
          
        if (profile) {
          finalCity = finalCity || profile.config_clima;
          finalNews = finalNews || profile.config_noticias;
          finalIG = finalIG || profile.instagram_handle;
        }
      }

      setCity(finalCity || "São Paulo");
      setTemplate((playlist as any).template || "corporativo");
      setNewsCategory(finalNews || "technology");
      setWidgetConfig((playlist as any).widget_config || null);
      setLayoutConfig((playlist as any).layout_config || null);
      setIgHandle(finalIG || "");

      // 2. Buscar mídias da biblioteca do cliente
      const { data: allMedia } = await supabase
        .from("media_library")
        .select("*")
        .eq("client_id", playlist.client_id);

      if (allMedia) {
        const mediaIds = playlist.ordem_arquivos as string[];
        if (mediaIds && mediaIds.length > 0) {
          const ordered = mediaIds
            .map((mid) => allMedia.find((m: any) => m.id === mid))
            .filter(Boolean) as MediaItem[];
          setMediaItems(ordered);
        } else {
          setMediaItems(allMedia as any);
        }
      }
    }
  }, [playlist_id]);

  // Realtime Sync Listener + Safety Polling
  useEffect(() => {
    if (!playlist_id || !fetchData) return;

    console.log(`🔌 Iniciando conexão Realtime para tela: ${playlist_id}`);

    const channel = supabase
      .channel(`sync-${playlist_id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'playlists',
          filter: `id=eq.${playlist_id}`
        },
        (payload) => {
          console.log("⚡ Sinal de Sincronização Recebido via Realtime:", payload);
          fetchData();
        }
      )
      .subscribe((status) => {
        console.log(`📡 Status da Conexão Realtime: ${status}`);
        if (status === 'SUBSCRIBED') {
          console.log("✅ Inscrito com sucesso no canal de sincronização.");
        }
        if (status === 'CHANNEL_ERROR') {
          console.error("❌ Erro ao conectar ao Realtime. Verifique as configurações de replicação no Supabase.");
        }
      });

    // Plano B: Polling de segurança a cada 5 minutos
    // Garante que a tela atualizará mesmo se o sinal realtime falhar
    const pollingInterval = setInterval(() => {
      console.log("🔄 Executando busca de rotina (Polling de segurança)...");
      fetchData();
    }, 5 * 60 * 1000);

    return () => {
      console.log("🔌 Desconectando canal Realtime");
      supabase.removeChannel(channel);
      clearInterval(pollingInterval);
    };
  }, [playlist_id, fetchData]);

  useEffect(() => {
    fetchData();
    // Busca inicial de notícias
    fetchNews(newsCategory);
    
    document.documentElement.requestFullscreen?.().catch(() => {});

    // Escuta Broadcast via Supabase Realtime
    const channel = supabase
      .channel(`player-${clientId}`)
      .on("broadcast", { event: "remote-intervention" }, ({ payload }) => {
        if (payload) {
          setRemoteIntervention({ active: payload.active, message: payload.message, type: payload.type });
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [clientId, playlist_id]);

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

  // Busca notícias quando a categoria ou configuração muda
  useEffect(() => {
    // Determina se há uma localização específica no ticker global do layout customizado
    const newsZone = layoutConfig?.zones?.find((z: any) => z.type === "news");
    const location = newsZone?.config?.location || "";
    const category = newsZone?.config?.category || newsCategory;
    
    fetchNews(category, location);

    // Refresh a cada 30 minutos
    const interval = setInterval(() => fetchNews(category, location), 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [newsCategory, layoutConfig, fetchNews]);

  const current = mediaItems[currentIndex];
  const currentQrLink = current?.qr_link || widgetConfig?.qr?.default_url || undefined;

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

  // ── CUSTOM MODE: Layout Personalizado (Arrastar & Soltar) ──
  if (layoutConfig?.is_custom && Array.isArray(layoutConfig?.zones) && layoutConfig.zones.length > 0) {
    const renderZone = (zone: Zone) => {
      const style: React.CSSProperties = {
        position: "absolute",
        left: `${zone.x}%`,
        top: `${zone.y}%`,
        width: `${zone.width}%`,
        height: `${zone.height}%`,
        overflow: "hidden",
        opacity: zone.opacity !== undefined ? zone.opacity / 100 : 1,
        borderRadius: zone.borderRadius ? `${zone.borderRadius}px` : undefined,
        backgroundColor: zone.backgroundColor || undefined,
      };

      switch (zone.type) {
        case "media":
          const objectFit = zone.config?.fit === "contain" ? "object-contain" : "object-cover";
          return (
            <div key={zone.id} style={style} className="bg-black">
              {current?.tipo === "video" ? (
                <video ref={videoRef} key={current.id} src={current.url_arquivo} className={`w-full h-full ${objectFit}`} muted autoPlay playsInline />
              ) : (
                <img key={current?.id} src={current?.url_arquivo} alt="" className={`w-full h-full ${objectFit} bg-black`} />
              )}
            </div>
          );
        case "clock":
          return (
            <div key={zone.id} style={style} className="bg-[#0A0D14] flex items-center justify-center p-2">
              <ClockWidget 
                weatherCity={zone.config?.city || city} 
                fontSize={zone.config?.fontSize} 
                variant={zone.config?.variant}
                showWeather={zone.config?.showWeather !== false} 
              />
            </div>
          );
        case "weather":
          return (
            <div key={zone.id} style={style} className="bg-[#0A0D14] p-2">
              <WeatherWidget city={zone.config?.city || city} fontSize={zone.config?.fontSize} variant={zone.config?.variant} />
            </div>
          );
        case "news":
          return (
            <div key={zone.id} style={{ ...style, overflow: "hidden" }} className="bg-[#0A0D14]">
              <NewsTicker headlines={headlines} />
            </div>
          );
        case "finance":
          return (
            <div key={zone.id} style={style} className="bg-[#0A0D14] p-2">
              <FinanceWidget />
            </div>
          );
        case "social":
          return (
            <div key={zone.id} style={style} className="bg-[#0A0D14] p-2">
              <SocialWidget instagramHandle={zone.config?.handle || igHandle} />
            </div>
          );
        case "qr":
          return (
            <div key={zone.id} style={style} className="bg-[#0A0D14] flex items-center justify-center p-3">
              <QRWidget url={zone.config?.url || currentQrLink || ""} size={zone.config?.size} />
            </div>
          );
        case "camera":
          return (
            <div key={zone.id} style={style} className="bg-[#0A0D14] p-2">
              <CameraWidget />
            </div>
          );
        case "text":
          return (
            <div key={zone.id} style={style} className="bg-[#0A0D14] flex items-center justify-center p-4">
              <p className="text-white leading-snug"
                style={{
                  fontSize: zone.config?.fontSize ? `${zone.config.fontSize}px` : "1.25rem",
                  textAlign: zone.config?.align || "center",
                  fontWeight: "bold",
                }}
              >{zone.config?.text || ""}</p>
            </div>
          );
        case "motivational":
          return (
            <div key={zone.id} style={style} className="bg-[#0A0D14]">
              <MotivationalWidget customQuote={zone.config?.customQuote} fontSize={zone.config?.fontSize} />
            </div>
          );
        case "crypto_pro":
          return (
            <div key={zone.id} style={style} className="bg-[#0A0D14]">
              <CryptoProWidget fontSize={zone.config?.fontSize} />
            </div>
          );
        case "kpi_dashboard":
          return (
            <div key={zone.id} style={style} className="bg-[#0A0D14]">
              <KPIDashboard 
                label={zone.config?.label}
                value={zone.config?.value}
                target={zone.config?.target}
                suffix={zone.config?.suffix}
                fontSize={zone.config?.fontSize}
              />
            </div>
          );
        case "transit":
          return (
            <div key={zone.id} style={style} className="bg-[#0A0D14]">
              <TransitWidget />
            </div>
          );
        case "countdown":
          return (
            <div key={zone.id} style={style} className="bg-[#0A0D14]">
              <CountdownWidget 
                targetDate={zone.config?.targetDate}
                label={zone.config?.label}
                fontSize={zone.config?.fontSize}
              />
            </div>
          );
        case "content_feed":
          return (
            <div key={zone.id} style={style} className="bg-[#0A0D14] overflow-hidden">
              <ContentFeedZone segment={zone.config?.segment || "corporativo"} />
            </div>
          );
        default:
          return null;
      }
    };

    return (
      <div className="h-screen w-screen relative bg-black overflow-hidden">
        <RemoteAlertOverlay active={remoteIntervention.active} message={remoteIntervention.message} type={remoteIntervention.type} />
        {(layoutConfig.zones as Zone[]).map(renderZone)}
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
          {isWidgetEnabled(widgetConfig, "qr") && currentQrLink && (
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
        
        {isWidgetEnabled(widgetConfig, "news") && layoutConfig?.show_ticker !== false && (
          <div className="z-20 relative shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
             <NewsTicker headlines={headlines} />
          </div>
        )}
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
          <div 
            className="flex flex-col bg-[#0A0D14] border-l border-white/5 relative overflow-hidden z-20"
            style={{ width: layoutConfig?.sidebar_width ? `${layoutConfig.sidebar_width}px` : '208px' }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 to-transparent pointer-events-none" />
            <div className="p-3 bg-gradient-to-b from-white/5 to-transparent">
              <ClockWidget compact weatherCity={city || "auto"} />
            </div>
            <div className="w-full h-px bg-white/10" />
            <div className="flex-1 p-3 space-y-3 overflow-hidden">
              {/* Weather unificado com o relógio acima */}
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
        {layoutConfig?.show_ticker !== false && (
          <div className="z-30 shadow-[0_-5px_30px_rgba(0,0,0,0.5)] border-t border-white/10">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-amber-500/0 via-amber-500/50 to-amber-500/0" />
            <NewsTicker headlines={headlines} accentColor="amber" />
          </div>
        )}
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
          <div 
            className="relative bg-black overflow-hidden"
            style={{ flex: layoutConfig?.split_ratio || 60 }}
          >
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
          <div 
            className="flex flex-col bg-[#0D111A] relative overflow-hidden z-20"
            style={{ flex: 100 - (layoutConfig?.split_ratio || 60) }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent pointer-events-none" />
            
            <div className="p-5 bg-gradient-to-b from-white/5 to-transparent border-b border-white/5">
              <ClockWidget weatherCity={city || "auto"} />
            </div>

            <div className="flex-1 p-4 space-y-4 overflow-hidden">
              {/* Weather unificado com o relógio acima */}
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
        {layoutConfig?.show_ticker !== false && (
          <div className="z-30 shadow-[0_-5px_30px_rgba(0,0,0,0.5)] border-t border-white/10">
            <NewsTicker headlines={headlines} accentColor="orange" />
          </div>
        )}
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
        <div style={{ width: layoutConfig?.sidebar_width ? `${layoutConfig.sidebar_width}px` : '300px' }}>
          <PlayerSidebar city={city} currentQrLink={currentQrLink} wc={widgetConfig} igHandle={igHandle} />
        </div>
      </div>

      {/* Zona 3: Footer Ticker */}
      {layoutConfig?.show_ticker !== false && (
        <div className="z-30 shadow-[0_-5px_30px_rgba(0,0,0,0.5)] border-t border-white/10 relative">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-indigo-500/0 via-indigo-500/50 to-indigo-500/0" />
          <NewsTicker headlines={headlines} />
        </div>
      )}
    </div>
  );
}
