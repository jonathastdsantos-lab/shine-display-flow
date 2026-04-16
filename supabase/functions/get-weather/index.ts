const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { city } = await req.json();
    if (!city || typeof city !== "string") {
      return new Response(JSON.stringify({ error: "City is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Clean city name (e.g., "Mesquita - RJ" -> "Mesquita, RJ")
    // Some APIs don't like the "-" separator
    const cleanCity = city.replace(/\s*-\s*/g, ", ").trim();
    
    // 1. Get coordinates using Open-Meteo Geocoding
    // Priority: Append ", Brasil" if no country specified to avoid international confusion
    const query = cleanCity.toLowerCase().includes("brasil") || cleanCity.toLowerCase().includes(", br") 
      ? cleanCity 
      : `${cleanCity}, Brasil`;

    console.log(`🔍 Geocoding search: ${query}`);
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=3&language=pt&format=json`;
    const geoRes = await fetch(geoUrl);
    const geoData = await geoRes.json();

    if (!geoRes.ok || !geoData.results || geoData.results.length === 0) {
      return new Response(JSON.stringify({ error: "City not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Pick best match. If multiple, prefer ones with state matches if user provided one.
    // For now, take the first result as it's the most relevant to the query string.
    const { latitude, longitude, name, admin1 } = geoData.results[0];
    const displayCity = admin1 ? `${name}, ${admin1}` : name;

    console.log(`✅ Found: ${displayCity} (${latitude}, ${longitude})`);

    // 2. Get weather using Open-Meteo
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&timezone=auto`;
    const weatherRes = await fetch(weatherUrl);
    const weatherData = await weatherRes.json();

    if (!weatherRes.ok || !weatherData.current_weather) {
      return new Response(JSON.stringify({ error: "Weather data not available" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Map WMO code to OpenWeatherMap-like icons
    const getIconFromWmo = (code: number) => {
      if (code === 0) return "01d";
      if (code <= 3) return "03d";
      if (code <= 48) return "50d";
      if (code <= 57) return "09d";
      if (code <= 67) return "10d";
      if (code <= 77) return "13d";
      if (code <= 82) return "09d";
      if (code <= 86) return "13d";
      if (code <= 99) return "11d";
      return "01d";
    };

    const getConditionFromWmo = (code: number) => {
      if (code === 0) return "Céu limpo";
      if (code <= 3) return "Parcialmente nublado";
      if (code <= 48) return "Nevoeiro";
      if (code <= 57) return "Garoa";
      if (code <= 67) return "Chuva";
      if (code <= 77) return "Neve";
      if (code <= 82) return "Pancadas de chuva";
      if (code <= 86) return "Pancadas de neve";
      if (code <= 99) return "Tempestade";
      return "Limpo";
    };

    const weather = {
      temp: Math.round(weatherData.current_weather.temperature),
      condition: getConditionFromWmo(weatherData.current_weather.weathercode),
      icon: getIconFromWmo(weatherData.current_weather.weathercode),
      humidity: 0,
      city: displayCity,
    };

    return new Response(JSON.stringify(weather), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Internal error: " + (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
