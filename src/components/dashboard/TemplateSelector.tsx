import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Store, Building2, Check, Wand2, CloudSun, TrendingUp, Rss, Clock, Instagram, QrCode, Camera } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ClientProfile } from "@/hooks/useDashboardData";

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
  },
  {
    id: "corporativo",
    label: "Modo Lobbies / Clínicas",
    icon: Building2,
    description: "Layout cortado com Sidebar direita. Ideal para ambientes de espera e portarias de condomínios.",
    features: ["Zonas de Widgets Ativas", "Clima e Relógio ao vivo", "Prende atenção durante filas"],
  },
];

export default function TemplateSelector({ profile, onSave }: TemplateSelectorProps) {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);

  const handleSelectTemplate = async (templateId: string) => {
    await onSave({ template: templateId });
    toast({ title: "Template estrutural atualizado!" });
  };

  const toggleWidget = async (type: string, enabled: boolean) => {
    let updates: Partial<ClientProfile> = {};
    if (type === 'weather') updates = { config_clima: enabled ? "São Paulo" : "" };
    if (type === 'news') updates = { config_noticias: enabled ? "technology" : "" };
    // Simulando configurações avançadas que o banco ou state absorve
    toast({ title: `Widget alterado com sucesso!`, description: "A tela irá refletir a mudança no próximo loop." });
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

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      <div>
        <h2 className="font-display text-3xl font-bold tracking-tight">App Store & Templates</h2>
        <p className="text-muted-foreground mt-1 text-base">
          Escolha a estrutura da sua tela e adicione inteligência conectando aplicações externas.
        </p>
      </div>

      <Tabs defaultValue="layouts" className="w-full">
        <TabsList className="mb-6 bg-muted/50 w-full justify-start overflow-x-auto">
          <TabsTrigger value="layouts" className="px-6 data-[state=active]:bg-background data-[state=active]:shadow-sm">Templates Base</TabsTrigger>
          <TabsTrigger value="widgets" className="px-6 data-[state=active]:bg-background data-[state=active]:shadow-sm">Widgets & App Store</TabsTrigger>
        </TabsList>

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
                  className={`relative cursor-pointer border-2 transition-all duration-300 hover:shadow-xl ${
                    isActive ? "border-indigo-500 shadow-md bg-indigo-500/5" : "border-border/50 hover:border-indigo-400/30"
                  }`}
                  onClick={() => handleSelectTemplate(tmpl.id)}
                >
                  {isActive && (
                    <div className="absolute top-4 right-4 rounded-full bg-indigo-500 p-1.5 shadow-sm text-white">
                      <Check className="h-4 w-4" />
                    </div>
                  )}
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className={`rounded-xl p-4 ${isActive ? "bg-indigo-500 text-white shadow-inner" : "bg-muted text-muted-foreground"}`}>
                        <tmpl.icon className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="font-display font-bold text-xl">{tmpl.label}</h3>
                      </div>
                    </div>
                    
                    {tmpl.id === "corporativo" ? (
                      <div className="flex rounded-lg overflow-hidden border border-border h-32 mb-6 bg-card shadow-inner">
                        <div className="flex-1 flex flex-col justify-center items-center opacity-60">
                           <span className="text-xs font-semibold">PLAYLIST (ZONA 1)</span>
                        </div>
                        <div className="w-[30%] bg-muted border-l border-border flex flex-col gap-1 p-2">
                          <div className="flex-1 bg-background/50 rounded flex items-center justify-center text-[10px]">WIDGET 1</div>
                          <div className="flex-1 bg-background/50 rounded flex items-center justify-center text-[10px]">WIDGET 2</div>
                        </div>
                        <div className="absolute bottom-6 left-6 right-6 h-6 border-t border-border bg-background/80 flex items-center px-4 rounded-b-lg opacity-80 overflow-hidden">
                           <span className="text-[10px] font-mono truncate">TICKER_TEXTO_DA_PÁGINA_WIDGET_3</span>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-lg overflow-hidden border border-border h-32 mb-6 bg-card shadow-inner flex flex-col relative">
                        <div className="flex-1 flex items-center justify-center opacity-60">
                          <span className="text-xs font-semibold">TELA CHEIA (ZONA 1)</span>
                        </div>
                        <div className="absolute bottom-0 w-full h-6 bg-muted/90 border-t border-border flex items-center px-4">
                          <span className="text-[10px] font-mono">TICKER_TEXTO_DA_PÁGINA</span>
                        </div>
                      </div>
                    )}

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

        <TabsContent value="widgets" className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            
            {/* WIDGET 1 */}
            <Card className="border-border/50">
               <CardContent className="p-6">
                 <div className="flex justify-between items-start mb-4">
                   <div className="p-3 bg-sky-500/10 text-sky-500 rounded-xl">
                     <CloudSun className="w-6 h-6" />
                   </div>
                   <Switch defaultChecked onCheckedChange={(checked) => toggleWidget('weather', checked)} />
                 </div>
                 <h3 className="font-bold text-lg mb-1">Clima Global</h3>
                 <p className="text-sm text-muted-foreground mb-4">
                   Conecta com APIs meteorológicas para mostrar a previsão de até 3 dias da tela onde está instalado.
                 </p>
                 <div className="text-xs font-mono bg-muted p-2 rounded text-muted-foreground truncate">
                   Capturando de: OpenWeather API
                 </div>
               </CardContent>
            </Card>

            {/* WIDGET 2 */}
            <Card className="border-border/50">
               <CardContent className="p-6">
                 <div className="flex justify-between items-start mb-4">
                   <div className="p-3 bg-red-500/10 text-red-500 rounded-xl">
                     <Rss className="w-6 h-6" />
                   </div>
                   <Switch defaultChecked onCheckedChange={(checked) => toggleWidget('news', checked)} />
                 </div>
                 <h3 className="font-bold text-lg mb-1">Últimas Notícias</h3>
                 <p className="text-sm text-muted-foreground mb-4">
                   Alimenta seu rodapé (Ticker) com os portais de notícias mais acessados (G1, UOL, CNN).
                 </p>
                 <div className="text-xs font-mono bg-muted p-2 rounded text-muted-foreground truncate">
                   Feed: Tecnologia & Negócios
                 </div>
               </CardContent>
            </Card>

            {/* WIDGET 3 */}
            <Card className="border-border/50">
               <CardContent className="p-6">
                 <div className="flex justify-between items-start mb-4">
                   <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl">
                     <TrendingUp className="w-6 h-6" />
                   </div>
                   <Switch />
                 </div>
                 <h3 className="font-bold text-lg mb-1">Cotações (Finance)</h3>
                 <p className="text-sm text-muted-foreground mb-4">
                   Tabela rotativa de câmbios de moedas na ponta da tela. Ótimo para casas de câmbio ou corporativo.
                 </p>
                 <div className="text-xs font-mono bg-muted p-2 rounded text-muted-foreground truncate">
                   Integração: BCB Market
                 </div>
               </CardContent>
            </Card>

            {/* WIDGET 4: INSTAGRAM */}
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

            {/* WIDGET 5: QR CODE PROMOCIONAL */}
            <Card className="border-border/50">
               <CardContent className="p-6">
                 <div className="flex justify-between items-start mb-4">
                   <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-xl">
                     <QrCode className="w-6 h-6" />
                   </div>
                   <Switch onCheckedChange={(checked) => toggleWidget('qrcode', checked)} />
                 </div>
                 <h3 className="font-bold text-lg mb-1">Promoção QR Code</h3>
                 <p className="text-sm text-muted-foreground mb-4">
                   Um balão interativo aparece de tempos em tempos com um QR Code que leva o cliente para o seu link.
                 </p>
                 <div className="text-xs font-mono bg-muted p-2 rounded text-muted-foreground truncate">
                   Link Atual: Seu link de ofertas
                 </div>
               </CardContent>
            </Card>

            {/* WIDGET 6: CÂMERA DE SEGURANÇA (CFTV) */}
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

          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
