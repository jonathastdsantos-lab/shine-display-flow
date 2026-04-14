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
}

export interface ClientProfile {
  config_clima: string;
  config_noticias: string;
  nome_empresa: string;
  template: string;
  instagram_handle: string;
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
  });
  const [uploading, setUploading] = useState(false);

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
    if (!user) return;
    await supabase.from("playlists").insert({
      client_id: user.id,
      nome_da_tela: name,
      ordem_arquivos: [],
    });
    fetchData();
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
    await supabase.from("profiles").update(updates).eq("user_id", user.id);
    setProfile((prev) => ({ ...prev, ...updates }));
  };

  return {
    user,
    media,
    playlists,
    profile,
    uploading,
    setProfile,
    handleUpload,
    deleteMedia,
    createPlaylist,
    addToPlaylist,
    removeFromPlaylist,
    reorderPlaylist,
    deletePlaylist,
    saveProfile,
    fetchData,
    getMediaName: (id: string) => media.find((m) => m.id === id)?.nome || "Desconhecido",
  };
}
