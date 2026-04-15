import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Save, CloudSun, TrendingUp, Rss, Clock, Instagram, QrCode, Camera, ExternalLink } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export interface WidgetConfig {
  clock: { enabled: boolean };
  weather: { enabled: boolean };
  news: { enabled: boolean };
  finance: { enabled: boolean };
  social: { enabled: boolean };
  qr: { enabled: boolean; default_url: string };
  camera: { enabled: boolean; label: string; url: string };
}

const DEFAULT_CONFIG: WidgetConfig = {
  clock: { enabled: true },
  weather: { enabled: true },
  news: { enabled: true },
  finance: { enabled: true },
  social: { enabled: true },
  qr: { enabled: true, default_url: "" },
  camera: { enabled: false, label: "Câmera 01", url: "" },
};

interface WidgetStoreProps {
  widgetConfig: WidgetConfig | null;
  instagramHandle: string;
  configClima: string;
  configNoticias: string;
  onSave: (wc: WidgetConfig, extras: { 
    instagram_handle?: string;
    config_clima?: string;
    config_noticias?: string;
  }) => Promise<void>;
}

export default function WidgetStore({ widgetConfig, instagramHandle, configClima, configNoticias, onSave }: WidgetStoreProps) {
  const { toast } = useToast();
  const [config, setConfig] = useState<WidgetConfig>(widgetConfig || DEFAULT_CONFIG);
  const [igHandle, setIgHandle] = useState(instagramHandle || "");
  const [clima, setClima] = useState(configClima || "");
  const [noticias, setNoticias] = useState(configNoticias || "technology");
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (widgetConfig) setConfig(widgetConfig);
  }, [widgetConfig]);

  useEffect(() => {
    setIgHandle(instagramHandle || "");
    setClima(configClima || "");
    setNoticias(configNoticias || "technology");
  }, [instagramHandle, configClima, configNoticias]);

  const update = <K extends keyof WidgetConfig>(key: K, value: Partial<WidgetConfig[K]>) => {
    setConfig(prev => ({ ...prev, [key]: { ...prev[key], ...value } }));
    setDirty(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(config, { 
        instagram_handle: config.social.enabled ? igHandle : "",
        config_clima: config.weather.enabled ? clima : "",
        config_noticias: config.news.enabled ? noticias : "",
      });
      setDirty(false);
      toast({ title: "✅ Widgets salvos com sucesso!" });
    } catch (err: any) {
      toast({ title: "❌ Erro ao salvar", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Grid de widgets */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        
        {/* Relógio */}
        <Card className={`border-border/50 transition-all ${config.clock.enabled ? "ring-1 ring-primary/20" : "opacity-70"}`}>
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-sky-500/10 text-sky-500 rounded-xl">
                <Clock className="w-6 h-6" />
              </div>
              <Switch
                checked={config.clock.enabled}
                onCheckedChange={(checked) => update("clock", { enabled: checked })}
              />
            </div>
            <h3 className="font-bold text-lg mb-1">Relógio Digital</h3>
            <p className="text-sm text-muted-foreground mb-4">Exibe o horário atual em tempo real na barra lateral.</p>
            <div className="text-xs font-mono bg-muted p-2 rounded text-muted-foreground truncate">
              ✅ Sempre ativo no modo Corporativo
            </div>
          </CardContent>
        </Card>

        {/* Clima */}
        <Card className={`border-border/50 transition-all ${config.weather.enabled ? "ring-1 ring-sky-500/20" : "opacity-70"}`}>
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-sky-500/10 text-sky-500 rounded-xl">
                <CloudSun className="w-6 h-6" />
              </div>
              <Switch
                checked={config.weather.enabled}
                onCheckedChange={(checked) => update("weather", { enabled: checked })}
              />
            </div>
            <h3 className="font-bold text-lg mb-1">Clima Global</h3>
            <p className="text-sm text-muted-foreground mb-3">Previsão do tempo automática para sua cidade.</p>
            {config.weather.enabled && (
              <div className="space-y-1">
                <label className="text-xs font-semibold">📍 Cidade</label>
                <Input
                  className="bg-card text-sm"
                  placeholder="Ex: São Paulo"
                  value={clima}
                  onChange={e => { setClima(e.target.value); setDirty(true); }}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notícias */}
        <Card className={`border-border/50 transition-all ${config.news.enabled ? "ring-1 ring-red-500/20" : "opacity-70"}`}>
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-red-500/10 text-red-500 rounded-xl">
                <Rss className="w-6 h-6" />
              </div>
              <Switch
                checked={config.news.enabled}
                onCheckedChange={(checked) => update("news", { enabled: checked })}
              />
            </div>
            <h3 className="font-bold text-lg mb-1">Ticker de Notícias</h3>
            <p className="text-sm text-muted-foreground mb-3">Feed de notícias no rodapé (Ticker).</p>
            {config.news.enabled && (
              <div className="space-y-1">
                <label className="text-xs font-semibold">📰 Categoria</label>
                <Select value={noticias} onValueChange={(val) => { setNoticias(val); setDirty(true); }}>
                  <SelectTrigger className="bg-card text-sm">
                    <SelectValue />
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
          </CardContent>
        </Card>

        {/* Finance */}
        <Card className={`border-border/50 transition-all ${config.finance.enabled ? "ring-1 ring-emerald-500/20" : "opacity-70"}`}>
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl">
                <TrendingUp className="w-6 h-6" />
              </div>
              <Switch
                checked={config.finance.enabled}
                onCheckedChange={(checked) => update("finance", { enabled: checked })}
              />
            </div>
            <h3 className="font-bold text-lg mb-1">Cotações (Finance)</h3>
            <p className="text-sm text-muted-foreground mb-4">Câmbios de moedas em tempo real (USD, EUR, BTC).</p>
            <div className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 p-2 rounded uppercase text-center">
              ✅ Ativo: BCB Market
            </div>
          </CardContent>
        </Card>

        {/* Instagram */}
        <Card className={`border-border/50 transition-all ${config.social.enabled ? "ring-1 ring-pink-500/20" : "opacity-70"}`}>
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-pink-500/10 text-pink-500 rounded-xl">
                <Instagram className="w-6 h-6" />
              </div>
              <Switch
                checked={config.social.enabled}
                onCheckedChange={(checked) => update("social", { enabled: checked })}
              />
            </div>
            <h3 className="font-bold text-lg mb-1">Mural Social</h3>
            <p className="text-sm text-muted-foreground mb-3">Fotos recentes da sua conta no Instagram.</p>
            {config.social.enabled && (
              <div className="space-y-1">
                <label className="text-xs font-semibold">Usuário do Instagram</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold text-sm">@</span>
                  <Input
                    className="pl-7 bg-card text-sm"
                    placeholder="suaempresa"
                    value={igHandle}
                    onChange={e => { setIgHandle(e.target.value.replace("@", "")); setDirty(true); }}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* QR Code */}
        <Card className={`border-border/50 transition-all ${config.qr.enabled ? "ring-1 ring-indigo-500/20" : "opacity-70"}`}>
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-xl">
                <QrCode className="w-6 h-6" />
              </div>
              <Switch
                checked={config.qr.enabled}
                onCheckedChange={(checked) => update("qr", { enabled: checked })}
              />
            </div>
            <h3 className="font-bold text-lg mb-1">QR Code Dinâmico</h3>
            <p className="text-sm text-muted-foreground mb-3">URL padrão ou configurada por cada mídia separadamente.</p>
            {config.qr.enabled && (
              <div className="space-y-1">
                <label className="text-xs font-semibold flex items-center gap-1">
                  <ExternalLink className="h-3 w-3" /> URL Padrão
                </label>
                <Input
                  className="bg-card text-sm"
                  placeholder="https://seusite.com.br"
                  value={config.qr.default_url}
                  onChange={e => { update("qr", { default_url: e.target.value }); setDirty(true); }}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Câmera */}
        <Card className={`border-border/50 transition-all ${config.camera.enabled ? "ring-1 ring-red-500/20" : "opacity-70"}`}>
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-red-500/10 text-red-500 rounded-xl">
                <Camera className="w-6 h-6" />
              </div>
              <Switch
                checked={config.camera.enabled}
                onCheckedChange={(checked) => update("camera", { enabled: checked })}
              />
            </div>
            <h3 className="font-bold text-lg mb-1">Câmera de Segurança</h3>
            <p className="text-sm text-muted-foreground mb-3">Espelha a imagem de câmeras RTSP/WebRTC direto na TV.</p>
            {config.camera.enabled && (
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Nome da Câmera</label>
                  <Input
                    className="bg-card text-sm"
                    placeholder="Ex: Câmera Playground"
                    value={config.camera.label}
                    onChange={e => { update("camera", { label: e.target.value }); setDirty(true); }}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold">URL do Stream</label>
                  <Input
                    className="bg-card text-sm"
                    placeholder="rtsp://192.168.1.100:554/stream"
                    value={config.camera.url}
                    onChange={e => { update("camera", { url: e.target.value }); setDirty(true); }}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Botão Salvar */}
      <div className="flex items-center justify-between border-t border-border/50 pt-6">
        <p className="text-xs text-muted-foreground">
          {dirty ? "⚡ Alterações não salvas" : "✅ Tudo salvo"}
        </p>
        <Button
          onClick={handleSave}
          disabled={saving || !dirty}
          className="gap-2 px-8 py-5 h-auto text-base font-semibold shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95 bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          {saving ? <div className="h-4 w-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Save className="h-5 w-5" />}
          Salvar Configurações ✨
        </Button>
      </div>
    </div>
  );
}
