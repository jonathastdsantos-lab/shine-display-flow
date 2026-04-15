import { useState, useRef, useCallback, useEffect } from "react";
import {
  Monitor, Clock, CloudSun, Newspaper, TrendingUp, Instagram, QrCode, Camera, Type, Sparkles,
  Plus, Trash2, Undo2, Redo2, Save, LayoutGrid,
  Lock, Unlock, Eye, EyeOff, Copy,
  ChevronUp, ChevronDown, Layers, Settings, Wand2, X, Grid3x3,
  ZoomIn, ZoomOut, RotateCcw, Maximize2, MapPin, AlignLeft, AlignCenter, AlignRight,
  Palette, Move, Sliders, Square
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { generateLayoutFromPrompt, ZONE_DEFAULTS, Zone } from "@/utils/AILayoutAssistant";
import { SEGMENT_LABELS, type BusinessSegment } from "@/utils/ContentFeed";

// ────────────────────────────────────────────────────────────
// Constants
// ────────────────────────────────────────────────────────────
const ZONE_ICONS: Record<Zone["type"], React.ComponentType<any>> = {
  media: Monitor, clock: Clock, weather: CloudSun, news: Newspaper,
  finance: TrendingUp, social: Instagram, qr: QrCode, camera: Camera,
  text: Type, content_feed: Sparkles,
};

const ZONE_COLORS: Record<Zone["type"], { bg: string; border: string; accent: string }> = {
  media:        { bg: "bg-indigo-600/70",  border: "border-indigo-400",  accent: "#6366f1" },
  clock:        { bg: "bg-violet-600/70",  border: "border-violet-400",  accent: "#7c3aed" },
  weather:      { bg: "bg-sky-600/70",     border: "border-sky-400",     accent: "#0284c7" },
  news:         { bg: "bg-amber-600/70",   border: "border-amber-400",   accent: "#d97706" },
  finance:      { bg: "bg-emerald-600/70", border: "border-emerald-400", accent: "#059669" },
  social:       { bg: "bg-pink-600/70",    border: "border-pink-400",    accent: "#db2777" },
  qr:           { bg: "bg-slate-600/70",   border: "border-slate-400",   accent: "#64748b" },
  camera:       { bg: "bg-red-600/70",     border: "border-red-400",     accent: "#dc2626" },
  text:         { bg: "bg-orange-600/70",  border: "border-orange-400",  accent: "#ea580c" },
  content_feed: { bg: "bg-yellow-600/70",  border: "border-yellow-400",  accent: "#ca8a04" },
};

const GRID_SIZE = 5;
const MIN_SIZE = 5;

// Maps widget type → App Store config key
const WIDGET_TO_CONFIG_KEY: Partial<Record<Zone["type"], string>> = {
  clock: "clock", weather: "weather", news: "news", finance: "finance",
  social: "social", qr: "qr", camera: "camera", content_feed: "content_feed",
};

const WIDGET_PALETTE: { type: Zone["type"]; label: string; desc: string }[] = [
  { type: "media",        label: "Vídeo / Foto",        desc: "Reproduz sua playlist" },
  { type: "clock",        label: "Relógio & Data",      desc: "Horário em tempo real" },
  { type: "weather",      label: "Clima Global",        desc: "Previsão do tempo" },
  { type: "news",         label: "Ticker Notícias",     desc: "RSS rolando" },
  { type: "finance",      label: "Cotações",            desc: "USD, EUR, BTC" },
  { type: "content_feed", label: "Dicas & Tendências",  desc: "Conteúdo por segmento" },
  { type: "social",       label: "Mural Instagram",     desc: "Últimos posts" },
  { type: "qr",           label: "QR Code",             desc: "Link dinâmico" },
  { type: "camera",       label: "Câmera CCTV",         desc: "Stream ao vivo" },
  { type: "text",         label: "Texto Livre",         desc: "Mensagem personalizada" },
];

const AI_QUICK_PRESETS = [
  "Salão de beleza", "Academia fitness", "Restaurante", "Clínica médica", "Varejo / Loja", "Corporativo",
];

const PRESET_SIZES = [
  { label: "Tela Cheia",  w: 100, h: 100 },
  { label: "Meia Tela",   w: 50,  h: 100 },
  { label: "1/3",         w: 33,  h: 100 },
  { label: "Barra Lateral", w: 30, h: 88 },
  { label: "Ticker",      w: 100, h: 12  },
  { label: "Quadrado",    w: 30,  h: 30  },
];

function snap(v: number): number {
  return Math.round(v / GRID_SIZE) * GRID_SIZE;
}

// ────────────────────────────────────────────────────────────
// Props
// ────────────────────────────────────────────────────────────
interface VisualLayoutEditorProps {
  initialZones?: Zone[];
  widgetConfig?: Record<string, { enabled: boolean; [k: string]: any }> | null;
  onSave: (zones: Zone[]) => void;
  onClose?: () => void;
  contextName?: string;
}

// ────────────────────────────────────────────────────────────
// Main Component
// ────────────────────────────────────────────────────────────
export function VisualLayoutEditor({ 
  initialZones = [], 
  widgetConfig, 
  onSave, 
  onClose,
  contextName = "Layout Padrão (Global)"
}: VisualLayoutEditorProps) {
  const defaultZones: Zone[] = initialZones.length > 0 ? initialZones : [
    { id: "zone-main",   type: "media",  label: "Mídia Principal",  x: 0, y: 0,  width: 70, height: 88 },
    { id: "zone-clock",  type: "clock",  label: "Relógio",          x: 70, y: 0, width: 30, height: 28 },
    { id: "zone-ticker", type: "news",   label: "Ticker Notícias",  x: 0, y: 88, width: 70, height: 12 },
  ];

  const [zones, setZones] = useState<Zone[]>(defaultZones);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [lockedIds, setLockedIds] = useState<Set<string>>(new Set());
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());
  const [showGrid, setShowGrid] = useState(true);
  const [snapGrid, setSnapGrid] = useState(true);
  const [aiPrompt, setAIPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [leftTab, setLeftTab] = useState<"widgets" | "layers" | "ai">("widgets");
  const [rightTab, setRightTab] = useState<"position" | "style" | "config">("position");
  const [zoom, setZoom] = useState(100);
  const [history, setHistory] = useState<Zone[][]>([]);
  const [future, setFuture] = useState<Zone[][]>([]);

  const canvasRef = useRef<HTMLDivElement>(null);
  const dragStart = useRef<{ mouseX: number; mouseY: number; zoneX: number; zoneY: number } | null>(null);
  const resizeStart = useRef<{ mouseX: number; mouseY: number; zoneW: number; zoneH: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const selectedZone = zones.find(z => z.id === selectedId) || null;

  // ── App Store helpers ──
  const isWidgetEnabled = (type: Zone["type"]): boolean => {
    const key = WIDGET_TO_CONFIG_KEY[type];
    if (!key || !widgetConfig) return true;
    return widgetConfig[key]?.enabled !== false;
  };
  const hasWidgetConfig = !!(widgetConfig && Object.keys(widgetConfig).length > 0);
  const enabledCount = WIDGET_PALETTE.filter(w => isWidgetEnabled(w.type)).length;

  // ── History ──
  const pushHistory = useCallback((prev: Zone[]) => {
    setHistory(h => [...h.slice(-30), prev]);
    setFuture([]);
  }, []);

  const undo = useCallback(() => {
    setHistory(h => {
      if (h.length === 0) return h;
      const prev = h[h.length - 1];
      setFuture(f => [zones, ...f]);
      setZones(prev);
      toast.info("Ação desfeita");
      return h.slice(0, -1);
    });
  }, [zones]);

  const redo = useCallback(() => {
    setFuture(f => {
      if (f.length === 0) return f;
      const next = f[0];
      setHistory(h => [...h, zones]);
      setZones(next);
      toast.info("Ação refeita");
      return f.slice(1);
    });
  }, [zones]);

  // ── Keyboard shortcuts ──
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return;
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) { e.preventDefault(); undo(); }
      if ((e.ctrlKey || e.metaKey) && (e.key === "y" || (e.key === "z" && e.shiftKey))) { e.preventDefault(); redo(); }
      if ((e.key === "Delete" || e.key === "Backspace") && selectedId && !lockedIds.has(selectedId)) removeZone(selectedId);
      if ((e.ctrlKey || e.metaKey) && e.key === "d") { e.preventDefault(); if (selectedId) duplicateZone(selectedId); }
      if (e.key === "Escape") setSelectedId(null);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selectedId, zones, lockedIds, undo, redo]);

  // Auto-switch to config tab when content_feed is selected
  useEffect(() => {
    if (selectedZone?.type === "content_feed" || selectedZone?.type === "text" || selectedZone?.type === "weather") {
      setRightTab("config");
    }
  }, [selectedId]);

  // ── Zone Operations ──
  const addZone = (type: Zone["type"]) => {
    pushHistory(zones);
    const defaults = ZONE_DEFAULTS[type];
    const id = `zone-${Date.now()}`;
    const newZone: Zone = { id, type, label: defaults.label, x: 10, y: 10, width: 40, height: 35, config: { ...defaults.defaultConfig } };
    setZones(prev => [...prev, newZone]);
    setSelectedId(id);
    setRightTab(type === "content_feed" || type === "text" || type === "weather" ? "config" : "position");
    toast.success(`"${defaults.label}" adicionado`);
  };

  const removeZone = (id: string) => {
    pushHistory(zones);
    setZones(prev => prev.filter(z => z.id !== id));
    setSelectedId(null);
    toast.error("Zona removida");
  };

  const duplicateZone = (id: string) => {
    const zone = zones.find(z => z.id === id);
    if (!zone) return;
    pushHistory(zones);
    const newId = `zone-${Date.now()}`;
    setZones(prev => [...prev, { ...zone, id: newId, x: Math.min(95, zone.x + 3), y: Math.min(95, zone.y + 3) }]);
    setSelectedId(newId);
    toast.success("Zona duplicada");
  };

  const moveLayer = (id: string, dir: "up" | "down") => {
    setZones(prev => {
      const i = prev.findIndex(z => z.id === id);
      if (i < 0) return prev;
      const arr = [...prev];
      if (dir === "up" && i > 0) [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]];
      if (dir === "down" && i < arr.length - 1) [arr[i], arr[i + 1]] = [arr[i + 1], arr[i]];
      return arr;
    });
  };

  const updateZone = (id: string, updates: Partial<Zone>) => {
    setZones(prev => prev.map(z => z.id === id ? { ...z, ...updates } : z));
  };

  const updateConfig = (id: string, key: string, value: any) => {
    setZones(prev => prev.map(z => z.id === id ? { ...z, config: { ...z.config, [key]: value } } : z));
  };

  const toggleLock = (id: string) => setLockedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleHidden = (id: string) => setHiddenIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  // ── Canvas helpers ──
  const getCanvasBounds = () => {
    const r = canvasRef.current?.getBoundingClientRect();
    return r ? { width: r.width, height: r.height } : { width: 800, height: 450 };
  };

  // ── Drag ──
  const handleMouseDown = (e: React.MouseEvent, zoneId: string) => {
    e.stopPropagation();
    e.preventDefault();
    setSelectedId(zoneId);
    if (lockedIds.has(zoneId)) return;
    const zone = zones.find(z => z.id === zoneId)!;
    dragStart.current = { mouseX: e.clientX, mouseY: e.clientY, zoneX: zone.x, zoneY: zone.y };
    setIsDragging(true);
    pushHistory(zones);

    const onMove = (ev: MouseEvent) => {
      if (!dragStart.current) return;
      const { width, height } = getCanvasBounds();
      const dx = ((ev.clientX - dragStart.current.mouseX) / width) * 100;
      const dy = ((ev.clientY - dragStart.current.mouseY) / height) * 100;
      setZones(prev => prev.map(z => {
        if (z.id !== zoneId) return z;
        let nx = dragStart.current!.zoneX + dx;
        let ny = dragStart.current!.zoneY + dy;
        if (snapGrid) { nx = snap(nx); ny = snap(ny); }
        return { ...z, x: Math.max(0, Math.min(100 - z.width, nx)), y: Math.max(0, Math.min(100 - z.height, ny)) };
      }));
    };
    const onUp = () => {
      dragStart.current = null;
      setIsDragging(false);
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  };

  // ── Resize ──
  const handleResizeMouseDown = (e: React.MouseEvent, zoneId: string) => {
    e.stopPropagation();
    e.preventDefault();
    if (lockedIds.has(zoneId)) return;
    const zone = zones.find(z => z.id === zoneId)!;
    resizeStart.current = { mouseX: e.clientX, mouseY: e.clientY, zoneW: zone.width, zoneH: zone.height };
    pushHistory(zones);

    const onMove = (ev: MouseEvent) => {
      if (!resizeStart.current) return;
      const { width, height } = getCanvasBounds();
      let nw = resizeStart.current.zoneW + ((ev.clientX - resizeStart.current.mouseX) / width) * 100;
      let nh = resizeStart.current.zoneH + ((ev.clientY - resizeStart.current.mouseY) / height) * 100;
      if (snapGrid) { nw = snap(nw); nh = snap(nh); }
      setZones(prev => prev.map(z =>
        z.id !== zoneId ? z : { ...z, width: Math.max(MIN_SIZE, Math.min(100 - z.x, nw)), height: Math.max(MIN_SIZE, Math.min(100 - z.y, nh)) }
      ));
    };
    const onUp = () => {
      resizeStart.current = null;
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  };

  // ── AI Generate ──
  const handleAIGenerate = () => {
    if (!aiPrompt.trim()) { toast.error("Digite uma descrição do negócio"); return; }
    setAiLoading(true);
    pushHistory(zones);
    setTimeout(() => {
      const result = generateLayoutFromPrompt(aiPrompt);
      setZones(result.zones);
      setSelectedId(null);
      setAiLoading(false);
      toast.success(`🤖 Layout "${result.label}" gerado pela IA!`);
    }, 800);
  };

  // ── Import from App Store ──
  const importFromAppStore = () => {
    if (!hasWidgetConfig) return;
    pushHistory(zones);
    const enabled = WIDGET_PALETTE.filter(w => isWidgetEnabled(w.type)).map(w => w.type);
    const newZones: Zone[] = [];
    newZones.push({ id: `zone-media-${Date.now()}`, type: "media", label: "Mídia Principal", x: 0, y: 0, width: 70, height: 88 });
    const sideWidgets = enabled.filter(t => t !== "media" && t !== "news" && t !== "text");
    sideWidgets.forEach((type, i) => {
      const h = Math.floor(88 / Math.max(sideWidgets.length, 1));
      newZones.push({ id: `zone-${type}-${Date.now()}-${i}`, type, label: ZONE_DEFAULTS[type].label, x: 70, y: i * h, width: 30, height: h, config: { ...ZONE_DEFAULTS[type].defaultConfig } });
    });
    if (enabled.includes("news")) {
      newZones.push({ id: `zone-news-${Date.now()}`, type: "news", label: "Ticker Notícias", x: 0, y: 88, width: 70, height: 12 });
    }
    setZones(newZones);
    setSelectedId(null);
    toast.success(`✨ Layout gerado com ${newZones.length} widgets habilitados!`);
  };

  // ── Save ──
  const handleSave = () => {
    const visibleZones = zones.filter(z => !hiddenIds.has(z.id));
    if (visibleZones.length === 0) { toast.error("Adicione pelo menos uma zona antes de salvar"); return; }
    onSave(visibleZones);
  };

  // ────────────────────────────────────────────────────────────
  // RENDER
  // ────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full bg-[#0f1117] text-white overflow-hidden select-none font-sans">

      {/* ── Top Toolbar ── */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-white/10 bg-[#161b27] shrink-0 flex-wrap gap-y-1">
        <div className="flex items-center gap-2 mr-1">
          <div className="p-1.5 bg-indigo-600/20 rounded-lg border border-indigo-500/30">
            <LayoutGrid className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <p className="text-xs font-bold text-white leading-none mb-0.5">Editor Visual</p>
            <p className="text-[10px] text-indigo-400 font-black truncate max-w-[120px]" title={contextName}>
              {contextName}
            </p>
          </div>
        </div>

        {/* Undo/Redo */}
        <div className="flex items-center gap-0.5 border border-white/10 rounded-lg p-0.5 bg-white/5">
          <Button variant="ghost" size="sm" onClick={undo} disabled={history.length === 0} className="h-7 w-7 p-0 text-white/60 hover:text-white hover:bg-white/10" title="Ctrl+Z">
            <Undo2 className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="sm" onClick={redo} disabled={future.length === 0} className="h-7 w-7 p-0 text-white/60 hover:text-white hover:bg-white/10" title="Ctrl+Y">
            <Redo2 className="w-3.5 h-3.5" />
          </Button>
        </div>

        {/* Grid/Snap */}
        <div className="flex items-center gap-0.5 border border-white/10 rounded-lg p-0.5 bg-white/5">
          <Button variant="ghost" size="sm" onClick={() => setShowGrid(g => !g)} className={`h-7 w-7 p-0 hover:bg-white/10 ${showGrid ? "text-indigo-400" : "text-white/30"}`} title="Grade">
            <Grid3x3 className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setSnapGrid(s => !s)} className={`h-7 px-2 text-[10px] hover:bg-white/10 ${snapGrid ? "text-indigo-400" : "text-white/30"}`}>
            <Maximize2 className="w-3 h-3 mr-1" />{snapGrid ? "Snap" : "Livre"}
          </Button>
        </div>

        {/* Zoom */}
        <div className="flex items-center gap-0.5">
          <Button variant="ghost" size="sm" onClick={() => setZoom(z => Math.max(50, z - 10))} className="h-7 w-7 p-0 text-white/30 hover:text-white hover:bg-white/5"><ZoomOut className="w-3.5 h-3.5" /></Button>
          <span className="text-[10px] font-mono text-white/30 w-10 text-center">{zoom}%</span>
          <Button variant="ghost" size="sm" onClick={() => setZoom(z => Math.min(150, z + 10))} className="h-7 w-7 p-0 text-white/30 hover:text-white hover:bg-white/5"><ZoomIn className="w-3.5 h-3.5" /></Button>
          <Button variant="ghost" size="sm" onClick={() => setZoom(100)} className="h-7 w-7 p-0 text-white/30 hover:text-white hover:bg-white/5"><RotateCcw className="w-3 h-3" /></Button>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {onClose && <Button variant="ghost" size="sm" onClick={onClose} className="h-8 px-3 text-white/50 hover:text-white gap-1.5"><X className="w-3.5 h-3.5" /> Cancelar</Button>}
          <Button size="sm" className="h-8 px-4 bg-indigo-600 hover:bg-indigo-500 text-white gap-1.5 font-bold shadow-lg shadow-indigo-500/25" onClick={handleSave}>
            <Save className="w-3.5 h-3.5" /> Salvar Layout
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">

        {/* ────────── LEFT PANEL ────────── */}
        <div className="w-52 shrink-0 border-r border-white/10 flex flex-col bg-[#161b27]">
          {/* Tabs */}
          <div className="flex border-b border-white/10 shrink-0">
            {([
              { id: "widgets", icon: Plus, label: "Widgets" },
              { id: "layers",  icon: Layers, label: "Camadas" },
              { id: "ai",      icon: Wand2, label: "IA" },
            ] as const).map(tab => (
              <button key={tab.id} onClick={() => setLeftTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-1 py-2 text-[10px] font-bold uppercase tracking-wider transition-colors
                  ${leftTab === tab.id ? "text-indigo-400 border-b-2 border-indigo-400 bg-indigo-400/5" : "text-white/30 hover:text-white/60"}`}>
                <tab.icon className="w-3 h-3" />{tab.label}
              </button>
            ))}
          </div>

          {/* WIDGETS TAB */}
          {leftTab === "widgets" && (
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-1">
                {hasWidgetConfig && (
                  <div className="mb-2 p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
                    <p className="text-[9px] text-indigo-400 font-bold">🔗 App Store conectado</p>
                    <p className="text-[8px] text-white/30 mb-1.5">{enabledCount} widget(s) habilitado(s)</p>
                    <button onClick={importFromAppStore}
                      className="w-full text-[10px] bg-indigo-600/40 hover:bg-indigo-600/70 border border-indigo-500/30 text-indigo-300 font-semibold py-1 px-2 rounded transition-colors flex items-center justify-center gap-1">
                      <Plus className="w-3 h-3" /> Importar do App Store
                    </button>
                  </div>
                )}

                <p className="text-[9px] text-white/20 uppercase tracking-widest px-1 pt-1 pb-0.5">Clique para adicionar</p>
                {WIDGET_PALETTE.map(({ type, label, desc }) => {
                  const Icon = ZONE_ICONS[type];
                  const colors = ZONE_COLORS[type];
                  const enabled = isWidgetEnabled(type);
                  return (
                    <button key={type} onClick={() => addZone(type)}
                      className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg transition-all group text-left border
                        ${enabled ? "hover:bg-white/5 hover:border-white/10 border-transparent" : "opacity-40 border-transparent"}`}>
                      <div className={`p-1.5 rounded-lg ${colors.bg} border ${colors.border} shrink-0 relative`}>
                        <Icon className="w-3 h-3 text-white" />
                        {hasWidgetConfig && (
                          <div className={`absolute -top-1 -right-1 w-2 h-2 rounded-full border border-[#161b27] ${enabled ? "bg-emerald-400" : "bg-slate-600"}`} />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-semibold text-white/80 leading-tight">{label}</p>
                        <p className="text-[9px] text-white/25 leading-tight truncate">{desc}</p>
                      </div>
                      {hasWidgetConfig && (
                        <span className={`text-[8px] font-bold ${enabled ? "text-emerald-400" : "text-slate-500"}`}>
                          {enabled ? "ON" : "OFF"}
                        </span>
                      )}
                    </button>
                  );
                })}
                {hasWidgetConfig && (
                  <p className="text-[8px] text-white/15 px-1 pt-1 text-center leading-relaxed">
                    🟢 ON = habilitado no App Store<br />Ative em Widgets &amp; App Store
                  </p>
                )}
              </div>
            </ScrollArea>
          )}

          {/* LAYERS TAB */}
          {leftTab === "layers" && (
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-1">
                <p className="text-[9px] text-white/20 uppercase tracking-widest px-1 pt-1 pb-0.5">{zones.length} zona(s)</p>
                {[...zones].reverse().map((zone, ri) => {
                  const i = zones.length - 1 - ri;
                  const Icon = ZONE_ICONS[zone.type];
                  const colors = ZONE_COLORS[zone.type];
                  const isLocked = lockedIds.has(zone.id);
                  const isHidden = hiddenIds.has(zone.id);
                  return (
                    <div key={zone.id} onClick={() => setSelectedId(zone.id)}
                      className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg cursor-pointer transition-all border
                        ${zone.id === selectedId ? "bg-indigo-500/20 border-indigo-500/30" : "hover:bg-white/5 border-transparent"}`}>
                      <div className={`p-1 rounded ${colors.bg} border ${colors.border} shrink-0`}>
                        <Icon className="w-2.5 h-2.5 text-white" />
                      </div>
                      <span className={`text-[10px] flex-1 truncate ${isHidden ? "line-through text-white/20" : "text-white/60"}`}>{zone.label}</span>
                      <div className="flex items-center gap-0.5 shrink-0">
                        <button onClick={e => { e.stopPropagation(); toggleHidden(zone.id); }} className="p-0.5 hover:text-white text-white/25">
                          {isHidden ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        </button>
                        <button onClick={e => { e.stopPropagation(); toggleLock(zone.id); }} className="p-0.5 hover:text-white text-white/25">
                          {isLocked ? <Lock className="w-3 h-3 text-amber-400" /> : <Unlock className="w-3 h-3" />}
                        </button>
                        <button onClick={e => { e.stopPropagation(); moveLayer(zone.id, "up"); }} className="p-0.5 hover:text-white text-white/25" disabled={i === zones.length - 1}>
                          <ChevronUp className="w-3 h-3" />
                        </button>
                        <button onClick={e => { e.stopPropagation(); moveLayer(zone.id, "down"); }} className="p-0.5 hover:text-white text-white/25" disabled={i === 0}>
                          <ChevronDown className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}

          {/* AI TAB */}
          {leftTab === "ai" && (
            <div className="flex-1 p-3 flex flex-col gap-3 overflow-auto">
              <div>
                <p className="text-[10px] text-amber-400/80 font-bold uppercase tracking-wider mb-1">🤖 IA Geradora</p>
                <p className="text-[9px] text-white/30 leading-relaxed">Descreva seu negócio para a IA criar o layout ideal.</p>
              </div>
              <textarea
                className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-xs text-white/80 placeholder:text-white/20 resize-none focus:outline-none focus:border-amber-500/50"
                rows={3} placeholder="Ex: Salão de beleza feminino..." value={aiPrompt}
                onChange={e => setAIPrompt(e.target.value)}
              />
              <div className="space-y-1">
                <p className="text-[9px] text-white/20">Sugestões:</p>
                {AI_QUICK_PRESETS.map(p => (
                  <button key={p} onClick={() => setAIPrompt(p)}
                    className="w-full text-left text-[10px] text-white/40 hover:text-amber-400 hover:bg-amber-400/5 px-2 py-1 rounded transition-colors">
                    → {p}
                  </button>
                ))}
              </div>
              <Button className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold gap-1.5 text-xs"
                onClick={handleAIGenerate} disabled={aiLoading || !aiPrompt.trim()}>
                {aiLoading ? <div className="w-3.5 h-3.5 border-2 border-black/20 border-t-black rounded-full animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                {aiLoading ? "Gerando..." : "Gerar Layout"}
              </Button>
            </div>
          )}
        </div>

        {/* ────────── CANVAS ────────── */}
        <div className="flex-1 overflow-auto bg-[#0a0e1a] flex items-center justify-center p-6" onClick={() => setSelectedId(null)}>
          <div style={{ transform: `scale(${zoom / 100})`, transformOrigin: "center center", transition: "transform 0.2s" }}>
            <div className="mb-2 flex items-center justify-between text-[9px] text-white/20 font-mono">
              <span>16:9 — TV Layout Canvas</span>
              <span>{zones.length} zonas · Histórico: {history.length}</span>
            </div>

            <div ref={canvasRef} className="relative bg-[#050810] overflow-hidden shadow-[0_0_80px_rgba(99,102,241,0.12)]"
              style={{ width: "800px", height: "450px", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "4px" }}
              onClick={e => { if (e.target === canvasRef.current) setSelectedId(null); }}>

              {/* Grid */}
              {showGrid && (
                <div className="absolute inset-0 pointer-events-none" style={{
                  backgroundImage: `linear-gradient(rgba(99,102,241,0.07) 1px, transparent 1px),linear-gradient(90deg, rgba(99,102,241,0.07) 1px, transparent 1px),linear-gradient(rgba(99,102,241,0.025) 1px, transparent 1px),linear-gradient(90deg, rgba(99,102,241,0.025) 1px, transparent 1px)`,
                  backgroundSize: "80px 45px, 80px 45px, 16px 9px, 16px 9px"
                }} />
              )}

              {/* Frame label */}
              <div className="absolute top-0 left-0 right-0 flex justify-center z-30 pointer-events-none">
                <div className="bg-white/5 border-b border-white/5 px-3 py-0.5">
                  <span className="text-[7px] font-mono text-white/15 uppercase tracking-widest">HDMI OUTPUT · 1920×1080</span>
                </div>
              </div>

              {/* Zones */}
              {zones.map(zone => {
                const Icon = ZONE_ICONS[zone.type];
                const colors = ZONE_COLORS[zone.type];
                const isSelected = zone.id === selectedId;
                const isLocked = lockedIds.has(zone.id);
                const isHidden = hiddenIds.has(zone.id);
                if (isHidden) return null;

                return (
                  <div key={zone.id}
                    className={`absolute border transition-all duration-75 ${colors.bg} ${colors.border}
                      ${isSelected ? "z-20 ring-2 ring-white/80 ring-offset-0" : "z-10"}
                      ${isLocked ? "cursor-not-allowed" : isDragging && isSelected ? "cursor-grabbing" : "cursor-grab"}`}
                    style={{
                      left: `${zone.x}%`, top: `${zone.y}%`,
                      width: `${zone.width}%`, height: `${zone.height}%`,
                      opacity: zone.opacity !== undefined ? zone.opacity / 100 : 1,
                      borderRadius: zone.borderRadius ? `${zone.borderRadius}px` : undefined,
                      backgroundColor: zone.backgroundColor || undefined,
                    }}
                    onMouseDown={e => handleMouseDown(e, zone.id)}
                  >
                    <div className="w-full h-full flex flex-col items-center justify-center p-2 overflow-hidden">
                      <Icon className="w-4 h-4 text-white/70 mb-0.5 shrink-0 drop-shadow" />
                      {zone.height > 10 && (
                        <span className="text-white text-[8px] font-bold text-center leading-tight px-1 drop-shadow" style={{ maxWidth: "100%" }}>
                          {zone.label}
                        </span>
                      )}
                      {zone.width > 18 && zone.height > 15 && (
                        <span className="text-white/25 text-[7px] font-mono mt-0.5">{Math.round(zone.width)}×{Math.round(zone.height)}%</span>
                      )}
                    </div>

                    {isLocked && (
                      <div className="absolute top-1 left-1 p-0.5 bg-amber-500/20 rounded border border-amber-500/30">
                        <Lock className="w-2 h-2 text-amber-400" />
                      </div>
                    )}

                    {/* Resize SE */}
                    {isSelected && !isLocked && (
                      <div className="absolute bottom-0 right-0 w-5 h-5 cursor-se-resize flex items-end justify-end"
                        onMouseDown={e => handleResizeMouseDown(e, zone.id)}>
                        <div className="w-2.5 h-2.5 border-r-2 border-b-2 border-white/80 m-0.5 rounded-br-sm" />
                      </div>
                    )}

                    {/* Context toolbar */}
                    {isSelected && (
                      <div className="absolute -top-7 left-0 flex items-center gap-0.5 bg-[#1a2035] border border-white/20 rounded px-1 py-0.5 shadow-xl z-30 whitespace-nowrap">
                        <span className="text-[9px] text-white/50 font-mono px-1">{zone.label}</span>
                        <div className="w-px h-3 bg-white/10" />
                        <button onClick={e => { e.stopPropagation(); duplicateZone(zone.id); }} className="p-0.5 hover:text-white text-white/30" title="Duplicar (Ctrl+D)"><Copy className="w-3 h-3" /></button>
                        <button onClick={e => { e.stopPropagation(); toggleLock(zone.id); }} className="p-0.5 hover:text-white text-white/30">
                          {isLocked ? <Lock className="w-3 h-3 text-amber-400" /> : <Unlock className="w-3 h-3" />}
                        </button>
                        <button onClick={e => { e.stopPropagation(); toggleHidden(zone.id); }} className="p-0.5 hover:text-white text-white/30"><EyeOff className="w-3 h-3" /></button>
                        <button onClick={e => { e.stopPropagation(); removeZone(zone.id); }} className="p-0.5 hover:text-red-400 text-white/30" title="Delete"><Trash2 className="w-3 h-3" /></button>
                      </div>
                    )}
                  </div>
                );
              })}

              {zones.filter(z => !hiddenIds.has(z.id)).length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center text-white/10">
                    <LayoutGrid className="w-10 h-10 mx-auto mb-2" />
                    <p className="text-sm font-bold">Canvas Vazio</p>
                    <p className="text-xs mt-1">Adicione widgets no painel esquerdo</p>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-2 flex gap-4 text-[8px] text-white/15 font-mono">
              <span>Del — Remover</span><span>Ctrl+Z — Desfazer</span><span>Ctrl+D — Duplicar</span><span>Esc — Desselecionar</span>
            </div>
          </div>
        </div>

        {/* ────────── RIGHT PANEL: PROPERTIES ────────── */}
        <div className="w-52 shrink-0 border-l border-white/10 flex flex-col bg-[#161b27]">

          {selectedZone ? (
            <>
              {/* Zone type badge */}
              <div className="px-3 py-2 border-b border-white/10 flex items-center gap-2 shrink-0">
                {(() => { const Icon = ZONE_ICONS[selectedZone.type]; const c = ZONE_COLORS[selectedZone.type]; return (
                  <div className={`p-1.5 rounded-lg ${c.bg} border ${c.border} shrink-0`}><Icon className="w-3.5 h-3.5 text-white" /></div>
                ); })()}
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-white truncate">{selectedZone.label}</p>
                  <p className="text-[8px] text-white/30 uppercase tracking-wider">{selectedZone.type.replace("_", " ")}</p>
                </div>
              </div>

              {/* Sub-tabs */}
              <div className="flex border-b border-white/10 shrink-0">
                {([
                  { id: "position", icon: Move,    label: "Posição" },
                  { id: "style",    icon: Palette,  label: "Estilo" },
                  { id: "config",   icon: Sliders,  label: "Config" },
                ] as const).map(tab => (
                  <button key={tab.id} onClick={() => setRightTab(tab.id)}
                    className={`flex-1 flex items-center justify-center gap-1 py-2 text-[9px] font-bold uppercase tracking-wider transition-colors
                      ${rightTab === tab.id ? "text-indigo-400 border-b-2 border-indigo-400 bg-indigo-400/5" : "text-white/25 hover:text-white/50"}`}>
                    <tab.icon className="w-3 h-3" />{tab.label}
                  </button>
                ))}
              </div>

              <ScrollArea className="flex-1">
                <div className="p-3 space-y-3">

                  {/* POSITION TAB */}
                  {rightTab === "position" && (
                    <>
                      {/* Name */}
                      <div className="space-y-1">
                        <Label className="text-[9px] text-white/30 uppercase tracking-wider">Nome da Zona</Label>
                        <Input value={selectedZone.label} onChange={e => updateZone(selectedZone.id, { label: e.target.value })}
                          className="h-7 text-xs bg-white/5 border-white/10 text-white" />
                      </div>
                      <Separator className="bg-white/8" />
                      {/* X/Y coords */}
                      <div className="space-y-1">
                        <Label className="text-[9px] text-white/30 uppercase tracking-wider">Posição</Label>
                        <div className="grid grid-cols-2 gap-2">
                          {[{ k: "x", l: "X (%)", min: 0, max: 95 }, { k: "y", l: "Y (%)", min: 0, max: 95 }].map(({ k, l, min, max }) => (
                            <div key={k}>
                              <p className="text-[8px] text-white/25 mb-0.5">{l}</p>
                              <Input type="number" min={min} max={max} value={Math.round((selectedZone as any)[k])}
                                onChange={e => updateZone(selectedZone.id, { [k]: Math.max(min, Math.min(max, +e.target.value)) } as any)}
                                className="h-7 text-xs bg-white/5 border-white/10 text-white" />
                            </div>
                          ))}
                        </div>
                      </div>
                      {/* W/H */}
                      <div className="space-y-1">
                        <Label className="text-[9px] text-white/30 uppercase tracking-wider">Tamanho</Label>
                        <div className="grid grid-cols-2 gap-2">
                          {[{ k: "width", l: "Larg. (%)", min: 5, max: 100 }, { k: "height", l: "Alt. (%)", min: 5, max: 100 }].map(({ k, l, min, max }) => (
                            <div key={k}>
                              <p className="text-[8px] text-white/25 mb-0.5">{l}</p>
                              <Input type="number" min={min} max={max} value={Math.round((selectedZone as any)[k])}
                                onChange={e => updateZone(selectedZone.id, { [k]: Math.max(min, Math.min(max, +e.target.value)) } as any)}
                                className="h-7 text-xs bg-white/5 border-white/10 text-white" />
                            </div>
                          ))}
                        </div>
                      </div>
                      {/* Preset sizes */}
                      <div className="space-y-1">
                        <Label className="text-[9px] text-white/30 uppercase tracking-wider">Tamanhos Predefinidos</Label>
                        <div className="grid grid-cols-2 gap-1">
                          {PRESET_SIZES.map(ps => (
                            <button key={ps.label}
                              onClick={() => updateZone(selectedZone.id, { width: ps.w, height: ps.h })}
                              className="text-[9px] text-white/50 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded px-1.5 py-1 transition-colors text-center">
                              {ps.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <Separator className="bg-white/8" />
                      {/* Actions */}
                      <div className="space-y-1">
                        <button onClick={() => duplicateZone(selectedZone.id)}
                          className="w-full flex items-center gap-1.5 px-2 py-1.5 text-[10px] text-white/50 hover:text-white hover:bg-white/5 rounded transition-colors">
                          <Copy className="w-3 h-3" /> Duplicar zona
                        </button>
                        <button onClick={() => toggleLock(selectedZone.id)}
                          className="w-full flex items-center gap-1.5 px-2 py-1.5 text-[10px] rounded transition-colors hover:bg-white/5"
                        >
                          {lockedIds.has(selectedZone.id)
                            ? <><Unlock className="w-3 h-3 text-amber-400" /><span className="text-amber-400">Desbloquear</span></>
                            : <><Lock className="w-3 h-3 text-white/50" /><span className="text-white/50">Bloquear</span></>}
                        </button>
                        <button onClick={() => removeZone(selectedZone.id)} disabled={lockedIds.has(selectedZone.id)}
                          className="w-full flex items-center gap-1.5 px-2 py-1.5 text-[10px] text-red-400/60 hover:text-red-400 hover:bg-red-500/5 rounded transition-colors disabled:opacity-30">
                          <Trash2 className="w-3 h-3" /> Remover zona
                        </button>
                      </div>
                    </>
                  )}

                  {/* STYLE TAB */}
                  {rightTab === "style" && (
                    <>
                      {/* Opacity */}
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <Label className="text-[9px] text-white/30 uppercase tracking-wider">Opacidade</Label>
                          <span className="text-[9px] text-white/40 font-mono">{selectedZone.opacity ?? 100}%</span>
                        </div>
                        <Slider
                          min={10} max={100} step={5}
                          value={[selectedZone.opacity ?? 100]}
                          onValueChange={([v]) => updateZone(selectedZone.id, { opacity: v })}
                          className="w-full"
                        />
                      </div>
                      {/* Border Radius */}
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <Label className="text-[9px] text-white/30 uppercase tracking-wider">Borda Arredondada</Label>
                          <span className="text-[9px] text-white/40 font-mono">{selectedZone.borderRadius ?? 0}px</span>
                        </div>
                        <Slider
                          min={0} max={40} step={2}
                          value={[selectedZone.borderRadius ?? 0]}
                          onValueChange={([v]) => updateZone(selectedZone.id, { borderRadius: v })}
                          className="w-full"
                        />
                      </div>
                      {/* Background Color */}
                      <div className="space-y-1.5">
                        <Label className="text-[9px] text-white/30 uppercase tracking-wider">Cor do Fundo</Label>
                        <div className="flex gap-2 items-center">
                          <input type="color"
                            value={selectedZone.backgroundColor || "#000000"}
                            onChange={e => updateZone(selectedZone.id, { backgroundColor: e.target.value })}
                            className="w-8 h-7 rounded cursor-pointer border-0 bg-transparent"
                          />
                          <Input value={selectedZone.backgroundColor || ""}
                            onChange={e => updateZone(selectedZone.id, { backgroundColor: e.target.value })}
                            placeholder="Transparente" className="h-7 text-xs bg-white/5 border-white/10 text-white flex-1" />
                          {selectedZone.backgroundColor && (
                            <button onClick={() => updateZone(selectedZone.id, { backgroundColor: undefined })}
                              className="text-white/30 hover:text-white"><X className="w-3 h-3" /></button>
                          )}
                        </div>
                        {/* Quick color presets */}
                        <div className="flex gap-1 flex-wrap mt-1">
                          {["#000000", "#1a1a2e", "#16213e", "#0f3460", "#533483", "#e94560"].map(c => (
                            <button key={c} onClick={() => updateZone(selectedZone.id, { backgroundColor: c })}
                              className="w-5 h-5 rounded border border-white/20 hover:scale-110 transition-transform"
                              style={{ backgroundColor: c }} title={c} />
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {/* CONFIG TAB */}
                  {rightTab === "config" && (
                    <>
                      {/* Weather config */}
                      {selectedZone.type === "weather" && (
                        <>
                          <div className="space-y-1.5">
                            <Label className="text-[9px] text-white/30 uppercase tracking-wider">Cidade</Label>
                            <Input value={selectedZone.config?.city || ""}
                              onChange={e => updateConfig(selectedZone.id, "city", e.target.value)}
                              className="h-7 text-xs bg-white/5 border-white/10 text-white" placeholder="São Paulo" />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-[9px] text-white/30 uppercase tracking-wider">Tamanho da Temperatura</Label>
                            <div className="flex gap-2 items-center">
                              <Slider min={20} max={120} step={2} value={[selectedZone.config?.fontSize || 36]}
                                onValueChange={([v]) => updateConfig(selectedZone.id, "fontSize", v)} className="flex-1" />
                              <span className="text-[9px] text-white/40 font-mono w-8 text-right">{selectedZone.config?.fontSize || 36}px</span>
                            </div>
                          </div>
                        </>
                      )}

                      {/* Clock config */}
                      {selectedZone.type === "clock" && (
                        <div className="space-y-1.5">
                          <Label className="text-[9px] text-white/30 uppercase tracking-wider">Tamanho da Hora</Label>
                          <div className="flex gap-2 items-center">
                            <Slider min={20} max={160} step={2} value={[selectedZone.config?.fontSize || 48]}
                              onValueChange={([v]) => updateConfig(selectedZone.id, "fontSize", v)} className="flex-1" />
                            <span className="text-[9px] text-white/40 font-mono w-8 text-right">{selectedZone.config?.fontSize || 48}px</span>
                          </div>
                        </div>
                      )}

                      {/* Text config */}
                      {selectedZone.type === "text" && (
                        <>
                          <div className="space-y-1.5">
                            <Label className="text-[9px] text-white/30 uppercase tracking-wider">Texto</Label>
                            <textarea value={selectedZone.config?.text || ""} rows={4}
                              onChange={e => updateConfig(selectedZone.id, "text", e.target.value)}
                              className="w-full bg-white/5 border border-white/10 rounded p-2 text-xs text-white placeholder:text-white/20 resize-none focus:outline-none focus:border-indigo-500/50"
                              placeholder="Sua mensagem aqui..." />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-[9px] text-white/30 uppercase tracking-wider">Tamanho da Fonte</Label>
                            <div className="flex gap-2 items-center">
                              <Slider min={12} max={72} step={2} value={[selectedZone.config?.fontSize || 24]}
                                onValueChange={([v]) => updateConfig(selectedZone.id, "fontSize", v)} className="flex-1" />
                              <span className="text-[9px] text-white/40 font-mono w-8 text-right">{selectedZone.config?.fontSize || 24}px</span>
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-[9px] text-white/30 uppercase tracking-wider">Alinhamento</Label>
                            <div className="flex gap-1">
                              {[{ v: "left", Icon: AlignLeft }, { v: "center", Icon: AlignCenter }, { v: "right", Icon: AlignRight }].map(({ v, Icon }) => (
                                <button key={v} onClick={() => updateConfig(selectedZone.id, "align", v)}
                                  className={`flex-1 py-1.5 rounded border transition-colors flex items-center justify-center
                                    ${selectedZone.config?.align === v ? "bg-indigo-500/30 border-indigo-500/50 text-indigo-400" : "border-white/10 text-white/30 hover:text-white hover:bg-white/5"}`}>
                                  <Icon className="w-3 h-3" />
                                </button>
                              ))}
                            </div>
                          </div>
                        </>
                      )}

                      {/* QR config */}
                      {selectedZone.type === "qr" && (
                        <>
                          <div className="space-y-1.5">
                            <Label className="text-[9px] text-white/30 uppercase tracking-wider">URL do QR Code</Label>
                            <Input value={selectedZone.config?.url || ""}
                              onChange={e => updateConfig(selectedZone.id, "url", e.target.value)}
                              className="h-7 text-xs bg-white/5 border-white/10 text-white" placeholder="https://..." />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-[9px] text-white/30 uppercase tracking-wider">Tamanho do QR (px)</Label>
                            <div className="flex gap-2 items-center">
                              <Slider min={40} max={400} step={10} value={[selectedZone.config?.size || 100]}
                                onValueChange={([v]) => updateConfig(selectedZone.id, "size", v)} className="flex-1" />
                              <span className="text-[9px] text-white/40 font-mono w-10 text-right">{selectedZone.config?.size || 100}px</span>
                            </div>
                          </div>
                        </>
                      )}

                      {/* News config */}
                      {selectedZone.type === "news" && (
                        <div className="space-y-1.5">
                          <Label className="text-[9px] text-white/30 uppercase tracking-wider">Categoria de Notícias</Label>
                          <Select value={selectedZone.config?.category || "technology"}
                            onValueChange={v => updateConfig(selectedZone.id, "category", v)}>
                            <SelectTrigger className="h-7 text-xs bg-white/5 border-white/10 text-white"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="technology">🖥️ Tecnologia</SelectItem>
                              <SelectItem value="business">💼 Negócios</SelectItem>
                              <SelectItem value="sports">⚽ Esportes</SelectItem>
                              <SelectItem value="general">📰 Geral</SelectItem>
                              <SelectItem value="health">🏥 Saúde</SelectItem>
                              <SelectItem value="science">🔬 Ciência</SelectItem>
                              <SelectItem value="entertainment">🎬 Entretenimento</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {/* Camera config */}
                      {selectedZone.type === "camera" && (
                        <>
                          <div className="space-y-1.5">
                            <Label className="text-[9px] text-white/30 uppercase tracking-wider">URL do Stream</Label>
                            <Input value={selectedZone.config?.url || ""}
                              onChange={e => updateConfig(selectedZone.id, "url", e.target.value)}
                              className="h-7 text-xs bg-white/5 border-white/10 text-white" placeholder="http://cam/video" />
                          </div>
                          <div className="text-[8px] text-white/25 p-2 bg-white/5 rounded leading-relaxed">
                            ✓ MJPEG/HTTP<br />✓ HLS (.m3u8)<br />⚠ RTSP (proxy necessário)
                          </div>
                        </>
                      )}

                      {/* Content Feed config */}
                      {selectedZone.type === "content_feed" && (
                        <div className="space-y-1.5">
                          <Label className="text-[9px] text-white/30 uppercase tracking-wider">Segmento de Negócio</Label>
                          <Select value={selectedZone.config?.segment || "corporativo"}
                            onValueChange={v => updateConfig(selectedZone.id, "segment", v)}>
                            <SelectTrigger className="h-7 text-xs bg-white/5 border-white/10 text-white"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {Object.entries(SEGMENT_LABELS).map(([k, v]) => (
                                <SelectItem key={k} value={k}>{v}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <div className="text-[8px] text-amber-400/60 p-2 bg-amber-500/5 border border-amber-500/15 rounded leading-relaxed mt-1">
                            ✨ Dicas e tendências deste segmento rotacionarão automaticamente na tela.
                          </div>
                        </div>
                      )}

                      {/* Media config */}
                      {selectedZone.type === "media" && (
                        <div className="space-y-1.5">
                          <Label className="text-[9px] text-white/30 uppercase tracking-wider">Ajuste da Imagem/Vídeo</Label>
                          <div className="flex gap-1">
                            {[{ v: "cover", label: "Preencher" }, { v: "contain", label: "Caber" }].map(({ v, label }) => (
                              <button key={v} onClick={() => updateConfig(selectedZone.id, "fit", v)}
                                className={`flex-1 py-1.5 text-[10px] font-bold rounded border transition-colors
                                  ${(selectedZone.config?.fit || "cover") === v ? "bg-indigo-500/30 border-indigo-500/50 text-indigo-400" : "border-white/10 text-white/30 hover:text-white hover:bg-white/5"}`}>
                                {label}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Social config */}
                      {selectedZone.type === "social" && (
                        <div className="space-y-1.5">
                          <Label className="text-[9px] text-white/30 uppercase tracking-wider">Handle do Instagram</Label>
                          <div className="relative">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/30 text-xs font-bold">@</span>
                            <Input value={selectedZone.config?.handle || ""}
                              onChange={e => updateConfig(selectedZone.id, "handle", e.target.value.replace("@", ""))}
                              className="h-7 text-xs bg-white/5 border-white/10 text-white pl-6" placeholder="suaempresa" />
                          </div>
                        </div>
                      )}

                      {/* Default: no config needed */}
                      {!["weather", "text", "qr", "news", "camera", "content_feed", "social", "clock", "media"].includes(selectedZone.type) && (
                        <div className="text-center py-6 text-white/20">
                          <Square className="w-7 h-7 mx-auto mb-2 opacity-30" />
                          <p className="text-[10px]">Este widget não<br />tem configurações</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </ScrollArea>
            </>
          ) : (
            <>
              <div className="px-3 py-2.5 border-b border-white/10 flex items-center gap-2 shrink-0">
                <Settings className="w-3.5 h-3.5 text-white/25" />
                <span className="text-[10px] font-bold text-white/30 uppercase tracking-wider">Propriedades</span>
              </div>
              <div className="flex-1 flex items-center justify-center p-4">
                <div className="text-center text-white/15">
                  <Layers className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-[10px] leading-relaxed">Clique em uma zona<br />no canvas para editar<br />suas propriedades</p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
