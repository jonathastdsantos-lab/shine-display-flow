import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  Store, Building2, Check, Wand2,
  LayoutPanelLeft, Columns2
} from "lucide-react";
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

  const handleWidgetSave = async (wc: WidgetConfig, extras: { instagram_handle?: string }) => {
    await onSave({ widget_config: wc, ...extras });
  };

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      <div>
        <h2 className="font-display text-3xl font-bold tracking-tight">App Store & Templates</h2>
        <p className="text-muted-foreground mt-1 text-base">
          Escolha a estrutura da sua tela e adicione inteligência conectando aplicações externas.
        </p>
      </div>

      <Tabs defaultValue="scenarios" className="w-full">
        <TabsList className="mb-6 bg-muted/50 w-full justify-start overflow-x-auto">
          <TabsTrigger value="scenarios" className="px-5 gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
            🏪 Cenários por Segmento
          </TabsTrigger>
          <TabsTrigger value="layouts" className="px-5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
            Templates Base
          </TabsTrigger>
          <TabsTrigger value="widgets" className="px-5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
            Widgets & App Store
          </TabsTrigger>
        </TabsList>

        {/* ── ABA: Cenários ── */}
        <TabsContent value="scenarios">
          <ScenarioWizard profile={profile} onSave={onSave} />
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
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            
            <Card className="border-border/50">
               <CardContent className="p-6">
                 <div className="flex justify-between items-start mb-4">
                   <div className="p-3 bg-sky-500/10 text-sky-500 rounded-xl">
                     <CloudSun className="w-6 h-6" />
                   </div>
                   <Switch defaultChecked={!!profile.config_clima} onCheckedChange={(checked) => toggleWidget('weather', checked)} />
                 </div>
                 <h3 className="font-bold text-lg mb-1">Clima Global</h3>
                 <p className="text-sm text-muted-foreground mb-4">
                   Conecta com APIs meteorológicas para mostrar a previsão de até 3 dias da tela onde está instalado.
                 </p>
                 <div className="text-xs font-mono bg-muted p-2 rounded text-muted-foreground truncate">
                   {profile.config_clima ? `📍 Cidade: ${profile.config_clima}` : "⚠️ Configure nas Configurações do Canal"}
                 </div>
               </CardContent>
            </Card>

            <Card className="border-border/50">
               <CardContent className="p-6">
                 <div className="flex justify-between items-start mb-4">
                   <div className="p-3 bg-red-500/10 text-red-500 rounded-xl">
                     <Rss className="w-6 h-6" />
                   </div>
                   <Switch defaultChecked={!!profile.config_noticias} onCheckedChange={(checked) => toggleWidget('news', checked)} />
                 </div>
                 <h3 className="font-bold text-lg mb-1">Últimas Notícias</h3>
                 <p className="text-sm text-muted-foreground mb-4">
                   Alimenta seu rodapé (Ticker) com os portais de notícias mais acessados (G1, UOL, CNN).
                 </p>
                 <div className="text-xs font-mono bg-muted p-2 rounded text-muted-foreground truncate">
                   {profile.config_noticias ? `📰 Feed: ${profile.config_noticias}` : "⚠️ Configure nas Configurações do Canal"}
                 </div>
               </CardContent>
            </Card>

            <Card className="border-border/50">
               <CardContent className="p-6">
                 <div className="flex justify-between items-start mb-4">
                   <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl">
                     <TrendingUp className="w-6 h-6" />
                   </div>
                   <Switch defaultChecked />
                 </div>
                 <h3 className="font-bold text-lg mb-1">Cotações (Finance)</h3>
                 <p className="text-sm text-muted-foreground mb-4">
                   Tabela rotativa de câmbios de moedas na ponta da tela. Ótimo para casas de câmbio ou corporativo.
                 </p>
                 <div className="text-xs font-mono bg-muted p-2 rounded text-muted-foreground truncate">
                   ✅ Integração: BCB Market
                 </div>
               </CardContent>
            </Card>

            <Card className="border-border/50">
               <CardContent className="p-6">
                 <div className="flex justify-between items-start mb-4">
                   <div className="p-3 bg-pink-500/10 text-pink-500 rounded-xl">
                     <Instagram className="w-6 h-6" />
                   </div>
                   <Switch onCheckedChange={(checked) => toggleWidget('social', checked)} />
                 </div>
                 <h3 className="font-bold text-lg mb-1">Mural Social (Instagram)</h3>
                 <p className="text-sm text-muted-foreground mb-4">
                   Puxa as fotos mais recentes e os textos da sua hashtag ou conta para criar uma prova social na TV.
                 </p>
                 <div className="text-xs font-mono bg-muted p-2 rounded text-muted-foreground truncate">
                   Conta Conectada: Pendente...
                 </div>
               </CardContent>
            </Card>

            <Card className="border-border/50">
               <CardContent className="p-6">
                 <div className="flex justify-between items-start mb-4">
                   <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-xl">
                     <QrCode className="w-6 h-6" />
                   </div>
                   <Switch defaultChecked onCheckedChange={(checked) => toggleWidget('qrcode', checked)} />
                 </div>
                 <h3 className="font-bold text-lg mb-1">QR Code Dinâmico</h3>
                 <p className="text-sm text-muted-foreground mb-4">
                   O QR Code muda automaticamente conforme cada mídia é exibida. Configure o link em cada arquivo na Biblioteca.
                 </p>
                 <div className="text-xs font-mono bg-muted p-2 rounded text-muted-foreground truncate">
                   ✅ URL dinâmica por mídia ativa
                 </div>
               </CardContent>
            </Card>

            <Card className="border-border/50">
               <CardContent className="p-6">
                 <div className="flex justify-between items-start mb-4">
                   <div className="p-3 bg-red-500/10 text-red-500 rounded-xl">
                     <Camera className="w-6 h-6" />
                   </div>
                   <Switch onCheckedChange={(checked) => toggleWidget('cctv', checked)} />
                 </div>
                 <h3 className="font-bold text-lg mb-1">Câmera de Segurança (Ao Vivo)</h3>
                 <p className="text-sm text-muted-foreground mb-4">
                   Ideal para Espaço Kids ou Portarias. Espelha a imagem das suas câmeras de segurança direto na TV.
                 </p>
                 <div className="text-xs font-mono bg-muted p-2 rounded text-muted-foreground truncate">
                   Protocolo: RTSP/WebRTC Integrado
                 </div>
               </CardContent>
            </Card>

            <Card className="border-border/50">
               <CardContent className="p-6">
                 <div className="flex justify-between items-start mb-4">
                   <div className="p-3 bg-sky-500/10 text-sky-500 rounded-xl">
                     <Clock className="w-6 h-6" />
                   </div>
                   <Switch defaultChecked />
                 </div>
                 <h3 className="font-bold text-lg mb-1">Relógio Digital</h3>
                 <p className="text-sm text-muted-foreground mb-4">
                   Exibe o horário atual em tempo real na barra lateral. Essencial para ambientes de espera e portarias.
                 </p>
                 <div className="text-xs font-mono bg-muted p-2 rounded text-muted-foreground truncate">
                   ✅ Sempre ativo no modo Corporativo
                 </div>
               </CardContent>
            </Card>

          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
