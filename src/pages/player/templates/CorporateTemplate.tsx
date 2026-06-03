import { Pause } from "lucide-react";
import NewsTicker from "@/components/NewsTicker";
import AdvertiseHereWidget from "@/components/AdvertiseHereWidget";
import { MediaZone, PlayerSidebar, RemoteAlertOverlay } from "@/pages/player/shared";
import type { TemplateProps } from "./types";

export default function CorporateTemplate(p: TemplateProps) {
  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-slate-900 relative">
      <RemoteAlertOverlay
        active={p.remoteIntervention.active}
        message={p.remoteIntervention.message}
        type={p.remoteIntervention.type}
      />
      {p.showAdOverlay && (
        <AdvertiseHereWidget
          customUrl={p.adWidgetUrl}
          playlistId={p.playlistId}
          clientId={p.clientId || undefined}
        />
      )}
      {p.paused && (
        <div className="absolute top-4 right-4 z-40 px-3 py-1.5 bg-amber-500 text-black text-xs font-black uppercase tracking-widest rounded-full shadow-lg flex items-center gap-1.5 animate-pulse">
          <Pause className="w-3 h-3" /> Pausado
        </div>
      )}

      <div className="flex-1 flex min-h-0 relative">
        <div className="flex-1 relative player-zone-main bg-black shadow-[10px_0_30px_rgba(0,0,0,0.5)] z-10 overflow-hidden">
          <MediaZone current={p.current} fading={p.fading} videoRef={p.videoRef} />
          <div className="absolute top-0 left-0 right-0 h-1 bg-black/20 z-20 flex">
            <div
              className="h-full bg-indigo-500 transition-all duration-1000 ease-linear"
              style={{ width: `${((p.currentIndex + 1) / p.mediaItems.length) * 100}%` }}
            />
          </div>
        </div>

        <div
          style={{
            width: p.layoutConfig?.sidebar_width
              ? `${p.layoutConfig.sidebar_width}px`
              : "300px",
          }}
        >
          <PlayerSidebar
            city={p.city}
            currentQrLink={p.currentQrLink}
            wc={p.widgetConfig}
            igHandle={p.igHandle}
          />
        </div>
      </div>

      {p.layoutConfig?.show_ticker !== false && (
        <div className="z-30 shadow-[0_-5px_30px_rgba(0,0,0,0.5)] border-t border-white/10 relative">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-indigo-500/0 via-indigo-500/50 to-indigo-500/0" />
          <NewsTicker headlines={p.headlines} />
        </div>
      )}
    </div>
  );
}
