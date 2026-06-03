import ClockWidget from "@/components/ClockWidget";
import NewsTicker from "@/components/NewsTicker";
import QRWidget from "@/components/QRWidget";
import { MediaZone, RemoteAlertOverlay } from "@/pages/player/shared";
import type { TemplateProps } from "./types";

export default function LBarTemplate(p: TemplateProps) {
  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-[#0A0D14] relative">
      <RemoteAlertOverlay
        active={p.remoteIntervention.active}
        message={p.remoteIntervention.message}
        type={p.remoteIntervention.type}
      />

      <div className="flex-1 flex min-h-0">
        <div className="flex-1 relative bg-black overflow-hidden">
          <MediaZone current={p.current} fading={p.fading} videoRef={p.videoRef} onEnded={p.goToNext} />
          <div className="absolute top-0 left-0 right-0 h-1 bg-black/20 z-20">
            <div
              className="h-full bg-amber-500 transition-all duration-1000 ease-linear"
              style={{ width: `${((p.currentIndex + 1) / p.mediaItems.length) * 100}%` }}
            />
          </div>
        </div>

        <div
          className="flex flex-col bg-[#0A0D14] border-l border-white/5 relative overflow-hidden z-20"
          style={{
            width: p.layoutConfig?.sidebar_width
              ? `${p.layoutConfig.sidebar_width}px`
              : "208px",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 to-transparent pointer-events-none" />
          <div className="p-3 bg-gradient-to-b from-white/5 to-transparent">
            <ClockWidget compact weatherCity={p.city || "auto"} />
          </div>
          <div className="w-full h-px bg-white/10" />
          <div className="flex-1 p-3 space-y-3 overflow-hidden">
            <div className="bg-white/5 rounded-xl border border-white/5 overflow-hidden">
              <QRWidget url={p.currentQrLink} compact />
            </div>
          </div>
          <div className="px-3 py-3 text-center border-t border-white/5">
            <p className="text-[9px] uppercase font-bold tracking-[0.2em] text-amber-500/50">
              SignageOS
            </p>
          </div>
        </div>
      </div>

      {p.layoutConfig?.show_ticker !== false && (
        <div className="z-30 shadow-[0_-5px_30px_rgba(0,0,0,0.5)] border-t border-white/10">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-amber-500/0 via-amber-500/50 to-amber-500/0" />
          <NewsTicker headlines={p.headlines} accentColor="amber" />
        </div>
      )}
    </div>
  );
}
