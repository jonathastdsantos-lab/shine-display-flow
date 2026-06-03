import ClockWidget from "@/components/ClockWidget";
import NewsTicker from "@/components/NewsTicker";
import QRWidget from "@/components/QRWidget";
import SocialWidget from "@/components/SocialWidget";
import { MediaZone, RemoteAlertOverlay } from "@/pages/player/shared";
import type { TemplateProps } from "./types";

export default function SplitTemplate(p: TemplateProps) {
  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-[#0A0D14] relative">
      <RemoteAlertOverlay
        active={p.remoteIntervention.active}
        message={p.remoteIntervention.message}
        type={p.remoteIntervention.type}
      />

      <div className="flex-1 flex min-h-0">
        <div
          className="relative bg-black overflow-hidden"
          style={{ flex: p.layoutConfig?.split_ratio || 60 }}
        >
          <MediaZone current={p.current} fading={p.fading} videoRef={p.videoRef} />
          <div className="absolute top-0 left-0 right-0 h-1 bg-black/20 z-20">
            <div
              className="h-full bg-orange-500 transition-all duration-1000 ease-linear"
              style={{ width: `${((p.currentIndex + 1) / p.mediaItems.length) * 100}%` }}
            />
          </div>
        </div>

        <div className="w-px bg-white/10 z-10" />

        <div
          className="flex flex-col bg-[#0D111A] relative overflow-hidden z-20"
          style={{ flex: 100 - (p.layoutConfig?.split_ratio || 60) }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent pointer-events-none" />

          <div className="p-5 bg-gradient-to-b from-white/5 to-transparent border-b border-white/5">
            <ClockWidget weatherCity={p.city || "auto"} />
          </div>

          <div className="flex-1 p-4 space-y-4 overflow-hidden">
            <div className="bg-white/5 rounded-2xl border border-white/5 backdrop-blur-sm overflow-hidden">
              <SocialWidget />
            </div>
            <div className="bg-white/5 rounded-2xl border border-white/5 backdrop-blur-sm overflow-hidden">
              <QRWidget url={p.currentQrLink} />
            </div>
          </div>

          <div className="px-5 py-4 text-center border-t border-white/5">
            <p className="text-[9px] uppercase font-bold tracking-[0.2em] text-orange-500/50">
              SignageOS
            </p>
          </div>
        </div>
      </div>

      {p.layoutConfig?.show_ticker !== false && (
        <div className="z-30 shadow-[0_-5px_30px_rgba(0,0,0,0.5)] border-t border-white/10">
          <NewsTicker headlines={p.headlines} accentColor="orange" />
        </div>
      )}
    </div>
  );
}
