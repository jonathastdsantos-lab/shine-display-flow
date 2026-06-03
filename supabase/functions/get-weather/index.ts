const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    let { city, locale } = await req.json();

    // Normaliza locale (pt-BR padrão)
    const lng = typeof locale === "string" && locale.startsWith("en") ? "en" : "pt-BR";
    const isEn = lng === "en";

    // Fallback de cidade default por idioma
    const defaultCity = isEn ? "New York, NY" : "São Paulo, SP";

    // IP-based automatic detection if city is empty or "auto"
    if (!city || city === "auto" || city.trim() === "") {
      const clientIp = req.headers.get("x-real-ip") || req.headers.get("cf-connecting-ip");
      try {
        const ipUrl = `http://ip-api.com/json/${clientIp || ""}?fields=status,message,city,regionName,country`;
        const ipRes = await fetch(ipUrl);
        const ipData = await ipRes.json();
        if (ipData.status === "success" && ipData.city) {
          city = `${ipData.city}, ${ipData.regionName || ""}`;
        } else {
          city = defaultCity;
        }
      } catch {
        city = defaultCity;
      }
    }

    const cleanCity = city.replace(/\s*-\s*/g, ", ").trim();
    const cityParts = cleanCity.split(",").map((p: string) => p.trim().toLowerCase());
    const cityName = cityParts[0];
    const stateHint = cityParts.length > 1 ? cityParts[1] : "";

    const geocodeLang = isEn ? "en" : "pt";
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=10&language=${geocodeLang}&format=json`;
    console.log(`🔍 Geocoding (${lng}): ${geoUrl}`);
    const geoRes = await fetch(geoUrl);
    const geoData = await geoRes.json();

    if (!geoRes.ok || !geoData.results || geoData.results.length === 0) {
      const msg = isEn ? "City not found: " : "Cidade não encontrada: ";
      return new Response(JSON.stringify({ error: msg + cleanCity }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Em pt-BR prioriza resultados BR; em en não força país
    const preferred = isEn ? geoData.results : geoData.results.filter((r: any) => r.country_code === "BR");
    const candidates = preferred.length > 0 ? preferred : geoData.results;

    let bestMatch = candidates[0];
    if (stateHint) {
      const normalize = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const found = candidates.find((r: any) => {
        const admin1 = normalize(r.admin1 || "");
        return admin1.includes(normalize(stateHint)) || normalize(stateHint).includes(admin1.substring(0, 3));
      });
      if (found) bestMatch = found;
    }

    const { latitude, longitude, name, admin1, timezone } = bestMatch;
    const displayCity = admin1 ? `${name}, ${admin1}` : name;
    const tz = timezone || (isEn ? "America/New_York" : "America/Sao_Paulo");
    console.log(`📍 Matched: ${displayCity} (${latitude}, ${longitude}) tz=${tz}`);

    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m,pressure_msl&hourly=temperature_2m,relative_humidity_2m,weather_code&timezone=${encodeURIComponent(tz)}&forecast_days=1`;
    const weatherRes = await fetch(weatherUrl);
    const wd = await weatherRes.json();

    if (!weatherRes.ok || !wd.current) {
      const msg = isEn ? "Weather data unavailable" : "Dados meteorológicos indisponíveis";
      return new Response(JSON.stringify({ error: msg }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const cur = wd.current;

    const getIconFromWmo = (code: number, isNight: boolean) => {
      const suffix = isNight ? "n" : "d";
      if (code === 0) return `01${suffix}`;
      if (code <= 3) return `03${suffix}`;
      if (code <= 48) return `50${suffix}`;
      if (code <= 57) return `09${suffix}`;
      if (code <= 67) return `10${suffix}`;
      if (code <= 77) return `13${suffix}`;
      if (code <= 82) return `09${suffix}`;
      if (code <= 86) return `13${suffix}`;
      if (code <= 99) return `11${suffix}`;
      return `01${suffix}`;
    };

    const conditionsPt: Record<string, string> = {
      clear: "Céu limpo",
      mostlyClear: "Predominantemente limpo",
      partlyCloudy: "Parcialmente nublado",
      cloudy: "Nublado",
      fog: "Nevoeiro",
      drizzle: "Garoa",
      freezingDrizzle: "Garoa congelante",
      rain: "Chuva",
      freezingRain: "Chuva congelante",
      snow: "Neve",
      smallHail: "Granizo fino",
      rainShowers: "Pancadas de chuva",
      snowShowers: "Pancadas de neve",
      thunderstorm: "Tempestade",
      thunderstormHail: "Tempestade com granizo",
      fallback: "Limpo",
    };
    const conditionsEn: Record<string, string> = {
      clear: "Clear sky",
      mostlyClear: "Mostly clear",
      partlyCloudy: "Partly cloudy",
      cloudy: "Overcast",
      fog: "Fog",
      drizzle: "Drizzle",
      freezingDrizzle: "Freezing drizzle",
      rain: "Rain",
      freezingRain: "Freezing rain",
      snow: "Snow",
      smallHail: "Small hail",
      rainShowers: "Rain showers",
      snowShowers: "Snow showers",
      thunderstorm: "Thunderstorm",
      thunderstormHail: "Thunderstorm with hail",
      fallback: "Clear",
    };
    const cMap = isEn ? conditionsEn : conditionsPt;

    const getConditionFromWmo = (code: number) => {
      if (code === 0) return cMap.clear;
      if (code === 1) return cMap.mostlyClear;
      if (code === 2) return cMap.partlyCloudy;
      if (code === 3) return cMap.cloudy;
      if (code <= 48) return cMap.fog;
      if (code <= 55) return cMap.drizzle;
      if (code <= 57) return cMap.freezingDrizzle;
      if (code <= 65) return cMap.rain;
      if (code <= 67) return cMap.freezingRain;
      if (code <= 75) return cMap.snow;
      if (code === 77) return cMap.smallHail;
      if (code <= 82) return cMap.rainShowers;
      if (code <= 86) return cMap.snowShowers;
      if (code === 95) return cMap.thunderstorm;
      if (code <= 99) return cMap.thunderstormHail;
      return cMap.fallback;
    };

    // Determine if night (simple: between 18-06 local time)
    const now = new Date();
    // Use timezone offset from the API response time
    const localHour = parseInt(cur.time?.split("T")[1]?.split(":")[0] || "12");
    const isNight = localHour >= 18 || localHour < 6;

    const windDirectionLabel = (deg: number) => {
      const dirs = ["N", "NE", "L", "SE", "S", "SO", "O", "NO"];
      return dirs[Math.round(deg / 45) % 8];
    };

    const weather = {
      temp: Math.round(cur.temperature_2m),
      feels_like: Math.round(cur.apparent_temperature),
      condition: getConditionFromWmo(cur.weather_code),
      icon: getIconFromWmo(cur.weather_code, isNight),
      humidity: Math.round(cur.relative_humidity_2m),
      wind_speed: Math.round(cur.wind_speed_10m),
      wind_direction: windDirectionLabel(cur.wind_direction_10m),
      pressure: Math.round(cur.pressure_msl),
      city: displayCity,
    };

    console.log(`✅ Weather: ${weather.temp}°C, ${weather.condition}, Humidity: ${weather.humidity}%`);

    return new Response(JSON.stringify(weather), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Erro interno: " + (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
