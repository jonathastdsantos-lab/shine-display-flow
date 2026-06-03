import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { category, location, locale } = await req.json();

    // Normaliza locale (pt-BR padrão para compat com clientes existentes)
    const lng = typeof locale === "string" && locale.startsWith("en") ? "en" : "pt-BR";
    const isEn = lng === "en";

    console.log(`Fetching news for category: ${category}, location: ${location}, locale: ${lng}`);

    let query = "";
    if (location && location.trim() !== "") {
      query += `"${location}" `;
    }

    // Categorias por idioma para melhores resultados regionais
    const categoryMapPt: Record<string, string> = {
      technology: "tecnologia",
      sports: "esportes",
      business: "economia",
      entertainment: "entretenimento",
      health: "saúde",
      science: "ciência",
      general: "notícias",
    };
    const categoryMapEn: Record<string, string> = {
      technology: "technology",
      sports: "sports",
      business: "business",
      entertainment: "entertainment",
      health: "health",
      science: "science",
      general: "news",
    };
    const map = isEn ? categoryMapEn : categoryMapPt;
    const fallbackTerm = isEn ? "news" : "notícias";
    const translatedCategory = map[category] || category || fallbackTerm;
    query += translatedCategory;

    const hl = isEn ? "en-US" : "pt-BR";
    const gl = isEn ? "US" : "BR";
    const ceid = isEn ? "US:en" : "BR:pt-419";
    const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=${hl}&gl=${gl}&ceid=${ceid}`;

    console.log(`RSS URL: ${rssUrl}`);

    const response = await fetch(rssUrl);
    const xmlText = await response.text();

    const itemRegex = /<item>[\s\S]*?<title>(.*?)<\/title>[\s\S]*?<\/item>/g;
    const titles: string[] = [];
    let match;

    while ((match = itemRegex.exec(xmlText)) !== null) {
      if (match[1]) {
        let title = match[1]
          .replace(/&amp;/g, '&')
          .replace(/&quot;/g, '"')
          .replace(/&apos;/g, "'")
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/ - Google News/g, '');
        titles.push(title);
      }
      if (titles.length >= 15) break;
    }

    if (titles.length === 0) {
      console.log("No titles found, returning general placeholder");
      const inWord = isEn ? "in" : "em";
      const prefix = isEn
        ? `Latest news on ${translatedCategory}`
        : `Últimas notícias sobre ${translatedCategory}`;
      titles.push(`${prefix}${location ? ` ${inWord} ${location}` : ""}`);
    }

    return new Response(JSON.stringify({ titles }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Error in get-news function:", error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
