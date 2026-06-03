import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useSelectedPlaylist } from "@/hooks/useSelectedPlaylist";
import {
  saveSelectedPlaylist,
  clearSelectedPlaylist,
  SELECTED_PLAYLIST_TTL_MS,
} from "@/utils/persistentSelection";
import type { Playlist } from "@/types/player";

const mkPlaylist = (id: string): Playlist =>
  ({ id, nome_da_tela: `P-${id}`, ordem_arquivos: [] } as unknown as Playlist);

describe("useSelectedPlaylist", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useRealTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    localStorage.clear();
  });

  it("retorna o ID quando ele existe na lista de playlists (válido)", async () => {
    saveSelectedPlaylist("abc");
    const playlists = [mkPlaylist("abc"), mkPlaylist("xyz")];

    const { result } = renderHook(() => useSelectedPlaylist(playlists, true));

    await waitFor(() => {
      expect(result.current.selectedPlaylistId).toBe("abc");
    });
    expect(localStorage.getItem("selectedPlaylist")).toContain("abc");
  });

  it("limpa o ID quando a playlist foi deletada (não existe mais na lista)", async () => {
    saveSelectedPlaylist("deleted-id");
    const playlists = [mkPlaylist("other")];

    const { result } = renderHook(() => useSelectedPlaylist(playlists, true));

    await waitFor(() => {
      expect(result.current.selectedPlaylistId).toBeNull();
    });
    expect(localStorage.getItem("selectedPlaylist")).toBeNull();
  });

  it("ignora ID expirado por TTL (>7 dias) e retorna null no load inicial", () => {
    const expired = {
      id: "old-id",
      savedAt: Date.now() - (SELECTED_PLAYLIST_TTL_MS + 1000),
    };
    localStorage.setItem("selectedPlaylist", JSON.stringify(expired));

    const playlists = [mkPlaylist("old-id")];
    const { result } = renderHook(() => useSelectedPlaylist(playlists, true));

    expect(result.current.selectedPlaylistId).toBeNull();
    expect(localStorage.getItem("selectedPlaylist")).toBeNull();
  });

  it("não valida enquanto playlistsLoaded=false (evita falso-positivo)", () => {
    saveSelectedPlaylist("abc");
    const { result } = renderHook(() => useSelectedPlaylist([], false));
    expect(result.current.selectedPlaylistId).toBe("abc");
    expect(localStorage.getItem("selectedPlaylist")).toContain("abc");
  });

  it("setSelectedPlaylistId persiste e limpa corretamente", () => {
    const { result } = renderHook(() => useSelectedPlaylist([], false));

    act(() => result.current.setSelectedPlaylistId("novo"));
    expect(result.current.selectedPlaylistId).toBe("novo");
    expect(localStorage.getItem("selectedPlaylist")).toContain("novo");

    act(() => result.current.setSelectedPlaylistId(null));
    expect(result.current.selectedPlaylistId).toBeNull();
    expect(localStorage.getItem("selectedPlaylist")).toBeNull();
  });
});
