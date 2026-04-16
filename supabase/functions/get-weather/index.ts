const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    let { city } = await req.json();

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
          city = "São Paulo, SP";
        }
      } catch {
        city = "São Paulo, SP";
      }
    }

    // Clean city name
    const cleanCity = city.replace(/\s*-\s*/g, ", ").trim();
    const cityParts = cleanCity.split(",").map((p: string) => p.trim().toLowerCase());
    const cityName = cityParts[0];
    const stateHint = cityParts.length > 1 ? cityParts[1] : "";

    // 1. Geocoding - search by city name only (no ", Brasil" suffix that breaks results)
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=10&language=pt&format=json`;
    console.log(`🔍 Geocoding: ${geoUrl}`);
    const geoRes = await fetch(geoUrl);
    const geoData = await geoRes.json();

    if (!geoRes.ok || !geoData.results || geoData.results.length === 0) {
      return new Response(JSON.stringify({ error: "Cidade não encontrada: " + cleanCity }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Filter to Brazilian results first
    const brResults = geoData.results.filter((r: any) => r.country_code === "BR");
    const candidates = brResults.length > 0 ? brResults : geoData.results;

    // Pick best match considering state hint
    let bestMatch = candidates[0];
    if (stateHint) {
      const normalize = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const found = candidates.find((r: any) => {
        const admin1 = normalize(r.admin1 || "");
        return admin1.includes(normalize(stateHint)) || normalize(stateHint).includes(admin1.substring(0, 3));
      });
      if (found) bestMatch = found;
    }

    const { latitude, longitude, name, admin1 } = bestMatch;
    const displayCity = admin1 ? `${name}, ${admin1}` : name;
    console.log(`📍 Matched: ${displayCity} (${latitude}, ${longitude})`);

    // 2. Weather - get current + hourly for accurate data
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m,pressure_msl&hourly=temperature_2m,relative_humidity_2m,weather_code&timezone=America/Sao_Paulo&forecast_days=1`;
    const weatherRes = await fetch(weatherUrl);
    const wd = await weatherRes.json();

    if (!weatherRes.ok || !wd.current) {
      return new Response(JSON.stringify({ error: "Dados meteorológicos indisponíveis" }), {
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

    const getConditionFromWmo = (code: number) => {
      if (code === 0) return "Céu limpo";
      if (code === 1) return "Predominantemente limpo";
      if (code === 2) return "Parcialmente nublado";
      if (code === 3) return "Nublado";
      if (code <= 48) return "Nevoeiro";
      if (code <= 55) return "Garoa";
      if (code <= 57) return "Garoa congelante";
      if (code <= 65) return "Chuva";
      if (code <= 67) return "Chuva congelante";
      if (code <= 75) return "Neve";
      if (code === 77) return "Granizo fino";
      if (code <= 82) return "Pancadas de chuva";
      if (code <= 86) return "Pancadas de neve";
      if (code === 95) return "Tempestade";
      if (code <= 99) return "Tempestade com granizo";
      return "Limpo";
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
