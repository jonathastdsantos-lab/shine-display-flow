import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Check, Sparkles, ChevronRight, Settings2 } from "lucide-react";
import type { ClientProfile } from "@/hooks/useDashboardData";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ScenarioWizardProps {
  profile: ClientProfile;
  onSave: (updates: Partial<ClientProfile>) => Promise<void>;
}

interface Scenario {
  id: string;
  emoji: string;
  label: string;
  description: string;
  template: string;
  color: string;
  gradient: string;
  shadowColor: string;
  tags: string[];
  config: Partial<ClientProfile>;
  widgets: string[];
  preview: { zones: { label: string; size: string; color: string }[] };
}

const scenarios: Scenario[] = [
  {
    id: "mercado",
    emoji: "🛒",
    label: "Supermercado / Varejo",
    description: "Destaque ofertas do dia, QR Code de cashback e preço em foco total. Máximo impacto visual nas gôndolas.",
    template: "varejo",
    color: "text-emerald-400",
    gradient: "from-emerald-500/20 to-teal-500/10",
    shadowColor: "shadow-emerald-500/20",
    tags: ["QR Ofertas", "Ticker de Preços", "Tela Cheia"],
    config: { template: "varejo", config_clima: "", config_noticias: "" },
    widgets: ["qrcode", "ticker"],
    preview: {
      zones: [
        { label: "Oferta em Destaque", size: "flex-1", color: "bg-emerald-500/20" },
        { label: "Ticker de Preços", size: "h-8", color: "bg-emerald-600/30" },
      ],
    },
  },
  {
    id: "salao",
    emoji: "💇",
    label: "Salão de Beleza / Spa",
    description: "Feed do Instagram em destaque, QR para agendamento online e música ambiente com visual elegante.",
    template: "corporativo",
    color: "text-pink-400",
    gradient: "from-pink-500/20 to-rose-500/10",
    shadowColor: "shadow-pink-500/20",
    tags: ["Instagram ao Vivo", "QR Agendamento", "Sidebar Widgets"],
    config: { template: "corporativo", config_clima: "São Paulo", config_noticias: "" },
    widgets: ["social", "qrcode", "clock"],
    preview: {
      zones: [
        { label: "Vídeo / Lookbook", size: "flex-1", color: "bg-pink-500/20" },
        { label: "Instagram + QR", size: "w-24", color: "bg-pink-600/30" },
      ],
    },
  },
  {
    id: "padaria",
    emoji: "🥐",
    label: "Padaria / Café",
    description: "Menu do dia em destaque, clima local e notícias leves no rodapé. Perfeito para o horário do café da manhã.",
    template: "lbar",
    color: "text-amber-400",
    gradient: "from-amber-500/20 to-orange-500/10",
    shadowColor: "shadow-amber-500/20",
    tags: ["Menu do Dia", "Clima Local", "L-Bar Elegante"],
    config: { template: "lbar", config_clima: "São Paulo", config_noticias: "business" },
    widgets: ["weather", "ticker", "clock"],
    preview: {
      zones: [
        { label: "Cardápio / Foto", size: "flex-1", color: "bg-amber-500/20" },
        { label: "Clima + Hora", size: "w-20", color: "bg-amber-600/30" },
        { label: "Noticias Locais", size: "h-8", color: "bg-orange-600/30" },
      ],
    },
  },
  {
    id: "clinica",
    emoji: "🏥",
    label: "Clínica / Consultório / Lobby",
    description: "Ambiente de espera tranquilo com relógio proeminente, clima, notícias de saúde e vídeos institucionais.",
    template: "corporativo",
    color: "text-sky-400",
    gradient: "from-sky-500/20 to-blue-500/10",
    shadowColor: "shadow-sky-500/20",
    tags: ["Modo Espera", "Clima e Relógio", "Notícias Health"],
    config: { template: "corporativo", config_clima: "São Paulo", config_noticias: "technology" },
    widgets: ["clock", "weather", "news"],
    preview: {
      zones: [
        { label: "Conteúdo Institucional", size: "flex-1", color: "bg-sky-500/20" },
        { label: "Relógio + Clima", size: "w-24", color: "bg-sky-600/30" },
      ],
    },
  },
  {
    id: "academia",
    emoji: "🏋️",
    label: "Academia / CrossFit",
    description: "Mural de motivação com feed social, timer de aula e notícias esportivas no ticker inferior.",
    template: "split",
    color: "text-orange-400",
    gradient: "from-orange-500/20 to-red-500/10",
    shadowColor: "shadow-orange-500/20",
    tags: ["Mural Social", "Timer de Treino", "Notícias Esportes"],
    config: { template: "split", config_clima: "", config_noticias: "sports" },
    widgets: ["social", "clock", "news"],
    preview: {
      zones: [
        { label: "Motivação / Vídeo", size: "flex-[3]", color: "bg-orange-500/20" },
        { label: "Social + Timer", size: "flex-[2]", color: "bg-red-500/20" },
        { label: "Noticias Esportes", size: "h-8", color: "bg-orange-600/30" },
      ],
    },
  },
  {
    id: "corporativo",
    emoji: "🏢",
    label: "Corporativo / Condomínio",
    description: "Layout premium com zonas inteligentes, cotações financeiras, notícias e relógio. Ideal para portarias e recepções.",
    template: "corporativo",
    color: "text-indigo-400",
    gradient: "from-indigo-500/20 to-violet-500/10",
    shadowColor: "shadow-indigo-500/20",
    tags: ["Cotações Finance", "Notícias Tech", "Layout Premium"],
    config: { template: "corporativo", config_clima: "São Paulo", config_noticias: "technology" },
    widgets: ["clock", "weather", "finance", "news"],
    preview: {
      zones: [
        { label: "Conteúdo Principal", size: "flex-[2]", color: "bg-indigo-500/20" },
        { label: "Widgets Sidebar", size: "flex-1", color: "bg-violet-500/20" },
        { label: "Ticker Corporativo", size: "h-8", color: "bg-indigo-600/30" },
      ],
    },
  },
];

