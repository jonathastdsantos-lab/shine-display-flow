import { useState, useEffect, useRef } from "react";
import { Camera, Wifi, WifiOff, AlertTriangle, RefreshCw, CheckCircle2 } from "lucide-react";

interface CameraWidgetProps {
  url?: string;
  label?: string;
  compact?: boolean;
}

type CameraProtocol = "mjpeg" | "hls" | "webrtc" | "img-refresh" | "unknown" | "none";
type ConnectionStatus = "idle" | "connecting" | "connected" | "error";

function detectProtocol(url: string): CameraProtocol {
  if (!url) return "none";
  const lower = url.toLowerCase();
  if (lower.startsWith("rtsp://") || lower.startsWith("rtmp://")) return "unknown"; // needs proxy
  if (lower.includes(".m3u8")) return "hls";
  if (lower.includes("mjpeg") || lower.includes("mjpg") || lower.includes("videostream") || lower.includes("/video")) return "mjpeg";
  if (lower.startsWith("http") && (lower.includes(".jpg") || lower.includes(".jpeg") || lower.includes("snapshot"))) return "img-refresh";
  if (lower.startsWith("http")) return "mjpeg"; // assume mjpeg for plain http streams
  return "unknown";
}

// MJPEG: direct img src — works for most IP cameras via HTTP
function MJPEGStream({ url, onError, onLoad }: { url: string; onError: () => void; onLoad: () => void }) {
  const [imgKey, setImgKey] = useState(Date.now());
  const [refreshing, setRefreshing] = useState(false);

  // For img-refresh mode: cycle a static snapshot every 2s
  const isSnapshot = url.toLowerCase().includes(".jpg") || url.toLowerCase().includes("snapshot");
  useEffect(() => {
    if (!isSnapshot) return;
    const t = setInterval(() => {
      setRefreshing(true);
      setImgKey(Date.now());
      setTimeout(() => setRefreshing(false), 200);
    }, 2000);
    return () => clearInterval(t);
  }, [isSnapshot, url]);

  return (
    <img
      key={imgKey}
      src={isSnapshot ? `${url}?t=${imgKey}` : url}
      className={`w-full h-full object-cover transition-opacity duration-200 ${refreshing ? "opacity-70" : "opacity-100"}`}
      onError={onError}
      onLoad={onLoad}
      referrerPolicy="no-referrer"
      crossOrigin="anonymous"
    />
  );
}

// HLS: native video element (Safari + modern Chrome support HLS natively)
function HLSStream({ url, onError, onLoad }: { url: string; onError: () => void; onLoad: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Modern browsers: try native HLS first
    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = url;
      video.play().catch(onError);
      return;
    }

    // For Chrome/Firefox: they support HLS natively in 2025+ or via MSE
    // We'll try src directly - if it fails, the onError will trigger
    video.src = url;
    video.play().catch(onError);
  }, [url, onError]);

  return (
    <video
      ref={videoRef}
      className="w-full h-full object-cover"
      muted
      autoPlay
      playsInline
      onError={onError}
      onCanPlay={onLoad}
    />
  );
}

