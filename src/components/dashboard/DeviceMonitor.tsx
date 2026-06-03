import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Monitor, Wifi, WifiOff, RefreshCw, Clock, MapPin,
  Tv2, Signal, Activity, Copy, ExternalLink, Settings2,
  Zap, ShieldCheck, AlertCircle, Plus, Check, Info,
  Film, Image as ImageIcon, GripVertical, Trash2, CheckCircle2,
  LayoutList, RotateCw, Pause, Play, AlertTriangle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Playlist, ClientProfile, MediaItem } from "@/hooks/useDashboardData";
import { useTranslation } from "react-i18next";

interface DeviceMonitorProps {
  playlists: Playlist[];
  profile: ClientProfile;
  media: MediaItem[];
  selectedPlaylistId: string | null;
  setSelectedPlaylistId: (id: string | null) => void;
  onSync: (ids?: string[]) => Promise<void>;
  onCreate: (name: string) => Promise<Playlist | null>;
  onUpdatePlaylist: (id: string, updates: Partial<Playlist>) => Promise<void>;
  onAddMedia: (playlistId: string, mediaId: string) => void;
  onRemoveMedia: (playlistId: string, index: number) => void;
  onReorder: (playlistId: string, newOrder: string[]) => void;
  getMediaName: (id: string) => string;
}