export default function ScenarioWizard({ profile, onSave }: ScenarioWizardProps) {
  const { toast } = useToast();
  const [applying, setApplying] = useState<string | null>(null);
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);
  const [config, setConfig] = useState({
    city: profile.config_clima || "São Paulo",
    news: profile.config_noticias || "technology",
    instagram: profile.instagram_handle || "",
  });

  const handleApply = async () => {
    if (!selectedScenario) return;
    
    setApplying(selectedScenario.id);
    
    const finalConfig: Partial<ClientProfile> = {
      ...selectedScenario.config,
      config_clima: selectedScenario.widgets.includes("weather") ? config.city : selectedScenario.config.config_clima,
      config_noticias: selectedScenario.widgets.includes("news") || selectedScenario.widgets.includes("ticker") ? config.news : selectedScenario.config.config_noticias,
      instagram_handle: selectedScenario.widgets.includes("social") ? config.instagram : profile.instagram_handle,
    };

    await onSave(finalConfig);
    
    setApplying(null);
    setSelectedScenario(null);
    toast({
      title: `✅ Cenário "${selectedScenario.label}" aplicado!`,
      description: `Configurações personalizadas foram salvas com sucesso.`,
    });
  };

  const openConfig = (scenario: Scenario) => {
    setSelectedScenario(scenario);
    setConfig({
      city: profile.config_clima || "São Paulo",
      news: profile.config_noticias || "technology",
      instagram: profile.instagram_handle || "",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-violet-500/10 via-indigo-500/10 to-transparent rounded-xl border border-indigo-500/20">
        <div className="p-2.5 bg-indigo-500 rounded-xl shadow-lg shadow-indigo-500/30">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="font-bold text-sm text-indigo-300">Configuração Inteligente por Segmento</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Selecione o tipo do seu negócio. Escolha o que exibir e personalize as informações.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {scenarios.map((scenario) => {
          const isActive = profile.template === scenario.template &&
            (scenario.id === "corporativo" ? profile.config_noticias === "technology" : true);
          const isApplying = applying === scenario.id;

          return (
            <div
              key={scenario.id}
              onClick={() => !isApplying && openConfig(scenario)}
              className={`relative flex flex-col rounded-2xl border-2 cursor-pointer transition-all duration-300 overflow-hidden group
                ${isActive
                  ? "border-indigo-500 shadow-lg shadow-indigo-500/20"
                  : "border-border/40 hover:border-white/20 hover:shadow-xl hover:-translate-y-0.5"
                }`}
            >
              {/* Gradient background */}
              <div className={`absolute inset-0 bg-gradient-to-br ${scenario.gradient} opacity-60 group-hover:opacity-100 transition-opacity`} />

              {/* Active badge */}
              {isActive && (
                <div className="absolute top-3 right-3 z-10 bg-indigo-500 text-white rounded-full p-1 shadow-md">
                  <Check className="w-3.5 h-3.5" />
                </div>
              )}

              <div className="relative p-5 flex flex-col gap-3 flex-1">
                {/* Header */}
                <div className="flex items-start gap-3">
                  <span className="text-3xl">{scenario.emoji}</span>
                  <div className="flex-1">
                    <h3 className="font-bold text-sm leading-tight">{scenario.label}</h3>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {scenario.tags.map((tag) => (
                        <span key={tag} className={`text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/10 ${scenario.color}`}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Layout Preview */}
                <div className="flex rounded-lg overflow-hidden border border-white/10 bg-black/20 h-16">
                  {scenario.preview.zones.map((zone, i) => (
                    <div
                      key={i}
                      className={`${zone.size} ${zone.color} flex items-center justify-center border-r border-white/10 last:border-0`}
                    >
                      <span className="text-[8px] text-white/50 font-semibold text-center px-1 leading-tight">
                        {zone.label}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Description */}
                <p className="text-xs text-muted-foreground leading-relaxed">{scenario.description}</p>

                {/* CTA */}
                <Button
                  size="sm"
                  variant="ghost"
                  className={`w-full mt-auto gap-2 transition-all ${
                    isActive
                      ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                      : "bg-white/10 hover:bg-white/20 text-foreground border border-white/10"
                  }`}
                  disabled={isApplying}
                >
                  {isApplying ? (
                    <div className="h-4 w-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  ) : isActive ? (
                    <>
                      <Settings2 className="w-4 h-4" /> Configurar
                    </>
                  ) : (
                    <>
                      Customizar e Aplicar <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Configuration Modal */}
      <Dialog open={!!selectedScenario} onOpenChange={(open) => !open && setSelectedScenario(null)}>
        <DialogContent className="sm:max-w-[425px] bg-card border-border shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span>{selectedScenario?.emoji}</span>
              Configurar Cenário: {selectedScenario?.label}
            </DialogTitle>
            <DialogDescription>
              Personalize o que será exibido na tela para este cenário.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-4">
            {selectedScenario?.widgets.includes("weather") && (
              <div className="space-y-2">
                <Label htmlFor="city">📍 Cidade para o Clima</Label>
                <Input
                  id="city"
                  value={config.city}
                  onChange={(e) => setConfig({ ...config, city: e.target.value })}
                  placeholder="Ex: São Paulo"
                  className="bg-muted/50 border-border"
                />
              </div>
            )}

            {(selectedScenario?.widgets.includes("news") || selectedScenario?.widgets.includes("ticker")) && (
              <div className="space-y-2">
                <Label htmlFor="news">📰 Categoria de Notícias</Label>
                <Select
                  value={config.news}
                  onValueChange={(value) => setConfig({ ...config, news: value })}
                >
                  <SelectTrigger className="bg-muted/50 border-border">
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="technology">Tecnologia</SelectItem>
                    <SelectItem value="business">Negócios</SelectItem>
                    <SelectItem value="sports">Esportes</SelectItem>
                    <SelectItem value="general">Geral</SelectItem>
                    <SelectItem value="health">Saúde</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {selectedScenario?.widgets.includes("social") && (
              <div className="space-y-2">
                <Label htmlFor="instagram">📸 Usuário do Instagram</Label>
                <Input
                  id="instagram"
                  value={config.instagram}
                  onChange={(e) => setConfig({ ...config, instagram: e.target.value })}
                  placeholder="Ex: @seunegocio"
                  className="bg-muted/50 border-border"
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
              onClick={handleApply}
              disabled={applying !== null}
            >
              {applying ? "Aplicando..." : "Salvar e Aplicar Cenário ✨"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
