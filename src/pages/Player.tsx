import { useParams } from "react-router-dom";
import { Megaphone } from "lucide-react";
import { usePlayerSync } from "@/hooks/usePlayerSync";
import { useMediaPlayback } from "@/hooks/useMediaPlayback";
import CorporateTemplate from "@/pages/player/templates/CorporateTemplate";
import RetailTemplate from "@/pages/player/templates/RetailTemplate";
import LBarTemplate from "@/pages/player/templates/LBarTemplate";
import SplitTemplate from "@/pages/player/templates/SplitTemplate";
import CustomTemplate from "@/pages/player/templates/CustomTemplate";
import PlayerError from "@/pages/player/PlayerError";
import type { TemplateProps } from "@/pages/player/templates/types";

export default function Player() {
  const { playlist_id } = useParams<{ playlist_id: string }>();
  const sync = usePlayerSync(playlist_id);
  const play = useMediaPlayback({
    playlistId: playlist_id,
    mediaItems: sync.mediaItems,
    paused: sync.paused,
    remoteActive: sync.remoteIntervention.active,
    adWidgetEnabled: sync.adWidgetEnabled,
    nextCommandSignal: sync.nextCommandSignal,
  });

  if (sync.error) {
    return (
      <PlayerError
        error={sync.error}
        onRetry={sync.retry}
        autoRetrySeconds={sync.error.kind === "playlist_not_found" ? 0 : 15}
      />
    );
  }

  if (sync.mediaItems.length === 0) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-black">
        <div className="text-center space-y-6">
          <div className="mx-auto h-20 w-20 animate-pulse rounded-full border-4 border-indigo-500/30 flex items-center justify-center shadow-[0_0_50px_rgba(99,102,241,0.2)]">
            <Megaphone className="h-8 w-8 text-indigo-500 opacity-50" />
          </div>
          <div>
            <p className="font-display text-2xl font-bold tracking-widest uppercase text-white/40">Signage OS</p>
            <p className="text-xs text-white/20 mt-1 uppercase tracking-widest">
              {sync.loading ? "Carregando programação..." : "Aguardando Programação Local"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const props: TemplateProps = {
    playlistId: playlist_id,
    clientId: sync.clientId,
    mediaItems: sync.mediaItems,
    current: play.current,
    currentIndex: play.currentIndex,
    fading: play.fading,
    videoRef: play.videoRef,
    city: sync.city,
    headlines: sync.headlines,
    widgetConfig: sync.widgetConfig,
    layoutConfig: sync.layoutConfig,
    igHandle: sync.igHandle,
    currentQrLink: play.current?.qr_link || sync.widgetConfig?.qr?.default_url || undefined,
    remoteIntervention: sync.remoteIntervention,
    paused: sync.paused,
    showAdOverlay: play.showAdOverlay,
    adWidgetUrl: sync.adWidgetUrl,
  };

  if (sync.layoutConfig?.is_custom && Array.isArray(sync.layoutConfig?.zones) && sync.layoutConfig.zones.length > 0) {
    return <CustomTemplate {...props} />;
  }
  if (sync.template === "varejo") return <RetailTemplate {...props} />;
  if (sync.template === "lbar") return <LBarTemplate {...props} />;
  if (sync.template === "split") return <SplitTemplate {...props} />;
  return <CorporateTemplate {...props} />;
}
