import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Save, CloudSun, Newspaper, Sparkles, Instagram, Link2, Link2Off, CheckCircle2, AlertCircle } from "lucide-react";
import type { ClientProfile } from "@/hooks/useDashboardData";
import { CityAutocomplete } from "./CityAutocomplete";
import { AINewsAssistant } from "./AINewsAssistant";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface ChannelSettingsProps {
  profile: ClientProfile;
  setProfile: (p: ClientProfile) => void;
  onSave: (updates: Partial<ClientProfile>) => Promise<void>;
}

export default function ChannelSettings({ profile, setProfile, onSave }: ChannelSettingsProps) {
  const { toast } = useToast();
  const [igHandle, setIgHandle] = React.useState(profile.instagram_handle || "");
  const [igConnected, setIgConnected] = React.useState(!!profile.instagram_handle);
  const [igConnecting, setIgConnecting] = React.useState(false);

  const handleSave = async () => {
    try {
      await onSave({ 
        config_clima: profile.config_clima, 
        config_noticias: profile.config_noticias,
        instagram_handle: igConnected ? igHandle : "",
      });
      toast({ title: "✅ Configurações salvas com sucesso!" });
    } catch (err: any) {
      toast({ 
        title: "❌ Erro ao salvar", 
        description: err.message || "Verifique o console para mais detalhes.",
        variant: "destructive" 
      });
    }
  };

  const handleConnectInstagram = async () => {
    if (!igHandle.trim()) {
      toast({ title: "Informe o @usuário do Instagram", variant: "destructive" });
      return;
    }
    setIgConnecting(true);
    // Simula verificação de conexão (substituir por OAuth real futuramente)
    await new Promise(r => setTimeout(r, 1400));
    setIgConnected(true);
    setIgConnecting(false);
    setProfile({ ...profile, instagram_handle: igHandle.trim() });
    toast({ 
      title: "Instagram Conectado! 🎉", 
      description: `O perfil @${igHandle} foi vinculado ao Mural Social.` 
    });
  };

  const handleDisconnect = () => {
    setIgConnected(false);
    setIgHandle("");
    setProfile({ ...profile, instagram_handle: "" });
    toast({ title: "Instagram desconectado", description: "O Mural Social foi desativado." });
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

      {/* CARD: INSTAGRAM (largura total) */}
      <Card className="border-border/50 shadow-sm overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-pink-500/5 via-purple-500/5 to-orange-500/5 pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-display flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-pink-500 to-orange-400">
                <Instagram className="h-4 w-4 text-white" />
              </div>
              Mural Social — Instagram
            </CardTitle>
            <div className="flex items-center gap-2">
              {igConnected ? (
                <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 flex items-center gap-1.5">
                  <CheckCircle2 className="h-3 w-3" /> Conectado
                </Badge>
              ) : (
                <Badge variant="outline" className="text-muted-foreground flex items-center gap-1.5">
                  <AlertCircle className="h-3 w-3" /> Desconectado
                </Badge>
              )}
              <div className="h-8 w-8 rounded-full bg-pink-500/10 flex items-center justify-center">
                <span className="text-xs font-bold text-pink-500">03</span>
              </div>
            </div>
          </div>
          <CardDescription>Exiba posts recentes do seu Instagram no widget lateral do player.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {igConnected ? (
            /* ESTADO: CONECTADO */
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-pink-500 to-orange-400 flex items-center justify-center text-white text-xl font-bold shrink-0">
                  {igHandle[0]?.toUpperCase() || "I"}
                </div>
                <div>
                  <p className="font-bold text-base">@{igHandle}</p>
                  <p className="text-xs text-muted-foreground">Mural Social ativo nos players</p>
                  <div className="flex gap-2 mt-1.5">
                    <Badge variant="outline" className="text-[9px] h-4 border-emerald-500/30 text-emerald-600 bg-emerald-500/5">
                      ● Posts sincronizados
                    </Badge>
                    <Badge variant="outline" className="text-[9px] h-4">
                      Público
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 opacity-60">
                {[1,2,3].map(i => (
                  <div key={i} className="aspect-square rounded-lg bg-gradient-to-br from-pink-500/10 to-orange-400/10 border border-pink-500/10 flex items-center justify-center">
                    <Instagram className="h-6 w-6 text-pink-400/50" />
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground italic text-center">Os 3 posts mais recentes serão rotacionados no player.</p>

              <Separator />
              <Button 
                variant="outline" 
                size="sm" 
                className="text-red-500 border-red-500/20 hover:bg-red-500/5 w-full gap-2"
                onClick={handleDisconnect}
              >
                <Link2Off className="h-4 w-4" /> Desconectar Instagram
              </Button>
            </div>
          ) : (
            /* ESTADO: DESCONECTADO */
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row gap-4 items-start">
                <div className="flex-1 space-y-2">
                  <label className="text-sm font-semibold">Usuário do Instagram</label>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold text-sm">@</span>
                      <Input 
                        className="pl-7 bg-card"
                        placeholder="suaempresa"
                        value={igHandle}
                        onChange={e => setIgHandle(e.target.value.replace("@", ""))}
                        onKeyDown={e => e.key === "Enter" && handleConnectInstagram()}
                      />
                    </div>
                    <Button
                      onClick={handleConnectInstagram}
                      disabled={igConnecting || !igHandle.trim()}
                      className="shrink-0 bg-gradient-to-r from-pink-600 to-orange-500 hover:from-pink-700 hover:to-orange-600 text-white border-0 gap-2"
                    >
                      {igConnecting ? (
                        <div className="h-4 w-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Link2 className="h-4 w-4" />
                      )}
                      {igConnecting ? "Conectando..." : "Conectar"}
                    </Button>
                  </div>
                  <p className="text-[10px] text-muted-foreground">O perfil precisa ser <strong>público</strong> para que os posts sejam exibidos.</p>
                </div>
              </div>

              <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">Aviso de Privacidade Instagram</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      O Mural Social exibe posts públicos do perfil informado. A integração com OAuth completo (acesso privado) estará disponível em breve.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

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


