import { QRCodeSVG } from "qrcode.react";

interface QRWidgetProps {
  url?: string;
  compact?: boolean;
  size?: number;
}

const DEFAULT_URL = "https://signageos.app";

export default function QRWidget({ url, compact = false, size }: QRWidgetProps) {
  const qrUrl = url || DEFAULT_URL;
  const qrSize = size || (compact ? 64 : 100);

  return (
    <div className={`flex flex-col items-center gap-2 ${compact ? "p-2" : "p-4"}`}>
      <div className="relative">
        <div className="absolute -inset-2 bg-indigo-500/20 rounded-xl blur-md animate-pulse opacity-60" />
        <div className="relative bg-white rounded-xl p-2 shadow-lg">
          <QRCodeSVG
            value={qrUrl}
            size={qrSize}
            bgColor="#ffffff"
            fgColor="#1a1a2e"
            level="M"
            includeMargin={false}
          />
        </div>
      </div>
      {!compact && (
        <div className="text-center">
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">
            Escaneie o QR Code
          </p>
          <p className="text-[9px] text-white/30 mt-0.5 truncate max-w-[110px]">
            {qrUrl.replace(/^https?:\/\//, "")}
          </p>
        </div>
      )}
    </div>
  );
}
