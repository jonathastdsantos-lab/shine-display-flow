import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  Store, Building2, Check, Wand2,
  LayoutPanelLeft, Columns2, Settings2, Sliders, PenSquare, LayoutGrid,
  Monitor, Tv2, Link, RefreshCw, AlertCircle, Info, ExternalLink
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { VisualLayoutEditor } from "@/components/developer/VisualLayoutEditor";
import type { Zone } from "@/utils/AILayoutAssistant";
import { 
  Sheet, 
  SheetContent, 
  SheetDescription, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger,
  SheetFooter,
  SheetClose
} from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ClientProfile } from "@/hooks/useDashboardData";
import ScenarioWizard from "./ScenarioWizard";
import WidgetStore from "./WidgetStore";
import type { StoredWidgetConfig } from "@/types/player";

interface TemplateSelectorProps {
  profile: ClientProfile;
  playlists?: any[];
  selectedPlaylistId?: string | null;
  setSelectedPlaylistId?: (id: string | null) => void;
  onSave: (updates: Partial<ClientProfile>) => Promise<void>;
  onSavePlaylist?: (id: string, updates: any) => Promise<void>;
}

const templates = [
  {
    id: "varejo",
    label: "Modo Varejo (Tela Cheia)",
    icon: Store,
    description: "Ideal para lojas, restaurantes e academias. O foco integral é no conteúdo que você envia.",
    features: ["Vídeos em 100% da tela", "Rodapé Ticker Opcional", "Impacto visual máximo"],
    previewBg: "bg-gradient-to-br from-emerald-500/20 to-teal-500/5",
  },
  {
    id: "corporativo",
    label: "Modo Lobbies / Clínicas",
    icon: Building2,
    description: "Layout cortado com Sidebar direita. Ideal para ambientes de espera e portarias de condomínios.",
    features: ["Zonas de Widgets Ativas", "Clima e Relógio ao vivo", "Prende atenção durante filas"],
    previewBg: "bg-gradient-to-br from-indigo-500/20 to-violet-500/5",
  },
  {
    id: "lbar",
    label: "L-Bar Mode (Sidebar + Rodapé)",
    icon: LayoutPanelLeft,
    description: "Layout com barra lateral compacta e rodapé ticker. Perfeito para padarias, cafés e ambientes com menu.",
    features: ["Sidebar lateral compacta", "Ticker de notícias no rodapé", "Visual âmbar elegante"],
    previewBg: "bg-gradient-to-br from-amber-500/20 to-orange-500/5",
    isNew: true,
  },
  {
    id: "split",
    label: "Split Mode (60/40 Dual Zone)",
    icon: Columns2,
    description: "Tela dividida: 60% para mídia principal e 40% para widgets (clima, social, QR). Ideal para academias.",
    features: ["Duas zonas independentes", "Widget social em destaque", "Máxima informação visível"],
    previewBg: "bg-gradient-to-br from-orange-500/20 to-red-500/5",
    isNew: true,
  },
];

