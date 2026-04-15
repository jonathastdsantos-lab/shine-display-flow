import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Check, Sparkles, ChevronRight, Settings2, Loader2 } from "lucide-react";
import type { ClientProfile } from "@/hooks/useDashboardData";
import { supabase } from "@/integrations/supabase/client";
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
  shadow_color: string;
  tags: string[];
  config: Partial<ClientProfile>;
  widgets: string[];
  preview: { zones: { label: string; size: string; color: string }[] };
}

export default function ScenarioWizard({ profile, onSave }: ScenarioWizardProps) {
  const { toast } = useToast();
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState<string | null>(null);
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);
  const [config, setConfig] = useState({
    city: profile.config_clima || "São Paulo",
    news: profile.config_noticias || "technology",
    instagram: profile.instagram_handle || "",
  });

  const loadScenarios = async () => {
    if (!profile?.user_id) {
      // Se não temos o ID do usuário ainda, buscamos apenas os globais para não quebrar a query
      try {
        const { data, error } = await supabase
          .from("scenarios")
          .select("*")
          .eq("is_global", true)
          .order("created_at", { ascending: false });
        if (!error) setScenarios(data || []);
      } catch (e) {
        console.warn("Aguardando ID do usuário para busca completa...");
      }
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("scenarios")
        .select("*")
        .or(`client_id.eq.${profile.user_id},is_global.eq.true`)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setScenarios(data || []);
    } catch (err: any) {
      console.error("Erro ao carregar cenários:", err);
      toast({
        title: "Erro ao carregar cenários",
        description: "Certifique-se que as tabelas do banco de dados foram criadas.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadScenarios();
  }, [profile.user_id]);

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
        {loading ? (
          <div className="col-span-full flex flex-col items-center justify-center py-20 animate-pulse">
            <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
            <p className="text-muted-foreground font-medium">Carregando cenários inteligentes...</p>
          </div>
        ) : scenarios.length === 0 ? (
          <div className="col-span-full py-10 text-center border-2 border-dashed border-border/50 rounded-2xl">
            <p className="text-muted-foreground italic">Nenhum cenário customizado disponível para sua conta.</p>
          </div>
        ) : scenarios.map((scenario) => {
          const isActive = profile.template === scenario.template;
          const isApplying = applying === scenario.id;

          return (
            <div
              key={scenario.id}
              onClick={() => !isApplying && openConfig(scenario)}
              className={`relative flex flex-col rounded-2xl border-2 cursor-pointer transition-all duration-300 overflow-hidden group
                ${isActive
                  ? "border-indigo-500 shadow-lg shadow-indigo-500/20"
                  : "border-border/40 hover:border-white/20 hover:shadow-xl hover:-translate-y-0.5"
                } ${scenario.shadow_color}`}
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
