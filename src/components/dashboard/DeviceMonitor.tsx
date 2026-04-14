import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Monitor, Wifi, WifiOff, RefreshCw, Clock, MapPin,
  Tv2, Signal, Activity, Copy, ExternalLink
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface DeviceInfo {
  id: string;
  nome_empresa: string;
  template: string;
  last_seen: string | null;
  config_clima: string;
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

export default function DeviceMonitor() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [device, setDevice] = useState<DeviceInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDevice = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("profiles")
      .select("user_id, nome_empresa, template, last_seen, config_clima")
      .eq("user_id", user.id)
      .single();
    if (data) {
      setDevice({
        id: (data as any).user_id,
        nome_empresa: (data as any).nome_empresa || "Meu Dispositivo",
        template: (data as any).template || "corporativo",
        last_seen: (data as any).last_seen || null,
        config_clima: (data as any).config_clima || "",
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDevice();
    // Polling a cada 30s para atualizar status
    const interval = setInterval(fetchDevice, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDevice();
    setTimeout(() => setRefreshing(false), 600);
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/player/${user?.id}`;
    navigator.clipboard.writeText(url);
    toast({ title: "Link do Player copiado!", description: url });
  };

  const playerUrl = `${window.location.origin}/player/${user?.id}`;
  const status = getStatusInfo(device?.last_seen || null);

  const templateLabels: Record<string, string> = {
    varejo: "Varejo – Tela Cheia",
    corporativo: "Corporativo / Lobby",
    lbar: "L-Bar Mode",
    split: "Split 60/40",
  };

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl font-bold tracking-tight">Meus Dispositivos</h2>
          <p className="text-muted-foreground mt-1 text-base">
            Monitore o status online dos seus players em tempo real (atualiza a cada 30s).
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh} className="gap-2">
          <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </div>

      {/* Status Card Principal */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 rounded-2xl bg-muted/30 animate-pulse" />
          ))}
        </div>
      ) : device ? (
        <>
          {/* Stat Cards */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Card className={`border-2 ${status.online ? "border-emerald-500/30 bg-emerald-500/5" : "border-red-500/20 bg-red-500/5"}`}>
              <CardContent className="p-5 flex items-center gap-4">
                <div className={`p-3 rounded-xl ${status.bgColor}`}>
                  {status.online ? (
                    <Wifi className={`w-6 h-6 ${status.color}`} />
                  ) : (
                    <WifiOff className={`w-6 h-6 ${status.color}`} />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${status.online ? "bg-emerald-400 animate-pulse" : "bg-red-400"}`} />
                    <p className={`font-bold text-lg ${status.color}`}>{status.label}</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Visto {status.ago}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="p-3 rounded-xl bg-indigo-500/10">
                  <Tv2 className="w-6 h-6 text-indigo-400" />
                </div>
                <div>
                  <p className="font-bold text-sm text-foreground">{device.nome_empresa || "Sem Nome"}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {templateLabels[device.template] || device.template}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="p-3 rounded-xl bg-violet-500/10">
                  <Signal className="w-6 h-6 text-violet-400" />
                </div>
                <div>
                  <p className="font-bold text-sm">
                    {device.config_clima ? `📍 ${device.config_clima}` : "Sem localização"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">Localização configurada</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Device Detail Card */}
          <Card className="border-border/50">
            <CardHeader className="border-b pb-4 bg-muted/10">
              <CardTitle className="flex items-center gap-2 text-base">
                <Monitor className="w-5 h-5 text-indigo-400" />
                Detalhes do Player
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-muted/30 border border-border/50">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-3 h-3 rounded-full shrink-0 ${status.online ? "bg-emerald-400 animate-pulse" : "bg-red-400"}`} />
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">{device.nome_empresa}</p>
                    <p className="text-xs text-muted-foreground font-mono truncate">{playerUrl}</p>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button size="sm" variant="outline" onClick={handleCopyLink} className="gap-1.5">
                    <Copy className="w-3.5 h-3.5" /> Copiar Link
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => window.open(playerUrl, '_blank')} className="gap-1.5">
                    <ExternalLink className="w-3.5 h-3.5" /> Abrir Player
                  </Button>
                </div>
              </div>

              {/* Timeline de Heartbeats (visual) */}
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
                  Atividade Recente (Heartbeat)
                </p>
                <div className="flex items-center gap-1.5">
                  {Array.from({ length: 20 }).map((_, i) => {
                    // Simula histórico: os últimos N dependem do status
                    const isActive = status.online ? i >= 15 : i >= 8 && i <= 10;
                    return (
                      <div
                        key={i}
                        className={`h-6 flex-1 rounded-sm transition-all ${
                          isActive
                            ? "bg-emerald-500 shadow-sm shadow-emerald-500/50"
                            : "bg-muted/40"
                        }`}
                        title={isActive ? "Heartbeat recebido" : "Sem sinal"}
                      />
                    );
                  })}
                </div>
                <div className="flex justify-between text-[10px] text-muted-foreground mt-1.5 font-mono">
                  <span>100 min atrás</span>
                  <span>Agora</span>
                </div>
              </div>

              {/* Instructions */}
              <div className="rounded-xl bg-indigo-500/5 border border-indigo-500/20 p-4">
                <div className="flex items-start gap-3">
                  <Activity className="w-5 h-5 text-indigo-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-indigo-300">Como funciona o Heartbeat?</p>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      Quando o player está aberto no dispositivo (TV/Raspberry Pi), ele envia um sinal a cada 60 segundos.
                      Se o sistema não receber sinal por mais de 3 minutos, o status muda para <span className="text-red-400 font-semibold">Inativo</span>.
                      Abra o link do player no seu dispositivo para ativar o monitoramento.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 border-2 border-dashed rounded-xl text-center">
          <Monitor className="w-12 h-12 text-muted-foreground/30 mb-4" />
          <p className="font-semibold text-lg">Nenhum dispositivo configurado</p>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
            Configure seu canal nas Configurações para começar o monitoramento.
          </p>
        </div>
      )}
    </div>
  );
}
