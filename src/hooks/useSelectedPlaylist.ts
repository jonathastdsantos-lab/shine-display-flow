import { useCallback, useEffect, useState } from "react";
import {
  saveSelectedPlaylist,
  loadSelectedPlaylist,
  clearSelectedPlaylist,
} from "@/utils/persistentSelection";
import type { Playlist } from "@/types/player";

/**
 * Encapsula leitura, persistência e validação do playlist selecionado.
 * Sempre que a lista de playlists muda, valida se o ID atual ainda existe.
 */
export function useSelectedPlaylist(playlists: Playlist[], playlistsLoaded: boolean) {
  const [selectedPlaylistId, setSelectedPlaylistIdState] = useState<string | null>(
    () => loadSelectedPlaylist()
  );

  const setSelectedPlaylistId = useCallback((id: string | null) => {
    setSelectedPlaylistIdState(id);
    if (id) {
      saveSelectedPlaylist(id);
    } else {
      clearSelectedPlaylist();
    }
  }, []);

  // Validação contra playlists reais — limpa IDs fantasma
  useEffect(() => {
    if (!playlistsLoaded) return;
    if (!selectedPlaylistId) return;
    const exists = playlists.some((p) => p.id === selectedPlaylistId);
    if (!exists) {
      console.warn(
        `[useSelectedPlaylist] ID fantasma detectado (${selectedPlaylistId}). Limpando.`
      );
      clearSelectedPlaylist();
      setSelectedPlaylistIdState(null);
    }
  }, [playlists, playlistsLoaded, selectedPlaylistId]);

  return { selectedPlaylistId, setSelectedPlaylistId };
}
