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
      console.log(`📡 Automatic location requested. Client IP: ${clientIp || "Unknown"}`);
      
      try {
        // Use ip-api.com (free) to get city from IP
        const ipUrl = `http://ip-api.com/json/${clientIp || ""}?fields=status,message,city,regionName,country`;
        const ipRes = await fetch(ipUrl);
        const ipData = await ipRes.json();
        
        if (ipData.status === "success" && ipData.city) {
          city = `${ipData.city}, ${ipData.regionName || ""}`;
          console.log(`📍 IP Geolocated: ${city}`);
        } else {
          console.warn("⚠️ IP Geolocation failed or returned no city. Falling back to default.");
          city = "São Paulo, SP";
        }
      } catch (e) {
        console.error("❌ Error during IP geolocation:", e);
        city = "São Paulo, SP";
      }
    }

    // Clean city name (e.g., "Mesquita - RJ" -> "Mesquita, RJ")
    const cleanCity = city.replace(/\s*-\s*/g, ", ").trim();
    
    // 1. Get coordinates using Open-Meteo Geocoding
    const query = cleanCity.toLowerCase().includes("brasil") || cleanCity.toLowerCase().includes(", br") 
      ? cleanCity 
      : `${cleanCity}, Brasil`;

    console.log(`🔍 Geocoding search: ${query}`);
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=pt&format=json`;
    const geoRes = await fetch(geoUrl);
    const geoData = await geoRes.json();

    if (!geoRes.ok || !geoData.results || geoData.results.length === 0) {
      return new Response(JSON.stringify({ error: "City not found: " + query }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Pick best match. 
    let bestMatch = geoData.results[0];
    const cityParts = cleanCity.split(",").map((p: string) => p.trim().toLowerCase());
    
    if (cityParts.length > 1) {
      const stateHint = cityParts[1];
      const foundInState = geoData.results.find((r: any) => 
        (r.admin1 && r.admin1.toLowerCase().includes(stateHint)) ||
        (r.admin1_id && r.admin1_id.toString().includes(stateHint))
      );
      if (foundInState) {
        bestMatch = foundInState;
      }
    }

    const { latitude, longitude, name, admin1 } = bestMatch;
    const displayCity = admin1 ? `${name}, ${admin1}` : name;

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