export default function CameraWidget({ url = "", label = "Câmera 01", compact = false }: CameraWidgetProps) {
  const [status, setStatus] = useState<ConnectionStatus>("idle");
  const [protocol, setProtocol] = useState<CameraProtocol>("none");
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!url) {
      setStatus("idle");
      setProtocol("none");
      return;
    }
    setStatus("connecting");
    const p = detectProtocol(url);
    setProtocol(p);
    if (p === "unknown") {
      // RTSP/RTMP needs server proxy — show helpful message
      setStatus("error");
      return;
    }
    // Small delay to simulate connection attempt
    const t = setTimeout(() => setStatus("connecting"), 100);
    return () => clearTimeout(t);
  }, [url, retryCount]);

  const handleLoad = () => setStatus("connected");
  const handleError = () => setStatus("error");
  const retry = () => { setRetryCount(n => n + 1); setStatus("connecting"); };

  const protocolLabel: Record<CameraProtocol, string> = {
    mjpeg: "MJPEG/HTTP",
    hls: "HLS Stream",
    "img-refresh": "Snapshot (HTTP)",
    webrtc: "WebRTC",
    unknown: "RTSP (proxy necessário)",
    none: "—",
  };

  return (
    <div className={`flex flex-col items-center w-full bg-slate-900/80 relative overflow-hidden border border-slate-700/50 rounded-xl ${compact ? "py-2 px-2" : "py-3 px-3"}`}>
      {/* Header */}
      <div className="flex items-center justify-between w-full mb-2">
        <div className="flex items-center gap-1.5 text-slate-300">
          <Camera className={`${compact ? "w-3 h-3" : "w-4 h-4"}`} />
          <span className={`${compact ? "text-[9px]" : "text-[10px]"} uppercase font-bold tracking-widest`}>{label}</span>
        </div>
        <div className="flex items-center gap-1.5">
          {status === "connected" && (
            <>
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[8px] text-red-500 font-bold uppercase">Ao Vivo</span>
            </>
          )}
          {status === "connecting" && (
            <>
              <RefreshCw className="w-3 h-3 text-amber-400 animate-spin" />
              <span className="text-[8px] text-amber-400 font-bold uppercase">Conectando</span>
            </>
          )}
          {status === "error" && (
            <>
              <WifiOff className="w-3 h-3 text-red-400" />
              <span className="text-[8px] text-red-400 font-bold uppercase">Erro</span>
            </>
          )}
          {status === "idle" && (
            <span className="text-[8px] text-slate-500 uppercase">Sem URL</span>
          )}
        </div>
      </div>

      {/* Video Area */}
      <div className={`w-full rounded overflow-hidden bg-black relative border border-slate-800 ${compact ? "aspect-video" : "aspect-video"}`}>
        {/* No URL configured */}
        {status === "idle" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-500">
            <Camera className="w-8 h-8 opacity-30" />
            <p className="text-[9px] text-center px-2">Configure a URL da câmera nas configurações</p>
          </div>
        )}

        {/* Connecting */}
        {status === "connecting" && url && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-amber-400 bg-black">
            <RefreshCw className="w-6 h-6 animate-spin" />
            <p className="text-[9px]">Conectando ao stream...</p>
            <p className="text-[8px] text-slate-500">Protocolo: {protocolLabel[protocol]}</p>
          </div>
        )}

        {/* RTSP / Unknown — needs proxy */}
        {status === "error" && protocol === "unknown" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-3 bg-black">
            <AlertTriangle className="w-6 h-6 text-amber-400" />
            <p className="text-[10px] text-white font-bold text-center">Câmera RTSP detectada</p>
            <p className="text-[9px] text-slate-400 text-center leading-relaxed">
              Câmeras RTSP precisam de um proxy local para conversão HLS/WebRTC. 
              Instale o <span className="text-amber-400 font-mono">rtsp-simple-server</span> ou converta o stream para HTTP/MJPEG.
            </p>
            <div className="bg-slate-800 rounded p-2 w-full mt-1">
              <p className="text-[8px] text-emerald-400 font-mono">ffmpeg -i rtsp://... -f mjpeg http://...</p>
            </div>
          </div>
        )}

        {/* Generic error */}
        {status === "error" && protocol !== "unknown" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black">
            <WifiOff className="w-6 h-6 text-red-400" />
            <p className="text-[10px] text-white text-center">Não foi possível conectar</p>
            <p className="text-[9px] text-slate-400 text-center">Verifique se a URL está correta e a câmera está online</p>
            <button onClick={retry} className="mt-2 text-[9px] text-indigo-400 border border-indigo-400/30 px-2 py-1 rounded hover:bg-indigo-400/10">
              Tentar novamente
            </button>
          </div>
        )}

        {/* Stream rendering */}
        {(status === "connecting" || status === "connected") && url && protocol !== "unknown" && (
          <div className={`absolute inset-0 transition-opacity duration-500 ${status === "connecting" ? "opacity-0" : "opacity-100"}`}>
            {(protocol === "mjpeg" || protocol === "img-refresh") && (
              <MJPEGStream url={url} onError={handleError} onLoad={handleLoad} />
            )}
            {protocol === "hls" && (
              <HLSStream url={url} onError={handleError} onLoad={handleLoad} />
            )}
          </div>
        )}

        {/* Overlay indicators when connected */}
        {status === "connected" && (
          <>
            <div className="absolute bottom-1 right-2 text-[8px] font-mono text-white/50 drop-shadow-md">{label.toUpperCase()}</div>
            <div className="absolute top-1 left-1 bg-black/50 rounded px-1 flex items-center gap-1">
              <CheckCircle2 className="w-2 h-2 text-emerald-400" />
              <span className="text-[7px] text-emerald-400">{protocolLabel[protocol]}</span>
            </div>
          </>
        )}

        {/* Scanlines overlay for CCTV feel */}
        <div className="absolute inset-0 pointer-events-none"
          style={{
            background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)"
          }}
        />
      </div>
    </div>
  );
}
