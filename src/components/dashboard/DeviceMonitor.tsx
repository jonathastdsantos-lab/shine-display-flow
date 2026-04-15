import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Monitor, Wifi, WifiOff, RefreshCw, Clock, MapPin,
  Tv2, Signal, Activity, Copy, ExternalLink, Settings2,
  Zap, ShieldCheck, AlertCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import type { Playlist, ClientProfile } from "@/hooks/useDashboardData";

interface DeviceMonitorProps {
  playlists: Playlist[];
  profile: ClientProfile;
  selectedPlaylistId: string | null;
  setSelectedPlaylistId: (id: string | null) => void;
  onSync: (ids?: string[]) => Promise<void>;
}

function getStatusInfo(lastSeen: string | null): {
  online: boolean; label: string; color: string; bgColor: string; ago: string;
} {
  if (!lastSeen) {
    return { online: false, label: "Nunca conectado", color: "text-slate-400", bgColor: "bg-slate-500/10", ago: "—" };
  }
  const diffMs = Date.now() - new Date(lastSeen).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const online = diffMin < 3;

  let ago = "";
  if (diffMs < 60000) ago = "há menos de 1 min";
  else if (diffMin < 60) ago = `há ${diffMin} min`;
  else ago = `há ${Math.floor(diffMin / 60)}h`;

  return online
    ? { online: true, label: "Online", color: "text-emerald-400", bgColor: "bg-emerald-500/10", ago }
    : { online: false, label: "Inativo", color: "text-red-400", bgColor: "bg-red-500/10", ago };
}

export default function DeviceMonitor({ 
  playlists, profile, selectedPlaylistId, setSelectedPlaylistId, onSync 
}: DeviceMonitorProps) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [statuses, setStatuses] = useState<Record<string, string | null>>({});

  const screenLimit = profile.screen_limit || 1;
  const usagePercentage = Math.min(100, (playlists.length / screenLimit) * 100);

  // Fetch heartbeats for all screens (using a mock or separate query if needed)
  // For now we'll simulate heartbeats from the profiles table as a baseline
  useEffect(() => {
    const checkStatuses = async () => {
      // In a real multi-screen system, each screen would have its own last_seen
      // Currently we only have one last_seen in the profiles table
      // We'll use that for all screens as a placeholder until we add screen-level heartbeats
      setStatuses(playlists.reduce((acc, p) => ({ ...acc, [p.id]: (profile as any).last_seen }), {}));
    };
    checkStatuses();
  }, [playlists, profile]);

  const handleSyncSelected = async () => {
    if (selectedIds.length === 0) return;
    try {
      setRefreshing(true);
      await onSync(selectedIds);
      toast({
        title: "Sincronização Enviada! ⚡",
        description: `${selectedIds.length} telas receberam o sinal de atualização.`,
      });
      setSelectedIds([]);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao sincronizar",
        description: "Não foi possível enviar o sinal para as telas selecionadas.",
      });
    } finally {
      setRefreshing(false);
    }
  };

  const handleConfigure = (id: string) => {
    setSelectedPlaylistId(id);
    navigate("/dashboard/settings");
    toast({
      title: "Tela Selecionada",
      description: `Agora você está editando as configurações da tela individual.`,
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
          <h2 className="font-display text-3xl font-bold tracking-tight">Meus Dispositivos</h2>
          <p className="text-muted-foreground mt-1 text-base">
            Gerencie e monitore suas telas individuais em tempo real.
          </p>
        </div>
        <div className="flex gap-2">
          {selectedIds.length > 0 && (
            <Button onClick={handleSyncSelected} className="gap-2 bg-amber-500 hover:bg-amber-600 animate-in fade-in zoom-in duration-300">
              <Zap className={`w-4 h-4 ${refreshing ? "animate-pulse" : ""}`} />
              Sincronizar Selecionados ({selectedIds.length})
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => window.location.reload()} className="gap-2">
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            Atualizar Status
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

      {/* Individual Devices List */}
      <div className="grid gap-4">
        <div className="flex items-center gap-2 px-2">
          <Monitor className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Dispositivos Ativos</h3>
        </div>
        
        {playlists.map((pl) => {
          const status = getStatusInfo(statuses[pl.id] || null);
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
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant={isCurrentEditor ? "default" : "outline"} 
                          onClick={() => handleConfigure(pl.id)} 
                          className={`gap-2 ${isCurrentEditor ? 'bg-indigo-500 hover:bg-indigo-600' : ''}`}
                        >
                          <Settings2 className="w-4 h-4" />
                          Configurar
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => window.open(`${window.location.origin}/player/${pl.id}`, '_blank')} className="text-muted-foreground hover:text-indigo-400">
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

      {/* Heartbeat Tip */}
      <div className="flex items-center gap-3 p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 max-w-2xl">
        <AlertCircle className="w-5 h-5 text-indigo-400 shrink-0" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          <span className="text-indigo-400 font-bold uppercase mr-1">Dica:</span>
          Cada player envia um sinal ("Heartbeat") a cada 60 segundos. Se o status estiver <span className="text-red-400 font-semibold italic underline">Inativo</span>, verifique a conexão com a internet da sua TV ou dispositivo de reprodução.
        </p>
      </div>
    </div>
  );
}
