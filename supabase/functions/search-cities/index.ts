import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { query } = await req.json();
    
    if (!query || query.length < 3) {
      return new Response(JSON.stringify([]), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("OPENWEATHERMAP_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "API key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stateMap: Record<string, string> = {
      "Acre": "AC", "Alagoas": "AL", "Amapá": "AP", "Amazonas": "AM", "Bahia": "BA",
      "Ceará": "CE", "Distrito Federal": "DF", "Espírito Santo": "ES", "Goiás": "GO",
      "Maranhão": "MA", "Mato Grosso": "MT", "Mato Grosso do Sul": "MS", "Minas Gerais": "MG",
      "Pará": "PA", "Paraíba": "PB", "Paraná": "PR", "Pernambuco": "PE", "Piauí": "PI",
      "Rio de Janeiro": "RJ", "Rio Grande do Norte": "RN", "Rio Grande do Sul": "RS",
      "Rondônia": "RO", "Roraima": "RR", "Santa Catarina": "SC", "São Paulo": "SP",
      "Sergipe": "SE", "Tocantins": "TO"
    };

    // Busca cidades no Brasil (country: BR)
    const url = `http://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(query)},BR&limit=10&appid=${apiKey}`;
    console.log("🔍 Buscando cidades:", url);
    
    const res = await fetch(url);
    const data = await res.json();

    if (!res.ok) {
      return new Response(JSON.stringify({ error: "External API error" }), {
        status: res.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Formata o resultado para "Cidade, Estado"
    const suggestions = data.map((item: any) => {
      const uf = stateMap[item.state] || item.state || "BR";
      return {
        name: item.name,
        state: uf,
        fullName: `${item.name}, ${uf}`,
        lat: item.lat,
        lon: item.lon
      };
    });

    return new Response(JSON.stringify(suggestions), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
