import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Save, CloudSun, TrendingUp, Rss, Clock, Instagram, QrCode, Camera, ExternalLink, Wifi, WifiOff, Loader2, CheckCircle2, Sparkles, MapPin } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { SEGMENT_LABELS, type BusinessSegment } from "@/utils/ContentFeed";

export interface WidgetConfig {
  clock: { enabled: boolean };
  weather: { enabled: boolean };
  news: { enabled: boolean };
  finance: { enabled: boolean };
  social: { enabled: boolean };
  qr: { enabled: boolean; default_url: string };
  camera: { enabled: boolean; label: string; url: string };
  content_feed: { enabled: boolean; segment: BusinessSegment };
}

const DEFAULT_CONFIG: WidgetConfig = {
  clock: { enabled: true },
  weather: { enabled: true },
  news: { enabled: true },
  finance: { enabled: true },
  social: { enabled: true },
  qr: { enabled: true, default_url: "" },
  camera: { enabled: false, label: "Câmera 01", url: "" },
  content_feed: { enabled: false, segment: "corporativo" },
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

// City autocomplete using the IBGE API (free, covers all Brazilian municipalities)
function CityAutocomplete({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setQuery(value); }, [value]);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) { setSuggestions([]); setOpen(false); return; }
    setLoading(true);
    try {
      // Use Open-Meteo geocoding API (free, supports Brazilian cities)
      const res = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=8&language=pt&format=json`
      );
      const data = await res.json();
      if (data?.results) {
        const cities = data.results
          .filter((r: any) => r.country_code === "BR" || !q.includes(","))
          .slice(0, 8)
          .map((r: any) => {
            const parts = [r.name];
            if (r.admin1) parts.push(r.admin1);
            if (r.country_code !== "BR") parts.push(r.country);
            return parts.join(", ");
          });
        setSuggestions(cities);
        setOpen(cities.length > 0);
      } else {
        setSuggestions([]);
        setOpen(false);
      }
    } catch {
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleInput = (v: string) => {
    setQuery(v);
    onChange(v);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => search(v), 300);
  };

  const handleSelect = (city: string) => {
    // Extract just the city name (before first comma)
    const cityName = city.split(",")[0].trim();
    setQuery(cityName);
    onChange(cityName);
    setOpen(false);
    setSuggestions([]);
  };

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <Input
          className="bg-card text-sm pl-9 pr-8"
          placeholder="Digite a cidade... Ex: São Paulo"
          value={query}
          onChange={e => handleInput(e.target.value)}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          autoComplete="off"
        />
        {loading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground animate-spin" />}
      </div>
      {open && suggestions.length > 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-xl overflow-hidden">
          {suggestions.map((city, i) => (
            <button
              key={i}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted/80 transition-colors text-left"
              onMouseDown={() => handleSelect(city)}
            >
              <MapPin className="w-3.5 h-3.5 text-sky-500 shrink-0" />
              <span className="truncate">{city}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Camera URL tester
function CameraURLTester({ url, onStatusChange }: { url: string; onStatusChange: (ok: boolean) => void }) {
  const [status, setStatus] = useState<"idle" | "testing" | "ok" | "fail">("idle");

  const test = async () => {
    if (!url) return;
    setStatus("testing");
    const lower = url.toLowerCase();
    
    // RTSP cannot be tested from browser — flag it
    if (lower.startsWith("rtsp://") || lower.startsWith("rtmp://")) {
      setStatus("fail");
      onStatusChange(false);
      return;
    }

    // Try to fetch the URL (works for HTTP streams)
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(url, { method: "HEAD", signal: controller.signal, mode: "no-cors" });
      clearTimeout(timeout);
      setStatus("ok");
      onStatusChange(true);
    } catch (e: any) {
      if (e.name === "AbortError") {
        setStatus("fail");
        onStatusChange(false);
      } else {
        // no-cors fetch: if we get here without abort, the server responded (even if opaque)
        setStatus("ok");
        onStatusChange(true);
      }
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        variant="outline"
        className="h-8 text-xs gap-1.5"
        onClick={test}
        disabled={!url || status === "testing"}
      >
        {status === "testing" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wifi className="w-3.5 h-3.5" />}
        {status === "testing" ? "Testando..." : "Testar Conexão"}
      </Button>
      {status === "ok" && (
        <div className="flex items-center gap-1 text-emerald-500 text-xs">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Acessível
        </div>
      )}
      {status === "fail" && (
        <div className="flex items-center gap-1 text-red-400 text-xs">
          <WifiOff className="w-3.5 h-3.5" />
          Sem resposta
        </div>
      )}
    </div>
  );
}

export default function WidgetStore({ widgetConfig, instagramHandle, configClima, configNoticias, onSave }: WidgetStoreProps) {
  const { toast } = useToast();
  const [config, setConfig] = useState<WidgetConfig>({ ...DEFAULT_CONFIG, ...(widgetConfig || {}) });
  const [igHandle, setIgHandle] = useState(instagramHandle || "");
  const [clima, setClima] = useState(configClima || "");
  const [noticias, setNoticias] = useState(configNoticias || "technology");
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (widgetConfig) setConfig({ ...DEFAULT_CONFIG, ...widgetConfig });
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
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">

        {/* Relógio */}
        <Card className={`border-border/50 transition-all ${config.clock.enabled ? "ring-1 ring-sky-500/20" : "opacity-70"}`}>
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-sky-500/10 text-sky-500 rounded-xl"><Clock className="w-6 h-6" /></div>
              <Switch checked={config.clock.enabled} onCheckedChange={checked => update("clock", { enabled: checked })} />
            </div>
            <h3 className="font-bold text-lg mb-1">Relógio Digital</h3>
            <p className="text-sm text-muted-foreground mb-4">Exibe horário e data em tempo real na tela.</p>
            <div className="text-xs font-mono bg-muted p-2 rounded text-muted-foreground">✅ Inclui data por extenso</div>
          </CardContent>
        </Card>

        {/* Clima com Autocomplete */}
        <Card className={`border-border/50 transition-all ${config.weather.enabled ? "ring-1 ring-sky-500/20" : "opacity-70"}`}>
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-sky-500/10 text-sky-500 rounded-xl"><CloudSun className="w-6 h-6" /></div>
              <Switch checked={config.weather.enabled} onCheckedChange={checked => update("weather", { enabled: checked })} />
            </div>
            <h3 className="font-bold text-lg mb-1">Clima Global</h3>
            <p className="text-sm text-muted-foreground mb-3">Previsão automática para qualquer cidade do mundo.</p>
            {config.weather.enabled && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold">📍 Cidade</label>
                <CityAutocomplete value={clima} onChange={v => { setClima(v); setDirty(true); }} />
                {clima && <p className="text-[10px] text-emerald-500">✓ Configurado: {clima}</p>}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notícias */}
        <Card className={`border-border/50 transition-all ${config.news.enabled ? "ring-1 ring-red-500/20" : "opacity-70"}`}>
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-red-500/10 text-red-500 rounded-xl"><Rss className="w-6 h-6" /></div>
              <Switch checked={config.news.enabled} onCheckedChange={checked => update("news", { enabled: checked })} />
            </div>
            <h3 className="font-bold text-lg mb-1">Ticker de Notícias</h3>
            <p className="text-sm text-muted-foreground mb-3">Feed de notícias rolando no rodapé da tela.</p>
            {config.news.enabled && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold">📰 Categoria</label>
                <Select value={noticias} onValueChange={val => { setNoticias(val); setDirty(true); }}>
                  <SelectTrigger className="bg-card text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="technology">🖥️ Tecnologia</SelectItem>
                    <SelectItem value="business">💼 Negócios</SelectItem>
                    <SelectItem value="sports">⚽ Esportes</SelectItem>
                    <SelectItem value="general">📰 Geral</SelectItem>
                    <SelectItem value="health">🏥 Saúde</SelectItem>
                    <SelectItem value="science">🔬 Ciência</SelectItem>
                    <SelectItem value="entertainment">🎬 Entretenimento</SelectItem>
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
              <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl"><TrendingUp className="w-6 h-6" /></div>
              <Switch checked={config.finance.enabled} onCheckedChange={checked => update("finance", { enabled: checked })} />
            </div>
            <h3 className="font-bold text-lg mb-1">Cotações (Finance)</h3>
            <p className="text-sm text-muted-foreground mb-4">Câmbios de moedas em tempo real (USD, EUR, BTC).</p>
            <div className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 p-2 rounded uppercase text-center">✅ Fonte: BCB Market</div>
          </CardContent>
        </Card>

        {/* Content Feed — NEW */}
        <Card className={`border-border/50 transition-all sm:col-span-2 ${config.content_feed?.enabled ? "ring-1 ring-amber-500/20" : "opacity-70"}`}>
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl"><Sparkles className="w-6 h-6" /></div>
                <div>
                  <h3 className="font-bold text-lg flex items-center gap-2">
                    Dicas & Tendências
                    <Badge className="text-[9px] bg-amber-500/10 text-amber-500 border-amber-500/30">NOVO</Badge>
                  </h3>
                  <p className="text-sm text-muted-foreground">Conteúdo segmentado — dicas e tendências do seu ramo automaticamente.</p>
                </div>
              </div>
              <Switch
                checked={config.content_feed?.enabled || false}
                onCheckedChange={checked => update("content_feed", { enabled: checked })}
              />
            </div>
            {config.content_feed?.enabled && (
              <div className="space-y-3">
                <label className="text-xs font-semibold">🏢 Segmento de Negócio</label>
                <Select
                  value={config.content_feed?.segment || "corporativo"}
                  onValueChange={val => { update("content_feed", { segment: val as BusinessSegment }); setDirty(true); }}
                >
                  <SelectTrigger className="bg-card"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(SEGMENT_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg">
                  <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                    ✨ Dicas, curiosidades e tendências do segmento selecionado rotacionarão automaticamente na tela, engajando quem aguarda atendimento.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Instagram / Mural Social */}
        <Card className={`border-border/50 transition-all ${config.social.enabled ? "ring-1 ring-pink-500/20" : "opacity-70"}`}>
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-pink-500/10 text-pink-500 rounded-xl"><Instagram className="w-6 h-6" /></div>
              <Switch checked={config.social.enabled} onCheckedChange={checked => update("social", { enabled: checked })} />
            </div>
            <h3 className="font-bold text-lg mb-1">Mural Social</h3>
            <p className="text-sm text-muted-foreground mb-3">Exibe posts recentes da conta Instagram configurada.</p>
            {config.social.enabled && (
              <div className="space-y-1.5">
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
                {igHandle && (
                  <a
                    href={`https://instagram.com/${igHandle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-pink-500 flex items-center gap-1 hover:underline"
                  >
                    <ExternalLink className="w-3 h-3" /> Ver perfil @{igHandle}
                  </a>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* QR Code */}
        <Card className={`border-border/50 transition-all ${config.qr.enabled ? "ring-1 ring-indigo-500/20" : "opacity-70"}`}>
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-xl"><QrCode className="w-6 h-6" /></div>
              <Switch checked={config.qr.enabled} onCheckedChange={checked => update("qr", { enabled: checked })} />
            </div>
            <h3 className="font-bold text-lg mb-1">QR Code Dinâmico</h3>
            <p className="text-sm text-muted-foreground mb-3">URL padrão ou configurada por cada mídia separadamente.</p>
            {config.qr.enabled && (
              <div className="space-y-1.5">
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

        {/* Câmera com tester */}
        <Card className={`border-border/50 transition-all sm:col-span-2 ${config.camera.enabled ? "ring-1 ring-red-500/20" : "opacity-70"}`}>
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-red-500/10 text-red-500 rounded-xl"><Camera className="w-6 h-6" /></div>
                <div>
                  <h3 className="font-bold text-lg">Câmera de Segurança</h3>
                  <p className="text-sm text-muted-foreground">Suporte a MJPEG, HLS e snapshots HTTP.</p>
                </div>
              </div>
              <Switch checked={config.camera.enabled} onCheckedChange={checked => update("camera", { enabled: checked })} />
            </div>
            {config.camera.enabled && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold">Nome da Câmera</label>
                  <Input
                    className="bg-card text-sm"
                    placeholder="Ex: Câmera Entrada"
                    value={config.camera.label}
                    onChange={e => { update("camera", { label: e.target.value }); setDirty(true); }}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold">URL do Stream</label>
                  <Input
                    className="bg-card text-sm"
                    placeholder="http://192.168.1.100/video ou https://cam.exemplo.com/stream.m3u8"
                    value={config.camera.url}
                    onChange={e => { update("camera", { url: e.target.value }); setDirty(true); }}
                  />
                </div>
                <CameraURLTester url={config.camera.url} onStatusChange={() => {}} />

                {/* Protocol guide */}
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {[
                    { proto: "MJPEG/HTTP", eg: "http://cam.local/video", ok: true },
                    { proto: "HLS (.m3u8)", eg: "https://cam.local/stream.m3u8", ok: true },
                    { proto: "RTSP", eg: "rtsp://192.168.1.x/...", ok: false },
                  ].map(p => (
                    <div key={p.proto} className={`p-2 rounded-lg border text-[10px] ${p.ok ? "border-emerald-500/20 bg-emerald-500/5" : "border-red-500/20 bg-red-500/5"}`}>
                      <div className={`font-bold mb-0.5 ${p.ok ? "text-emerald-500" : "text-red-400"}`}>
                        {p.ok ? "✓" : "⚠"} {p.proto}
                      </div>
                      <code className="text-[9px] text-muted-foreground break-all">{p.eg}</code>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-muted-foreground">⚠️ RTSP requer conversão via proxy (ffmpeg ou rtsp-simple-server) antes de chegar ao browser.</p>
              </div>
            )}
          </CardContent>
        </Card>

      </div>

      {/* Salvar */}
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
