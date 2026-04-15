import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import WeatherWidget from "./WeatherWidget";

interface ClockWidgetProps {
  compact?: boolean;
  weatherCity?: string;
  fontSize?: number;
}

export default function ClockWidget({ compact = false, weatherCity, fontSize }: ClockWidgetProps) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

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
         style={{ fontSize: fontSize ? `${fontSize}px` : undefined }}>
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
