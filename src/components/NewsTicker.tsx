interface NewsTickerProps {
  headlines: string[];
  accentColor?: "indigo" | "amber" | "orange";
}

const accentMap = {
  indigo: { dot: "text-indigo-400", label: "bg-indigo-500/80", text: "text-white/80" },
  amber: { dot: "text-amber-400", label: "bg-amber-500/80", text: "text-white/80" },
  orange: { dot: "text-orange-400", label: "bg-orange-500/80", text: "text-white/80" },
};

export default function NewsTicker({ headlines, accentColor = "indigo" }: NewsTickerProps) {
  if (headlines.length === 0) return null;
  const text = headlines.join("   ●   ");
  const accent = accentMap[accentColor];

  return (
    <div className="w-full overflow-hidden player-zone-footer py-2.5 flex items-center gap-0">
      {/* Label badge */}
      <div className={`shrink-0 px-3 py-2.5 ${accent.label} flex items-center gap-1.5 border-r border-white/10`}>
        <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-white whitespace-nowrap">AO VIVO</span>
      </div>
      {/* Scrolling text */}
      <div className="flex-1 overflow-hidden">
        <div className={`ticker-animate whitespace-nowrap text-sm font-medium ${accent.text} tracking-wide pl-6`}>
          {text}   ●   {text}
        </div>
      </div>
    </div>
  );
}
