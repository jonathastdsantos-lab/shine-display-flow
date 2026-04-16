import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import WeatherWidget from "./WeatherWidget";

interface ClockWidgetProps {
  compact?: boolean;
  weatherCity?: string;
  fontSize?: number;
  variant?: 'standard' | 'glass' | 'bold' | 'split';
}

export default function ClockWidget({ 
  compact = false, 
  weatherCity, 
  fontSize,
  variant = 'standard'
}: ClockWidgetProps) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Variant: GLASS (Modern, blurred look)
  if (variant === 'glass') {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 shadow-2xl relative overflow-hidden group">
        <div className="absolute -top-10 -left-10 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/20 transition-colors" />
        <p className="font-display font-black text-white tracking-tighter tabular-nums drop-shadow-lg"
           style={{ fontSize: fontSize ? `${fontSize}px` : "3.5rem", lineHeight: 0.9 }}>
          {format(now, "HH:mm")}
        </p>
        <div className="mt-2 text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">{format(now, "EEEE", { locale: ptBR })}</p>
          <p className="text-[11px] font-bold text-white/60 uppercase tracking-widest">{format(now, "d MMMM", { locale: ptBR })}</p>
        </div>
        {weatherCity && (
          <div className="mt-4 pt-4 border-t border-white/5 w-full">
            <WeatherWidget city={weatherCity} compact variant="glass" />
          </div>
        )}
      </div>
    );
  }

  // Variant: BOLD (Industrial, high-visibility)
  if (variant === 'bold') {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-2 bg-white border-[6px] border-black rounded-none shadow-[10px_10px_0_0_rgba(0,0,0,0.2)]">
        <p className="font-display font-black text-black tracking-tighter tabular-nums italic"
           style={{ fontSize: fontSize ? `${fontSize}px` : "5rem", lineHeight: 0.8 }}>
          {format(now, "HH:mm")}
        </p>
        <div className="w-full h-2 bg-black mt-2" />
        <div className="flex justify-between w-full mt-1 px-1">
          <span className="text-[10px] font-black text-black uppercase">{format(now, "EEEE", { locale: ptBR })}</span>
          <span className="text-[10px] font-black text-black uppercase">{format(now, "dd/MM/yy")}</span>
        </div>
        {weatherCity && (
          <div className="mt-2 w-full">
            <WeatherWidget city={weatherCity} compact fontSize={20} />
          </div>
        )}
      </div>
    );
  }

  // Variant: SPLIT (Side-by-side)
  if (variant === 'split') {
    return (
      <div className="w-full h-full flex items-center justify-between p-6 bg-gradient-to-r from-black/20 to-transparent rounded-xl border-l-4 border-indigo-500">
        <div className="flex flex-col">
          <p className="font-display font-black text-white tabular-nums leading-none"
             style={{ fontSize: fontSize ? `${fontSize}px` : "4rem" }}>
            {format(now, "HH:mm")}
          </p>
          <p className="text-xs font-bold text-indigo-400 uppercase tracking-[0.2em] mt-2">
            {format(now, "EEEE, d MMM", { locale: ptBR })}
          </p>
        </div>
        {weatherCity && (
          <div className="ml-4 pl-6 border-l border-white/10 h-full flex items-center">
            <WeatherWidget city={weatherCity} fontSize={fontSize ? fontSize * 0.6 : 32} />
          </div>
        )}
      </div>
    );
  }

  // DEFAULT (Current style modified for consistency)
  if (compact) {
    return (
      <div className="text-center px-2 py-3 flex flex-col items-center">
        <p className="font-bold font-display tabular-nums text-player-text tracking-tight leading-none"
           style={{ fontSize: fontSize ? `${fontSize}px` : undefined }}>
          {format(now, "HH:mm")}
        </p>
        <p className="text-[10px] text-player-muted mt-0.5 uppercase font-bold tracking-widest">{format(now, "dd/MM", { locale: ptBR })}</p>
        
        {weatherCity && (
          <div className="mt-2 pt-2 border-t border-white/5 w-full">
            <WeatherWidget city={weatherCity} compact />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="text-center px-4 py-6 flex flex-col items-center">
      <p className="font-black font-display tabular-nums text-player-text tracking-tighter leading-none"
         style={{ fontSize: fontSize ? `${fontSize}px` : "3rem" }}>
        {format(now, "HH:mm")}
      </p>
      <div className="mt-1 mb-2">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-player-muted/60">{format(now, "EEEE", { locale: ptBR })}</p>
        <p className="text-sm font-bold text-player-muted uppercase tracking-wider">{format(now, "d 'de' MMMM", { locale: ptBR })}</p>
      </div>

      {weatherCity && (
        <div className="mt-4 pt-4 border-t border-white/10 w-full flex justify-center">
          <WeatherWidget city={weatherCity} />
        </div>
      )}
    </div>
  );
}