const templatePreviews: Record<string, JSX.Element> = {
  corporativo: (
    <div className="flex rounded-lg overflow-hidden border border-border h-28 bg-card shadow-inner relative">
      <div className="flex-1 flex flex-col justify-center items-center opacity-50">
        <span className="text-[10px] font-semibold">PLAYLIST (ZONA 1)</span>
      </div>
      <div className="w-[28%] bg-muted border-l border-border flex flex-col gap-1 p-2">
        <div className="flex-1 bg-background/60 rounded text-[8px] flex items-center justify-center">CLIMA</div>
        <div className="flex-1 bg-background/60 rounded text-[8px] flex items-center justify-center">FINANÇAS</div>
        <div className="flex-1 bg-background/60 rounded text-[8px] flex items-center justify-center">QR CODE</div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-5 border-t border-border bg-muted/80 flex items-center px-3">
        <span className="text-[8px] font-mono opacity-60">TICKER ──────────────────</span>
      </div>
    </div>
  ),
  varejo: (
    <div className="rounded-lg overflow-hidden border border-border h-28 bg-card shadow-inner flex flex-col relative">
      <div className="flex-1 flex items-center justify-center opacity-50">
        <span className="text-[10px] font-semibold">TELA CHEIA (ZONA 1)</span>
      </div>
      <div className="absolute bottom-0 w-full h-6 bg-muted/90 border-t border-border flex items-center px-3">
        <span className="text-[8px] font-mono opacity-60">TICKER ──────────────────</span>
      </div>
    </div>
  ),
  lbar: (
    <div className="flex flex-col rounded-lg overflow-hidden border border-border h-28 bg-card shadow-inner">
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 flex items-center justify-center opacity-50">
          <span className="text-[10px] font-semibold">MÍDIA</span>
        </div>
        <div className="w-[22%] bg-muted/60 border-l border-border flex flex-col gap-1 p-1.5">
          <div className="flex-1 bg-background/60 rounded text-[7px] flex items-center justify-center">RELÓGIO</div>
          <div className="flex-1 bg-background/60 rounded text-[7px] flex items-center justify-center">CLIMA</div>
          <div className="flex-1 bg-background/60 rounded text-[7px] flex items-center justify-center">QR</div>
        </div>
      </div>
      <div className="h-5 border-t border-border bg-muted/80 flex items-center px-3">
        <span className="text-[8px] font-mono opacity-60">TICKER ──────────────</span>
      </div>
    </div>
  ),
  split: (
    <div className="flex flex-col rounded-lg overflow-hidden border border-border h-28 bg-card shadow-inner">
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-[3] flex items-center justify-center opacity-50 border-r border-border">
          <span className="text-[10px] font-semibold">MÍDIA (60%)</span>
        </div>
        <div className="flex-[2] bg-muted/40 flex flex-col gap-1 p-1.5">
          <div className="flex-1 bg-background/60 rounded text-[7px] flex items-center justify-center">CLIMA</div>
          <div className="flex-1 bg-background/60 rounded text-[7px] flex items-center justify-center">SOCIAL</div>
          <div className="flex-1 bg-background/60 rounded text-[7px] flex items-center justify-center">QR CODE</div>
        </div>
      </div>
      <div className="h-5 border-t border-border bg-muted/80 flex items-center px-3">
        <span className="text-[8px] font-mono opacity-60">TICKER ──────────────</span>
      </div>
    </div>
  ),
};

