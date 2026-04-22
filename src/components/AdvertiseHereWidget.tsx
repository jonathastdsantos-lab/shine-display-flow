import { Megaphone, ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";

interface Props {
  /** Override URL — if set, QR points here instead of /anuncie */
  customUrl?: string;
  /** Playlist ID for tracking */
  playlistId?: string;
  /** Client ID hint */
  clientId?: string;
}

/**
 * Overlay rotativo "Anuncie Aqui" que aparece em loop nas telas
 * para captar interessados em comprar espaço publicitário.
 */
export default function AdvertiseHereWidget({ customUrl, playlistId, clientId }: Props) {
  const [qrSrc, setQrSrc] = useState("");

  useEffect(() => {
    let url = customUrl;
    if (!url) {
      const origin = window.location.origin;
      const params = new URLSearchParams();
      if (playlistId) params.set("tela", playlistId);
      if (clientId) params.set("c", clientId);
      const qs = params.toString();
      url = `${origin}/anuncie${qs ? "?" + qs : ""}`;
    }
    // QR via api pública
    setQrSrc(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=10&data=${encodeURIComponent(url)}`);
  }, [customUrl, playlistId, clientId]);

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-gradient-to-br from-amber-600 via-orange-600 to-pink-700 animate-in fade-in zoom-in-95 duration-700">
      {/* Decorative glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-yellow-300/30 rounded-full blur-[120px]" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-pink-500/30 rounded-full blur-[120px]" />

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl px-12 items-center">
        <div className="text-white space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/15 backdrop-blur border border-white/20">
            <Megaphone className="w-5 h-5" />
            <span className="text-xs font-black uppercase tracking-[0.3em]">Espaço Disponível</span>
          </div>
          <h1 className="text-6xl xl:text-7xl font-black leading-[1.05] tracking-tight drop-shadow-lg">
            Anuncie<br />
            <span className="text-yellow-200">Aqui!</span>
          </h1>
          <p className="text-xl xl:text-2xl text-white/90 leading-relaxed font-medium max-w-lg">
            Sua marca em destaque nesta tela. Aponte a câmera, preencha o formulário e fale conosco.
          </p>
          <div className="flex items-center gap-3 pt-2">
            <ArrowRight className="w-7 h-7 text-yellow-200 animate-pulse" />
            <span className="text-sm font-bold uppercase tracking-widest text-white/80">Escaneie o QR Code →</span>
          </div>
        </div>

        <div className="flex justify-center lg:justify-end">
          <div className="bg-white p-6 rounded-3xl shadow-2xl ring-4 ring-white/30 transition-transform hover:scale-105">
            {qrSrc && (
              <img
                src={qrSrc}
                alt="QR para anunciar"
                className="w-72 h-72 xl:w-80 xl:h-80 object-contain"
              />
            )}
            <p className="text-center mt-4 text-xs uppercase tracking-widest font-black text-gray-700">
              Escaneie e anuncie
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
