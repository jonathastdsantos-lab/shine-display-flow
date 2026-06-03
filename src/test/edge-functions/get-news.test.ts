import { describe, it, expect, beforeEach } from "vitest";

/**
 * As edge functions usam APIs Deno e não podem ser importadas no Vitest (Node).
 * Replicamos aqui a lógica pura para validá-la em isolamento.
 * Mantenha sincronizado com supabase/functions/get-news/index.ts.
 */

const categoryMap: Record<string, string> = {
  technology: "tecnologia",
  sports: "esportes",
  business: "economia",
  entertainment: "entretenimento",
  health: "saúde",
  science: "ciência",
  general: "notícias",
};

function buildQuery(category: string, location?: string) {
  let query = "";
  if (location && location.trim() !== "") query += `"${location}" `;
  query += categoryMap[category] || category || "notícias";
  return query;
}

function decodeEntities(s: string) {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/ - Google News/g, "");
}

function parseRssTitles(xml: string): string[] {
  const itemRegex = /<item>[\s\S]*?<title>(.*?)<\/title>[\s\S]*?<\/item>/g;
  const titles: string[] = [];
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    if (match[1]) titles.push(decodeEntities(match[1]));
    if (titles.length >= 15) break;
  }
  return titles;
}

function handleResponse(titles: string[], category: string, location?: string) {
  if (titles.length === 0) {
    const translated = categoryMap[category] || category || "notícias";
    return [`Últimas notícias sobre ${translated}${location ? " em " + location : ""}`];
  }
  return titles;
}

beforeEach(() => {});

describe("get-news edge function (lógica pura)", () => {
  it('monta query para categoria "technology"', () => {
    expect(buildQuery("technology")).toBe("tecnologia");
    expect(buildQuery("technology", "São Paulo")).toBe('"São Paulo" tecnologia');
  });

  it("usa fallback quando RSS retorna vazio", () => {
    const titles = parseRssTitles("<rss></rss>");
    expect(titles).toEqual([]);
    const out = handleResponse(titles, "technology");
    expect(out).toEqual(["Últimas notícias sobre tecnologia"]);
  });

  it("decodifica entidades XML (&amp; &quot; &apos; &lt; &gt;)", () => {
    const xml = `
      <rss><channel>
        <item><title>Banco &amp; Bolsa</title></item>
        <item><title>&quot;Crise&quot; mundial</title></item>
        <item><title>It&apos;s here - Google News</title></item>
        <item><title>5 &lt; 10 &gt; 1</title></item>
      </channel></rss>
    `;
    const titles = parseRssTitles(xml);
    expect(titles).toEqual([
      "Banco & Bolsa",
      '"Crise" mundial',
      "It's here",
      "5 < 10 > 1",
    ]);
  });
});