function SortableMediaItem({ id, mediaItem, index, onRemove }: any) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
  };

  if (!mediaItem) return null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative flex items-center gap-3 rounded-lg border bg-card p-2 shadow-sm transition-all duration-200 ${
        isDragging ? "shadow-lg ring-2 ring-indigo-500/50 opacity-90 scale-[1.02] border-indigo-500" : "border-border/50 hover:border-indigo-400/30"
      }`}
    >
      <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-indigo-500 p-1">
        <GripVertical className="h-4 w-4" />
      </button>

      <div className="w-12 h-9 bg-muted rounded overflow-hidden shrink-0 relative flex items-center justify-center">
         {mediaItem.tipo === "video" ? (
           <video src={mediaItem.url_arquivo} className="w-full h-full object-cover" />
         ) : (
           <img src={mediaItem.url_arquivo} className="w-full h-full object-cover" />
         )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-bold text-[11px] truncate">{mediaItem.nome}</p>
        <p className="text-[9px] text-muted-foreground uppercase font-black">{mediaItem.duracao}s • Pos {index + 1}</p>
      </div>

      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={onRemove}>
        <Trash2 className="h-3 w-3" />
      </Button>
    </div>
  );
}

function getStatusInfo(lastSeen: string | null, t: (k: string, o?: any) => string): {
  online: boolean; label: string; color: string; bgColor: string; ago: string;
} {
  if (!lastSeen) {
    return { online: false, label: t("deviceMonitor.status.neverConnected"), color: "text-slate-400", bgColor: "bg-slate-500/10", ago: "—" };
  }
  const diffMs = Date.now() - new Date(lastSeen).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const online = diffMin < 3;

  let ago = "";
  if (diffMs < 60000) ago = t("deviceMonitor.status.agoLessThanMin");
  else if (diffMin < 60) ago = t("deviceMonitor.status.agoMin", { min: diffMin });
  else ago = t("deviceMonitor.status.agoHours", { hours: Math.floor(diffMin / 60) });

  return online
    ? { online: true, label: t("deviceMonitor.status.online"), color: "text-emerald-400", bgColor: "bg-emerald-500/10", ago }
    : { online: false, label: t("deviceMonitor.status.inactive"), color: "text-red-400", bgColor: "bg-red-500/10", ago };
}

export default function DeviceMonitor({ 
  playlists, 
  profile, 
  media,
  selectedPlaylistId, 
  setSelectedPlaylistId, 
  onSync, 
  onCreate,
  onUpdatePlaylist,
  onAddMedia,
  onRemoveMedia,
  onReorder,
  getMediaName
}: DeviceMonitorProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [statuses, setStatuses] = useState<Record<string, string | null>>({});
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newScreenName, setNewScreenName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [createdScreen, setCreatedScreen] = useState<Playlist | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editingPlaylist, setEditingPlaylist] = useState<Playlist | null>(null);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const screenLimit = profile.screen_limit || 1;
  const usagePercentage = Math.min(100, (playlists.length / screenLimit) * 100);

  // Status real por tela usando last_heartbeat individual
  useEffect(() => {
    const map: Record<string, string | null> = {};
    playlists.forEach((p) => {
      map[p.id] = (p as any).last_heartbeat || null;
    });
    setStatuses(map);
  }, [playlists]);

  // Refresh playlists every 30s to refresh heartbeat status
  useEffect(() => {
    const interval = setInterval(() => {
      // Force re-render by triggering a state change with same data
      setStatuses((prev) => ({ ...prev }));
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const sendRemoteCommand = async (playlistId: string, command: "reload" | "pause" | "play" | "next") => {
    try {
      await onUpdatePlaylist(playlistId, {
        remote_command: command,
        remote_command_at: new Date().toISOString(),
        ...(command === "pause" && { playback_state: "paused" }),
        ...(command === "play" && { playback_state: "playing" }),
      } as any);
      toast({
        title: t(`deviceMonitor.toasts.commands.${command}`),
        description: t("deviceMonitor.toasts.commands.description"),
      });
    } catch (e) {
      toast({ title: t("deviceMonitor.toasts.commandErrorTitle"), variant: "destructive" });
    }
  };

  const handleSyncSelected = async () => {
    if (selectedIds.length === 0) return;
    try {
      setRefreshing(true);
      await onSync(selectedIds);
      toast({
        title: t("deviceMonitor.toasts.syncSentTitle"),
        description: t("deviceMonitor.toasts.syncSentDescription", { count: selectedIds.length }),
      });
      setSelectedIds([]);
    } catch (error) {
      toast({
        variant: "destructive",
        title: t("deviceMonitor.toasts.syncErrorTitle"),
        description: t("deviceMonitor.toasts.syncErrorDescription"),
      });
    } finally {
      setRefreshing(false);
    }
  };

  const handleCreateScreen = async () => {
    if (!newScreenName.trim()) {
      toast({ title: t("deviceMonitor.createDialog.nameRequired"), variant: "destructive" });
      return;
    }
    
    if (playlists.length >= screenLimit) {
      toast({ 
        title: t("deviceMonitor.createDialog.limitReachedTitle"), 
        description: t("deviceMonitor.createDialog.limitReachedDescription", { limit: screenLimit }),
        variant: "destructive" 
      });
      return;
    }

    try {
      setIsCreating(true);
      const newPl = await onCreate(newScreenName.trim());
      if (newPl) {
        setCreatedScreen(newPl);
        setNewScreenName("");
        toast({ title: t("deviceMonitor.createDialog.createdTitle") });
      }
    } catch (error: any) {
      console.error("❌ Erro ao cadastrar tela:", error);
      toast({ 
        title: t("deviceMonitor.createDialog.createErrorTitle"), 
        description: error.message || t("deviceMonitor.createDialog.createErrorDefault"),
        variant: "destructive" 
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleOpenSettings = (pl: Playlist) => {
    setEditingPlaylist({ ...pl });
    setIsSettingsOpen(true);
  };

  const handleSaveQuickConfig = async () => {
    if (!editingPlaylist) return;
    setIsSavingSettings(true);
    try {
      await onUpdatePlaylist(editingPlaylist.id, {
        ordem_arquivos: editingPlaylist.ordem_arquivos,
        template: editingPlaylist.template,
        config_clima: editingPlaylist.config_clima,
        config_noticias: editingPlaylist.config_noticias,
        instagram_handle: editingPlaylist.instagram_handle,
        widget_config: editingPlaylist.widget_config,
        layout_config: editingPlaylist.layout_config,
      });
      
      // Auto-sync after save
      await onSync([editingPlaylist.id]);
      
      toast({
        title: t("deviceMonitor.toasts.saveSuccessTitle"),
        description: t("deviceMonitor.toasts.saveSuccessDescription"),
      });
      setIsSettingsOpen(false);
    } catch (error) {
      toast({
        title: t("deviceMonitor.toasts.saveErrorTitle"),
        variant: "destructive",
      });
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || !editingPlaylist || active.id === over.id) return;
    
    const items = editingPlaylist.ordem_arquivos || [];
    const oldIndex = items.findIndex((_, i) => `${editingPlaylist.id}-${i}` === active.id);
    const newIndex = items.findIndex((_, i) => `${editingPlaylist.id}-${i}` === over.id);
    
    if (oldIndex === -1 || newIndex === -1) return;
    
    const newOrder = arrayMove(items, oldIndex, newIndex);
    setEditingPlaylist({ ...editingPlaylist, ordem_arquivos: newOrder });
  };

  const copyPlayerLink = (id: string) => {
    const link = `${window.location.origin}/player/${id}`;
    navigator.clipboard.writeText(link);
    toast({ title: t("deviceMonitor.toasts.linkCopied") });
  };

  const handleConfigure = (id: string) => {
    setSelectedPlaylistId(id);
    navigate("/dashboard/settings");
    toast({
      title: t("deviceMonitor.toasts.screenSelectedTitle"),
      description: t("deviceMonitor.toasts.screenSelectedDescription"),
    });
  };

  const templateLabels: Record<string, string> = {
    varejo: "Varejo – Tela Cheia",
    corporativo: "Corporativo / Lobby",
    lbar: "L-Bar Mode",
    split: "Split 60/40",
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl font-bold tracking-tight">{t("deviceMonitor.title")}</h2>
          <p className="text-muted-foreground mt-1 text-base">
            {t("deviceMonitor.subtitle")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) setCreatedScreen(null);
          }}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/20">
                <Plus className="w-4 h-4" />
                {t("deviceMonitor.createScreen")}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Monitor className="w-5 h-5 text-indigo-500" />
                  {t("deviceMonitor.createDialog.title")}
                </DialogTitle>
                <DialogDescription>
                  {t("deviceMonitor.createDialog.description")}
                </DialogDescription>
              </DialogHeader>

              {!createdScreen ? (
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="screen-name">{t("deviceMonitor.createDialog.nameLabel")}</Label>
                    <Input
                      id="screen-name"
                      placeholder={t("deviceMonitor.createDialog.namePlaceholder")}
                      value={newScreenName}
                      onChange={(e) => setNewScreenName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleCreateScreen()}
                      autoFocus
                    />
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg flex items-start gap-3">
                    <Info className="w-4 h-4 text-muted-foreground mt-0.5" />
                    <p className="text-[11px] text-muted-foreground">
                      {t("deviceMonitor.createDialog.infoHint")}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="py-6 space-y-6">
                  <div className="flex flex-col items-center text-center space-y-2">
                    <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-2">
                      <Check className="h-6 w-6 text-emerald-500" />
                    </div>
                    <h4 className="font-bold text-lg">{t("deviceMonitor.createDialog.readyTitle")}</h4>
                    <p className="text-sm text-muted-foreground">{t("deviceMonitor.createDialog.readySubtitle")}</p>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 bg-muted border rounded-xl space-y-3">
                      <div className="space-y-1">
                        <Label className="text-[10px] uppercase font-black text-muted-foreground">{t("deviceMonitor.createDialog.screenNameLabel")}</Label>
                        <p className="font-bold text-foreground">{createdScreen.nome_da_tela}</p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] uppercase font-black text-muted-foreground">{t("deviceMonitor.createDialog.deviceIdLabel")}</Label>
                        <p className="font-mono text-xs text-foreground bg-background p-2 rounded border border-border/50">{createdScreen.id}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-bold">{t("deviceMonitor.createDialog.linkLabel")}</Label>
                      <div className="flex gap-2">
                        <Input 
                          readOnly 
                          value={`${window.location.origin}/player/${createdScreen.id}`} 
                          className="font-mono text-xs bg-muted"
                        />
                        <Button 
                          variant="outline" 
                          size="icon" 
                          onClick={() => copyPlayerLink(createdScreen.id)}
                          className="shrink-0"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <DialogFooter>
                {!createdScreen ? (
                  <Button 
                    type="submit" 
                    onClick={handleCreateScreen} 
                    disabled={isCreating}
                    className="w-full bg-indigo-600 hover:bg-indigo-700"
                  >
                    {isCreating ? t("deviceMonitor.createDialog.creating") : t("deviceMonitor.createDialog.confirm")}
                  </Button>
                ) : (
                  <Button onClick={() => setIsDialogOpen(false)} className="w-full">
                    {t("deviceMonitor.createDialog.done")}
                  </Button>
                )}
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {selectedIds.length > 0 && (
            <Button onClick={handleSyncSelected} className="gap-2 bg-amber-500 hover:bg-amber-600 animate-in fade-in zoom-in duration-300">
              <Zap className={`w-4 h-4 ${refreshing ? "animate-pulse" : ""}`} />
              {t("deviceMonitor.syncSelected", { count: selectedIds.length })}
            </Button>
          )}
          <Button variant="outline" onClick={() => window.location.reload()} className="gap-2">
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">{t("deviceMonitor.refreshStatus")}</span>
          </Button>
        </div>
      </div>

      {/* Quota Section */}
      <Card className="border-border/60 bg-card/50 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-500" />
                <h3 className="font-bold text-lg">Cota de Telas do Plano</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Você está utilizando <span className="text-foreground font-bold">{playlists.length}</span> de <span className="text-foreground font-bold">{screenLimit}</span> telas disponíveis.
              </p>
            </div>
            <div className="flex-1 max-w-md w-full">
              <div className="flex justify-between text-xs mb-2 font-bold tracking-tight uppercase text-muted-foreground/70">
                <span>Uso de Banda</span>
                <span>{playlists.length}/{screenLimit}</span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden border border-border/50">
                <div 
                  className={`h-full transition-all duration-1000 ease-out ${usagePercentage > 90 ? 'bg-red-500' : 'bg-emerald-500'}`}
                  style={{ width: `${usagePercentage}%` }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tip on link 404 */}
      <Card className="border-amber-500/30 bg-amber-500/5">
        <CardContent className="p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
          <div className="text-xs space-y-1">
            <p className="font-bold text-amber-700 dark:text-amber-400">Importante sobre os links das telas</p>
            <p className="text-muted-foreground leading-relaxed">
              Para que o link <code className="bg-muted px-1 py-0.5 rounded text-[10px]">/player/...</code> funcione em qualquer dispositivo (TV, celular, outra rede), o app precisa estar <strong>publicado com visibilidade pública</strong>. Clique em <strong>Publish</strong> no topo do editor e marque como público. No preview (id-preview-...), o link só funciona para você logado.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Individual Devices List */}
      <div className="grid gap-4">
        <div className="flex items-center gap-2 px-2">
          <Monitor className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Dispositivos Ativos</h3>
        </div>
        
        {playlists.map((pl) => {
          const status = getStatusInfo(statuses[pl.id] || null, t);
          const isSelected = selectedIds.includes(pl.id);
          const isCurrentEditor = selectedPlaylistId === pl.id;

          return (
            <Card 
              key={pl.id} 
              className={`border-border/50 transition-all hover:border-indigo-500/40 relative overflow-hidden group ${isCurrentEditor ? 'ring-2 ring-indigo-500 border-indigo-500/50 bg-indigo-500/5' : ''}`}
            >
              {isCurrentEditor && (
                <div className="absolute top-0 right-0 px-3 py-1 bg-indigo-500 text-[10px] font-black uppercase text-white rounded-bl-lg tracking-widest animate-in slide-in-from-top-full duration-300">
                  Editando agora
                </div>
              )}
              
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center gap-4 sm:gap-6">
                  {/* Selection Checkbox */}
                  <div className="flex items-center h-full">
                    <Checkbox 
                      checked={isSelected} 
                      onCheckedChange={() => toggleSelect(pl.id)}
                      className="w-5 h-5 border-border/80 data-[state=checked]:bg-indigo-500 data-[state=checked]:border-indigo-500"
                    />
                  </div>

                  {/* Device Info */}
                  <div className="flex-1 min-w-0 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className={`p-3 rounded-2xl ${status.bgColor} shrink-0`}>
                        <Tv2 className={`w-6 h-6 ${status.color}`} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-base truncate">{pl.nome_da_tela}</p>
                          <Badge variant={status.online ? "secondary" : "outline"} className={`text-[10px] h-5 ${status.online ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'text-muted-foreground'}`}>
                            {status.label}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1 font-mono uppercase tracking-tighter">
                          ID: {pl.id.split('-')[0]} • {templateLabels[pl.template || ''] || "Padrão"}
                        </p>
                      </div>
                    </div>

                    {/* Quick Stats/Actions */}
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="hidden sm:flex flex-col items-end mr-4">
                         <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">Último Sinal</p>
                         <p className="text-xs font-medium text-foreground">{status.ago}</p>
                      </div>
                      <div className="flex gap-1.5 flex-wrap justify-end">
                        <Button 
                          size="sm" 
                          variant={isCurrentEditor ? "default" : "outline"} 
                          onClick={() => handleOpenSettings(pl)} 
                          className={`gap-2 ${isCurrentEditor ? 'bg-indigo-500 hover:bg-indigo-600' : ''}`}
                        >
                          <Settings2 className="w-4 h-4" />
                          Configurar
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => sendRemoteCommand(pl.id, (pl as any).playback_state === "paused" ? "play" : "pause")}
                          className="text-muted-foreground hover:text-amber-500"
                          title={(pl as any).playback_state === "paused" ? "Retomar reprodução" : "Pausar reprodução"}
                        >
                          {(pl as any).playback_state === "paused" ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => sendRemoteCommand(pl.id, "reload")}
                          className="text-muted-foreground hover:text-indigo-500"
                          title="Recarregar tela remotamente"
                        >
                          <RotateCw className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => copyPlayerLink(pl.id)}
                          className="text-muted-foreground hover:text-foreground"
                          title="Copiar link"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => window.open(`${window.location.origin}/player/${pl.id}`, '_blank')} className="text-muted-foreground hover:text-indigo-400" title="Abrir tela">
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {playlists.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed rounded-2xl bg-muted/20 text-center">
            <Monitor className="w-12 h-12 text-muted-foreground/20 mb-4" />
            <p className="font-bold text-lg text-foreground/70">Nenhuma tela cadastrada</p>
            <p className="text-sm text-muted-foreground max-w-xs mt-1">
              Vá em "Playlists" para criar sua primeira tela e começar a exibir conteúdo.
            </p>
          </div>
        )}
      </div>

      {/* Quick Config Modal */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden shadow-2xl border-indigo-500/20">
          <DialogHeader className="p-6 bg-indigo-500/5 border-b shrink-0">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-2.5 bg-indigo-500 rounded-xl shadow-lg shadow-indigo-500/20 text-white">
                  <Settings2 className="w-6 h-6" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold">Configurações da Tela</DialogTitle>
                  <DialogDescription className="text-indigo-500/60 font-medium">
                    {editingPlaylist?.nome_da_tela} • ID: {editingPlaylist?.id.split("-")[0]}
                  </DialogDescription>
                </div>
              </div>
              <Badge variant="outline" className="h-6 gap-1 bg-white/50 border-indigo-500/20 text-indigo-500">
                <ShieldCheck className="w-3 h-3" />
                Master Admin
              </Badge>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-hidden flex flex-col">
            <Tabs defaultValue="geral" className="flex-1 flex flex-col overflow-hidden">
              <div className="px-6 py-2 border-b bg-muted/30">
                <TabsList className="bg-transparent gap-2 h-auto p-0">
                  <TabsTrigger value="geral" className="data-[state=active]:bg-white data-[state=active]:shadow-sm px-6 py-2 rounded-lg gap-2 text-xs font-bold uppercase tracking-wider">
                    <Clock className="w-4 h-4" /> Geral
                  </TabsTrigger>
                  <TabsTrigger value="layout" className="data-[state=active]:bg-white data-[state=active]:shadow-sm px-6 py-2 rounded-lg gap-2 text-xs font-bold uppercase tracking-wider">
                    <Monitor className="w-4 h-4" /> Layout
                  </TabsTrigger>
                  <TabsTrigger value="programacao" className="data-[state=active]:bg-white data-[state=active]:shadow-sm px-6 py-2 rounded-lg gap-2 text-xs font-bold uppercase tracking-wider">
                    <Activity className="w-4 h-4" /> Programação
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="flex-1 overflow-hidden">
                <ScrollArea className="h-full">
                  <div className="p-6">
                    <TabsContent value="geral" className="mt-0 space-y-6">
                      <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Cidade (Clima)</Label>
                          <Input 
                            value={editingPlaylist?.config_clima || ""} 
                            onChange={(e) => setEditingPlaylist(prev => prev ? { ...prev, config_clima: e.target.value } : null)}
                            placeholder="Ex: São Paulo"
                            className="bg-muted/30"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Categoria de Notícias</Label>
                          <Select 
                            value={editingPlaylist?.config_noticias || "technology"} 
                            onValueChange={(val) => setEditingPlaylist(prev => prev ? { ...prev, config_noticias: val } : null)}
                          >
                            <SelectTrigger className="bg-muted/30">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="technology">Tecnologia</SelectItem>
                              <SelectItem value="business">Economia / Negócios</SelectItem>
                              <SelectItem value="sports">Esportes</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Instagram (Handle)</Label>
                          <Input 
                            value={editingPlaylist?.instagram_handle || ""} 
                            onChange={(e) => setEditingPlaylist(prev => prev ? { ...prev, instagram_handle: e.target.value } : null)}
                            placeholder="Ex: @minhaempresa"
                            className="bg-muted/30"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Alertas Master (Cenário)</Label>
                          <Select value="default_off">
                             <SelectTrigger className="bg-muted/30 opacity-50 cursor-not-allowed">
                               <SelectValue placeholder="Cenário de Segmento" />
                             </SelectTrigger>
                             <SelectContent>
                               <SelectItem value="default_off">Seguir Configuração Global</SelectItem>
                             </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="layout" className="mt-0 space-y-6">
                       <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                          { id: "varejo", label: "Varejo", icon: <Tv2 className="w-5 h-5" />, desc: "Impacto Visual" },
                          { id: "corporativo", label: "Lobby", icon: <Monitor className="w-5 h-5" />, desc: "Informação & Clima" },
                          { id: "lbar", label: "L-Bar", icon: <LayoutList className="w-5 h-5" />, desc: "Vertical Lateral" },
                          { id: "split", label: "Split", icon: <Activity className="w-5 h-5" />, desc: "Zonas 60/40" },
                        ].map((tpl) => (
                          <div
                            key={tpl.id}
                            onClick={() => setEditingPlaylist(prev => prev ? { ...prev, template: tpl.id } : null)}
                            className={`p-4 rounded-xl border-2 transition-all cursor-pointer text-center space-y-2 ${
                              editingPlaylist?.template === tpl.id 
                                ? "border-indigo-500 bg-indigo-500/5 shadow-md" 
                                : "border-border/50 hover:bg-muted"
                            }`}
                          >
                            <div className={`mx-auto w-10 h-10 rounded-full flex items-center justify-center ${editingPlaylist?.template === tpl.id ? "bg-indigo-500 text-white" : "bg-muted text-muted-foreground"}`}>
                              {tpl.icon}
                            </div>
                            <p className="font-bold text-xs">{tpl.label}</p>
                            <p className="text-[10px] text-muted-foreground">{tpl.desc}</p>
                          </div>
                        ))}
                       </div>
                    </TabsContent>

                    <TabsContent value="programacao" className="mt-0 space-y-6">
                      <div className="grid md:grid-cols-2 gap-8">
                        {/* Timeline */}
                        <div className="space-y-4">
                          <h4 className="text-xs font-bold uppercase text-muted-foreground tracking-widest flex items-center gap-2">
                             <Activity className="w-3 h-3" /> Ordem de Exibição
                          </h4>
                          <ScrollArea className="h-[300px] border rounded-xl bg-muted/10 p-4">
                            <DndContext 
                              sensors={sensors} 
                              collisionDetection={closestCenter} 
                              modifiers={[restrictToVerticalAxis]} 
                              onDragEnd={handleDragEnd}
                            >
                              <SortableContext 
                                items={(editingPlaylist?.ordem_arquivos || []).map((_, i) => `${editingPlaylist?.id}-${i}`)} 
                                strategy={verticalListSortingStrategy}
                              >
                                <div className="space-y-3">
                                  {(editingPlaylist?.ordem_arquivos || []).map((mediaId, idx) => {
                                    const mInfo = media.find(x => x.id === mediaId);
                                    return (
                                      <SortableMediaItem
                                        key={`${editingPlaylist?.id}-${idx}`}
                                        id={`${editingPlaylist?.id}-${idx}`}
                                        index={idx}
                                        mediaItem={mInfo}
                                        onRemove={() => {
                                          const updated = [...(editingPlaylist?.ordem_arquivos || [])];
                                          updated.splice(idx, 1);
                                          setEditingPlaylist(prev => prev ? { ...prev, ordem_arquivos: updated } : null);
                                        }}
                                      />
                                    );
                                  })}
                                  {(editingPlaylist?.ordem_arquivos || []).length === 0 && (
                                    <div className="py-12 text-center">
                                      <p className="text-xs text-muted-foreground italic">Nenhuma mídia na grade.</p>
                                    </div>
                                  )}
                                </div>
                              </SortableContext>
                            </DndContext>
                          </ScrollArea>
                        </div>

                        {/* Media Selector */}
                        <div className="space-y-4">
                          <h4 className="text-xs font-bold uppercase text-muted-foreground tracking-widest flex items-center gap-2">
                             <Plus className="w-3 h-3" /> Seu Acervo
                          </h4>
                          <ScrollArea className="h-[300px] border rounded-xl bg-card p-4">
                            <div className="grid grid-cols-1 gap-2">
                              {media.map((m) => (
                                <Button 
                                  key={m.id} 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => {
                                    const updated = [...(editingPlaylist?.ordem_arquivos || []), m.id];
                                    setEditingPlaylist(prev => prev ? { ...prev, ordem_arquivos: updated } : null);
                                  }}
                                  className="justify-start gap-4 h-12 px-3 border-dashed hover:border-indigo-500 hover:bg-indigo-500/5 group"
                                >
                                  {m.tipo === "video" ? <Film className="w-4 h-4 text-indigo-400" /> : <ImageIcon className="w-4 h-4 text-indigo-400" />}
                                  <div className="flex-1 text-left">
                                    <p className="text-[11px] font-bold truncate group-hover:text-indigo-600">{m.nome}</p>
                                    <p className="text-[9px] uppercase font-black text-muted-foreground">{m.duracao} segundos</p>
                                  </div>
                                  <Plus className="w-3 h-3 opacity-30 group-hover:opacity-100" />
                                </Button>
                              ))}
                            </div>
                          </ScrollArea>
                        </div>
                      </div>
                    </TabsContent>
                  </div>
                </ScrollArea>
              </div>
            </Tabs>
          </div>

          <DialogFooter className="p-6 border-t bg-muted/20">
            <div className="flex w-full items-center justify-between gap-4">
               <p className="text-[10px] text-muted-foreground max-w-[200px]">
                 Ao salvar, o hardware receberá um comando instantâneo de atualização.
               </p>
               <div className="flex gap-2">
                 <Button variant="ghost" onClick={() => setIsSettingsOpen(false)}>Cancelar</Button>
                 <Button 
                   onClick={handleSaveQuickConfig}
                   disabled={isSavingSettings}
                   className="gap-2 bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 px-8"
                 >
                   {isSavingSettings ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                   Salvar e Sincronizar
                 </Button>
               </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
