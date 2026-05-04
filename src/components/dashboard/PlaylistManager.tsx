import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Eye, LayoutList, GripVertical, Image as ImageIcon, Film, Clock, Copy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Playlist, MediaItem } from "@/hooks/useDashboardData";

interface PlaylistManagerProps {
  playlists: Playlist[];
  media: MediaItem[];
  getMediaName: (id: string) => string;
  onCreate: (name: string) => void;
  onAddMedia: (playlistId: string, mediaId: string) => void;
  onRemoveMedia: (playlistId: string, index: number) => void;
  onReorder: (playlistId: string, newOrder: string[]) => void;
  onDelete: (id: string) => void;
}

function SortableTimelineItem({ id, mediaItem, index, total, onRemove }: any) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative flex items-center gap-4 rounded-xl border bg-card p-3 shadow-sm transition-all duration-200 ${
        isDragging ? "shadow-xl ring-2 ring-indigo-500/50 opacity-95 scale-[1.02] border-indigo-500" : "border-border/50 hover:border-indigo-400/50 hover:bg-muted/30"
      }`}
    >
      <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-8 bg-indigo-500 rounded-r-md opacity-0 group-hover:opacity-100 transition-opacity"></div>
      
      <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing touch-none text-muted-foreground hover:text-indigo-500 transition-colors p-1">
        <GripVertical className="h-5 w-5" />
      </button>

      <div className="w-16 h-12 bg-muted rounded-md border overflow-hidden shrink-0 relative flex items-center justify-center">
         {mediaItem ? (
           mediaItem.tipo === "video" ? (
             <video src={mediaItem.url_arquivo} className="w-full h-full object-cover" />
           ) : (
             <img src={mediaItem.url_arquivo} className="w-full h-full object-cover" />
           )
         ) : (
           <div className="w-full h-full bg-slate-200 dark:bg-slate-800" />
         )}
         <div className="absolute bottom-0.5 right-0.5 rounded-sm bg-black/70 px-1 py-px text-[8px] font-bold text-white uppercase backdrop-blur-sm">
           {mediaItem?.tipo === 'video' ? 'VID' : 'IMG'}
         </div>
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm truncate">{mediaItem ? mediaItem.nome : "Desconhecido"}</p>
        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5 font-medium">
           <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {mediaItem?.duracao || 0}s</span>
           <span className="opacity-50">Posição {index + 1} de {total}</span>
        </div>
      </div>

      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={onRemove}>
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}


export default function PlaylistManager({
  playlists, media, getMediaName, onCreate, onAddMedia, onRemoveMedia, onReorder, onDelete,
}: PlaylistManagerProps) {
  const [newName, setNewName] = useState("");
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const handleDuplicate = async (pl: Playlist) => {
    if (!user) return;
    const { error } = await supabase.from("playlists").insert({
      client_id: user.id,
      nome_da_tela: `${pl.nome_da_tela} (cópia)`,
      ordem_arquivos: pl.ordem_arquivos || [],
      template: pl.template,
      layout_config: pl.layout_config,
      widget_config: pl.widget_config,
      config_clima: pl.config_clima,
      config_noticias: pl.config_noticias,
      instagram_handle: pl.instagram_handle,
    } as any);
    if (error) {
      toast({ title: "Erro ao duplicar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Tela duplicada!", description: `"${pl.nome_da_tela} (cópia)" criada com sucesso.` });
      window.location.reload();
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const handleDragEnd = (playlistId: string, event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const pl = playlists.find((p) => p.id === playlistId);
    if (!pl) return;
    const items = pl.ordem_arquivos || [];
    const oldIndex = items.findIndex((_, i) => `${playlistId}-${i}` === active.id);
    const newIndex = items.findIndex((_, i) => `${playlistId}-${i}` === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    onReorder(playlistId, arrayMove(items, oldIndex, newIndex));
  };

  const handleCreate = () => {
    if (!newName.trim()) return;
    onCreate(newName.trim());
    setNewName("");
  };

  const calculateTotalDuration = (playlist: Playlist) => {
    let total = 0;
    (playlist.ordem_arquivos || []).forEach(mediaId => {
      const m = media.find(x => x.id === mediaId);
      if(m) total += m.duracao;
    });
    return total;
  };

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl font-bold tracking-tight">Playlists</h2>
          <p className="text-muted-foreground mt-1 text-base">Monte a grade de programação. Arraste e solte para ordenar o fluxo das mídias.</p>
        </div>
      </div>

      <Card className="border-border/60 bg-card/40 shadow-sm">
         <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row gap-4 items-center">
           <div className="p-3 bg-indigo-500/10 rounded-xl hidden sm:block">
             <LayoutList className="w-6 h-6 text-indigo-500" />
           </div>
           <div className="w-full flex-1 relative">
             <Input
               placeholder="Ex: Grade da Manhã, Promoções do Mês..."
               value={newName}
               onChange={(e) => setNewName(e.target.value)}
               onKeyDown={(e) => e.key === "Enter" && handleCreate()}
               className="h-12 w-full text-base bg-background"
             />
           </div>
           <Button onClick={handleCreate} className="h-12 px-8 w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 gap-2 font-medium">
             <Plus className="h-5 w-5" /> Criar Grade
           </Button>
         </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {playlists.map((pl) => {
          const totalDuration = calculateTotalDuration(pl);
          
          return (
            <Card key={pl.id} className="border-border/60 overflow-hidden flex flex-col hover:border-indigo-500/30 transition-colors shadow-sm">
              <CardHeader className="bg-muted/20 border-b pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="font-display text-xl font-bold">{pl.nome_da_tela}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                      <span className="font-semibold text-foreground/80">{(pl.ordem_arquivos || []).length} mídias</span> • 
                      <span>~{Math.round(totalDuration / 60)} min de duração</span>
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="gap-2" onClick={() => navigate(`/player/${pl.id}`)}>
                      <Eye className="h-4 w-4" /> <span className="hidden sm:inline">Preview na TV</span>
                    </Button>
                    <Button variant="outline" size="sm" className="gap-2" onClick={() => handleDuplicate(pl)} title="Duplicar tela">
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive hover:text-white transition-colors" onClick={() => onDelete(pl.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="p-0 flex-1 flex flex-col bg-slate-50/50 dark:bg-slate-900/50">
                <div className="p-4 flex-1">
                  <h4 className="text-xs font-bold tracking-widest text-muted-foreground uppercase mb-4">Linha do Tempo (Timeline)</h4>
                  
                  <DndContext sensors={sensors} collisionDetection={closestCenter} modifiers={[restrictToVerticalAxis]} onDragEnd={(e) => handleDragEnd(pl.id, e)}>
                    <SortableContext items={(pl.ordem_arquivos || []).map((_, i) => `${pl.id}-${i}`)} strategy={verticalListSortingStrategy}>
                      <div className="space-y-3">
                        {(pl.ordem_arquivos || []).map((mediaId, idx) => {
                          const mInfo = media.find(x => x.id === mediaId);
                          return (
                            <SortableTimelineItem
                              key={`${pl.id}-${idx}`}
                              id={`${pl.id}-${idx}`}
                              index={idx}
                              total={(pl.ordem_arquivos || []).length}
                              mediaItem={mInfo}
                              onRemove={() => onRemoveMedia(pl.id, idx)}
                            />
                          );
                        })}
                      </div>
                    </SortableContext>
                  </DndContext>

                  {(pl.ordem_arquivos || []).length === 0 && (
                    <div className="border-2 border-dashed rounded-xl p-8 text-center bg-card">
                      <LayoutList className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
                      <p className="text-muted-foreground font-medium">Cronograma vazio</p>
                      <p className="text-xs text-muted-foreground mt-1">Acrescente mídias pelo acervo abaixo</p>
                    </div>
                  )}
                </div>

                {media.length > 0 && (
                  <div className="border-t bg-card p-4">
                    <p className="text-sm font-semibold text-foreground mb-3">Seu Acervo (Clique para inserir)</p>
                    <div className="h-auto max-h-32 overflow-y-auto">
                      <div className="flex flex-wrap gap-2 pb-2">
                        {media.map((m) => (
                          <Button 
                            key={m.id} 
                            variant="secondary" 
                            size="sm" 
                            className="text-xs h-8 pl-2 pr-3 bg-muted/80 hover:bg-indigo-500 hover:text-white transition-colors group border"
                            onClick={() => onAddMedia(pl.id, m.id)}
                          >
                            {m.tipo === "video" ? <Film className="w-3 h-3 mr-1.5 opacity-60 group-hover:opacity-100" /> : <ImageIcon className="w-3 h-3 mr-1.5 opacity-60 group-hover:opacity-100" />}
                            {m.nome.length > 20 ? m.nome.substring(0, 20) + "..." : m.nome}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}

        {playlists.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-24 text-center border-2 border-dashed rounded-xl bg-muted/10">
            <LayoutList className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="text-xl font-semibold text-foreground">Nenhuma Grade de Programação</p>
            <p className="text-muted-foreground mt-1 max-w-sm">
              Crie uma grade de horários ou campanhas ali em cima para começar a rodar na sua parede.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
