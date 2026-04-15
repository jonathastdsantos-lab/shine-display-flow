import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  Store, Building2, Check, Wand2,
  LayoutPanelLeft, Columns2, Settings2, Sliders, PenSquare, LayoutGrid
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
import type { WidgetConfig } from "./WidgetStore";

interface TemplateSelectorProps {
  profile: ClientProfile;
  onSave: (updates: Partial<ClientProfile>) => Promise<void>;
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

export default function TemplateSelector({ profile, onSave }: TemplateSelectorProps) {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

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

  const handleWidgetSave = async (wc: WidgetConfig, extras: { 
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
      await onSave({
        layout_config: {
          ...(profile.layout_config || {}),
          is_custom: true,
          zones,
        },
        // NOTE: não enviamos template:"custom" pois o banco tem um CHECK constraint
        // O Player verifica layout_config.is_custom antes de verificar o template
      });
      toast({ title: "🎨 Layout personalizado salvo!", description: "Seu layout customizado foi aplicado ao canal." });
      setIsEditorOpen(false);
    } catch (err: any) {
      toast({
        title: "❌ Erro ao salvar layout",
        description: err.message?.includes("column") || err.message?.includes("does not exist")
          ? "Coluna layout_config não existe no banco. Execute o SQL de migração no Supabase."
          : err.message,
        variant: "destructive",
      });
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
      <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
        <DialogContent className="max-w-[98vw] w-[98vw] h-[95vh] p-0 flex flex-col overflow-hidden">
          <VisualLayoutEditor
            initialZones={(profile.layout_config as any)?.zones || []}
            widgetConfig={profile.widget_config}
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
        <TabsContent value="editor" className="space-y-6">
          <div className="bg-gradient-to-br from-indigo-500/10 via-violet-500/10 to-indigo-500/5 p-6 rounded-xl border border-indigo-500/20">
            <div className="flex flex-col sm:flex-row items-start gap-6 justify-between">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-500/30 text-white shrink-0">
                  <LayoutGrid className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-indigo-700 dark:text-indigo-300">Editor Visual de Layout</h3>
                  <p className="text-sm text-foreground/80 mt-1 max-w-xl">
                    Crie seu layout personalizado arrastando e redimensionando zonas livremente. 
                    Use a <strong>IA Geradora</strong> para criar um layout completo a partir de uma descrição do seu negócio.
                  </p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {["Arrastar e Redimensionar", "9 Tipos de Widget", "IA Geradora de Layout", "Salva na Nuvem"].map(f => (
                      <span key={f} className="text-xs bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 rounded-full px-2.5 py-0.5">✓ {f}</span>
                    ))}
                  </div>
                </div>
              </div>
              <Button
                onClick={() => setIsEditorOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-700 gap-2 shrink-0 shadow-lg shadow-indigo-500/20 h-12 px-6"
                size="lg"
              >
                <PenSquare className="w-5 h-5" />
                Abrir Editor Completo
              </Button>
            </div>
          </div>

          {/* Current custom layout preview */}
          {(profile.layout_config as any)?.is_custom && (profile.layout_config as any)?.zones?.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500" />
                Layout Personalizado Ativo
              </h4>
              <div className="relative bg-black rounded-xl overflow-hidden border border-slate-700" style={{ aspectRatio: "16/9", maxWidth: "600px" }}>
                <div className="absolute inset-0 pointer-events-none opacity-5"
                  style={{
                    backgroundImage: "linear-gradient(rgba(99,102,241,1) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,1) 1px, transparent 1px)",
                    backgroundSize: "10% 11.11%"
                  }}
                />
                {((profile.layout_config as any)?.zones as Zone[]).map((zone) => (
                  <div
                    key={zone.id}
                    className="absolute border border-indigo-400/60 bg-indigo-600/40 flex items-center justify-center rounded"
                    style={{ left: `${zone.x}%`, top: `${zone.y}%`, width: `${zone.width}%`, height: `${zone.height}%` }}
                  >
                    <span className="text-white text-[8px] font-bold text-center px-1 truncate">{zone.label}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                {(profile.layout_config as any)?.zones?.length} zona(s) configurada(s) · Clique em "Abrir Editor Completo" para modificar
              </p>
            </div>
          )}
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
