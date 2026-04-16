import { useState, useEffect } from "react";
import { Cloud, Sun, CloudRain, CloudSnow, CloudLightning, CloudDrizzle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface WeatherWidgetProps {
  city: string;
  compact?: boolean;
  fontSize?: number;
  variant?: 'standard' | 'glass' | 'bold' | 'split';
}

interface WeatherData {
  temp: number;
  condition: string;
  icon: string;
  humidity: number;
  city: string;
}

function getWeatherIcon(icon: string) {
  if (icon.startsWith("01")) return Sun;
  if (icon.startsWith("09")) return CloudDrizzle;
  if (icon.startsWith("10")) return CloudRain;
  if (icon.startsWith("11")) return CloudLightning;
  if (icon.startsWith("13")) return CloudSnow;
  return Cloud;
}

export default function WeatherWidget({ 
  city, 
  compact = false, 
  fontSize,
  variant = 'standard'
}: WeatherWidgetProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!city) return;
    const fetchWeather = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke("get-weather", { body: { city } });
        if (error) throw error;
        if (data) setWeather(data);
      } catch (err: any) {
        console.error("❌ Erro clima:", err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchWeather();
    const interval = setInterval(fetchWeather, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [city]);

  if (loading && !weather) {
    return <div className="animate-pulse h-10 w-24 bg-white/5 rounded mx-auto" />;
  }

  if (!weather) return null;
  const Icon = getWeatherIcon(weather.icon);

  // Variant: GLASS
  if (variant === 'glass') {
    return (
      <div className={`flex flex-col items-center justify-center p-3 rounded-xl bg-white/5 border border-white/5 backdrop-blur-sm ${compact ? 'flex-row gap-3' : ''}`}>
        <Icon className="h-8 w-8 text-sky-400 drop-shadow-[0_0_8px_rgba(56,189,248,0.4)]" />
        <div className="text-center">
          <p className="font-display font-black text-white leading-none"
             style={{ fontSize: fontSize ? `${fontSize}px` : "1.75rem" }}>
            {weather.temp}°
          </p>
          {!compact && <p className="text-[8px] font-bold text-white/40 uppercase tracking-widest mt-1">{weather.condition}</p>}
        </div>
      </div>
    );
  }

  // Variant: BOLD
  if (variant === 'bold') {
    return (
      <div className="flex items-center gap-4 p-2 bg-black text-white uppercase italic">
        <Icon className="h-8 w-8 text-white" />
        <div className="flex flex-col">
          <p className="font-display font-black leading-none"
             style={{ fontSize: fontSize ? `${fontSize}px` : "2rem" }}>
            {weather.temp}°C
          </p>
          <span className="text-[8px] font-bold tracking-tighter">{weather.condition}</span>
        </div>
      </div>
    );
  }

  // Variant: SPLIT (Transparent, relies on container)
  if (variant === 'split') {
    return (
      <div className="flex items-center gap-4">
        <Icon className="h-10 w-10 text-sky-400" />
        <div className="flex flex-col">
          <p className="font-display font-black text-white leading-none"
             style={{ fontSize: fontSize ? `${fontSize}px` : "2.5rem" }}>
            {weather.temp}°
          </p>
          <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{weather.city}</p>
        </div>
      </div>
    );
  }

  // DEFAULT
  if (compact) {
    return (
      <div className="flex flex-col items-center justify-center text-center">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-sky-400" />
          <p className="font-bold text-player-text font-display tabular-nums leading-none tracking-tighter"
             style={{ fontSize: fontSize ? `${fontSize}px` : "1.25rem" }}>
            {weather.temp}°
          </p>
        </div>
        <p className="text-[8px] text-player-muted font-black uppercase tracking-widest mt-1 opacity-60">
          {weather.city}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center text-center">
      <Icon className="h-12 w-12 text-sky-400 mb-2 drop-shadow-lg" />
      <p className="font-bold text-player-text font-display tracking-tight leading-none"
         style={{ fontSize: fontSize ? `${fontSize}px` : "2.5rem" }}>
        {weather.temp}°
      </p>
      <p className="text-xs font-black text-player-muted uppercase tracking-[0.15em] mt-2">{weather.condition}</p>
      <p className="text-[9px] text-player-muted/40 font-bold uppercase mt-1 tracking-widest">{weather.city}</p>
    </div>
  );
}
