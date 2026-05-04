import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import {
  BarChart2, Play, Clock, TrendingUp, Film, Image as ImageIcon,
  RefreshCw, Calendar, Eye, Monitor, LayoutGrid, Layers
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Zone } from "@/utils/AILayoutAssistant";

// ── Zone color map for mini-preview ──
const ZONE_COLORS: Record<string, string> = {
  media: "#6366f1", clock: "#7c3aed", weather: "#0284c7", news: "#d97706",
  finance: "#059669", social: "#db2777", qr: "#64748b", camera: "#dc2626",
  text: "#ea580c", content_feed: "#ca8a04",
};

// ── Mini Preview of current layout ──
function LayoutMiniPreview({ profile }: { profile: any }) {
  const layoutConfig = profile?.layout_config as any;
  const isCustom = layoutConfig?.is_custom && Array.isArray(layoutConfig?.zones) && layoutConfig.zones.length > 0;
  const template = profile?.template || "corporativo";

  const templateColors: Record<string, { label: string; color: string }> = {
    corporativo: { label: "Corporativo", color: "#6366f1" },
    varejo:      { label: "Varejo",      color: "#ec4899" },
    lbar:        { label: "L-Bar",       color: "#f59e0b" },
    split:       { label: "Split",       color: "#10b981" },
  };

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Monitor className="w-4 h-4 text-indigo-400" />
          Preview do Layout Ativo
          {isCustom
            ? <Badge className="ml-2 bg-indigo-500/15 text-indigo-400 border-indigo-500/30 text-[10px]">✏️ Personalizado</Badge>
            : <Badge variant="outline" className="ml-2 text-[10px]">{templateColors[template]?.label || template}</Badge>
          }
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* 16:9 canvas preview */}
        <div className="relative w-full rounded-xl overflow-hidden border border-border/50 bg-zinc-950"
          style={{ paddingBottom: "56.25%" }}>
          <div className="absolute inset-0">
            {isCustom ? (
              <>
                {/* Grid background */}
                <div className="absolute inset-0 opacity-20"
                  style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)", backgroundSize: "10% 10%" }} />

                {/* Zones */}
                {(layoutConfig.zones as Zone[]).map((zone, i) => (
                  <div key={zone.id || i}
                    style={{
                      position: "absolute",
                      left: `${zone.x}%`, top: `${zone.y}%`,
                      width: `${zone.width}%`, height: `${zone.height}%`,
                      backgroundColor: (ZONE_COLORS[zone.type] || "#6366f1") + "55",
                      border: `1px solid ${ZONE_COLORS[zone.type] || "#6366f1"}88`,
                      borderRadius: zone.borderRadius ? `${zone.borderRadius}px` : "2px",
                      display: "flex", flexDirection: "column",
                      alignItems: "center", justifyContent: "center",
                      overflow: "hidden",
                    }}>
                    <p className="text-white text-[8px] font-bold text-center leading-tight px-1 drop-shadow">
                      {zone.label}
                    </p>
                    {zone.width > 15 && zone.height > 10 && (
                      <p className="text-white/30 text-[6px] font-mono mt-0.5">
                        {Math.round(zone.width)}×{Math.round(zone.height)}%
                      </p>
                    )}
                  </div>
                ))}

                {/* Overlay info */}
                <div className="absolute bottom-1 right-1.5 text-[7px] font-mono text-white/20">
                  {layoutConfig.zones.length} zonas · 16:9
                </div>
              </>
            ) : (
              /* Template placeholder */
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                <LayoutGrid className="w-8 h-8 text-white/20" />
                <p className="text-white/30 text-xs font-medium">
                  Template: {templateColors[template]?.label || template}
                </p>
                <p className="text-white/15 text-[10px]">
                  Vá em Templates para criar um layout personalizado
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Zone legend */}
        {isCustom && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {(layoutConfig.zones as Zone[]).map((zone: Zone, i: number) => (
              <div key={i} className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] text-white/60 border border-white/10"
                style={{ backgroundColor: (ZONE_COLORS[zone.type] || "#6366f1") + "22" }}>
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: ZONE_COLORS[zone.type] || "#6366f1" }} />
                {zone.label}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}


interface PlayLog {
  id: string;
  media_id: string;
  media_name: string;
  media_type: string;
  played_at: string;
  player_id: string;
  duration_sec: number;
}

interface ChartEntry {
  name: string;
  plays: number;
  type: string;
}

