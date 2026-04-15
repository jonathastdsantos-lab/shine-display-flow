import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export interface MediaItem {
  id: string;
  url_arquivo: string;
  tipo: string;
  nome: string;
  duracao: number;
}

export interface Playlist {
  id: string;
  nome_da_tela: string;
  ordem_arquivos: string[];
  template?: string;
  layout_config?: any;
  widget_config?: any;
  config_clima?: string;
  config_noticias?: string;
  instagram_handle?: string;
  last_sync_at?: string;
}

export interface ClientProfile {
  config_clima: string;
  config_noticias: string;
  nome_empresa: string;
  template: string;
  instagram_handle: string;
  widget_config: any;
  layout_config?: any;
  user_id?: string;
  screen_limit?: number;
}

export function useDashboardData() {
  const { user } = useAuth();
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [profile, setProfile] = useState<ClientProfile>({
    config_clima: "São Paulo",
    config_noticias: "technology",
    nome_empresa: "",
    template: "corporativo",
    instagram_handle: "",
    widget_config: null,
  });
  const [uploading, setUploading] = useState(false);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(() => {
    return localStorage.getItem("selectedPlaylistId");
  });

  useEffect(() => {
    if (selectedPlaylistId) {
      localStorage.setItem("selectedPlaylistId", selectedPlaylistId);
    }
  }, [selectedPlaylistId]);

  const fetchData = useCallback(async () => {
    if (!user) return;
    
    console.log("🔄 Buscando dados para o usuário:", user.id);
    
    const [mediaRes, playlistRes, profileRes] = await Promise.all([
      supabase.from("media_library").select("*").eq("client_id", user.id),
      supabase.from("playlists").select("*").eq("client_id", user.id),
      supabase.from("profiles").select("*").eq("user_id", user.id).single(),
    ]);

    if (mediaRes.error) console.error("❌ Erro ao buscar mídias:", mediaRes.error.message, mediaRes.error.details);
    if (playlistRes.error) console.error("❌ Erro ao buscar playlists:", playlistRes.error.message);
    if (profileRes.error) console.error("❌ Erro ao buscar perfil:", profileRes.error.message);

    if (mediaRes.data) {
      console.log("✅ Mídias encontradas:", mediaRes.data.length);
      setMedia(mediaRes.data as any);
    }
    if (playlistRes.data) setPlaylists(playlistRes.data as any);
    if (profileRes.data) setProfile(profileRes.data as any);
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleUpload = async (files: FileList) => {
    if (!user) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const tipo = file.type.startsWith("video") ? "video" : "imagem";
        
        // Limpa o nome do arquivo: remove acentos, espaços e caracteres especiais
        const cleanName = file.name
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "") // Remove acentos
          .replace(/[^\w.-]/g, "_")        // Substitui espaços e símbolos por '_'
          .toLowerCase();

        const path = `${user.id}/${Date.now()}-${cleanName}`;
        
        console.log("📤 Iniciando upload Higienizado:", path);
        
        // Upload para o Storage
        const { error: uploadErr } = await supabase.storage.from("media").upload(path, file, {
          cacheControl: '3600',
          upsert: false
        });
        
        if (uploadErr) {
          console.error("Erro no Storage:", uploadErr);
          throw new Error(`Erro no Storage: ${uploadErr.message}`);
        }

        // Obter URL pública
        const { data: { publicUrl } } = supabase.storage.from("media").getPublicUrl(path);

        // Salvar referência no Banco de Dados
        const { error: dbError } = await supabase.from("media_library").insert({
          client_id: user.id,
          url_arquivo: publicUrl,
          tipo,
          nome: file.name,
          duracao: tipo === "imagem" ? 10 : 30,
        });

        if (dbError) {
          console.error("Erro no Banco (media_library):", dbError);
          throw new Error(`Erro no Banco: ${dbError.message}`);
        }
      }
      fetchData();
      return true;
    } catch (error: any) {
      console.error("Falha detalhada no upload:", error);
      // Aqui poderíamos emitir um toast, mas o handleUpload é consumido pelo componente
      // Vamos lançar o erro para que o componente MediaLibrary mostre o toast correto
      throw error;
    } finally {
      setUploading(false);
    }
  };

  const deleteMedia = async (id: string) => {
    await supabase.from("media_library").delete().eq("id", id);
    fetchData();
  };

  const createPlaylist = async (name: string) => {
    if (!user) return null;
    const { data, error } = await supabase
      .from("playlists")
      .insert({
        client_id: user.id,
        nome_da_tela: name,
        ordem_arquivos: [],
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();
      
    if (error) {
      console.error("❌ Erro ao criar tela:", error.message);
      throw error;
    }
    
    await fetchData();
    return data as Playlist;
  };

  const addToPlaylist = async (playlistId: string, mediaId: string) => {
    const pl = playlists.find((p) => p.id === playlistId);
    if (!pl) return;
    const updated = [...(pl.ordem_arquivos || []), mediaId];
    await supabase.from("playlists").update({ ordem_arquivos: updated }).eq("id", playlistId);
    fetchData();
  };

  const removeFromPlaylist = async (playlistId: string, index: number) => {
    const pl = playlists.find((p) => p.id === playlistId);
    if (!pl) return;
    const updated = [...pl.ordem_arquivos];
    updated.splice(index, 1);
    await supabase.from("playlists").update({ ordem_arquivos: updated }).eq("id", playlistId);
    fetchData();
  };

  const reorderPlaylist = async (playlistId: string, newOrder: string[]) => {
    setPlaylists((prev) =>
      prev.map((p) => (p.id === playlistId ? { ...p, ordem_arquivos: newOrder } : p))
    );
    await supabase.from("playlists").update({ ordem_arquivos: newOrder }).eq("id", playlistId);
  };

  const deletePlaylist = async (id: string) => {
    await supabase.from("playlists").delete().eq("id", id);
    fetchData();
  };

  const saveProfile = async (updates: Partial<ClientProfile>) => {
    if (!user) return;
    
    // Remove any keys that don't exist in the DB schema
    const allowedKeys = ["config_clima", "config_noticias", "nome_empresa", "template", "instagram_handle", "widget_config", "layout_config"];
    const sanitized: Record<string, any> = {};
    for (const key of allowedKeys) {
      if (key in updates) sanitized[key] = (updates as any)[key];
    }
    
    console.log("💾 Salvando perfil:", JSON.stringify(sanitized, null, 2));
    
    const { error } = await supabase
      .from("profiles")
      .update(sanitized)
      .eq("user_id", user.id);
    
    if (error) {
      console.error("❌ Erro ao salvar perfil:", error.message, error.details, error.hint);
      throw new Error(`Falha ao salvar: ${error.message}`);
    }
    
    console.log("✅ Perfil salvo com sucesso!");
    // Update local state immediately for optimistic UI
    setProfile((prev) => ({ ...prev, ...updates }));
    // Also refetch to confirm DB persistence
    await fetchData();
  };

  const savePlaylistConfig = async (playlistId: string, updates: Partial<Playlist>) => {
    const { error } = await supabase
      .from("playlists")
      .update(updates as any)
      .eq("id", playlistId);

    if (error) {
      console.error("❌ Erro ao salvar config da tela:", error.message);
      throw error;
    }

    setPlaylists((prev) =>
      prev.map((p) => (p.id === playlistId ? { ...p, ...updates } : p))
    );
  };

  const triggerSync = async (playlistIds?: string[]) => {
    const timestamp = new Date().toISOString();
    const targetIds = playlistIds || playlists.map(p => p.id);
    
    if (targetIds.length === 0) return;

    const { error } = await supabase
      .from("playlists")
      .update({ last_sync_at: timestamp } as any)
      .in("id", targetIds);

    if (error) {
      console.error("❌ Erro ao disparar sincronização:", error.message);
      throw error;
    }

    setPlaylists((prev) =>
      prev.map((p) => targetIds.includes(p.id) ? { ...p, last_sync_at: timestamp } : p)
    );
  };

  return {
    user,
    media,
    playlists,
    profile,
    uploading,
    selectedPlaylistId,
    setSelectedPlaylistId,
    setProfile,
    handleUpload,
    deleteMedia,
    createPlaylist,
    addToPlaylist,
    removeFromPlaylist,
    reorderPlaylist,
    deletePlaylist,
    saveProfile,
    savePlaylistConfig,
    triggerSync,
    fetchData,
    getMediaName: (id: string) => media.find((m) => m.id === id)?.nome || "Desconhecido",
  };
}
