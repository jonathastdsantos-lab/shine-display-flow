import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";

/**
 * Helper para criar uma cadeia .from(...).select().eq().maybeSingle() / .eq()
 * com resultado controlado por tabela.
 */
function makeSupabaseMock(tables: Record<string, { data?: any; error?: any }>) {
  const rpc = vi.fn().mockResolvedValue({ data: null, error: null });
  const invoke = vi.fn().mockResolvedValue({ data: { titles: [] }, error: null });
  const removeChannel = vi.fn();
  const channel = vi.fn(() => {
    const obj: any = {};
    obj.on = vi.fn(() => obj);
    obj.subscribe = vi.fn(() => obj);
    return obj;
  });

  const from = vi.fn((table: string) => {
    const result = tables[table] || { data: null, error: null };
    const builder: any = {};
    builder.select = vi.fn(() => builder);
    builder.eq = vi.fn(() => builder);
    builder.maybeSingle = vi.fn().mockResolvedValue(result);
    // p/ media_library (.eq() resolve direto)
    builder.then = (resolve: any) => Promise.resolve(result).then(resolve);
    return builder;
  });

  return {
    supabase: { from, rpc, functions: { invoke }, channel, removeChannel },
    rpc,
    invoke,
  };
}

// Mock dinâmico — reconfigurado em cada teste via vi.doMock+import dinâmico.
vi.mock("@/integrations/supabase/client", () => ({ supabase: {} }));

async function loadHook(mockBundle: ReturnType<typeof makeSupabaseMock>) {
  vi.doMock("@/integrations/supabase/client", () => ({ supabase: mockBundle.supabase }));
  vi.resetModules();
  const mod = await import("@/hooks/usePlayerSync");
  return mod.usePlayerSync;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
});

afterEach(() => {
  vi.doUnmock("@/integrations/supabase/client");
});

describe("usePlayerSync", () => {
  it("popula mediaItems corretamente a partir de media_library", async () => {
    const media = [
      { id: "a", url_arquivo: "x", tipo: "imagem", duracao: 5, client_id: "c1" },
      { id: "b", url_arquivo: "y", tipo: "imagem", duracao: 5, client_id: "c1" },
    ];
    const bundle = makeSupabaseMock({
      playlists: {
        data: {
          id: "pl1",
          client_id: "c1",
          ordem_arquivos: ["a", "b"],
          template: "corporativo",
        },
      },
      media_library: { data: media },
      profiles: { data: { config_clima: "Rio", config_noticias: "sports" } },
    });
    const usePlayerSync = await loadHook(bundle);

    const { result } = renderHook(() => usePlayerSync("pl1"));
    await waitFor(() => expect(result.current.mediaItems).toHaveLength(2));
    expect(result.current.mediaItems[0].id).toBe("a");
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("config da tela tem precedência sobre profile (tela → perfil → default)", async () => {
    const bundle = makeSupabaseMock({
      playlists: {
        data: {
          id: "pl1",
          client_id: "c1",
          config_clima: "Curitiba", // tela define
          ordem_arquivos: [],
        },
      },
      media_library: { data: [] },
      profiles: { data: { config_clima: "Rio", config_noticias: "sports" } },
    });
    const usePlayerSync = await loadHook(bundle);
    const { result } = renderHook(() => usePlayerSync("pl1"));

    // city da tela vence
    await waitFor(() => expect(result.current.city).toBe("Curitiba"));
    // newsCategory cai no perfil porque tela não define
    expect(result.current.newsCategory).toBe("sports");
  });

  it("usa defaults quando tela e perfil estão vazios", async () => {
    const bundle = makeSupabaseMock({
      playlists: { data: { id: "pl1", client_id: "c1", ordem_arquivos: [] } },
      media_library: { data: [] },
      profiles: { data: {} },
    });
    const usePlayerSync = await loadHook(bundle);
    const { result } = renderHook(() => usePlayerSync("pl1"));
    await waitFor(() => expect(result.current.city).toBe("São Paulo"));
    expect(result.current.newsCategory).toBe("technology");
  });

  it('remote_command "reload" dispara window.location.reload', async () => {
    const reloadSpy = vi.fn();
    const originalLocation = window.location;
    // @ts-ignore
    delete (window as any).location;
    (window as any).location = { ...originalLocation, reload: reloadSpy };

    const bundle = makeSupabaseMock({
      playlists: {
        data: {
          id: "pl1",
          client_id: "c1",
          ordem_arquivos: [],
          remote_command: "reload",
        },
      },
      media_library: { data: [] },
      profiles: { data: {} },
    });
    const usePlayerSync = await loadHook(bundle);
    renderHook(() => usePlayerSync("pl1"));

    await waitFor(() => expect(bundle.rpc).toHaveBeenCalledWith("clear_remote_command", { p_playlist_id: "pl1" }));
    await new Promise((r) => setTimeout(r, 350));
    expect(reloadSpy).toHaveBeenCalled();

    (window as any).location = originalLocation;
  });

  it('remote_command "pause" seta paused=true', async () => {
    const bundle = makeSupabaseMock({
      playlists: {
        data: {
          id: "pl1",
          client_id: "c1",
          ordem_arquivos: [],
          remote_command: "pause",
        },
      },
      media_library: { data: [] },
      profiles: { data: {} },
    });
    const usePlayerSync = await loadHook(bundle);
    const { result } = renderHook(() => usePlayerSync("pl1"));
    await waitFor(() => expect(result.current.paused).toBe(true));
  });
});
