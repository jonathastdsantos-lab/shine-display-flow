import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import type { MediaItem } from "@/pages/player/shared";

// ── Supabase mock ──
const insertSpy = vi.fn().mockResolvedValue({ error: null });
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn(() => ({ insert: insertSpy })),
  },
}));

// Import AFTER mocks
import { useMediaPlayback } from "@/hooks/useMediaPlayback";

const items: MediaItem[] = [
  { id: "m1", url_arquivo: "https://x/a.jpg", tipo: "imagem", duracao: 5 } as any,
  { id: "m2", url_arquivo: "https://x/b.jpg", tipo: "imagem", duracao: 5 } as any,
  { id: "m3", url_arquivo: "https://x/c.jpg", tipo: "imagem", duracao: 5 } as any,
];

const defaults = {
  playlistId: "pl-1",
  mediaItems: items,
  paused: false,
  remoteActive: false,
  adWidgetEnabled: false,
  nextCommandSignal: 0,
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("useMediaPlayback", () => {
  it("avança o índice ao chamar goToNext()", () => {
    const { result } = renderHook(() => useMediaPlayback(defaults));
    expect(result.current.currentIndex).toBe(0);

    act(() => {
      result.current.goToNext();
    });
    // após 800ms o índice deve avançar
    act(() => {
      vi.advanceTimersByTime(800);
    });
    expect(result.current.currentIndex).toBe(1);
  });

  it("não avança quando paused=true", () => {
    const { result } = renderHook(() =>
      useMediaPlayback({ ...defaults, paused: true })
    );
    act(() => result.current.goToNext());
    act(() => vi.advanceTimersByTime(1000));
    expect(result.current.currentIndex).toBe(0);
    expect(insertSpy).not.toHaveBeenCalled();
  });

  it("não avança quando remoteActive=true (intervenção remota)", () => {
    const { result } = renderHook(() =>
      useMediaPlayback({ ...defaults, remoteActive: true })
    );
    act(() => result.current.goToNext());
    act(() => vi.advanceTimersByTime(1000));
    expect(result.current.currentIndex).toBe(0);
    expect(insertSpy).not.toHaveBeenCalled();
  });

  it("executa o ciclo completo de fade (true → false)", () => {
    const { result } = renderHook(() => useMediaPlayback(defaults));
    expect(result.current.fading).toBe(false);

    act(() => result.current.goToNext());
    // imediatamente após chamar, fading=true
    expect(result.current.fading).toBe(true);

    act(() => vi.advanceTimersByTime(800));
    expect(result.current.fading).toBe(false);
  });

  it("chama logPlay() (insert em play_logs) ao avançar", () => {
    const { result } = renderHook(() => useMediaPlayback(defaults));
    act(() => result.current.goToNext());

    expect(insertSpy).toHaveBeenCalledTimes(1);
    const payload = insertSpy.mock.calls[0][0];
    expect(payload).toMatchObject({
      player_id: "pl-1",
      media_id: "m1",
      media_type: "imagem",
      duration_sec: 5,
    });
    expect(payload.played_at).toEqual(expect.any(String));
  });
});
