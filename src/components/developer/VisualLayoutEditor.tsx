import { useState, useRef, useCallback } from "react";
import {
  Monitor, Clock, CloudSun, Newspaper, TrendingUp, Instagram, QrCode, Camera, Type,
  Plus, Trash2, Undo2, Save, Sparkles, LayoutGrid, Play, GripVertical, Move, ZoomIn, ZoomOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { generateLayoutFromPrompt, ZONE_DEFAULTS, Zone } from "@/utils/AILayoutAssistant";

const ZONE_ICONS: Record<Zone["type"], React.ComponentType<any>> = {
  media: Monitor,
  clock: Clock,
  weather: CloudSun,
  news: Newspaper,
  finance: TrendingUp,
  social: Instagram,
  qr: QrCode,
  camera: Camera,
  text: Type,
};

const ZONE_COLORS: Record<Zone["type"], string> = {
  media: "bg-indigo-600/80 border-indigo-400",
  clock: "bg-violet-600/80 border-violet-400",
  weather: "bg-sky-600/80 border-sky-400",
  news: "bg-amber-600/80 border-amber-400",
  finance: "bg-emerald-600/80 border-emerald-400",
  social: "bg-pink-600/80 border-pink-400",
  qr: "bg-slate-600/80 border-slate-400",
  camera: "bg-red-600/80 border-red-400",
  text: "bg-orange-600/80 border-orange-400",
};

interface VisualLayoutEditorProps {
  initialZones?: Zone[];
  onSave: (zones: Zone[]) => void;
  onClose?: () => void;
}

const WIDGET_PALETTE: Array<{ type: Zone["type"]; label: string }> = [
  { type: "media", label: "Mídia (Vídeo/Foto)" },
  { type: "clock", label: "Relógio & Data" },
  { type: "weather", label: "Previsão do Tempo" },
  { type: "news", label: "Ticker de Notícias" },
  { type: "finance", label: "Widget Financeiro" },
  { type: "social", label: "Rede Social" },
  { type: "qr", label: "QR Code" },
  { type: "camera", label: "Câmera CCTV" },
  { type: "text", label: "Texto Livre" },
];

const CANVAS_ASPECT = 16 / 9;
const MIN_SIZE = 5; // min 5% of canvas

export function VisualLayoutEditor({ initialZones = [], onSave, onClose }: VisualLayoutEditorProps) {
  const [zones, setZones] = useState<Zone[]>(initialZones.length > 0 ? initialZones : [
    { id: "zone-main", type: "media", label: "Mídia Principal", x: 0, y: 0, width: 70, height: 88 },
    { id: "zone-sidebar", type: "clock", label: "Relógio", x: 70, y: 0, width: 30, height: 25 },
    { id: "zone-ticker", type: "news", label: "Ticker Notícias", x: 0, y: 88, width: 70, height: 12 },
  ]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [aiPrompt, setAIPrompt] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState<string | null>(null);

  const canvasRef = useRef<HTMLDivElement>(null);
  const dragStart = useRef<{ mouseX: number; mouseY: number; zoneX: number; zoneY: number } | null>(null);
  const resizeStart = useRef<{ mouseX: number; mouseY: number; zoneW: number; zoneH: number } | null>(null);
  const history = useRef<Zone[][]>([]);

  const pushHistory = useCallback(() => {
    history.current = [...history.current.slice(-20), [...zones]];
  }, [zones]);

  const undo = () => {
    if (history.current.length === 0) return;
    const prev = history.current.pop()!;
    setZones(prev);
    toast.info("Ação desfeita");
  };

  const addZone = (type: Zone["type"]) => {
    pushHistory();
    const defaults = ZONE_DEFAULTS[type];
    const newZone: Zone = {
      id: `zone-${Date.now()}`,
      type,
      label: defaults.label,
      x: 10,
      y: 10,
      width: 40,
      height: 30,
      config: defaults.defaultConfig,
    };
    setZones((prev) => [...prev, newZone]);
    setSelectedId(newZone.id);
    toast.success(`"${defaults.label}" adicionado!`);
  };

  const removeZone = (id: string) => {
    pushHistory();
    setZones((prev) => prev.filter((z) => z.id !== id));
    setSelectedId(null);
  };

  const getCanvasBounds = () => {
    const rect = canvasRef.current?.getBoundingClientRect();
    return rect ? { width: rect.width, height: rect.height } : { width: 800, height: 450 };
  };

  const handleMouseDown = (e: React.MouseEvent, zoneId: string) => {
    e.stopPropagation();
    e.preventDefault();
    if (isResizing) return;

    setSelectedId(zoneId);
    const zone = zones.find((z) => z.id === zoneId)!;
    dragStart.current = { mouseX: e.clientX, mouseY: e.clientY, zoneX: zone.x, zoneY: zone.y };
    setIsDragging(true);
    pushHistory();

    const handleMouseMove = (ev: MouseEvent) => {
      if (!dragStart.current) return;
      const { width, height } = getCanvasBounds();
      const dx = ((ev.clientX - dragStart.current.mouseX) / width) * 100;
      const dy = ((ev.clientY - dragStart.current.mouseY) / height) * 100;

      setZones((prev) => prev.map((z) => {
        if (z.id !== zoneId) return z;
        return {
          ...z,
          x: Math.max(0, Math.min(100 - z.width, dragStart.current!.zoneX + dx)),
          y: Math.max(0, Math.min(100 - z.height, dragStart.current!.zoneY + dy)),
        };
      }));
    };

    const handleMouseUp = () => {
      dragStart.current = null;
      setIsDragging(false);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleResizeMouseDown = (e: React.MouseEvent, zoneId: string) => {
    e.stopPropagation();
    e.preventDefault();
    const zone = zones.find((z) => z.id === zoneId)!;
    resizeStart.current = { mouseX: e.clientX, mouseY: e.clientY, zoneW: zone.width, zoneH: zone.height };
    setIsResizing(zoneId);
    pushHistory();

    const handleMouseMove = (ev: MouseEvent) => {
      if (!resizeStart.current) return;
      const { width, height } = getCanvasBounds();
      const dw = ((ev.clientX - resizeStart.current.mouseX) / width) * 100;
      const dh = ((ev.clientY - resizeStart.current.mouseY) / height) * 100;

      setZones((prev) => prev.map((z) => {
        if (z.id !== zoneId) return z;
        return {
          ...z,
          width: Math.max(MIN_SIZE, Math.min(100 - z.x, resizeStart.current!.zoneW + dw)),
          height: Math.max(MIN_SIZE, Math.min(100 - z.y, resizeStart.current!.zoneH + dh)),
        };
      }));
    };

    const handleMouseUp = () => {
      resizeStart.current = null;
      setIsResizing(null);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleAIGenerate = () => {
    if (!aiPrompt.trim()) {
      toast.error("Digite uma descrição do layout.");
      return;
    }
    pushHistory();
    const result = generateLayoutFromPrompt(aiPrompt);
    setZones(result.zones);
    setSelectedId(null);
    toast.success(`🤖 Layout "${result.label}" gerado pela IA!`);
  };

  const selectedZone = zones.find((z) => z.id === selectedId);

  const updateSelectedZone = (updates: Partial<Zone>) => {
    setZones((prev) => prev.map((z) => z.id === selectedId ? { ...z, ...updates } : z));
  };

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card/50 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/10 rounded-lg">
            <LayoutGrid className="w-5 h-5 text-indigo-500" />
          </div>
          <div>
            <h2 className="font-bold text-sm">Editor Visual de Layout</h2>
            <p className="text-xs text-muted-foreground">{zones.length} zona(s) · Arraste, redimensione e personalize</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={undo} className="gap-1.5">
            <Undo2 className="w-4 h-4" /> Desfazer
          </Button>
          {onClose && (
            <Button variant="outline" size="sm" onClick={onClose}>Cancelar</Button>
          )}
          <Button
            size="sm"
            className="bg-indigo-600 hover:bg-indigo-700 gap-1.5"
            onClick={() => { onSave(zones); toast.success("Layout salvo!"); }}
          >
            <Save className="w-4 h-4" /> Salvar Layout
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel: Palette + AI */}
        <div className="w-56 shrink-0 border-r border-border flex flex-col bg-card/30">
          {/* AI Prompt */}
          <div className="p-3 border-b border-border space-y-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> IA Geradora
            </Label>
            <Input
              placeholder="Ex: Academia com clima..."
              value={aiPrompt}
              onChange={(e) => setAIPrompt(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAIGenerate()}
              className="text-xs h-8"
            />
            <Button size="sm" className="w-full bg-amber-500 hover:bg-amber-600 gap-1.5 h-8 text-xs" onClick={handleAIGenerate}>
              <Sparkles className="w-3.5 h-3.5" /> Gerar Layout
            </Button>
          </div>

          {/* Widget Palette */}
          <div className="p-3 border-b border-border">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-2 block">Widgets</Label>
          </div>
          <ScrollArea className="flex-1 p-2">
            <div className="space-y-1">
              {WIDGET_PALETTE.map(({ type, label }) => {
                const Icon = ZONE_ICONS[type];
                return (
                  <button
                    key={type}
                    onClick={() => addZone(type)}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-muted/80 transition-colors text-left group"
                  >
                    <div className={`p-1 rounded ${ZONE_COLORS[type].split(" ")[0]} text-white shrink-0`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-medium">{label}</span>
                    <Plus className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 text-muted-foreground" />
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </div>

        {/* Main Canvas Area */}
        <div className="flex-1 bg-slate-900/50 overflow-hidden flex flex-col items-center justify-center p-6 relative">
          <div className="text-xs text-muted-foreground mb-3 flex items-center gap-2">
            <Move className="w-3.5 h-3.5" /> Arraste para mover · <GripVertical className="w-3.5 h-3.5" /> Canto inferior direito para redimensionar
          </div>

          {/* 16:9 Canvas */}
          <div
            ref={canvasRef}
            className="relative bg-black rounded-xl overflow-hidden border-2 border-slate-700 shadow-2xl"
            style={{
              width: "100%",
              maxWidth: "800px",
              aspectRatio: "16/9",
              cursor: isDragging ? "grabbing" : "default",
            }}
            onClick={() => setSelectedId(null)}
          >
            {/* Grid guide lines */}
            <div className="absolute inset-0 pointer-events-none opacity-10"
              style={{
                backgroundImage: "linear-gradient(rgba(99,102,241,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.5) 1px, transparent 1px)",
                backgroundSize: "10% 11.11%"
              }}
            />

            {zones.map((zone) => {
              const Icon = ZONE_ICONS[zone.type];
              const isSelected = zone.id === selectedId;
              return (
                <div
                  key={zone.id}
                  className={`absolute border ${ZONE_COLORS[zone.type]} transition-shadow ${isSelected ? "ring-2 ring-white shadow-[0_0_20px_rgba(255,255,255,0.2)] z-20" : "z-10 opacity-90"}`}
                  style={{
                    left: `${zone.x}%`,
                    top: `${zone.y}%`,
                    width: `${zone.width}%`,
                    height: `${zone.height}%`,
                    cursor: "grab",
                  }}
                  onMouseDown={(e) => handleMouseDown(e, zone.id)}
                >
                  {/* Zone content */}
                  <div className="w-full h-full flex flex-col items-center justify-center p-1 select-none">
                    <Icon className="w-5 h-5 text-white/80 mb-0.5 shrink-0" />
                    <span className="text-white text-[9px] font-bold text-center leading-tight px-1 truncate w-full text-center">
                      {zone.label}
                    </span>
                    {zone.width > 15 && zone.height > 12 && (
                      <span className="text-white/40 text-[7px] mt-0.5">
                        {Math.round(zone.width)}% × {Math.round(zone.height)}%
                      </span>
                    )}
                  </div>

                  {/* Resize handle */}
                  <div
                    className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize flex items-center justify-center bg-white/20 hover:bg-white/40 transition-colors rounded-tl"
                    onMouseDown={(e) => handleResizeMouseDown(e, zone.id)}
                  >
                    <GripVertical className="w-2.5 h-2.5 text-white rotate-45" />
                  </div>

                  {/* Delete on select */}
                  {isSelected && (
                    <button
                      className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center z-30 shadow-lg"
                      onMouseDown={(e) => { e.stopPropagation(); removeZone(zone.id); }}
                    >
                      <Trash2 className="w-2.5 h-2.5 text-white" />
                    </button>
                  )}
                </div>
              );
            })}

            {zones.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center text-white/20">
                <div className="text-center">
                  <LayoutGrid className="w-10 h-10 mx-auto mb-2" />
                  <p className="text-sm">Canvas vazio — adicione widgets à esquerda</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: Zone Properties */}
        <div className="w-52 shrink-0 border-l border-border flex flex-col bg-card/30">
          <div className="p-3 border-b border-border">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Propriedades</Label>
          </div>

          {selectedZone ? (
            <ScrollArea className="flex-1 p-3">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Nome da Zona</Label>
                  <Input
                    value={selectedZone.label}
                    onChange={(e) => updateSelectedZone({ label: e.target.value })}
                    className="h-7 text-xs"
                  />
                </div>

                <Separator />

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Posição</Label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <div>
                      <Label className="text-[10px] text-muted-foreground">X (%)</Label>
                      <Input
                        type="number" min={0} max={95}
                        value={Math.round(selectedZone.x)}
                        onChange={(e) => updateSelectedZone({ x: Math.max(0, Math.min(95, +e.target.value)) })}
                        className="h-7 text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-[10px] text-muted-foreground">Y (%)</Label>
                      <Input
                        type="number" min={0} max={95}
                        value={Math.round(selectedZone.y)}
                        onChange={(e) => updateSelectedZone({ y: Math.max(0, Math.min(95, +e.target.value)) })}
                        className="h-7 text-xs"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Tamanho</Label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <div>
                      <Label className="text-[10px] text-muted-foreground">Larg. (%)</Label>
                      <Input
                        type="number" min={5} max={100}
                        value={Math.round(selectedZone.width)}
                        onChange={(e) => updateSelectedZone({ width: Math.max(5, Math.min(100, +e.target.value)) })}
                        className="h-7 text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-[10px] text-muted-foreground">Alt. (%)</Label>
                      <Input
                        type="number" min={5} max={100}
                        value={Math.round(selectedZone.height)}
                        onChange={(e) => updateSelectedZone({ height: Math.max(5, Math.min(100, +e.target.value)) })}
                        className="h-7 text-xs"
                      />
                    </div>
                  </div>
                </div>

                {(selectedZone.type === "weather" || selectedZone.type === "text" || selectedZone.type === "qr") && (
                  <>
                    <Separator />
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Configurações</Label>
                      {selectedZone.type === "weather" && (
                        <div>
                          <Label className="text-[10px] text-muted-foreground">Cidade</Label>
                          <Input
                            value={selectedZone.config?.city || "São Paulo"}
                            onChange={(e) => updateSelectedZone({ config: { ...selectedZone.config, city: e.target.value } })}
                            className="h-7 text-xs"
                          />
                        </div>
                      )}
                      {selectedZone.type === "text" && (
                        <div>
                          <Label className="text-[10px] text-muted-foreground">Texto</Label>
                          <Input
                            value={selectedZone.config?.text || ""}
                            onChange={(e) => updateSelectedZone({ config: { ...selectedZone.config, text: e.target.value } })}
                            className="h-7 text-xs"
                          />
                        </div>
                      )}
                      {selectedZone.type === "qr" && (
                        <div>
                          <Label className="text-[10px] text-muted-foreground">URL do QR</Label>
                          <Input
                            value={selectedZone.config?.url || ""}
                            onChange={(e) => updateSelectedZone({ config: { ...selectedZone.config, url: e.target.value } })}
                            className="h-7 text-xs"
                            placeholder="https://..."
                          />
                        </div>
                      )}
                    </div>
                  </>
                )}

                <Separator />
                <Button
                  size="sm"
                  variant="destructive"
                  className="w-full gap-1.5 h-7 text-xs"
                  onClick={() => removeZone(selectedZone.id)}
                >
                  <Trash2 className="w-3.5 h-3.5" /> Remover Zona
                </Button>
              </div>
            </ScrollArea>
          ) : (
            <div className="flex-1 flex items-center justify-center p-4">
              <div className="text-center text-muted-foreground">
                <LayoutGrid className="w-6 h-6 mx-auto mb-2 opacity-30" />
                <p className="text-xs">Clique em uma zona para editar suas propriedades</p>
              </div>
            </div>
          )}

          {/* Zone List */}
          <div className="border-t border-border p-3">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-2 block">Camadas ({zones.length})</Label>
            <div className="space-y-1">
              {zones.map((zone) => {
                const Icon = ZONE_ICONS[zone.type];
                return (
                  <button
                    key={zone.id}
                    onClick={() => setSelectedId(zone.id)}
                    className={`w-full flex items-center gap-1.5 px-2 py-1 rounded text-left transition-colors ${zone.id === selectedId ? "bg-indigo-500/20 text-indigo-400" : "hover:bg-muted/50"}`}
                  >
                    <Icon className="w-3 h-3 shrink-0" />
                    <span className="text-[10px] truncate">{zone.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
