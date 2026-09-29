import { Newspaper } from "lucide-react";

interface NewsTickerProps {
  headlines: string[];
  accentColor?: "indigo" | "amber" | "orange" | "rose";
}

const accentMap = {
  indigo: { 
    badge: "bg-indigo-600/90 shadow-[0_0_15px_rgba(79,70,229,0.5)]", 
    text: "from-indigo-100 to-indigo-300",
    border: "border-indigo-500/30"
  },
  amber: { 
    badge: "bg-amber-600/90 shadow-[0_0_15px_rgba(217,119,6,0.5)]", 
    text: "from-amber-100 to-amber-300",
    border: "border-amber-500/30"
  },
  orange: { 
    badge: "bg-orange-600/90 shadow-[0_0_15px_rgba(234,88,12,0.5)]", 
    text: "from-orange-100 to-orange-300",
    border: "border-orange-500/30"
  },
  rose: { 
    badge: "bg-rose-600/90 shadow-[0_0_15px_rgba(225,29,72,0.5)]", 
    text: "from-rose-100 to-rose-300",
    border: "border-rose-500/30"
  },
};

export default function NewsTicker({ headlines, accentColor = "indigo" }: NewsTickerProps) {
  if (headlines.length === 0) return null;
  const text = headlines.join("   ◆   ");
  const accent = accentMap[accentColor] || accentMap.indigo;

  return (
    <div className="w-full overflow-hidden bg-black/60 backdrop-blur-lg border-t border-white/10 flex items-center shadow-2xl z-50">
      {/* Label badge */}
      <div className={`relative z-10 shrink-0 px-5 py-3 ${accent.badge} flex items-center gap-2 border-r ${accent.border}`}>
        <Newspaper className="w-4 h-4 text-white drop-shadow-md" />
        <span className="text-xs font-black uppercase tracking-[0.25em] text-white whitespace-nowrap drop-shadow-md">
          Notícias em Tempo Real
        </span>
        <div className="absolute top-1/2 -right-1.5 w-3 h-3 bg-white rounded-full -translate-y-1/2 opacity-20 blur-sm" />
      </div>
      
      {/* Scrolling text */}
      <div className="flex-1 overflow-hidden relative">
        <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-black/60 to-transparent z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-black/60 to-transparent z-10" />
        <div className="ticker-animate whitespace-nowrap py-3">
          <span className={`text-base font-semibold tracking-wide bg-gradient-to-r ${accent.text} bg-clip-text text-transparent px-8 drop-shadow-sm`}>
            {text}   ◆   {text}
          </span>
        </div>
      </div>
    </div>
  );
}
