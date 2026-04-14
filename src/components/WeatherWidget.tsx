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
        const { data, error } = await supabase.functions.invoke("get-weather", { body: { city } });
        if (!error && data) setWeather(data);
      } catch {
        // keep last known
      } finally {
        setLoading(false);
      }
    };
    fetchWeather();
    const interval = setInterval(fetchWeather, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, [city]);

  if (loading && !weather) {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-4">
        <Loader2 className="h-5 w-5 animate-spin text-player-muted" />
        <span className="text-[10px] text-player-muted mt-1">Carregando...</span>
      </div>
    );
  }

  if (!weather) return null;

  const Icon = getWeatherIcon(weather.icon);

  if (compact) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-center">
        <Icon className="h-5 w-5 text-sky-400 shrink-0" />
        <div className="text-left">
          <p className="text-lg font-bold text-player-text font-display leading-none">{weather.temp}°</p>
          <p className="text-[9px] text-player-muted truncate max-w-[70px]">{weather.city}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center px-4 py-6 text-center">
      <Icon className="h-10 w-10 text-primary mb-2" />
      <p className="text-3xl font-bold text-player-text font-display">{weather.temp}°</p>
      <p className="text-xs text-player-muted capitalize mt-1">{weather.condition}</p>
      <p className="text-[10px] text-player-muted/60 mt-0.5">{weather.city}</p>
    </div>
  );
}