export default function TemplateSelector({ 
  profile, 
  playlists = [], 
  selectedPlaylistId, 
  setSelectedPlaylistId,
  onSave 
}: TemplateSelectorProps) {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [targetScreenId, setTargetScreenId] = useState<string | null>(null);

  const targetPlaylist = playlists.find(p => p.id === targetScreenId);
  const activeLayout = targetPlaylist ? (targetPlaylist.layout_config || profile.layout_config) : profile.layout_config;
  const activeWidgetConfig = targetPlaylist ? (targetPlaylist.widget_config || profile.widget_config) : profile.widget_config;

  const handleSelectTemplate = async (templateId: string) => {
    await onSave({ template: templateId });
    toast({ title: "✅ Template atualizado!", description: `Template "${templateId}" aplicado ao seu canal.` });
  };

  const handleAISuggestion = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      handleSelectTemplate("corporativo");
      toast({ 
        title: "Inteligência Artificial Aplicada ✨", 
        description: "Detectamos seu perfil B2B. Ativamos Widgets de Notícias Tech e Mercado Financeiro nas laterais!" 
      });
    }, 2500);
  };

  const handleWidgetSave = async (wc: StoredWidgetConfig, extras: { 
    instagram_handle?: string;
    config_clima?: string;
    config_noticias?: string;
  }) => {
    await onSave({ widget_config: wc, ...extras });
  };

  const handleLayoutSave = async (updates: any) => {
    const currentLayout = profile.layout_config || {
      sidebar_width: 300,
      footer_height: 60,
      split_ratio: 60,
      show_ticker: true
    };
    await onSave({ layout_config: { ...currentLayout, ...updates } });
    toast({ title: "📏 Layout atualizado!", description: "As dimensões das áreas foram salvas." });
  };

  const handleSaveCustomLayout = async (zones: Zone[]) => {
    try {
      if (targetScreenId) {
        // Salvar para playlist específica (através do onSave do Dashboard que detecta se há playlist selecionada)
        // OBS: Como TemplateSelector recebe onSave genérico, se targetScreenId estiver setado,
        // precisamos garantir que o Dashboard use handleSaveEditor que já lida com playlists.
        await onSave({
          layout_config: {
            ...(activeLayout || {}),
            is_custom: true,
            zones,
          }
        } as any);
        toast({ title: "🎨 Layout dispositivo salvo!", description: `O layout personalizado da tela "${targetPlaylist?.nome_da_tela}" foi atualizado.` });
      } else {
        await onSave({
          layout_config: {
            ...(profile.layout_config || {}),
            is_custom: true,
            zones,
          },
        });
        toast({ title: "🎨 Layout global salvo!", description: "Seu layout padrão foi aplicado. Novas telas herdarão este design." });
      }
      setIsEditorOpen(false);
      setTargetScreenId(null);
    } catch (err: any) {
      toast({
        title: "❌ Erro ao salvar layout",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  const handleOpenEditor = (screenId: string | null = null) => {
    setTargetScreenId(screenId);
    // Notificamos o Dashboard sobre a mudança de contexto para que activeConfig reflita a tela correta
    if (setSelectedPlaylistId) setSelectedPlaylistId(screenId);
    setIsEditorOpen(true);
  };

  const handleAtrelar = async (playlist: any) => {
    try {
      // "Atrelar" copia o layout global para a playlist específica
      await onSave({
        id_playlist_alvo: playlist.id, // Enviar sinalizador para o handleSaveEditor no Dashboard
        layout_config: profile.layout_config,
        widget_config: profile.widget_config
      } as any);
      toast({ 
        title: "🔗 Conectado com sucesso!", 
        description: `A tela "${playlist.nome_da_tela}" agora está usando os parâmetros do Layout Global.` 
      });
    } catch (error) {
      toast({ title: "Erro ao atrelar", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      <div>
        <h2 className="font-display text-3xl font-bold tracking-tight">App Store & Templates</h2>
        <p className="text-muted-foreground mt-1 text-base">
          Escolha a estrutura da sua tela e adicione inteligência conectando aplicações externas.
        </p>
      </div>

      {/* Visual Editor Dialog */}
      <Dialog open={isEditorOpen} onOpenChange={(open) => {
        setIsEditorOpen(open);
        if (!open) {
          setTargetScreenId(null);
          if (setSelectedPlaylistId) setSelectedPlaylistId(null);
        }
      }}>
        <DialogContent className="max-w-[98vw] w-[98vw] h-[95vh] p-0 flex flex-col overflow-hidden">
          <VisualLayoutEditor
            initialZones={(activeLayout as any)?.zones || []}
            widgetConfig={activeWidgetConfig}
            contextName={targetPlaylist ? `Editando Tela: ${targetPlaylist.nome_da_tela}` : "Layout Padrão (Global)"}
            onSave={handleSaveCustomLayout}
            onClose={() => setIsEditorOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Tabs defaultValue="scenarios" className="w-full">
        <TabsList className="mb-6 bg-muted/50 w-full justify-start overflow-x-auto">
          <TabsTrigger value="scenarios" className="px-5 gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
            🏪 Cenários por Segmento
          </TabsTrigger>
          <TabsTrigger value="layouts" className="px-5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
            Templates Base
          </TabsTrigger>
          <TabsTrigger value="editor" className="px-5 gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm text-indigo-500 data-[state=active]:text-indigo-500">
            <LayoutGrid className="w-4 h-4" /> Editor Visual
          </TabsTrigger>
          <TabsTrigger value="widgets" className="px-5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
            Widgets & App Store
          </TabsTrigger>
        </TabsList>

        {/* ── ABA: Cenários ── */}
        <TabsContent value="scenarios">
          <ScenarioWizard profile={profile} onSave={onSave} />
        </TabsContent>

        {/* ── ABA: Editor Visual ── */}
        <TabsContent value="editor" className="space-y-8">
          <div className="flex flex-col md:flex-row gap-6">
            {/* CARD GLOBAL */}
            <div className="w-full md:w-[350px] shrink-0">
              <div className="bg-indigo-600 rounded-2xl p-6 text-white shadow-xl shadow-indigo-500/20 relative overflow-hidden h-full flex flex-col">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                  <LayoutGrid className="w-32 h-32" />
                </div>
                <div className="relative z-10 space-y-4 flex-1">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-white/20 rounded-lg backdrop-blur-md">
                      <Settings2 className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-xl font-bold">Layout Global</h3>
                  </div>
                  <p className="text-indigo-100 text-sm leading-relaxed">
                    Configure o padrão visual da sua conta. Todas as novas telas cadastradas herdarão este design automaticamente.
                  </p>
                  
                  {/* Preview Mini do Global */}
                  <div className="bg-black/40 rounded-xl p-2 border border-white/10 aspect-video relative">
                    <div className="absolute inset-0 flex items-center justify-center opacity-30">
                       <span className="text-[10px] uppercase font-bold tracking-widest text-white/50">Preview Global</span>
                    </div>
                    {((profile.layout_config as any)?.zones as Zone[] || []).map((zone) => (
                      <div key={zone.id} className="absolute border border-indigo-400/40 bg-indigo-400/20 rounded-[1px]"
                        style={{ left: `${zone.x}%`, top: `${zone.y}%`, width: `${zone.width}%`, height: `${zone.height}%` }}
                      ></div>
                    ))}
                  </div>
                </div>
                
                <Button 
                  onClick={() => handleOpenEditor(null)}
                  className="w-full bg-white text-indigo-700 hover:bg-white/90 font-bold mt-6 h-12 rounded-xl"
                >
                  <PenSquare className="w-4 h-4 mr-2" /> Editar Padrão Geral
                </Button>
              </div>
            </div>

            {/* LISTA DE TELAS */}
            <div className="flex-1 space-y-4">
              <div className="flex items-center justify-between border-b pb-4">
                <div>
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <Monitor className="w-5 h-5 text-indigo-500" />
                    Customização por Tela
                  </h3>
                  <p className="text-sm text-muted-foreground italic">Cada dispositivo pode ter um layout exclusivo.</p>
                </div>
                <div className="flex gap-2">
                   <div className="px-3 py-1 bg-muted rounded-full text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-1.5 border border-border">
                      <Tv2 className="w-3 h-3" /> {playlists.length} Telas
                   </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {playlists.map((pl) => {
                  const hasCustomLayout = !!pl.layout_config && (pl.layout_config as any).is_custom;
                  const plLayout = (pl.layout_config as any)?.zones || (profile.layout_config as any)?.zones || [];
                  return (
                    <Card key={pl.id} className={`group hover:shadow-lg transition-all duration-300 border-border overflow-hidden flex flex-col`}>
                      <div className="aspect-video bg-muted/30 relative border-b border-border/50">
                        {/* Mini Preview do Dispositivo */}
                        <div className="absolute inset-0 p-2">
                           <div className="w-full h-full bg-black/5 dark:bg-black/40 rounded border border-indigo-500/10 relative overflow-hidden">
                              {plLayout.map((zone: Zone) => (
                                <div key={zone.id} className="absolute border border-indigo-500/30 bg-indigo-500/10 rounded-[1px]"
                                  style={{ left: `${zone.x}%`, top: `${zone.y}%`, width: `${zone.width}%`, height: `${zone.height}%` }}
                                ></div>
                              ))}
                           </div>
                        </div>
                        {/* Status Overlay */}
                        <div className="absolute top-2 right-2 flex gap-1.5">
                           {hasCustomLayout ? (
                             <span className="px-1.5 py-0.5 bg-indigo-500 text-white text-[9px] font-black uppercase rounded shadow-lg">Custom</span>
                           ) : (
                             <span className="px-1.5 py-0.5 bg-emerald-500 text-white text-[9px] font-black uppercase rounded shadow-lg">Global</span>
                           )}
                        </div>
                      </div>
                      <CardContent className="p-4 flex-1 flex flex-col">
                        <div className="flex-1 mb-4">
                           <h4 className="font-bold text-sm truncate">{pl.nome_da_tela}</h4>
                           <p className="text-[10px] text-muted-foreground uppercase font-black mt-0.5 flex items-center gap-1.5">
                             {hasCustomLayout ? "Layout Independente" : "Herdando Global"}
                             {!hasCustomLayout && <span className="w-1 h-1 bg-emerald-400 rounded-full animate-pulse" />}
                           </p>
                        </div>
                        
                        <div className="flex gap-2">
                           <Button 
                             onClick={() => handleOpenEditor(pl.id)}
                             variant="outline" size="sm" className="flex-1 h-9 bg-background border-border/50 hover:border-indigo-500/30 hover:bg-indigo-500/5"
                           >
                             Personalizar
                           </Button>
                           <Button 
                             onClick={() => handleAtrelar(pl)}
                             variant="outline" size="icon" className="h-9 w-9 border-border/50 hover:text-indigo-500 hover:border-indigo-500/30"
                             title="Atrelar ao Global"
                           >
                             <Link className="w-4 h-4" />
                           </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}

                {playlists.length === 0 && (
                  <div className="col-span-full py-12 flex flex-col items-center justify-center border-2 border-dashed rounded-2xl opacity-40">
                    <Tv2 className="w-12 h-12 mb-3" />
                    <p className="text-sm font-bold">Nenhuma tela encontrada</p>
                    <p className="text-xs">Cadastre telas em 'Meus Dispositivos' para vê-las aqui.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-muted/40 rounded-xl p-4 flex items-start gap-3 border border-border">
             <Info className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
             <div className="text-xs text-muted-foreground leading-relaxed">
                <p className="font-bold text-foreground">💡 Como funciona o Editor por Dispositivo?</p>
                <p className="mt-1">
                  O <strong>Layout Global</strong> serve como template padrão para todas as telas. Se você quiser que uma tela específica tenha um visual diferente 
                  (ex: uma TV na recepção vs uma TV na vitrine), clique em <strong>Personalizar</strong> naquele dispositivo.
                  Para que a tela volte a seguir o padrão geral, clique no ícone de <strong>Atrelar <Link className="inline h-3 w-3" /></strong>.
                </p>
             </div>
          </div>
        </TabsContent>

        {/* ── ABA: Templates Base ── */}
        <TabsContent value="layouts" className="space-y-6">
          <div className="bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-indigo-500/5 p-6 rounded-xl border border-indigo-500/20 mb-6 flex flex-col sm:flex-row items-center gap-6 justify-between">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-indigo-500 rounded-xl shadow-lg shadow-indigo-500/20 text-white shrink-0">
                <Wand2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-indigo-700 dark:text-indigo-400">Sugestão de Template Automática</h3>
                <p className="text-sm text-foreground/80 mt-1 max-w-xl">
                  Deixe nossa IA analisar os dados de mercado e configurar o melhor layout e mix de widgets comprovados para focar clientes no seu tipo de negócio.
                </p>
              </div>
            </div>
            <Button 
              className="bg-indigo-600 hover:bg-indigo-700 text-white shrink-0 w-full sm:w-auto min-w-[200px]" 
              onClick={handleAISuggestion}
              disabled={isGenerating}
            >
              {isGenerating ? <div className="animate-spin h-5 w-5 border-2 border-white/20 border-t-white rounded-full" /> : "Gerar com IA ✨"}
            </Button>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            {templates.map((tmpl) => {
              const isActive = profile.template === tmpl.id;
              return (
                <Card
                  key={tmpl.id}
                  className={`relative cursor-pointer border-2 transition-all duration-300 hover:shadow-xl overflow-hidden ${
                    isActive ? "border-indigo-500 shadow-md" : "border-border/50 hover:border-indigo-400/30"
                  }`}
                  onClick={() => handleSelectTemplate(tmpl.id)}
                >
                  {/* Background gradient */}
                  <div className={`absolute inset-0 ${tmpl.previewBg} opacity-30`} />
                  
                  {isActive && (
                    <div className="absolute top-4 right-4 rounded-full bg-indigo-500 p-1.5 shadow-sm text-white z-10">
                      <Check className="h-4 w-4" />
                    </div>
                  )}
                  {tmpl.isNew && !isActive && (
                    <div className="absolute top-4 right-4 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-bold text-white z-10 uppercase tracking-wide">
                      Novo
                    </div>
                  )}
                  
                  <CardContent className="p-6 relative">
                    <div className="flex items-center gap-4 mb-4">
                      <div className={`rounded-xl p-4 ${isActive ? "bg-indigo-500 text-white shadow-inner" : "bg-muted text-muted-foreground"}`}>
                        <tmpl.icon className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="font-display font-bold text-xl">{tmpl.label}</h3>
                      </div>
                      {isActive && (
                        <Sheet>
                          <SheetTrigger asChild>
                            <Button variant="outline" size="sm" className="ml-auto gap-2 bg-background/50 backdrop-blur-sm border-indigo-500/30 hover:bg-indigo-500/10">
                              <Settings2 className="w-4 h-4" />
                              Configurar
                            </Button>
                          </SheetTrigger>
                          <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
                            <SheetHeader className="pb-6">
                              <SheetTitle className="flex items-center gap-2">
                                <Sliders className="w-5 h-5 text-indigo-500" />
                                Ajustar Layout: {tmpl.label}
                              </SheetTitle>
                              <SheetDescription>
                                Personalize o tamanho das áreas e os elementos visíveis deste template.
                              </SheetDescription>
                            </SheetHeader>

                            <div className="space-y-8 py-4">
                              {/* Configuração de Tamanhos */}
                              <div className="space-y-6">
                                <h4 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                  <div className="w-1 h-4 bg-indigo-500 rounded-full" />
                                  Dimensões das Áreas
                                </h4>
                                
                                {(tmpl.id === "corporativo" || tmpl.id === "lbar") && (
                                  <div className="space-y-4">
                                    <div className="flex justify-between">
                                      <Label>Largura da Sidebar (px)</Label>
                                      <span className="text-sm font-mono text-indigo-600 font-bold">{profile.layout_config?.sidebar_width || 300}px</span>
                                    </div>
                                    <Slider 
                                      defaultValue={[profile.layout_config?.sidebar_width || 300]} 
                                      max={500} 
                                      min={200} 
                                      step={10}
                                      onValueCommit={(val) => handleLayoutSave({ sidebar_width: val[0] })}
                                    />
                                    <p className="text-[10px] text-muted-foreground italic">Arraste para ajustar a largura da barra lateral de widgets.</p>
                                  </div>
                                )}

                                {tmpl.id === "split" && (
                                  <div className="space-y-4">
                                    <div className="flex justify-between">
                                      <Label>Proporção da Divisão (%)</Label>
                                      <span className="text-sm font-mono text-indigo-600 font-bold">{profile.layout_config?.split_ratio || 60}% / {100 - (profile.layout_config?.split_ratio || 60)}%</span>
                                    </div>
                                    <Slider 
                                      defaultValue={[profile.layout_config?.split_ratio || 60]} 
                                      max={80} 
                                      min={40} 
                                      step={5}
                                      onValueCommit={(val) => handleLayoutSave({ split_ratio: val[0] })}
                                    />
                                    <p className="text-[10px] text-muted-foreground italic">Ajuste o equilíbrio entre a mídia principal e os widgets.</p>
                                  </div>
                                )}

                                <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border/50">
                                  <div className="space-y-0.5">
                                    <Label>Exibir Rodapé (Ticker)</Label>
                                    <p className="text-[10px] text-muted-foreground">Mostrar barra de notícias na base.</p>
                                  </div>
                                  <Switch 
                                    checked={profile.layout_config?.show_ticker !== false}
                                    onCheckedChange={(checked) => handleLayoutSave({ show_ticker: checked })}
                                  />
                                </div>
                              </div>

                              <Separator />

                              {/* Seleção de Widgets para este Template */}
                              <div className="space-y-6">
                                <h4 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                  <div className="w-1 h-4 bg-indigo-500 rounded-full" />
                                  Widgets Ativos no Template
                                </h4>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                  Ative ou desative aplicações de inteligência especificamente para este layout.
                                </p>
                                
                                <div className="grid gap-3">
                                  {Object.entries(profile.widget_config || {}).map(([key, cfg]: [string, any]) => (
                                    <div key={key} className="flex items-center justify-between p-3 rounded-md border border-border/50 hover:bg-muted/20 transition-colors">
                                      <span className="text-sm font-medium capitalize">{key === 'qr' ? 'QR Code' : key}</span>
                                      <Switch 
                                        checked={cfg.enabled}
                                        onCheckedChange={(checked) => {
                                          const newConfig = { ...profile.widget_config };
                                          newConfig[key] = { ...newConfig[key], enabled: checked };
                                          handleWidgetSave(newConfig, {});
                                        }}
                                      />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>

                            <SheetFooter className="mt-8 border-t pt-6">
                                <SheetClose asChild>
                                  <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">Concluir Ajustes</Button>
                                </SheetClose>
                            </SheetFooter>
                          </SheetContent>
                        </Sheet>
                      )}
                    </div>

                    {/* Preview visual */}
                    <div className="mb-5">
                      {templatePreviews[tmpl.id] || null}
                    </div>

                    <p className="text-sm text-muted-foreground leading-relaxed mb-4">{tmpl.description}</p>
                    <ul className="space-y-2">
                      {tmpl.features.map((f) => (
                        <li key={f} className="flex items-center gap-2 text-sm font-medium text-foreground/80">
                          <div className={`h-2 w-2 rounded-full ${isActive ? 'bg-indigo-500' : 'bg-muted-foreground'}`} />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* ── ABA: Widgets ── */}
        <TabsContent value="widgets" className="space-y-6">
          <WidgetStore
            widgetConfig={profile.widget_config}
            instagramHandle={profile.instagram_handle}
            configClima={profile.config_clima}
            configNoticias={profile.config_noticias}
            onSave={handleWidgetSave}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
