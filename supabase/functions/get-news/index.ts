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
    const { category, location } = await req.json();

    console.log(`Fetching news for category: ${category}, location: ${location}`);

    // Construct search query for Google News RSS
    // q=location+category
    let query = "";
    if (location && location.trim() !== "") {
      query += `"${location}" `;
    }
    
    // Map category to Portuguese terms for better results in BR
    const categoryMap: Record<string, string> = {
      technology: "tecnologia",
      sports: "esportes",
      business: "economia",
      entertainment: "entretenimento",
      health: "saúde",
      science: "ciência",
      general: "notícias",
    };

    const translatedCategory = categoryMap[category] || category || "notícias";
    query += translatedCategory;

    const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=pt-BR&gl=BR&ceid=BR:pt-419`;

    console.log(`RSS URL: ${rssUrl}`);

    const response = await fetch(rssUrl);
    const xmlText = await response.text();

    // Simple regex-based XML parsing to extract <title> tags from <item> blocks
    // This avoids heavy XML parsing libraries in the edge function
    const itemRegex = /<item>[\s\S]*?<title>(.*?)<\/title>[\s\S]*?<\/item>/g;
    const titles: string[] = [];
    let match;

    while ((match = itemRegex.exec(xmlText)) !== null) {
      if (match[1]) {
        // Decode common XML entities
        let title = match[1]
          .replace(/&amp;/g, '&')
          .replace(/&quot;/g, '"')
          .replace(/&apos;/g, "'")
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/ - Google News/g, ''); // Remove Google News suffix
        
        titles.push(title);
      }
      
      // Limit to 15 titles
      if (titles.length >= 15) break;
    }

    if (titles.length === 0) {
      // Fallback to general news if specific query yielded nothing
      console.log("No titles found, returning general placeholder");
      titles.push(`Últimas notícias sobre ${translatedCategory}${location ? ' em ' + location : ''}`);
    }

    return new Response(JSON.stringify({ titles }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Error in get-news function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