// Mock data para demonstração quando a tabela não existe ainda
const generateMockData = (): PlayLog[] => {
  const mediaNames = [
    { name: "promo-verao.mp4", type: "video" },
    { name: "oferta-semana.jpg", type: "imagem" },
    { name: "institucional.mp4", type: "video" },
    { name: "cardapio-novo.jpg", type: "imagem" },
    { name: "desconto-50.jpg", type: "imagem" },
  ];
  const logs: PlayLog[] = [];
  const now = Date.now();
  for (let i = 0; i < 48; i++) {
    const media = mediaNames[Math.floor(Math.random() * mediaNames.length)];
    logs.push({
      id: `mock-${i}`,
      media_id: `mock-id-${i % 5}`,
      media_name: media.name,
      media_type: media.type,
      played_at: new Date(now - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      player_id: "local",
      duration_sec: media.type === "video" ? 30 : 10,
    });
  }
  return logs.sort((a, b) => new Date(b.played_at).getTime() - new Date(a.played_at).getTime());
};

export default function ReportsPanel({ profile }: { profile?: any }) {
  const { user } = useAuth();
  const [logs, setLogs] = useState<PlayLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isMock, setIsMock] = useState(false);

  const fetchLogs = async () => {
    if (!user) return;
    try {
      // 1. Buscar IDs das playlists do usuário
      const { data: pls } = await supabase
        .from("playlists")
        .select("id")
        .eq("client_id", user.id);

      const playlistIds = (pls || []).map((p: any) => p.id);
      if (playlistIds.length === 0) {
        setLogs([]);
        setIsMock(false);
        setLoading(false);
        return;
      }

      // 2. Buscar logs reais dessas playlists (RLS já garante segurança)
      const { data, error } = await (supabase as any)
        .from("play_logs")
        .select("*")
        .in("player_id", playlistIds)
        .order("played_at", { ascending: false })
        .limit(500);

      if (error) {
        console.error("Erro ao buscar play_logs:", error);
        setLogs(generateMockData());
        setIsMock(true);
      } else if (!data || data.length === 0) {
        // Sem dados reais ainda — mostra demo + flag
        setLogs(generateMockData());
        setIsMock(true);
      } else {
        setLogs(data);
        setIsMock(false);
      }
    } catch (e) {
      console.error(e);
      setLogs(generateMockData());
      setIsMock(true);
    }
    setLoading(false);
  };

  useEffect(() => { fetchLogs(); }, [user]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchLogs();
    setTimeout(() => setRefreshing(false), 600);
  };

  // Calcular estatísticas
  const totalPlays = logs.length;
  const totalSeconds = logs.reduce((acc, l) => acc + (l.duration_sec || 10), 0);
  const totalHours = (totalSeconds / 3600).toFixed(1);

  // Top mídias
  const mediaCounts: Record<string, { count: number; type: string; name: string }> = {};
  logs.forEach((l) => {
    const key = l.media_name || l.media_id;
    if (!mediaCounts[key]) mediaCounts[key] = { count: 0, type: l.media_type, name: key };
    mediaCounts[key].count++;
  });
  const topMedia: ChartEntry[] = Object.values(mediaCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 6)
    .map((m) => ({
      name: m.name.length > 16 ? m.name.substring(0, 16) + "…" : m.name,
      plays: m.count,
      type: m.type,
    }));

  // Plays por dia (últimos 7 dias)
  const last7Days = Array.from({ length: 7 }).map((_, i) => {
    const date = subDays(new Date(), 6 - i);
    const dayStr = format(date, "yyyy-MM-dd");
    const count = logs.filter((l) => l.played_at?.startsWith(dayStr)).length;
    return { name: format(date, "EEE", { locale: ptBR }), plays: count };
  });

  const COLORS = ["#6366f1", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#3b82f6"];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload?.length) {
      return (
        <div className="bg-card border border-border rounded-xl px-3 py-2 shadow-xl text-sm">
          <p className="font-bold text-foreground">{label}</p>
          <p className="text-indigo-400">{payload[0].value} exibições</p>
        </div>
      );
    }
    return null;
  };

  const exportCSV = () => {
    const header = "data,hora,midia,tipo,duracao_seg\n";
    const rows = logs.map((l) => {
      const d = l.played_at ? new Date(l.played_at) : new Date();
      return [
        format(d, "yyyy-MM-dd"),
        format(d, "HH:mm:ss"),
        `"${(l.media_name || "").replace(/"/g, '""')}"`,
        l.media_type || "",
        l.duration_sec || 10,
      ].join(",");
    }).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relatorio-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = () => {
    const w = window.open("", "_blank", "width=900,height=700");
    if (!w) return;
    const totalH = (logs.reduce((a, l) => a + (l.duration_sec || 10), 0) / 3600).toFixed(1);
    w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Relatório de Exibição</title>
      <style>
        body{font-family:system-ui,sans-serif;padding:32px;color:#111}
        h1{margin:0 0 8px} .sub{color:#666;margin-bottom:24px}
        .stats{display:flex;gap:16px;margin-bottom:24px}
        .stat{flex:1;padding:14px;border:1px solid #e5e5e5;border-radius:8px}
        .stat b{font-size:22px;display:block}
        table{width:100%;border-collapse:collapse;font-size:12px}
        th,td{text-align:left;padding:6px 8px;border-bottom:1px solid #eee}
        th{background:#fafafa}
      </style></head><body>
      <h1>Relatório de Exibição</h1>
      <p class="sub">Gerado em ${format(new Date(), "dd/MM/yyyy HH:mm")}</p>
      <div class="stats">
        <div class="stat"><b>${logs.length}</b>Total de exibições</div>
        <div class="stat"><b>${totalH}h</b>Horas no ar</div>
        <div class="stat"><b>${Object.keys(mediaCounts).length}</b>Arquivos únicos</div>
      </div>
      <table><thead><tr><th>Data/Hora</th><th>Mídia</th><th>Tipo</th><th>Duração</th></tr></thead><tbody>
      ${logs.slice(0, 200).map(l => `<tr>
        <td>${l.played_at ? format(new Date(l.played_at), "dd/MM/yyyy HH:mm") : "—"}</td>
        <td>${(l.media_name || "—").replace(/</g, "&lt;")}</td>
        <td>${l.media_type || "—"}</td>
        <td>${l.duration_sec || 10}s</td>
      </tr>`).join("")}
      </tbody></table>
      <script>setTimeout(()=>window.print(),300)</script>
      </body></html>`);
    w.document.close();
  };

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl font-bold tracking-tight">Relatórios de Exibição</h2>
          <p className="text-muted-foreground mt-1 text-base">
            Proof of Play – veja quantas vezes cada mídia foi exibida e por quanto tempo.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportCSV} className="gap-2" disabled={logs.length === 0}>
            📊 CSV
          </Button>
          <Button variant="outline" size="sm" onClick={exportPDF} className="gap-2" disabled={logs.length === 0}>
            📄 PDF
          </Button>
          <Button variant="outline" size="sm" onClick={handleRefresh} className="gap-2">
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {isMock && (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-sm">
          <span className="text-lg">⚠️</span>
          <p className="text-amber-300">
            <span className="font-semibold">Dados demonstrativos.</span> Os logs reais serão registrados conforme o player exibe as mídias. A tabela <code className="bg-black/20 px-1 py-0.5 rounded text-xs">play_logs</code> será criada automaticamente.
          </p>
        </div>
      )}

      {/* Live Layout Preview */}
      {profile && <LayoutMiniPreview profile={profile} />}

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: Play, label: "Total de Exibições", value: totalPlays.toLocaleString("pt-BR"), color: "text-indigo-400", bg: "bg-indigo-500/10" },
          { icon: Clock, label: "Horas no Ar", value: `${totalHours}h`, color: "text-emerald-400", bg: "bg-emerald-500/10" },
          { icon: Film, label: "Arquivos Únicos", value: Object.keys(mediaCounts).length, color: "text-violet-400", bg: "bg-violet-500/10" },
          { icon: TrendingUp, label: "Média Diária", value: `${Math.round(totalPlays / 7)} exib.`, color: "text-amber-400", bg: "bg-amber-500/10" },
        ].map((stat) => (
          <Card key={stat.label} className="border-border/50">
            <CardContent className="p-5 flex items-center gap-4">
              <div className={`p-3 rounded-xl ${stat.bg}`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold font-display">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Plays por Dia */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="w-4 h-4 text-indigo-400" />
              Exibições por Dia (Últimos 7 Dias)
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={last7Days} barSize={28}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#94a3b8" }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} width={28} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(99,102,241,0.07)" }} />
                <Bar dataKey="plays" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Mídias */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Eye className="w-4 h-4 text-violet-400" />
              Top Mídias Mais Exibidas
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            {topMedia.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={topMedia} layout="vertical" barSize={18}>
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} width={80} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(139,92,246,0.07)" }} />
                  <Bar dataKey="plays" radius={[0, 6, 6, 0]}>
                    {topMedia.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
                Nenhuma exibição registrada ainda
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Log Recente */}
      <Card className="border-border/50">
        <CardHeader className="border-b pb-4 bg-muted/10">
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart2 className="w-4 h-4 text-indigo-400" />
            Log de Exibições Recentes
            {isMock && (
              <Badge variant="outline" className="ml-2 text-[10px] border-amber-500/30 text-amber-400">
                Demo
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border/40 max-h-80 overflow-auto">
            {logs.slice(0, 20).map((log, i) => (
              <div key={log.id || i} className="flex items-center gap-4 px-5 py-3 hover:bg-muted/20 transition-colors">
                <div className={`p-1.5 rounded-lg shrink-0 ${log.media_type === "video" ? "bg-indigo-500/10" : "bg-emerald-500/10"}`}>
                  {log.media_type === "video"
                    ? <Film className="w-3.5 h-3.5 text-indigo-400" />
                    : <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{log.media_name || "Mídia sem nome"}</p>
                  <p className="text-xs text-muted-foreground">
                    {log.played_at
                      ? format(new Date(log.played_at), "dd/MM 'às' HH:mm", { locale: ptBR })
                      : "—"
                    }
                  </p>
                </div>
                <span className="text-xs font-mono text-muted-foreground shrink-0 bg-muted px-2 py-0.5 rounded">
                  {log.duration_sec || 10}s
                </span>
              </div>
            ))}
            {logs.length === 0 && !loading && (
              <div className="py-12 text-center text-sm text-muted-foreground">
                Nenhuma exibição registrada ainda.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
