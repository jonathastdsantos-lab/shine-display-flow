import { useState, useEffect } from "react";
import { Cloud, Sun, CloudRain, CloudSnow, CloudLightning, CloudDrizzle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface WeatherWidgetProps {
  city: string;
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

export default function WeatherWidget({ city }: WeatherWidgetProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!city) return;

    const fetchWeather = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke("get-weather", {
          body: { city },
        });
        if (!error && data) {
          setWeather(data);
        }
      } catch {
        // silently fail, keep last known data
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
    const interval = setInterval(fetchWeather, 10 * 60 * 1000); // refresh every 10 min
    return () => clearInterval(interval);
  }, [city]);

  if (loading && !weather) {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-background/20 px-4 py-2 backdrop-blur-md">
        <Loader2 className="h-5 w-5 animate-spin text-primary-foreground" />
        <span className="text-xs text-primary-foreground/70">Carregando...</span>
      </div>
    );
  }

  if (!weather) return null;

  const Icon = getWeatherIcon(weather.icon);

  return (
    <div className="flex items-center gap-2 rounded-xl bg-background/20 px-4 py-2 backdrop-blur-md">
      <Icon className="h-6 w-6 text-primary-foreground" />
      <div>
        <p className="text-lg font-bold text-primary-foreground">{weather.temp}°C</p>
        <p className="text-xs text-primary-foreground/70 capitalize">{weather.condition}</p>
        <p className="text-[10px] text-primary-foreground/50">{weather.city}</p>
      </div>
    </div>
  );
}
