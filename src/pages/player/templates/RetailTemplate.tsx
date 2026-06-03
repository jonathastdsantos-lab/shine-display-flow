import NewsTicker from "@/components/NewsTicker";
import QRWidget from "@/components/QRWidget";
import YoutubeWidget from "@/components/YoutubeWidget";
import { RemoteAlertOverlay, isWidgetEnabled, isYoutubeUrl } from "@/pages/player/shared";
import type { TemplateProps } from "./types";

export default function RetailTemplate(p: TemplateProps) {
  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-black relative">
      <RemoteAlertOverlay
        active={p.remoteIntervention.active}
        message={p.remoteIntervention.message}
        type={p.remoteIntervention.type}
      />

      <div className="flex-1 relative bg-black">
        <div
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            p.fading ? "opacity-0 scale-105" : "opacity-100 scale-100"
          }`}
        >
          {isYoutubeUrl(p.current?.url_arquivo) ? (
            <YoutubeWidget key={p.current?.id} url={p.current?.url_arquivo} />
          ) : p.current?.tipo === "video" ? (
            <video
              ref={p.videoRef}
              key={p.current.id}
              src={p.current.url_arquivo}
              className="h-full w-full object-cover"
              muted
              autoPlay
              playsInline
            />
          ) : (
            <img
              key={p.current?.id}
              src={p.current?.url_arquivo}
              alt=""
              className="h-full w-full object-contain bg-black"
            />
          )}
        </div>

        {isWidgetEnabled(p.widgetConfig, "qr") && p.currentQrLink && (
          <div className="absolute bottom-16 right-6 z-20 bg-white/10 backdrop-blur-md rounded-2xl p-2 border border-white/20 shadow-2xl animate-in fade-in duration-500">
            <QRWidget url={p.currentQrLink} compact />
          </div>
        )}

        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/80 to-transparent z-10 pointer-events-none" />

        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20">
          {p.mediaItems.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                i === p.currentIndex
                  ? "w-8 bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]"
                  : "w-2 bg-white/20"
              }`}
            />
          ))}
        </div>
      </div>

      {isWidgetEnabled(p.widgetConfig, "news") &&
        p.layoutConfig?.show_ticker !== false && (
          <div className="z-20 relative shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
            <NewsTicker headlines={p.headlines} />
          </div>
        )}
    </div>
  );
}
