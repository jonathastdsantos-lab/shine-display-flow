import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MediaItem, RemoteIntervention, mockNews } from "@/pages/player/shared";
import type { PlayerErrorInfo } from "@/pages/player/PlayerError";
import type { Playlist, StoredWidgetConfig, LayoutConfig } from "@/types/player";
import { toPlaylist } from "@/types/player";

export interface PlayerSyncState {
  mediaItems: MediaItem[];
  clientId: string | null;
  city: string;
  template: string;
  newsCategory: string;
  headlines: string[];
  widgetConfig: StoredWidgetConfig | null;
  layoutConfig: LayoutConfig | null;
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
  const e = err as { message?: string; code?: string; details?: string; hint?: string };
  console.error(`[Player:${scope}]`, {
    message: e?.message || String(err),
    code: e?.code,
    details: e?.details,
    hint: e?.hint,
    ...ctx,
  });
}

const errMsg = (err: unknown): string | undefined =>
  (err as { message?: string })?.message;

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
  const [widgetConfig, setWidgetConfig] = useState<StoredWidgetConfig | null>(null);
  const [layoutConfig, setLayoutConfig] = useState<LayoutConfig | null>(null);
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
  const [error, setError] = useState<PlayerErrorInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [retryTick, setRetryTick] = useState(0);
  const retry = useCallback(() => {
    setError(null);
    setRetryTick((n) => n + 1);
  }, []);

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

  // ── fetchData principal (com tratamento de erro estruturado) ──
  const fetchData = useCallback(async () => {
    if (!playlist_id) return;
    setLoading(true);

    // 1. Playlist
    let playlist: any = null;
    try {
      const { data, error: err } = await supabase
        .from("playlists")
        .select("*")
        .eq("id", playlist_id)
        .maybeSingle();
      if (err) throw err;
      playlist = data;
    } catch (err) {
      logError("playlists.fetch", err, { playlist_id });
      setError({
        kind: "playlist_fetch",
        message: "Não conseguimos contatar o servidor para carregar a tela.",
        detail: (err as any)?.message,
      });
      setLoading(false);
      return;
    }

    if (!playlist) {
      console.warn("[Player:playlists.fetch] Tela não encontrada", { playlist_id });
      setError({
        kind: "playlist_not_found",
        message: `Nenhuma tela cadastrada com o ID informado.`,
        detail: playlist_id,
      });
      setLoading(false);
      return;
    }

    setClientId(playlist.client_id);

    // 2. Profile (fallback de config)
    let finalCity = (playlist as any).config_clima;
    let finalNews = (playlist as any).config_noticias;
    let finalIG = (playlist as any).instagram_handle;

    if (!finalCity || !finalNews || !finalIG) {
      try {
        const { data: profile, error: err } = await supabase
          .from("profiles")
          .select("config_clima, config_noticias, instagram_handle")
          .eq("user_id", playlist.client_id)
          .maybeSingle();
        if (err) throw err;
        if (profile) {
          finalCity = finalCity || profile.config_clima;
          finalNews = finalNews || profile.config_noticias;
          finalIG = finalIG || profile.instagram_handle;
        }
      } catch (err) {
        // Não bloqueia a renderização — apenas usa defaults
        logError("profiles.fetch", err, { client_id: playlist.client_id });
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

    // 3. Mídias — retry com backoff exponencial (1s, 2s, 4s)
    const delays = [1000, 2000, 4000];
    let allMedia: any[] | null = null;
    let lastErr: unknown = null;
    for (let attempt = 0; attempt < delays.length; attempt++) {
      try {
        const { data, error: err } = await supabase
          .from("media_library")
          .select("*")
          .eq("client_id", playlist.client_id);
        if (err) throw err;
        allMedia = data || [];
        lastErr = null;
        if (attempt > 0) {
          console.info(`[Player:media_library.fetch] sucesso na tentativa ${attempt + 1}`);
        }
        break;
      } catch (err) {
        lastErr = err;
        logError("media_library.fetch", err, {
          attempt: attempt + 1,
          client_id: playlist.client_id,
        });
        if (attempt < delays.length - 1) {
          await sleep(delays[attempt]);
        }
      }
    }

    if (lastErr) {
      setError({
        kind: "media_fetch",
        message: "Não foi possível carregar as mídias após 3 tentativas.",
        detail: (lastErr as any)?.message,
      });
      setLoading(false);
      return;
    }

    if (allMedia) {
      const mediaIds = playlist.ordem_arquivos as string[];
      if (mediaIds && mediaIds.length > 0) {
        const ordered = mediaIds
          .map((mid) => allMedia!.find((m: any) => m.id === mid))
          .filter(Boolean) as MediaItem[];
        setMediaItems(ordered);
      } else {
        setMediaItems(allMedia as any);
      }
    }

    setError(null);
    setLoading(false);
  }, [playlist_id, retryTick]);

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
    error,
    loading,
    retry,
  };
}
