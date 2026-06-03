import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

/**
 * Edge functions Deno não podem ser importadas no Vitest.
 * Replicamos aqui as funções puras de supabase/functions/get-weather/index.ts
 * para validá-las em isolamento.
 */

function normalizeCity(input: string | undefined): string {
  if (!input || input === "auto" || input.trim() === "") return "São Paulo, SP";
  return input.replace(/\s*-\s*/g, ", ").trim();
}

function splitCity(clean: string) {
  const parts = clean.split(",").map((p) => p.trim().toLowerCase());
  return { cityName: parts[0], stateHint: parts[1] || "" };
}

function getConditionFromWmo(code: number): string {
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
}

async function geocode(city: string, fetchImpl: typeof fetch) {
  const { cityName } = splitCity(city);
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
    cityName
  )}&count=10&language=pt&format=json`;
  const res = await fetchImpl(url);
  return res.json();
}

beforeEach(() => {
  vi.restoreAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("get-weather edge function (lógica pura)", () => {
  it('faz geocoding com cidade válida "São Paulo, SP"', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        results: [
          { name: "São Paulo", admin1: "São Paulo", country_code: "BR", latitude: -23.5, longitude: -46.6 },
        ],
      }),
    });
    const data = await geocode("São Paulo, SP", mockFetch as any);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const calledUrl = (mockFetch.mock.calls[0] as any[])[0] as string;
    expect(calledUrl).toContain("name=s%C3%A3o%20paulo");
    expect(data.results[0].name).toBe("São Paulo");
  });

  it('faz fallback para "São Paulo, SP" quando cidade é "auto", vazia ou undefined', () => {
    expect(normalizeCity("auto")).toBe("São Paulo, SP");
    expect(normalizeCity("")).toBe("São Paulo, SP");
    expect(normalizeCity("   ")).toBe("São Paulo, SP");
    expect(normalizeCity(undefined)).toBe("São Paulo, SP");
    expect(normalizeCity("Curitiba, PR")).toBe("Curitiba, PR");
    expect(normalizeCity("Curitiba - PR")).toBe("Curitiba, PR");
  });

  it("mapeia códigos WMO para condições em português", () => {
    expect(getConditionFromWmo(0)).toBe("Céu limpo");
    expect(getConditionFromWmo(2)).toBe("Parcialmente nublado");
    expect(getConditionFromWmo(3)).toBe("Nublado");
    expect(getConditionFromWmo(45)).toBe("Nevoeiro");
    expect(getConditionFromWmo(53)).toBe("Garoa");
    expect(getConditionFromWmo(63)).toBe("Chuva");
    expect(getConditionFromWmo(73)).toBe("Neve");
    expect(getConditionFromWmo(77)).toBe("Granizo fino");
    expect(getConditionFromWmo(81)).toBe("Pancadas de chuva");
    expect(getConditionFromWmo(95)).toBe("Tempestade");
    expect(getConditionFromWmo(99)).toBe("Tempestade com granizo");
  });
});
