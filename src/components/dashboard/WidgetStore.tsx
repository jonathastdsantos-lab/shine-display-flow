import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Save, CloudSun, TrendingUp, Rss, Clock, Instagram, QrCode, Camera, ExternalLink } from "lucide-react";

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
  onSave: (wc: WidgetConfig, extras: { instagram_handle?: string }) => Promise<void>;
}

export default function WidgetStore({ widgetConfig, instagramHandle, configClima, configNoticias, onSave }: WidgetStoreProps) {
  const { toast } = useToast();
  const [config, setConfig] = useState<WidgetConfig>(widgetConfig || DEFAULT_CONFIG);
  const [igHandle, setIgHandle] = useState(instagramHandle || "");
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (widgetConfig) setConfig(widgetConfig);
  }, [widgetConfig]);

  useEffect(() => {
    setIgHandle(instagramHandle || "");
  }, [instagramHandle]);

  const update = <K extends keyof WidgetConfig>(key: K, value: Partial<WidgetConfig[K]>) => {
    setConfig(prev => ({ ...prev, [key]: { ...prev[key], ...value } }));
    setDirty(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(config, { instagram_handle: config.social.enabled ? igHandle : "" });
      setDirty(false);
      toast({ title: "✅ Widgets salvos com sucesso!" });
    } catch (err: any) {
      toast({ title: "❌ Erro ao salvar", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const widgets = [
    {
      key: "clock" as const,
      icon: Clock,
      color: "sky",
      title: "Relógio Digital",
      desc: "Exibe o horário atual em tempo real na barra lateral.",
      info: "✅ Sempre ativo no modo Corporativo",
    },
    {
      key: "weather" as const,
      icon: CloudSun,
      color: "sky",
      title: "Clima Global",
      desc: "Mostra a previsão do tempo para a cidade configurada.",
      info: configClima ? `📍 Cidade: ${configClima}` : "⚠️ Configure em Config. do Canal",
    },
    {
      key: "news" as const,
      icon: Rss,
      color: "red",
      title: "Ticker de Notícias",
      desc: "Alimenta o rodapé com notícias de portais como G1, CNN.",
      info: configNoticias ? `📰 Feed: ${configNoticias}` : "⚠️ Configure em Config. do Canal",
    },
    {
      key: "finance" as const,
      icon: TrendingUp,
      color: "emerald",
      title: "Cotações (Finance)",
      desc: "Tabela rotativa de câmbio de moedas (USD, EUR, BTC).",
      info: "✅ Integração: BCB Market",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Grid de widgets simples */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {widgets.map(w => (
          <Card key={w.key} className={`border-border/50 transition-all ${config[w.key].enabled ? "ring-1 ring-primary/20" : "opacity-70"}`}>
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 bg-${w.color}-500/10 text-${w.color}-500 rounded-xl`}>
                  <w.icon className="w-6 h-6" />
                </div>
                <Switch
                  checked={config[w.key].enabled}
                  onCheckedChange={(checked) => update(w.key, { enabled: checked } as any)}
                />
              </div>
              <h3 className="font-bold text-lg mb-1">{w.title}</h3>
              <p className="text-sm text-muted-foreground mb-4">{w.desc}</p>
              <div className="text-xs font-mono bg-muted p-2 rounded text-muted-foreground truncate">
                {w.info}
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Instagram - com campo editável */}
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
            <h3 className="font-bold text-lg mb-1">Mural Social (Instagram)</h3>
            <p className="text-sm text-muted-foreground mb-3">Exibe posts recentes do Instagram no widget lateral.</p>
            {config.social.enabled && (
              <div className="space-y-2">
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
                <p className="text-[10px] text-muted-foreground">O perfil precisa ser <strong>público</strong>.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* QR Code - com campo de URL padrão */}
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
            <p className="text-sm text-muted-foreground mb-3">QR Code exibido no player. Use a URL padrão ou configure por mídia.</p>
            {config.qr.enabled && (
              <div className="space-y-2">
                <label className="text-xs font-semibold flex items-center gap-1">
                  <ExternalLink className="h-3 w-3" /> URL Padrão do QR Code
                </label>
                <Input
                  className="bg-card text-sm"
                  placeholder="https://seusite.com.br"
                  value={config.qr.default_url}
                  onChange={e => { update("qr", { default_url: e.target.value }); }}
                />
                <p className="text-[10px] text-muted-foreground">Quando a mídia não tiver link próprio, esta URL será usada.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Câmera - com campos de label e URL */}
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
                    onChange={e => update("camera", { label: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold">URL do Stream (RTSP/HLS)</label>
                  <Input
                    className="bg-card text-sm"
                    placeholder="rtsp://192.168.1.100:554/stream"
                    value={config.camera.url}
                    onChange={e => update("camera", { url: e.target.value })}
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
          className="gap-2 px-8 py-5 h-auto text-base font-semibold shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95"
        >
          {saving ? <div className="h-4 w-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Save className="h-5 w-5" />}
          Salvar Widgets
        </Button>
      </div>
    </div>
  );
}
