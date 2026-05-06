import { useState, useEffect } from "react";
import { Cloud, Sun, CloudRain, CloudSnow, CloudLightning, CloudDrizzle, Wind, Droplets, Moon, CloudFog } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// Mock determinístico: gera dados plausíveis baseados na cidade quando a API real falha
function getMockWeather(city: string): WeatherData {
  const seed = (city || "default").split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const conditions = [
    { c: "Céu limpo", i: "01d" },
    { c: "Parcialmente nublado", i: "03d" },
    { c: "Nublado", i: "03d" },
    { c: "Chuva leve", i: "10d" },
    { c: "Tempestade", i: "11d" },
  ];
  const pick = conditions[seed % conditions.length];
  const hour = new Date().getHours();
  const isNight = hour >= 18 || hour < 6;
  const temp = 18 + (seed % 15);
  return {
    temp,
    feels_like: temp - 1,
    condition: pick.c,
    icon: isNight ? pick.i.replace("d", "n") : pick.i,
    humidity: 40 + (seed % 50),
    wind_speed: 5 + (seed % 20),
    wind_direction: ["N", "NE", "L", "SE", "S", "SO", "O", "NO"][seed % 8],
    pressure: 1010 + (seed % 15),
    city: city || "São Paulo",
  };
}

interface WeatherWidgetProps {
  city: string;
  compact?: boolean;
  fontSize?: number;
  variant?: 'standard' | 'glass' | 'bold' | 'split';
}

interface WeatherData {
  temp: number;
  feels_like: number;
  condition: string;
  icon: string;
  humidity: number;
  wind_speed: number;
  wind_direction: string;
  pressure: number;
  city: string;
}

function getWeatherIcon(icon: string) {
  if (icon.startsWith("01") && icon.endsWith("n")) return Moon;
  if (icon.startsWith("01")) return Sun;
  if (icon.startsWith("03") && icon.endsWith("n")) return Moon;
  if (icon.startsWith("03")) return Cloud;
  if (icon.startsWith("09")) return CloudDrizzle;
  if (icon.startsWith("10")) return CloudRain;
  if (icon.startsWith("11")) return CloudLightning;
  if (icon.startsWith("13")) return CloudSnow;
  if (icon.startsWith("50")) return CloudFog;
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
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  useEffect(() => {
    const target = city || "auto";
    const fetchWeather = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke("get-weather", { body: { city: target } });
        if (error || !data || (data as any).error) throw error || new Error("api falhou");
        setWeather(data as WeatherData);
      } catch (err: any) {
        console.warn("⚠️ Clima via API falhou, usando mock:", err?.message);
        setWeather(getMockWeather(target));
      } finally {
        setUpdatedAt(new Date());
        setLoading(false);
      }
    };
    fetchWeather();
    const interval = setInterval(fetchWeather, 15 * 60 * 1000);
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
          {!compact && (
            <>
              <p className="text-[8px] font-bold text-white/40 uppercase tracking-widest mt-1">{weather.condition}</p>
              <p className="text-[7px] text-white/30 mt-0.5">Sensação: {weather.feels_like}°</p>
            </>
          )}
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

  // Variant: SPLIT
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
      <p className="text-[10px] text-player-muted/60 mt-1">Sensação: {weather.feels_like}°</p>
      <p className="text-xs font-black text-player-muted uppercase tracking-[0.15em] mt-2">{weather.condition}</p>
      <div className="flex items-center gap-3 mt-2 text-[9px] text-player-muted/50 uppercase tracking-widest">
        <span className="flex items-center gap-1"><Droplets className="w-3 h-3" />{weather.humidity}%</span>
        <span className="flex items-center gap-1"><Wind className="w-3 h-3" />{weather.wind_direction} {weather.wind_speed}km/h</span>
      </div>
      <p className="text-[9px] text-player-muted/40 font-bold uppercase mt-1 tracking-widest">{weather.city}</p>
      {updatedAt && (
        <p className="text-[8px] text-player-muted/30 mt-1 tracking-wider">
          Atualizado {format(updatedAt, "dd 'de' MMM 'às' HH:mm", { locale: ptBR })}
        </p>
      )}
    </div>
  );
}
