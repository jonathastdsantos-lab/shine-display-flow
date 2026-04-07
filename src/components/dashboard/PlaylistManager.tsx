import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import SortablePlaylistItem from "@/components/SortablePlaylistItem";
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

export default function PlaylistManager({
  playlists, media, getMediaName, onCreate, onAddMedia, onRemoveMedia, onReorder, onDelete,
}: PlaylistManagerProps) {
  const [newName, setNewName] = useState("");
  const navigate = useNavigate();
  const { user } = useAuth();

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

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="font-display text-2xl font-bold">Playlists</h2>
        <p className="text-muted-foreground text-sm mt-1">Organize a sequência de conteúdo dos seus terminais</p>
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="Nome da nova playlist..."
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          className="max-w-sm"
        />
        <Button onClick={handleCreate}><Plus className="mr-1 h-4 w-4" /> Criar</Button>
      </div>

      <div className="grid gap-4">
        {playlists.map((pl) => (
          <Card key={pl.id} className="border-border/50 animate-scale-in">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="font-display text-lg">{pl.nome_da_tela}</CardTitle>
                <div className="flex gap-1">
                  <Button variant="outline" size="sm" onClick={() => navigate(`/player/${user?.id}?playlist=${pl.id}`)}>
                    <Eye className="mr-1 h-3 w-3" /> Preview
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => onDelete(pl.id)}>
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <DndContext sensors={sensors} collisionDetection={closestCenter} modifiers={[restrictToVerticalAxis]} onDragEnd={(e) => handleDragEnd(pl.id, e)}>
                <SortableContext items={(pl.ordem_arquivos || []).map((_, i) => `${pl.id}-${i}`)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-2">
                    {(pl.ordem_arquivos || []).map((mediaId, idx) => (
                      <SortablePlaylistItem
                        key={`${pl.id}-${idx}`}
                        id={`${pl.id}-${idx}`}
                        index={idx}
                        name={getMediaName(mediaId)}
                        onRemove={() => onRemoveMedia(pl.id, idx)}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>

              {(pl.ordem_arquivos || []).length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">Playlist vazia — adicione mídias abaixo</p>
              )}

              {media.length > 0 && (
                <div className="border-t border-border/50 pt-3">
                  <p className="text-xs text-muted-foreground mb-2">Adicionar mídia:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {media.map((m) => (
                      <Button key={m.id} variant="outline" size="sm" className="text-xs h-7" onClick={() => onAddMedia(pl.id, m.id)}>
                        + {m.nome.substring(0, 20)}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {playlists.length === 0 && (
          <div className="flex flex-col items-center py-16">
            <p className="text-muted-foreground">Nenhuma playlist criada</p>
          </div>
        )}
      </div>
    </div>
  );
}
