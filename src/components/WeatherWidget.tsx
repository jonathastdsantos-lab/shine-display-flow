import { useState, useEffect } from "react";
import { Cloud, Sun, CloudRain, CloudSnow, CloudLightning, CloudDrizzle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface WeatherWidgetProps {
  city: string;
  compact?: boolean;
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

export default function WeatherWidget({ city, compact = false }: WeatherWidgetProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!city) return;
    const fetchWeather = async () => {
      setLoading(true);
      try {
        console.log(`🌦️ Buscando clima para: ${city}`);
        const { data, error } = await supabase.functions.invoke("get-weather", { body: { city } });
        if (error) {
          console.error("❌ Erro na Edge Function get-weather:", error);
          throw error;
        }
        if (data) setWeather(data);
      } catch (err: any) {
        console.error("❌ Falha crítica ao buscar clima:", err.message);
        // keep last known or show nothing
      } finally {
        setLoading(false);
      }
    };
    fetchWeather();
    const interval = setInterval(fetchWeather, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, [city]);

  if (loading && !weather) {
    if (compact) return <div className="animate-pulse h-8 w-16 bg-white/5 rounded mx-auto" />;
    return (
      <div className="flex flex-col items-center justify-center px-4 py-4">
        <Loader2 className="h-5 w-5 animate-spin text-player-muted" />
        <span className="text-[10px] text-player-muted mt-1 uppercase tracking-widest font-bold">Buscando...</span>
      </div>
    );
  }

  if (!weather) {
    console.warn("⚠️ Sem dados de clima para exibir");
    return null;
  }

  const Icon = getWeatherIcon(weather.icon);

  if (compact) {
    return (
      <div className="flex flex-col items-center justify-center text-center animate-in fade-in slide-in-from-top-1 duration-500">
        <div className="flex items-center gap-1.5">
          <Icon className="h-4 w-4 text-sky-400 shrink-0 drop-shadow-[0_0_8px_rgba(56,189,248,0.4)]" />
          <p className="text-xl font-bold text-player-text font-display tabular-nums leading-none tracking-tighter">
            {weather.temp}°
          </p>
        </div>
        <p className="text-[9px] text-player-muted font-black uppercase tracking-widest mt-0.5 opacity-60">
          {weather.city}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center px-4 py-6 text-center animate-in zoom-in duration-500">
      <div className="relative mb-3">
        <div className="absolute inset-0 bg-sky-500/20 blur-2xl rounded-full" />
        <Icon className="h-12 w-12 text-sky-400 relative drop-shadow-lg" />
      </div>
      <p className="text-4xl font-bold text-player-text font-display tracking-tight">{weather.temp}°</p>
      <p className="text-sm font-black text-player-muted uppercase tracking-[0.15em] mt-1">{weather.condition}</p>
      <p className="text-[10px] text-player-muted/40 font-bold uppercase mt-1 tracking-widest">{weather.city}</p>
    </div>
  );
}
