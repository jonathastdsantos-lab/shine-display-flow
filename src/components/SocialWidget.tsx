import { Instagram } from "lucide-react";
import InstagramEmbed from "./InstagramEmbed";

interface SocialWidgetProps {
  instagramHandle?: string;
  compact?: boolean;
}

export default function SocialWidget({ instagramHandle = "suaempresa", compact = false }: SocialWidgetProps) {
  const handle = instagramHandle.replace("@", "") || "suaempresa";

  if (compact) {
    return (
      <div className="flex flex-col px-2 py-2 w-full h-full bg-black/30 overflow-hidden relative group">
        <div className="flex items-center gap-1.5 mb-1.5 relative z-10">
          <Instagram className="w-3 h-3 text-pink-500" />
          <span className="text-[9px] font-bold text-pink-400 group-hover:text-pink-300 transition-colors">@{handle}</span>
        </div>
        <div className="flex-1 w-full rounded overflow-hidden">
          <InstagramEmbed handle={handle} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center w-full h-full bg-[#0A0D14] overflow-hidden relative border border-white/5">
      {/* Header */}
      <div className="flex items-center justify-between w-full px-4 py-2 border-b border-white/5 bg-slate-900/50 backdrop-blur-sm z-10">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-gradient-to-br from-pink-500 to-purple-600 rounded-lg shadow-sm">
            <Instagram className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-white tracking-tight">@{handle}</p>
            <p className="text-[8px] text-white/40 uppercase tracking-widest font-medium">Mural Social — Real Time</p>
          </div>
        </div>
      </div>

      {/* Real Embed Content */}
      <div className="flex-1 w-full relative overflow-hidden bg-slate-950">
        <InstagramEmbed handle={handle} />
      </div>

      {/* Footer Branding */}
      <div className="w-full bg-[#0D1117] border-t border-white/5 px-3 py-1.5 flex items-center justify-center gap-2">
        <Instagram className="w-3 h-3 text-pink-500/60" />
        <span className="text-[9px] text-white/40 font-bold uppercase tracking-tight">Siga-nos → <span className="text-pink-400">@{handle}</span></span>
      </div>
    </div>
  );
}
