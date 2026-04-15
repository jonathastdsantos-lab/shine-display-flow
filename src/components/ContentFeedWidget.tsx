import { useState, useEffect } from "react";
import { Lightbulb, ChevronRight } from "lucide-react";
import { CONTENT_FEEDS, SEGMENT_LABELS, type BusinessSegment, type ContentTip } from "@/utils/ContentFeed";

interface ContentFeedWidgetProps {
  segment: BusinessSegment;
  compact?: boolean;
}

export default function ContentFeedWidget({ segment, compact = false }: ContentFeedWidgetProps) {
  const tips = CONTENT_FEEDS[segment] || CONTENT_FEEDS["corporativo"];
  const [index, setIndex] = useState(0);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (tips.length === 0) return;
    const interval = setInterval(() => {
      setAnimating(true);
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % tips.length);
        setAnimating(false);
      }, 600);
    }, 8000);
    return () => clearInterval(interval);
  }, [tips.length]);

  const tip: ContentTip = tips[index];
  if (!tip) return null;

  if (compact) {
    return (
      <div className="flex flex-col px-3 py-2 w-full bg-black/30 animate-fade-in overflow-hidden">
        <div className="flex items-center gap-1.5 mb-1">
          <Lightbulb className="w-3 h-3 text-amber-400 shrink-0" />
          <span className="text-[8px] uppercase font-bold tracking-widest text-amber-400/80">{tip.category}</span>
        </div>
        <p className={`text-[9px] text-white/80 leading-relaxed transition-all duration-500 ${animating ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"}`}>
          {tip.emoji} {tip.text}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full h-full bg-gradient-to-br from-slate-900 to-slate-800 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-500/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center gap-2 px-4 pt-3 pb-2 border-b border-white/5">
        <div className="p-1.5 bg-amber-500/20 rounded-lg">
          <Lightbulb className="w-4 h-4 text-amber-400" />
        </div>
        <div>
          <p className="text-[10px] uppercase font-bold tracking-widest text-amber-400/80">Dicas & Tendências</p>
          <p className="text-[9px] text-white/40">{SEGMENT_LABELS[segment]}</p>
        </div>
        <div className="ml-auto flex gap-1">
          {tips.slice(0, Math.min(tips.length, 8)).map((_, i) => (
            <div key={i} className={`w-1 h-1 rounded-full transition-all ${i === index ? "bg-amber-400 w-3" : "bg-white/20"}`} />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center px-4 py-3">
        <div className={`transition-all duration-600 ease-in-out ${animating ? "opacity-0 translate-y-3" : "opacity-100 translate-y-0"}`}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">{tip.emoji}</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400/80 bg-amber-400/10 px-2 py-0.5 rounded-full">
              {tip.category}
            </span>
          </div>
          <p className="text-white/90 text-sm leading-relaxed font-medium">
            {tip.text}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-0.5 bg-white/5">
        <div
          key={index}
          className="h-full bg-amber-400/50 rounded-full"
          style={{ animation: "progressFill 8s linear forwards" }}
        />
      </div>

      <style>{`
        @keyframes progressFill {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
    </div>
  );
}
