import { useState, useRef, useCallback, useEffect } from "react";
import {
  Monitor, Clock, CloudSun, Newspaper, TrendingUp, Instagram, QrCode, Camera, Type,
  Plus, Trash2, Undo2, Redo2, Save, Sparkles, LayoutGrid, GripHorizontal,
  Lock, Unlock, Eye, EyeOff, Copy, AlignLeft, AlignCenter, AlignRight,
  ChevronUp, ChevronDown, Layers, Settings, Wand2, X, Check, Grid3x3,
  ZoomIn, ZoomOut, RotateCcw, Maximize2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { generateLayoutFromPrompt, ZONE_DEFAULTS, Zone } from "@/utils/AILayoutAssistant";

// ────────────────────────────────────────────────
// Constants  
// ────────────────────────────────────────────────
const ZONE_ICONS: Record<Zone["type"], React.ComponentType<any>> = {
  media: Monitor, clock: Clock, weather: CloudSun, news: Newspaper,
  finance: TrendingUp, social: Instagram, qr: QrCode, camera: Camera, text: Type,
};

const ZONE_COLORS: Record<Zone["type"], { bg: string; border: string; text: string; accent: string }> = {
  media:   { bg: "bg-indigo-600/70",  border: "border-indigo-400",  text: "text-indigo-200",  accent: "#6366f1" },
  clock:   { bg: "bg-violet-600/70",  border: "border-violet-400",  text: "text-violet-200",  accent: "#7c3aed" },
  weather: { bg: "bg-sky-600/70",     border: "border-sky-400",     text: "text-sky-200",     accent: "#0284c7" },
  news:    { bg: "bg-amber-600/70",   border: "border-amber-400",   text: "text-amber-200",   accent: "#d97706" },
  finance: { bg: "bg-emerald-600/70", border: "border-emerald-400", text: "text-emerald-200", accent: "#059669" },
  social:  { bg: "bg-pink-600/70",    border: "border-pink-400",    text: "text-pink-200",    accent: "#db2777" },
  qr:      { bg: "bg-slate-600/70",   border: "border-slate-400",   text: "text-slate-200",   accent: "#64748b" },
  camera:  { bg: "bg-red-600/70",     border: "border-red-400",     text: "text-red-200",     accent: "#dc2626" },
  text:    { bg: "bg-orange-600/70",  border: "border-orange-400",  text: "text-orange-200",  accent: "#ea580c" },
};

const GRID_SIZE = 5; // snap to 5% grid
const MIN_SIZE = 5;

const WIDGET_PALETTE = [
  { type: "media" as Zone["type"],   label: "Vídeo / Foto",       desc: "Reproduz sua playlist" },
  { type: "clock" as Zone["type"],   label: "Relógio & Data",     desc: "Horário em tempo real" },
  { type: "weather" as Zone["type"], label: "Clima",              desc: "Previsão do tempo" },
  { type: "news" as Zone["type"],    label: "Ticker Notícias",    desc: "RSS rolando" },
  { type: "finance" as Zone["type"], label: "Cotações",           desc: "USD, EUR, BTC" },
  { type: "social" as Zone["type"],  label: "Mural Instagram",    desc: "Últimos posts" },
  { type: "qr" as Zone["type"],      label: "QR Code",            desc: "Link dinâmico" },
  { type: "camera" as Zone["type"],  label: "Câmera CCTV",        desc: "Stream ao vivo" },
  { type: "text" as Zone["type"],    label: "Texto Livre",        desc: "Mensagem personalizada" },
];

const AI_QUICK_PRESETS = [
  "Salão de beleza",
  "Academia fitness",
  "Restaurante",
  "Clínica médica",
  "Varejo / Loja",
  "Corporativo",
];

function snapToGrid(v: number): number {
  return Math.round(v / GRID_SIZE) * GRID_SIZE;
}

// Maps each palette widget type to its key in WidgetConfig
const WIDGET_TO_CONFIG_KEY: Partial<Record<Zone["type"], string>> = {
  clock:   "clock",
  weather: "weather",
  news:    "news",
  finance: "finance",
  social:  "social",
  qr:      "qr",
  camera:  "camera",
  // media and text are always available (managed by MediaLibrary)
};

// ────────────────────────────────────────────────
// Props
// ────────────────────────────────────────────────
interface VisualLayoutEditorProps {
  initialZones?: Zone[];
  widgetConfig?: Record<string, { enabled: boolean; [k: string]: any }> | null;
  onSave: (zones: Zone[]) => void;
  onClose?: () => void;
}

// ────────────────────────────────────────────────
// Main Component
// ────────────────────────────────────────────────
export function VisualLayoutEditor({ initialZones = [], widgetConfig, onSave, onClose }: VisualLayoutEditorProps) {
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
  const [activeTab, setActiveTab] = useState<"widgets" | "layers" | "ai">("widgets");
  const [zoom, setZoom] = useState(100);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [history, setHistory] = useState<Zone[][]>([]);
  const [future, setFuture] = useState<Zone[][]>([]);

  const canvasRef = useRef<HTMLDivElement>(null);
  const dragStart = useRef<{ mouseX: number; mouseY: number; zoneX: number; zoneY: number } | null>(null);
  const resizeStart = useRef<{ mouseX: number; mouseY: number; zoneW: number; zoneH: number } | null>(null);

  const selectedZone = zones.find(z => z.id === selectedId);

  // ── Helpers for widget store awareness ──
  const isWidgetEnabled = (type: Zone["type"]): boolean => {
    const key = WIDGET_TO_CONFIG_KEY[type];
    if (!key || !widgetConfig) return true; // media/text always available
    return widgetConfig[key]?.enabled !== false;
  };

  const hasWidgetConfig = widgetConfig && Object.keys(widgetConfig).length > 0;

  const enabledTypes = WIDGET_PALETTE
    .filter(w => isWidgetEnabled(w.type))
    .map(w => w.type);

  // ── Import from App Store ──
  const importFromAppStore = () => {
    if (!hasWidgetConfig) return;
    pushHistory(zones);
    // Build a sensible auto-layout from enabled widgets
    const enabled = WIDGET_PALETTE.filter(w => isWidgetEnabled(w.type)).map(w => w.type);
    const newZones: Zone[] = [];
    let sideY = 0;
    const sideW = 30;
    const sideH = Math.floor(100 / Math.max(enabled.filter(t => t !== "media" && t !== "news").length, 1));

    // Always keep media as main zone
    newZones.push({ id: `zone-media-${Date.now()}`, type: "media", label: "Mídia Principal", x: 0, y: 0, width: 100 - sideW, height: 88 });

    const sideWidgets = enabled.filter(t => t !== "media" && t !== "news" && t !== "text");
    sideWidgets.forEach((type, i) => {
      const h = Math.floor(88 / Math.max(sideWidgets.length, 1));
      newZones.push({
        id: `zone-${type}-${Date.now()}-${i}`,
        type, label: ZONE_DEFAULTS[type].label,
        x: 100 - sideW, y: i * h, width: sideW, height: h,
        config: ZONE_DEFAULTS[type].defaultConfig,
      });
    });

    // Ticker at bottom if news is enabled
    if (enabled.includes("news")) {
      newZones.push({ id: `zone-news-${Date.now()}`, type: "news", label: "Ticker Notícias", x: 0, y: 88, width: 100, height: 12 });
      // Adjust main media height
      newZones[0].height = 88;
    }

    setZones(newZones);
    setSelectedId(null);
    toast.success(`✨ Layout gerado com ${newZones.length} widgets habilitados!`);
  };

  // ── History ──
  const pushHistory = useCallback((prev: Zone[]) => {
    setHistory(h => [...h.slice(-30), prev]);
    setFuture([]);
  }, []);

  const undo = () => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setFuture(f => [zones, ...f]);
    setHistory(h => h.slice(0, -1));
    setZones(prev);
    toast.info("Ação desfeita");
  };

  const redo = () => {
    if (future.length === 0) return;
    const next = future[0];
    setHistory(h => [...h, zones]);
    setFuture(f => f.slice(1));
    setZones(next);
    toast.info("Ação refeita");
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) { e.preventDefault(); undo(); }
      if ((e.ctrlKey || e.metaKey) && (e.key === "y" || (e.key === "z" && e.shiftKey))) { e.preventDefault(); redo(); }
      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedId && !lockedIds.has(selectedId)) { removeZone(selectedId); }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "d") {
        e.preventDefault();
        if (selectedId) duplicateZone(selectedId);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selectedId, zones, history, future, lockedIds]);

  // ── Zone Operations ──
  const addZone = (type: Zone["type"]) => {
    pushHistory(zones);
    const defaults = ZONE_DEFAULTS[type];
    const id = `zone-${Date.now()}`;
    setZones(prev => [...prev, {
      id, type, label: defaults.label,
      x: 10, y: 10, width: 40, height: 35,
      config: defaults.defaultConfig,
    }]);
    setSelectedId(id);
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
    const newZone = { ...zone, id: newId, x: Math.min(95, zone.x + 2), y: Math.min(95, zone.y + 2) };
    setZones(prev => [...prev, newZone]);
    setSelectedId(newId);
    toast.success("Zona duplicada");
  };

  const moveZone = (id: string, dir: "up" | "down") => {
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

  const toggleLock = (id: string) => {
    setLockedIds(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const toggleHidden = (id: string) => {
    setHiddenIds(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  // ── Canvas Sizing ──
  const getCanvasBounds = () => {
    const r = canvasRef.current?.getBoundingClientRect();
    return r ? { width: r.width, height: r.height } : { width: 800, height: 450 };
  };

  // ── Drag ──
  const handleMouseDown = (e: React.MouseEvent, zoneId: string) => {
    e.stopPropagation();
    e.preventDefault();
    if (lockedIds.has(zoneId)) { setSelectedId(zoneId); return; }
    setSelectedId(zoneId);
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
        if (snapGrid) { nx = snapToGrid(nx); ny = snapToGrid(ny); }
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
  const handleResizeMouseDown = (e: React.MouseEvent, zoneId: string, corner: string) => {
    e.stopPropagation();
    e.preventDefault();
    if (lockedIds.has(zoneId)) return;
    const zone = zones.find(z => z.id === zoneId)!;
    resizeStart.current = { mouseX: e.clientX, mouseY: e.clientY, zoneW: zone.width, zoneH: zone.height };
    setIsResizing(true);
    pushHistory(zones);

    const onMove = (ev: MouseEvent) => {
      if (!resizeStart.current) return;
      const { width, height } = getCanvasBounds();
      const dw = ((ev.clientX - resizeStart.current.mouseX) / width) * 100;
      const dh = ((ev.clientY - resizeStart.current.mouseY) / height) * 100;
      setZones(prev => prev.map(z => {
        if (z.id !== zoneId) return z;
        let nw = resizeStart.current!.zoneW + dw;
        let nh = resizeStart.current!.zoneH + dh;
        if (snapGrid) { nw = snapToGrid(nw); nh = snapToGrid(nh); }
        return { ...z, width: Math.max(MIN_SIZE, Math.min(100 - z.x, nw)), height: Math.max(MIN_SIZE, Math.min(100 - z.y, nh)) };
      }));
    };
    const onUp = () => {
      resizeStart.current = null;
      setIsResizing(false);
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

  // ── Save ──
  const handleSave = () => {
    const visibleZones = zones.filter(z => !hiddenIds.has(z.id));
    onSave(visibleZones);
  };

  // ── Render ──
  return (
    <div className="flex flex-col h-full bg-[#0f1117] text-white overflow-hidden select-none">

      {/* ── Top Toolbar ── */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/10 bg-[#161b27] shrink-0">
        <div className="flex items-center gap-2 mr-2">
          <div className="p-1.5 bg-indigo-600/20 rounded-lg border border-indigo-500/30">
            <LayoutGrid className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-white">Editor Visual</h2>
            <p className="text-[9px] text-white/40">{zones.length} zona(s)</p>
          </div>
        </div>

        <div className="flex items-center gap-1 border border-white/10 rounded-lg p-0.5 bg-white/5">
          <Button variant="ghost" size="sm" onClick={undo} disabled={history.length === 0}
            className="h-7 w-7 p-0 text-white/60 hover:text-white hover:bg-white/10">
            <Undo2 className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="sm" onClick={redo} disabled={future.length === 0}
            className="h-7 w-7 p-0 text-white/60 hover:text-white hover:bg-white/10">
            <Redo2 className="w-3.5 h-3.5" />
          </Button>
        </div>

        <div className="flex items-center gap-1 border border-white/10 rounded-lg p-0.5 bg-white/5">
          <Button variant="ghost" size="sm" onClick={() => setShowGrid(g => !g)}
            className={`h-7 w-7 p-0 hover:bg-white/10 ${showGrid ? "text-indigo-400" : "text-white/40"}`}>
            <Grid3x3 className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setSnapGrid(s => !s)}
            className={`h-7 px-2 text-[10px] hover:bg-white/10 ${snapGrid ? "text-indigo-400" : "text-white/40"}`}>
            <Maximize2 className="w-3 h-3 mr-1" />
            {snapGrid ? "Snap ON" : "Snap OFF"}
          </Button>
        </div>

        <div className="flex items-center gap-1.5 ml-1 text-[10px] text-white/40">
          <Button variant="ghost" size="sm" onClick={() => setZoom(z => Math.max(50, z - 10))}
            className="h-7 w-7 p-0 text-white/40 hover:text-white hover:bg-white/10">
            <ZoomOut className="w-3.5 h-3.5" />
          </Button>
          <span className="w-10 text-center font-mono">{zoom}%</span>
          <Button variant="ghost" size="sm" onClick={() => setZoom(z => Math.min(150, z + 10))}
            className="h-7 w-7 p-0 text-white/40 hover:text-white hover:bg-white/10">
            <ZoomIn className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setZoom(100)}
            className="h-7 px-2 text-[10px] text-white/40 hover:text-white hover:bg-white/10">
            <RotateCcw className="w-3 h-3" />
          </Button>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}
              className="h-8 px-3 text-white/60 hover:text-white hover:bg-white/10 gap-1.5">
              <X className="w-3.5 h-3.5" /> Cancelar
            </Button>
          )}
          <Button size="sm"
            className="h-8 px-4 bg-indigo-600 hover:bg-indigo-500 text-white gap-1.5 font-semibold shadow-lg shadow-indigo-500/20"
            onClick={handleSave}>
            <Save className="w-3.5 h-3.5" /> Salvar Layout
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">

        {/* ── Left Panel ── */}
        <div className="w-[200px] shrink-0 border-r border-white/10 flex flex-col bg-[#161b27]">
          {/* Tabs */}
          <div className="flex border-b border-white/10">
            {([
              { id: "widgets", icon: Plus, label: "Widgets" },
              { id: "layers", icon: Layers, label: "Camadas" },
              { id: "ai", icon: Wand2, label: "IA" },
            ] as const).map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-1 py-2.5 text-[10px] font-bold uppercase tracking-wider transition-colors
                  ${activeTab === tab.id ? "text-indigo-400 border-b-2 border-indigo-400 bg-indigo-400/5" : "text-white/40 hover:text-white/70"}`}>
                <tab.icon className="w-3 h-3" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Widgets Tab */}
          {activeTab === "widgets" && (
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-1">

                {/* Import from App Store banner */}
                {hasWidgetConfig && (
                  <div className="mb-2 p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
                    <p className="text-[9px] text-indigo-400 font-bold mb-1">App Store conectado</p>
                    <p className="text-[8px] text-white/40 mb-1.5">{enabledTypes.length} widget(s) habilitado(s)</p>
                    <button
                      onClick={importFromAppStore}
                      className="w-full text-[10px] bg-indigo-600/40 hover:bg-indigo-600/70 border border-indigo-500/30 text-indigo-300 font-semibold py-1 px-2 rounded transition-colors flex items-center justify-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      Importar do App Store
                    </button>
                  </div>
                )}

                <p className="text-[9px] text-white/30 uppercase tracking-widest px-1 pt-1 pb-0.5">Clique para adicionar</p>
                {WIDGET_PALETTE.map(({ type, label, desc }) => {
                  const Icon = ZONE_ICONS[type];
                  const colors = ZONE_COLORS[type];
                  const enabled = isWidgetEnabled(type);
                  return (
                    <button key={type} onClick={() => addZone(type)}
                      className={`w-full flex items-center gap-2.5 px-2 py-2 rounded-lg transition-all group text-left border
                        ${enabled
                          ? "hover:bg-white/5 hover:border-white/10 border-transparent"
                          : "opacity-40 hover:opacity-60 border-transparent hover:border-white/5"
                        }`}>
                      <div className={`p-1.5 rounded-lg ${colors.bg} border ${colors.border} shrink-0 relative`}>
                        <Icon className="w-3.5 h-3.5 text-white" />
                        {/* Status dot */}
                        {hasWidgetConfig && (
                          <div className={`absolute -top-1 -right-1 w-2 h-2 rounded-full border border-[#161b27] ${
                            enabled ? "bg-emerald-400" : "bg-slate-500"
                          }`} />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-white/80 leading-tight">{label}</p>
                        <p className="text-[9px] text-white/30 leading-tight truncate">{desc}</p>
                      </div>
                      {hasWidgetConfig && (
                        <span className={`text-[8px] font-bold shrink-0 ${
                          enabled ? "text-emerald-400" : "text-slate-500"
                        }`}>
                          {enabled ? "ON" : "OFF"}
                        </span>
                      )}
                      {!hasWidgetConfig && (
                        <Plus className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-60 text-white shrink-0" />
                      )}
                    </button>
                  );
                })}

                {hasWidgetConfig && (
                  <p className="text-[8px] text-white/20 px-1 pt-2 text-center leading-relaxed">
                    🟢 ON = habilitado no App Store<br/>Vá em Widgets &amp; App Store para ativar mais
                  </p>
                )}
              </div>
            </ScrollArea>
          )}

          {/* Layers Tab */}
          {activeTab === "layers" && (
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-1">
                <p className="text-[9px] text-white/30 uppercase tracking-widest px-1 pt-1 pb-0.5">{zones.length} zona(s)</p>
                {[...zones].reverse().map((zone, ri) => {
                  const i = zones.length - 1 - ri;
                  const Icon = ZONE_ICONS[zone.type];
                  const colors = ZONE_COLORS[zone.type];
                  const isLocked = lockedIds.has(zone.id);
                  const isHidden = hiddenIds.has(zone.id);
                  return (
                    <div key={zone.id}
                      onClick={() => setSelectedId(zone.id)}
                      className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg cursor-pointer transition-all
                        ${zone.id === selectedId ? "bg-indigo-500/20 border border-indigo-500/30" : "hover:bg-white/5 border border-transparent"}`}>
                      <div className={`p-1 rounded ${colors.bg} border ${colors.border} shrink-0`}>
                        <Icon className="w-2.5 h-2.5 text-white" />
                      </div>
                      <span className={`text-[10px] flex-1 truncate ${isHidden ? "line-through text-white/30" : "text-white/70"}`}>
                        {zone.label}
                      </span>
                      <div className="flex items-center gap-0.5">
                        <button onClick={e => { e.stopPropagation(); toggleHidden(zone.id); }}
                          className="p-0.5 hover:text-white text-white/30 transition-colors">
                          {isHidden ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        </button>
                        <button onClick={e => { e.stopPropagation(); toggleLock(zone.id); }}
                          className="p-0.5 hover:text-white text-white/30 transition-colors">
                          {isLocked ? <Lock className="w-3 h-3 text-amber-400" /> : <Unlock className="w-3 h-3" />}
                        </button>
                        <button onClick={e => { e.stopPropagation(); moveZone(zone.id, "up"); }}
                          className="p-0.5 hover:text-white text-white/30 transition-colors" disabled={i === zones.length - 1}>
                          <ChevronUp className="w-3 h-3" />
                        </button>
                        <button onClick={e => { e.stopPropagation(); moveZone(zone.id, "down"); }}
                          className="p-0.5 hover:text-white text-white/30 transition-colors" disabled={i === 0}>
                          <ChevronDown className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}

          {/* AI Tab */}
          {activeTab === "ai" && (
            <div className="flex-1 p-3 flex flex-col gap-3">
              <div>
                <p className="text-[10px] text-amber-400/80 font-bold uppercase tracking-wider mb-1">🤖 IA Geradora</p>
                <p className="text-[9px] text-white/40 leading-relaxed">Descreva seu negócio e a IA criará o layout ideal.</p>
              </div>
              <textarea
                className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-xs text-white/80 placeholder:text-white/20 resize-none focus:outline-none focus:border-amber-500/50"
                rows={3}
                placeholder="Ex: Salão de beleza com foco em cabelo feminino..."
                value={aiPrompt}
                onChange={e => setAIPrompt(e.target.value)}
              />
              <div className="space-y-1">
                <p className="text-[9px] text-white/30">Sugestões rápidas:</p>
                {AI_QUICK_PRESETS.map(p => (
                  <button key={p} onClick={() => { setAIPrompt(p); }}
                    className="w-full text-left text-[10px] text-white/50 hover:text-amber-400 hover:bg-amber-400/5 px-2 py-1 rounded transition-colors">
                    → {p}
                  </button>
                ))}
              </div>
              <Button
                className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold gap-1.5 text-xs mt-auto"
                onClick={handleAIGenerate}
                disabled={aiLoading || !aiPrompt.trim()}
              >
                {aiLoading ? (
                  <div className="w-3.5 h-3.5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                {aiLoading ? "Gerando..." : "Gerar Layout"}
              </Button>
            </div>
          )}
        </div>

        {/* ── Canvas ── */}
        <div className="flex-1 overflow-auto bg-[#0a0e1a] flex items-center justify-center p-8"
          onClick={() => setSelectedId(null)}>
          <div style={{ transform: `scale(${zoom / 100})`, transformOrigin: "center center", transition: "transform 0.2s" }}>
            <div className="mb-2 flex items-center justify-between text-[10px] text-white/30">
              <span className="font-mono">16:9 — TV Layout Canvas</span>
              <span className="font-mono">{zones.length} zonas · {history.length} histórico</span>
            </div>

            {/* 16:9 Canvas */}
            <div
              ref={canvasRef}
              className="relative bg-[#050810] overflow-hidden shadow-[0_0_80px_rgba(99,102,241,0.15)]"
              style={{ width: "800px", height: "450px", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "4px" }}
              onClick={e => { if (e.target === canvasRef.current) setSelectedId(null); }}
            >
              {/* Grid */}
              {showGrid && (
                <div className="absolute inset-0 pointer-events-none"
                  style={{
                    backgroundImage: `
                      linear-gradient(rgba(99,102,241,0.06) 1px, transparent 1px),
                      linear-gradient(90deg, rgba(99,102,241,0.06) 1px, transparent 1px),
                      linear-gradient(rgba(99,102,241,0.02) 1px, transparent 1px),
                      linear-gradient(90deg, rgba(99,102,241,0.02) 1px, transparent 1px)
                    `,
                    backgroundSize: "80px 45px, 80px 45px, 16px 9px, 16px 9px"
                  }}
                />
              )}

              {/* Screen frame label */}
              <div className="absolute top-0 left-0 right-0 flex justify-center z-30 pointer-events-none">
                <div className="bg-white/5 border-b border-white/5 px-3 py-0.5">
                  <span className="text-[8px] font-mono text-white/20 uppercase tracking-widest">HDMI OUTPUT · 1920×1080</span>
                </div>
              </div>

              {/* Zones */}
              {zones.map((zone) => {
                const Icon = ZONE_ICONS[zone.type];
                const colors = ZONE_COLORS[zone.type];
                const isSelected = zone.id === selectedId;
                const isLocked = lockedIds.has(zone.id);
                const isHidden = hiddenIds.has(zone.id);
                if (isHidden) return null;

                return (
                  <div
                    key={zone.id}
                    className={`absolute border transition-all duration-75
                      ${colors.bg} ${colors.border}
                      ${isSelected ? "z-20 shadow-[0_0_0_2px_white,0_0_30px_rgba(255,255,255,0.1)]" : "z-10"}
                      ${isLocked ? "cursor-not-allowed" : "cursor-grab active:cursor-grabbing"}
                      ${isHidden ? "opacity-20" : ""}
                    `}
                    style={{
                      left: `${zone.x}%`, top: `${zone.y}%`,
                      width: `${zone.width}%`, height: `${zone.height}%`,
                    }}
                    onMouseDown={e => handleMouseDown(e, zone.id)}
                  >
                    {/* Zone Content */}
                    <div className="w-full h-full flex flex-col items-center justify-center p-2 overflow-hidden">
                      <Icon className="w-5 h-5 text-white/70 mb-1 shrink-0 drop-shadow-md" />
                      {zone.height > 12 && (
                        <span className="text-white text-[9px] font-bold text-center leading-tight px-1 drop-shadow-md" style={{ maxWidth: "100%" }}>
                          {zone.label}
                        </span>
                      )}
                      {zone.width > 20 && zone.height > 18 && (
                        <span className="text-white/30 text-[7px] font-mono mt-0.5">
                          {Math.round(zone.width)}×{Math.round(zone.height)}%
                        </span>
                      )}
                    </div>

                    {/* Lock indicator */}
                    {isLocked && (
                      <div className="absolute top-1 left-1 p-0.5 bg-amber-500/20 rounded border border-amber-500/30">
                        <Lock className="w-2.5 h-2.5 text-amber-400" />
                      </div>
                    )}

                    {/* Resize handles (8 corners + sides) */}
                    {isSelected && !isLocked && (
                      <>
                        {/* Corner: SE */}
                        <div
                          className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize flex items-end justify-end bg-white/20 hover:bg-white/40 transition-colors"
                          onMouseDown={e => handleResizeMouseDown(e, zone.id, "se")}
                        >
                          <div className="w-2 h-2 border-r-2 border-b-2 border-white m-0.5" />
                        </div>
                        {/* Corner: SW */}
                        <div className="absolute bottom-0 left-0 w-3 h-3 cursor-sw-resize bg-white/10 hover:bg-white/30"
                          onMouseDown={e => handleResizeMouseDown(e, zone.id, "sw")} />
                        {/* Corner: NE */}
                        <div className="absolute top-0 right-0 w-3 h-3 cursor-ne-resize bg-white/10 hover:bg-white/30"
                          onMouseDown={e => handleResizeMouseDown(e, zone.id, "ne")} />
                      </>
                    )}

                    {/* Selected: top toolbar */}
                    {isSelected && (
                      <div className="absolute -top-7 left-0 flex items-center gap-0.5 bg-[#161b27] border border-white/20 rounded px-1 py-0.5 shadow-xl z-30">
                        <span className="text-[9px] text-white/60 font-mono px-1">{zone.label}</span>
                        <div className="w-px h-3 bg-white/10" />
                        <button onClick={e => { e.stopPropagation(); duplicateZone(zone.id); }}
                          className="p-0.5 hover:text-white text-white/40 transition-colors" title="Duplicar (Ctrl+D)">
                          <Copy className="w-3 h-3" />
                        </button>
                        <button onClick={e => { e.stopPropagation(); toggleLock(zone.id); }}
                          className="p-0.5 hover:text-white text-white/40 transition-colors">
                          {isLocked ? <Lock className="w-3 h-3 text-amber-400" /> : <Unlock className="w-3 h-3" />}
                        </button>
                        <button onClick={e => { e.stopPropagation(); removeZone(zone.id); }}
                          className="p-0.5 hover:text-red-400 text-white/40 transition-colors" title="Delete">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Empty state */}
              {zones.filter(z => !hiddenIds.has(z.id)).length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center text-white/10">
                    <LayoutGrid className="w-12 h-12 mx-auto mb-3" />
                    <p className="text-sm font-bold">Canvas Vazio</p>
                    <p className="text-xs mt-1">Adicione widgets no painel esquerdo</p>
                  </div>
                </div>
              )}
            </div>

            {/* Keyboard shortcuts hint */}
            <div className="mt-2 flex gap-4 text-[9px] text-white/20 font-mono">
              <span>Del — Remover</span>
              <span>Ctrl+Z — Desfazer</span>
              <span>Ctrl+D — Duplicar</span>
              <span>Ctrl+Y — Refazer</span>
            </div>
          </div>
        </div>

        {/* ── Right Panel: Properties ── */}
        <div className="w-[200px] shrink-0 border-l border-white/10 flex flex-col bg-[#161b27]">
          <div className="px-3 py-2.5 border-b border-white/10 flex items-center gap-2">
            <Settings className="w-3.5 h-3.5 text-white/40" />
            <span className="text-[10px] font-bold text-white/60 uppercase tracking-wider">Propriedades</span>
          </div>

          {selectedZone ? (
            <ScrollArea className="flex-1">
              <div className="p-3 space-y-4">
                {/* Name */}
                <div className="space-y-1">
                  <Label className="text-[10px] text-white/40 uppercase tracking-wider">Nome</Label>
                  <Input
                    value={selectedZone.label}
                    onChange={e => updateZone(selectedZone.id, { label: e.target.value })}
                    className="h-7 text-xs bg-white/5 border-white/10 text-white placeholder:text-white/20"
                  />
                </div>

                <Separator className="bg-white/10" />

                {/* Position */}
                <div className="space-y-2">
                  <Label className="text-[10px] text-white/40 uppercase tracking-wider">Posição</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { key: "x", label: "X (%)", min: 0, max: 95 },
                      { key: "y", label: "Y (%)", min: 0, max: 95 },
                    ].map(({ key, label, min, max }) => (
                      <div key={key}>
                        <p className="text-[9px] text-white/30 mb-0.5">{label}</p>
                        <Input
                          type="number" min={min} max={max}
                          value={Math.round((selectedZone as any)[key])}
                          onChange={e => updateZone(selectedZone.id, { [key]: Math.max(min, Math.min(max, +e.target.value)) } as any)}
                          className="h-7 text-xs bg-white/5 border-white/10 text-white"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Size */}
                <div className="space-y-2">
                  <Label className="text-[10px] text-white/40 uppercase tracking-wider">Tamanho</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { key: "width", label: "Larg. (%)", min: 5, max: 100 },
                      { key: "height", label: "Alt. (%)", min: 5, max: 100 },
                    ].map(({ key, label, min, max }) => (
                      <div key={key}>
                        <p className="text-[9px] text-white/30 mb-0.5">{label}</p>
                        <Input
                          type="number" min={min} max={max}
                          value={Math.round((selectedZone as any)[key])}
                          onChange={e => updateZone(selectedZone.id, { [key]: Math.max(min, Math.min(max, +e.target.value)) } as any)}
                          className="h-7 text-xs bg-white/5 border-white/10 text-white"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Type-specific config */}
                {(selectedZone.type === "weather" || selectedZone.type === "text" || selectedZone.type === "qr" || selectedZone.type === "news") && (
                  <>
                    <Separator className="bg-white/10" />
                    <div className="space-y-2">
                      <Label className="text-[10px] text-white/40 uppercase tracking-wider">Configuração</Label>
                      {selectedZone.type === "weather" && (
                        <div>
                          <p className="text-[9px] text-white/30 mb-0.5">Cidade</p>
                          <Input value={selectedZone.config?.city || ""}
                            onChange={e => updateZone(selectedZone.id, { config: { ...selectedZone.config, city: e.target.value } })}
                            className="h-7 text-xs bg-white/5 border-white/10 text-white" placeholder="São Paulo" />
                        </div>
                      )}
                      {selectedZone.type === "text" && (
                        <div>
                          <p className="text-[9px] text-white/30 mb-0.5">Texto</p>
                          <textarea
                            value={selectedZone.config?.text || ""}
                            onChange={e => updateZone(selectedZone.id, { config: { ...selectedZone.config, text: e.target.value } })}
                            className="w-full bg-white/5 border border-white/10 rounded p-2 text-xs text-white placeholder:text-white/20 resize-none focus:outline-none focus:border-indigo-500/50"
                            rows={3} placeholder="Sua mensagem aqui..."
                          />
                        </div>
                      )}
                      {selectedZone.type === "qr" && (
                        <div>
                          <p className="text-[9px] text-white/30 mb-0.5">URL</p>
                          <Input value={selectedZone.config?.url || ""}
                            onChange={e => updateZone(selectedZone.id, { config: { ...selectedZone.config, url: e.target.value } })}
                            className="h-7 text-xs bg-white/5 border-white/10 text-white" placeholder="https://..." />
                        </div>
                      )}
                    </div>
                  </>
                )}

                <Separator className="bg-white/10" />

                {/* Actions */}
                <div className="space-y-1.5">
                  <Button size="sm" variant="ghost"
                    className="w-full h-7 text-xs justify-start text-white/50 hover:text-white hover:bg-white/5 gap-1.5"
                    onClick={() => duplicateZone(selectedZone.id)}>
                    <Copy className="w-3.5 h-3.5" /> Duplicar
                  </Button>
                  <Button size="sm" variant="ghost"
                    className="w-full h-7 text-xs justify-start hover:bg-white/5 gap-1.5"
                    onClick={() => toggleLock(selectedZone.id)}>
                    {lockedIds.has(selectedZone.id)
                      ? <><Unlock className="w-3.5 h-3.5 text-amber-400" /> <span className="text-amber-400">Desbloquear</span></>
                      : <><Lock className="w-3.5 h-3.5 text-white/50" /> <span className="text-white/50">Bloquear</span></>}
                  </Button>
                  <Button size="sm" variant="ghost"
                    className="w-full h-7 text-xs justify-start text-red-400/70 hover:text-red-400 hover:bg-red-500/5 gap-1.5"
                    onClick={() => removeZone(selectedZone.id)}
                    disabled={lockedIds.has(selectedZone.id)}>
                    <Trash2 className="w-3.5 h-3.5" /> Remover Zona
                  </Button>
                </div>
              </div>
            </ScrollArea>
          ) : (
            <div className="flex-1 flex items-center justify-center p-4">
              <div className="text-center text-white/20">
                <Layers className="w-7 h-7 mx-auto mb-2 opacity-40" />
                <p className="text-[10px]">Selecione uma zona<br />para editar</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
