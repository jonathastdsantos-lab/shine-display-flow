import { AlertTriangle } from "lucide-react";
import ClockWidget from "@/components/ClockWidget";
import FinanceWidget from "@/components/FinanceWidget";
import SocialWidget from "@/components/SocialWidget";
import QRWidget from "@/components/QRWidget";
import CameraWidget from "@/components/CameraWidget";
import YoutubeWidget from "@/components/YoutubeWidget";

export interface MediaItem {
  id: string;
  url_arquivo: string;
  tipo: string;
  duracao: number;
  qr_link?: string;
  nome?: string;
}

export const mockNews: Record<string, string[]> = {
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

export function isYoutubeUrl(url?: string) {
  if (!url) return false;
  return /(?:youtube\.com|youtu\.be)/i.test(url);
}

export function isWidgetEnabled(wc: any, key: string): boolean {
  if (!wc) return true;
  return wc[key]?.enabled !== false;
}

export function RemoteAlertOverlay({
  active,
  message,
  type,
}: {
  active: boolean;
  message: string;
  type: "alert" | "media" | null;
}) {
  if (!active || type !== "alert") return null;
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-red-900/90 backdrop-blur-md animate-in fade-in zoom-in duration-500">
      <div className="flex flex-col items-center p-12 text-center animate-pulse">
        <AlertTriangle className="w-24 h-24 text-white mb-6 drop-shadow-lg" />
        <h1 className="text-5xl font-black text-white tracking-widest uppercase shadow-black drop-shadow-md">
          Atenção!
        </h1>
        <p className="text-2xl text-white mt-4 font-medium max-w-2xl leading-relaxed">
          {message || "Mensagem de Alerta da Administração Master"}
        </p>
      </div>
    </div>
  );
}

export function PlayerSidebar({
  city,
  currentQrLink,
  wc,
  igHandle,
}: {
  city: string;
  currentQrLink?: string;
  wc?: any;
  igHandle?: string;
}) {
  const qrDefaultUrl = wc?.qr?.default_url || "";
  const qrUrl = currentQrLink || qrDefaultUrl;

  return (
    <div className="w-[300px] flex flex-col player-zone-sidebar bg-[#0A0D14] border-l border-white/5 z-20 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-600/5 rounded-full blur-[80px] translate-y-1/3 -translate-x-1/2 pointer-events-none" />
      {isWidgetEnabled(wc, "clock") && (
        <div className="p-4 bg-gradient-to-b from-white/5 to-transparent">
          <ClockWidget
            weatherCity={
              isWidgetEnabled(wc, "weather") && wc?.clock?.showWeather !== false
                ? city || "auto"
                : undefined
            }
            showWeather={wc?.clock?.showWeather !== false}
          />
        </div>
      )}
      <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-2" />
      <div className="flex-1 overflow-hidden relative">
        <div className="absolute inset-0 p-4 space-y-5 overflow-hidden">
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
              <CameraWidget
                url={wc?.camera?.url || ""}
                label={wc?.camera?.label || "Câmera 01"}
                compact
              />
            </div>
          )}
        </div>
      </div>
      <div className="px-6 py-4 text-center border-t border-white/5 bg-black/20">
        <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-indigo-500/60 pb-1">
          Powered By
        </p>
        <p className="text-xs font-display font-bold text-white/50 tracking-widest">
          SIGNAGE OS
        </p>
      </div>
    </div>
  );
}

export function MediaZone({
  current,
  fading,
  videoRef,
}: {
  current: MediaItem | undefined;
  fading: boolean;
  videoRef: React.RefObject<HTMLVideoElement>;
}) {
  const youtube = isYoutubeUrl(current?.url_arquivo);
  return (
    <div
      className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
        fading ? "opacity-0 blur-sm scale-105" : "opacity-100 blur-0 scale-100"
      }`}
    >
      {youtube ? (
        <YoutubeWidget key={current?.id} url={current?.url_arquivo} />
      ) : current?.tipo === "video" ? (
        <video
          ref={videoRef}
          key={current.id}
          src={current.url_arquivo}
          className="h-full w-full object-cover"
          muted
          autoPlay
          playsInline
        />
      ) : (
        <img
          key={current?.id}
          src={current?.url_arquivo}
          alt=""
          className="h-full w-full object-contain bg-black"
        />
      )}
    </div>
  );
}

export interface RemoteIntervention {
  active: boolean;
  message: string;
  type: "alert" | "media" | null;
}
