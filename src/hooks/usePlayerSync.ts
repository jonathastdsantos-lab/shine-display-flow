import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MediaItem, RemoteIntervention, mockNews } from "@/pages/player/shared";
import type { PlayerErrorInfo } from "@/pages/player/PlayerError";

export interface PlayerSyncState {
  mediaItems: MediaItem[];
  clientId: string | null;
  city: string;
  template: string;
  newsCategory: string;
  headlines: string[];
  widgetConfig: any;
  layoutConfig: any;
  igHandle: string;
  paused: boolean;
  adWidgetEnabled: boolean;
  adWidgetUrl: string | undefined;
  remoteIntervention: RemoteIntervention;
  /** Incrementa quando um comando remoto "next" é recebido. */
  nextCommandSignal: number;
  /** Erro atual da sincronização, se houver. */
  error: PlayerErrorInfo | null;
  /** Carregamento inicial em andamento. */
  loading: boolean;
  /** Força nova tentativa de fetchData. */
  retry: () => void;
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

function logError(scope: string, err: unknown, ctx: Record<string, unknown> = {}) {
  const e = err as any;
  console.error(`[Player:${scope}]`, {
    message: e?.message || String(err),
    code: e?.code,
    details: e?.details,
    hint: e?.hint,
    ...ctx,
  });
}

/**
 * Hook responsável por:
 *  - Sincronização da playlist (Realtime + Polling de segurança a cada 5min)
 *  - Heartbeat a cada 30s
 *  - Comandos remotos (pause / play / next / reload)
 *  - Intervenções remotas via Broadcast
 *  - Busca de notícias (com refresh a cada 30min)
 *  - Fullscreen-on-click
 */
export function usePlayerSync(playlist_id: string | undefined): PlayerSyncState {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [clientId, setClientId] = useState<string | null>(null);
  const [city, setCity] = useState("São Paulo");
  const [template, setTemplate] = useState("corporativo");
  const [newsCategory, setNewsCategory] = useState("technology");
  const [headlines, setHeadlines] = useState<string[]>([]);
  const [widgetConfig, setWidgetConfig] = useState<any>(null);
  const [layoutConfig, setLayoutConfig] = useState<any>(null);
  const [igHandle, setIgHandle] = useState("");
  const [paused, setPaused] = useState(false);
  const [adWidgetEnabled, setAdWidgetEnabled] = useState(true);
  const [adWidgetUrl, setAdWidgetUrl] = useState<string | undefined>(undefined);
  const [remoteIntervention, setRemoteIntervention] = useState<RemoteIntervention>({
    active: false,
    message: "",
    type: null,
  });
  const [nextCommandSignal, setNextCommandSignal] = useState(0);

  // ── Heartbeat por TELA (playlist) ──
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

  // ── Busca notícias ──
  const fetchNews = useCallback(async (category: string, location?: string) => {
    try {
      console.log(`📡 Buscando notícias reais: ${category}${location ? " @ " + location : ""}`);
      const { data, error } = await supabase.functions.invoke("get-news", {
        body: { category, location },
      });
      if (error) throw error;
      if (data?.titles) setHeadlines(data.titles);
    } catch (err) {
      console.error("Erro ao buscar notícias:", err);
      const fallback = mockNews[category as keyof typeof mockNews] || mockNews.technology;
      setHeadlines(fallback);
    }
  }, []);

  // ── fetchData principal ──
  const fetchData = useCallback(async () => {
    if (!playlist_id) return;

    const { data: playlist } = await supabase
      .from("playlists")
      .select("*")
      .eq("id", playlist_id)
      .single();

    if (!playlist) return;

    setClientId(playlist.client_id);

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

    setAdWidgetEnabled((playlist as any).ad_widget_enabled !== false);
    setAdWidgetUrl((playlist as any).ad_widget_url || undefined);
    setPaused((playlist as any).playback_state === "paused");

    // Comandos remotos
    const cmd = (playlist as any).remote_command;
    if (cmd) {
      if (cmd === "reload") {
        await (supabase as any).rpc("clear_remote_command", { p_playlist_id: playlist_id });
        setTimeout(() => window.location.reload(), 300);
        return;
      }
      if (cmd === "pause") setPaused(true);
      if (cmd === "play") setPaused(false);
      if (cmd === "next") setNextCommandSignal((n) => n + 1);
      await (supabase as any).rpc("clear_remote_command", { p_playlist_id: playlist_id });
    }

    // Mídias
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
  }, [playlist_id]);

  // ── Realtime + Polling de segurança ──
  useEffect(() => {
    if (!playlist_id) return;
    console.log(`🔌 Iniciando conexão Realtime para tela: ${playlist_id}`);

    const channel = supabase
      .channel(`sync-${playlist_id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "playlists",
          filter: `id=eq.${playlist_id}`,
        },
        (payload) => {
          console.log("⚡ Sinal de Sincronização Recebido via Realtime:", payload);
          fetchData();
        }
      )
      .subscribe((status) => {
        console.log(`📡 Status da Conexão Realtime: ${status}`);
        if (status === "SUBSCRIBED") {
          console.log("✅ Inscrito com sucesso no canal de sincronização.");
        }
        if (status === "CHANNEL_ERROR") {
          console.error("❌ Erro ao conectar ao Realtime.");
        }
      });

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

  // ── Bootstrap + Broadcast (intervenção remota) + Fullscreen ──
  useEffect(() => {
    fetchData();
    fetchNews(newsCategory);

    document.documentElement.requestFullscreen?.().catch(() => {});

    const tryFullscreen = () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen?.().catch(() => {});
      }
    };
    document.addEventListener("click", tryFullscreen);

    const channel = supabase
      .channel(`player-${clientId}`)
      .on("broadcast", { event: "remote-intervention" }, ({ payload }) => {
        if (payload) {
          setRemoteIntervention({
            active: payload.active,
            message: payload.message,
            type: payload.type,
          });
        }
      })
      .subscribe();

    return () => {
      document.removeEventListener("click", tryFullscreen);
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId, playlist_id]);

  // ── Notícias (refresh a cada 30min, escuta config customizada) ──
  useEffect(() => {
    const newsZone = layoutConfig?.zones?.find((z: any) => z.type === "news");
    const location = newsZone?.config?.location || "";
    const category = newsZone?.config?.category || newsCategory;

    fetchNews(category, location);
    const interval = setInterval(() => fetchNews(category, location), 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [newsCategory, layoutConfig, fetchNews]);

  return {
    mediaItems,
    clientId,
    city,
    template,
    newsCategory,
    headlines,
    widgetConfig,
    layoutConfig,
    igHandle,
    paused,
    adWidgetEnabled,
    adWidgetUrl,
    remoteIntervention,
    nextCommandSignal,
  };
}
