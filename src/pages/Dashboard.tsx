import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { LogOut, Upload, Plus, Trash2, Eye, Monitor, Settings, Image, ListVideo } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers" ;
import SortablePlaylistItem from "@/components/SortablePlaylistItem";

interface MediaItem {
  id: string;
  url_arquivo: string;
  tipo: string;
  nome: string;
  duracao: number;
}

interface Playlist {
  id: string;
  nome_da_tela: string;
  ordem_arquivos: string[];
}

interface Profile {
  config_clima: string;
  config_noticias: string;
  nome_empresa: string;
}

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [profile, setProfile] = useState<Profile>({ config_clima: "São Paulo", config_noticias: "technology", nome_empresa: "" });
  const [uploading, setUploading] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");

  const fetchData = useCallback(async () => {
    if (!user) return;
    const [mediaRes, playlistRes, profileRes] = await Promise.all([
      supabase.from("media_library").select("*").eq("client_id", user.id),
      supabase.from("playlists").select("*").eq("client_id", user.id),
      supabase.from("profiles").select("*").eq("user_id", user.id).single(),
    ]);
    if (mediaRes.data) setMedia(mediaRes.data as any);
    if (playlistRes.data) setPlaylists(playlistRes.data as any);
    if (profileRes.data) setProfile(profileRes.data as any);
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !user) return;
    setUploading(true);
    try {
      for (const file of Array.from(e.target.files)) {
        const tipo = file.type.startsWith("video") ? "video" : "imagem";
        const path = `${user.id}/${Date.now()}-${file.name}`;
        const { error: uploadErr } = await supabase.storage.from("media").upload(path, file);
        if (uploadErr) throw uploadErr;
        const { data: { publicUrl } } = supabase.storage.from("media").getPublicUrl(path);
        await supabase.from("media_library").insert({
          client_id: user.id,
          url_arquivo: publicUrl,
          tipo,
          nome: file.name,
          duracao: tipo === "imagem" ? 10 : 30,
        });
      }
      toast({ title: "Upload concluído!" });
      fetchData();
    } catch (err: any) {
      toast({ title: "Erro no upload", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const deleteMedia = async (id: string) => {
    await supabase.from("media_library").delete().eq("id", id);
    fetchData();
  };

  const createPlaylist = async () => {
    if (!user || !newPlaylistName.trim()) return;
    await supabase.from("playlists").insert({
      client_id: user.id,
      nome_da_tela: newPlaylistName,
      ordem_arquivos: [],
    });
    setNewPlaylistName("");
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

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const handleDragEnd = async (playlistId: string, event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const pl = playlists.find((p) => p.id === playlistId);
    if (!pl) return;
    const items = pl.ordem_arquivos || [];
    const oldIndex = items.findIndex((_, i) => `${playlistId}-${i}` === active.id);
    const newIndex = items.findIndex((_, i) => `${playlistId}-${i}` === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(items, oldIndex, newIndex);
    setPlaylists((prev) => prev.map((p) => p.id === playlistId ? { ...p, ordem_arquivos: reordered } : p));
    await supabase.from("playlists").update({ ordem_arquivos: reordered }).eq("id", playlistId);

  const deletePlaylist = async (id: string) => {
    await supabase.from("playlists").delete().eq("id", id);
    fetchData();
  };

  const saveProfile = async () => {
    if (!user) return;
    await supabase.from("profiles").update({
      config_clima: profile.config_clima,
      config_noticias: profile.config_noticias,
    }).eq("user_id", user.id);
    toast({ title: "Configurações salvas!" });
  };

  const getMediaName = (id: string) => media.find((m) => m.id === id)?.nome || "Desconhecido";

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card px-4 py-3">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Monitor className="h-6 w-6 text-primary" />
            <h1 className="font-display text-xl font-bold">{profile.nome_empresa || "Digital Signage"}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate(`/player/${user?.id}`)}>
              <Eye className="mr-1 h-4 w-4" /> Preview
            </Button>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4 space-y-6">
        <Tabs defaultValue="media" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="media" className="gap-1"><Image className="h-4 w-4" /> Mídia</TabsTrigger>
            <TabsTrigger value="playlists" className="gap-1"><ListVideo className="h-4 w-4" /> Playlists</TabsTrigger>
            <TabsTrigger value="settings" className="gap-1"><Settings className="h-4 w-4" /> Widgets</TabsTrigger>
          </TabsList>

          <TabsContent value="media" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="font-display text-lg">Biblioteca de Mídia</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border p-8 transition-colors hover:border-primary/50 hover:bg-muted/50">
                  <Upload className="h-5 w-5 text-muted-foreground" />
                  <span className="text-muted-foreground">{uploading ? "Enviando..." : "Clique para enviar imagens ou vídeos"}</span>
                  <input type="file" className="hidden" multiple accept="image/*,video/*" onChange={handleUpload} disabled={uploading} />
                </label>

                <div className="grid gap-3">
                  {media.map((item) => (
                    <div key={item.id} className="flex items-center justify-between rounded-lg border border-border bg-card p-3">
                      <div className="flex items-center gap-3">
                        {item.tipo === "video" ? (
                          <video src={item.url_arquivo} className="h-12 w-20 rounded object-cover" muted />
                        ) : (
                          <img src={item.url_arquivo} alt={item.nome} className="h-12 w-20 rounded object-cover" />
                        )}
                        <div>
                          <p className="text-sm font-medium">{item.nome}</p>
                          <p className="text-xs text-muted-foreground">{item.tipo} · {item.duracao}s</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => deleteMedia(item.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                  {media.length === 0 && (
                    <p className="text-center text-sm text-muted-foreground py-8">Nenhuma mídia enviada ainda</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="playlists" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="font-display text-lg">Playlists</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input placeholder="Nome da nova playlist" value={newPlaylistName} onChange={(e) => setNewPlaylistName(e.target.value)} />
                  <Button onClick={createPlaylist}><Plus className="mr-1 h-4 w-4" /> Criar</Button>
                </div>

                {playlists.map((pl) => (
                  <Card key={pl.id} className="border-border/50">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base font-display">{pl.nome_da_tela}</CardTitle>
                        <div className="flex gap-1">
                          <Button variant="outline" size="sm" onClick={() => navigate(`/player/${user?.id}?playlist=${pl.id}`)}>
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => deletePlaylist(pl.id)}>
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {(pl.ordem_arquivos || []).map((mediaId, idx) => (
                        <div key={`${mediaId}-${idx}`} className="flex items-center gap-2 rounded border border-border/50 bg-muted/30 px-3 py-2 text-sm">
                          <GripVertical className="h-4 w-4 text-muted-foreground" />
                          <span className="flex-1">{getMediaName(mediaId)}</span>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeFromPlaylist(pl.id, idx)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                      {media.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-2">
                          {media.map((m) => (
                            <Button key={m.id} variant="outline" size="sm" className="text-xs" onClick={() => addToPlaylist(pl.id, m.id)}>
                              + {m.nome.substring(0, 15)}
                            </Button>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
                {playlists.length === 0 && (
                  <p className="text-center text-sm text-muted-foreground py-8">Nenhuma playlist criada</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="font-display text-lg">Configurações de Widgets</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Cidade (Clima)</label>
                  <Input value={profile.config_clima} onChange={(e) => setProfile({ ...profile, config_clima: e.target.value })} placeholder="Ex: São Paulo" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Categoria de Notícias</label>
                  <Input value={profile.config_noticias} onChange={(e) => setProfile({ ...profile, config_noticias: e.target.value })} placeholder="Ex: technology, sports, business" />
                </div>
                <Button onClick={saveProfile}>Salvar Configurações</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
