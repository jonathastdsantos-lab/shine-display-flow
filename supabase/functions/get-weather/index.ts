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

    // 1. Get coordinates using Open-Meteo Geocoding (Free, no key)
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=pt&format=json`;
    const geoRes = await fetch(geoUrl);
    const geoData = await geoRes.json();

    if (!geoRes.ok || !geoData.results || geoData.results.length === 0) {
      return new Response(JSON.stringify({ error: "City not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { latitude, longitude, name } = geoData.results[0];

    // 2. Get weather using Open-Meteo (Free, no key)
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&timezone=auto`;
    const weatherRes = await fetch(weatherUrl);
    const weatherData = await weatherRes.json();

    if (!weatherRes.ok || !weatherData.current_weather) {
      return new Response(JSON.stringify({ error: "Weather data not available" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Map WMO code to OpenWeatherMap-like icons for compatibility with existing frontend
    // https://open-meteo.com/en/docs
    const getIconFromWmo = (code: number) => {
      if (code === 0) return "01d"; // Clear
      if (code <= 3) return "03d";  // Partly cloudy
      if (code <= 48) return "50d"; // Fog
      if (code <= 57) return "09d"; // Drizzle
      if (code <= 67) return "10d"; // Rain
      if (code <= 77) return "13d"; // Snow
      if (code <= 82) return "09d"; // Showers
      if (code <= 86) return "13d"; // Snow showers
      if (code <= 99) return "11d"; // Thunderstorm
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
      humidity: 0, // Open-Meteo current_weather doesn't return humidity by default
      city: name,
    };

    return new Response(JSON.stringify(weather), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Internal error: " + err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
