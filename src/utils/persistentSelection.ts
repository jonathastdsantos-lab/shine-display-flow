/**
 * Persistência da playlist selecionada com TTL de 7 dias.
 * Evita IDs "fantasma" no localStorage após exclusão ou inatividade prolongada.
 */

const STORAGE_KEY = "selectedPlaylist";
export const SELECTED_PLAYLIST_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 dias

interface StoredSelection {
  id: string;
  savedAt: number;
}

export function saveSelectedPlaylist(id: string): void {
  try {
    const payload: StoredSelection = { id, savedAt: Date.now() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (err) {
    console.warn("[persistentSelection] Falha ao salvar:", err);
  }
}

export function loadSelectedPlaylist(): string | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // Fallback de compatibilidade com chave antiga
      const legacy = localStorage.getItem("selectedPlaylistId");
      if (legacy) {
        saveSelectedPlaylist(legacy);
        localStorage.removeItem("selectedPlaylistId");
        return legacy;
      }
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<StoredSelection>;
    if (!parsed || typeof parsed.id !== "string" || typeof parsed.savedAt !== "number") {
      clearSelectedPlaylist();
      return null;
    }

    const age = Date.now() - parsed.savedAt;
    if (age > SELECTED_PLAYLIST_TTL_MS) {
      console.info("[persistentSelection] Seleção expirada (>7 dias), removendo.");
      clearSelectedPlaylist();
      return null;
    }

    return parsed.id;
  } catch (err) {
    console.warn("[persistentSelection] Falha ao ler, limpando:", err);
    clearSelectedPlaylist();
    return null;
  }
}

export function clearSelectedPlaylist(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem("selectedPlaylistId");
  } catch (err) {
    console.warn("[persistentSelection] Falha ao limpar:", err);
  }
}
