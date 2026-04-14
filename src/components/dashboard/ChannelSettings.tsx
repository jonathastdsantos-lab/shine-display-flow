import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Save, CloudSun, Newspaper, Sparkles } from "lucide-react";
import type { ClientProfile } from "@/hooks/useDashboardData";
import { CityAutocomplete } from "./CityAutocomplete";
import { AINewsAssistant } from "./AINewsAssistant";

interface ChannelSettingsProps {
  profile: ClientProfile;
  setProfile: (p: ClientProfile) => void;
  onSave: (updates: Partial<ClientProfile>) => Promise<void>;
}

export default function ChannelSettings({ profile, setProfile, onSave }: ChannelSettingsProps) {
  const { toast } = useToast();

  const handleSave = async () => {
    await onSave({ config_clima: profile.config_clima, config_noticias: profile.config_noticias });
    toast({ title: "Configurações salvas!" });
  };

  return (
    <div className="max-w-4xl space-y-8 animate-fade-in pb-10">
      <div>
        <h2 className="font-display text-3xl font-bold tracking-tight">Configurações do Canal</h2>
        <p className="text-muted-foreground text-sm mt-1">Personalize os widgets e o conteúdo informativo que aparecerá nos seus players.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* CARD: CLIMA */}
        <Card className="border-border/50 shadow-sm overflow-hidden">
          <CardHeader className="bg-primary/5 pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-display flex items-center gap-2">
                <CloudSun className="h-5 w-5 text-primary" /> Previsão do Tempo
              </CardTitle>
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-xs font-bold text-primary">01</span>
              </div>
            </div>
            <CardDescription>O player exibirá a temperatura local e condições climáticas.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold flex items-center gap-2">
                Localização do Player
              </label>
              <CityAutocomplete 
                value={profile.config_clima} 
                onChange={(val) => setProfile({ ...profile, config_clima: val })} 
              />
              <p className="text-[10px] text-muted-foreground bg-muted/50 p-2 rounded-md italic">
                A temperatura será atualizada a cada 30 minutos automaticamente nos dispositivos sincronizados.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* CARD: NOTÍCIAS */}
        <Card className="border-border/50 shadow-sm overflow-hidden">
          <CardHeader className="bg-indigo-500/5 pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-display flex items-center gap-2">
                <Newspaper className="h-5 w-5 text-indigo-500" /> Ticker de Notícias
              </CardTitle>
              <div className="h-8 w-8 rounded-full bg-indigo-500/10 flex items-center justify-center">
                <span className="text-xs font-bold text-indigo-500">02</span>
              </div>
            </div>
            <CardDescription>RSS Feed dinâmico exibido na barra inferior do player.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold">Categoria ou Palavra-chave</label>
              <Input
                value={profile.config_noticias}
                onChange={(e) => setProfile({ ...profile, config_noticias: e.target.value })}
                placeholder="Ex: tecnologia, esportes, etc"
                className="bg-card"
              />
            </div>
            
            <AINewsAssistant 
              onSuggest={(keyword) => {
                // Se já tiver algo, adiciona vírgula, senão apenas coloca
                const current = profile.config_noticias.trim();
                const updated = current ? `${current}, ${keyword}` : keyword;
                setProfile({ ...profile, config_noticias: updated });
                toast({ 
                  title: "Sugestão Aplicada", 
                  description: `"${keyword}" adicionado à lista.` 
                });
              }} 
            />
          </CardContent>
        </Card>
      </div>

      <div className="pt-4 flex items-center justify-between border-t border-border/50">
        <div className="hidden sm:block">
          <p className="text-xs text-muted-foreground flex items-center gap-2">
            <Sparkles className="h-3 w-3 text-amber-500" /> Todas as alterações são aplicadas em tempo real via Cloud Sync.
          </p>
        </div>
        <Button onClick={handleSave} className="gap-2 px-8 py-6 h-auto text-lg font-semibold shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95">
          <Save className="h-5 w-5" /> Salvar Configurações
        </Button>
      </div>
    </div>
  );
}
