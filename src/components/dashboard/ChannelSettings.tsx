import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Save, CloudSun, Newspaper } from "lucide-react";
import type { ClientProfile } from "@/hooks/useDashboardData";

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
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="font-display text-2xl font-bold">Configurações do Canal</h2>
        <p className="text-muted-foreground text-sm mt-1">Defina os widgets que aparecem no player</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-display flex items-center gap-2">
              <CloudSun className="h-5 w-5 text-primary" /> Previsão do Tempo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Cidade</label>
              <Input
                value={profile.config_clima}
                onChange={(e) => setProfile({ ...profile, config_clima: e.target.value })}
                placeholder="Ex: São Paulo, Rio de Janeiro"
              />
            </div>
            <p className="text-xs text-muted-foreground">A previsão será exibida na barra lateral do player</p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-display flex items-center gap-2">
              <Newspaper className="h-5 w-5 text-primary" /> Ticker de Notícias
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Categoria</label>
              <Input
                value={profile.config_noticias}
                onChange={(e) => setProfile({ ...profile, config_noticias: e.target.value })}
                placeholder="Ex: technology, sports, business"
              />
            </div>
            <p className="text-xs text-muted-foreground">Notícias exibidas no rodapé do player</p>
          </CardContent>
        </Card>
      </div>

      <Button onClick={handleSave} className="gap-2">
        <Save className="h-4 w-4" /> Salvar Configurações
      </Button>
    </div>
  );
}
