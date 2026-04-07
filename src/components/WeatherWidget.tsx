import { useState, useEffect } from "react";
import { Cloud, Sun, CloudRain } from "lucide-react";

interface WeatherWidgetProps {
  city: string;
}

const mockWeather: Record<string, { temp: number; condition: string }> = {
  "São Paulo": { temp: 24, condition: "Parcialmente nublado" },
  "Rio de Janeiro": { temp: 31, condition: "Ensolarado" },
  "Curitiba": { temp: 18, condition: "Chuvoso" },
  "Belo Horizonte": { temp: 27, condition: "Ensolarado" },
  "Brasília": { temp: 26, condition: "Parcialmente nublado" },
};

const defaultWeather = { temp: 22, condition: "Parcialmente nublado" };

export default function WeatherWidget({ city }: WeatherWidgetProps) {
  const [weather, setWeather] = useState(defaultWeather);

  useEffect(() => {
    setWeather(mockWeather[city] || defaultWeather);
  }, [city]);

  const Icon = weather.condition.includes("Chuv") ? CloudRain : weather.condition.includes("Ensol") ? Sun : Cloud;

  return (
    <div className="flex items-center gap-2 rounded-xl bg-background/20 px-4 py-2 backdrop-blur-md">
      <Icon className="h-6 w-6 text-primary-foreground" />
      <div>
        <p className="text-lg font-bold text-primary-foreground">{weather.temp}°C</p>
        <p className="text-xs text-primary-foreground/70">{city}</p>
      </div>
    </div>
  );
}
