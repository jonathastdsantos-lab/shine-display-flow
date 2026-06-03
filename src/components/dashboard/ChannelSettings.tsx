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
import { useTranslation, Trans } from "react-i18next";

interface ChannelSettingsProps {
  profile: ClientProfile;
  setProfile: (p: ClientProfile) => void;
  onSave: (updates: Partial<ClientProfile>) => Promise<void>;
}

export default function ChannelSettings({ profile, setProfile, onSave }: ChannelSettingsProps) {
  const { t } = useTranslation();
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
      toast({ title: t("channelSettings.footer.saveSuccess") });
    } catch (err: any) {
      toast({
        title: t("channelSettings.footer.saveError"),
        description: err.message || t("channelSettings.footer.saveErrorDefault"),
        variant: "destructive",
      });
    }
  };

  const handleConnectInstagram = async () => {
    if (!igHandle.trim()) {
      toast({ title: t("channelSettings.instagram.informHandleError"), variant: "destructive" });
      return;
    }
    setIgConnecting(true);
    await new Promise((r) => setTimeout(r, 1400));
    setIgConnected(true);
    setIgConnecting(false);
    setProfile({ ...profile, instagram_handle: igHandle.trim() });
    toast({
      title: t("channelSettings.instagram.connectedTitle"),
      description: t("channelSettings.instagram.connectedDescription", { handle: igHandle }),
    });
  };

  const handleDisconnect = () => {
    setIgConnected(false);
    setIgHandle("");
    setProfile({ ...profile, instagram_handle: "" });
    toast({
      title: t("channelSettings.instagram.disconnectedTitle"),
      description: t("channelSettings.instagram.disconnectedDescription"),
    });
  };

  return (
    <div className="max-w-4xl space-y-8 animate-fade-in pb-10">
      <div>
        <h2 className="font-display text-3xl font-bold tracking-tight">{t("channelSettings.title")}</h2>
        <p className="text-muted-foreground text-sm mt-1">{t("channelSettings.subtitle")}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-border/50 shadow-sm overflow-hidden">
          <CardHeader className="bg-primary/5 pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-display flex items-center gap-2">
                <CloudSun className="h-5 w-5 text-primary" /> {t("channelSettings.weather.title")}
              </CardTitle>
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-xs font-bold text-primary">01</span>
              </div>
            </div>
            <CardDescription>{t("channelSettings.weather.description")}</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold flex items-center gap-2">
                {t("channelSettings.weather.locationLabel")}
              </label>
              <CityAutocomplete
                value={profile.config_clima}
                onChange={(val) => setProfile({ ...profile, config_clima: val })}
              />
              <p className="text-[10px] text-muted-foreground bg-muted/50 p-2 rounded-md italic">
                {t("channelSettings.weather.hint")}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm overflow-hidden">
          <CardHeader className="bg-indigo-500/5 pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-display flex items-center gap-2">
                <Newspaper className="h-5 w-5 text-indigo-500" /> {t("channelSettings.news.title")}
              </CardTitle>
              <div className="h-8 w-8 rounded-full bg-indigo-500/10 flex items-center justify-center">
                <span className="text-xs font-bold text-indigo-500">02</span>
              </div>
            </div>
            <CardDescription>{t("channelSettings.news.description")}</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold">{t("channelSettings.news.categoryLabel")}</label>
              <Input
                value={profile.config_noticias}
                onChange={(e) => setProfile({ ...profile, config_noticias: e.target.value })}
                placeholder={t("channelSettings.news.categoryPlaceholder")}
                className="bg-card"
              />
            </div>

            <AINewsAssistant
              onSuggest={(keyword) => {
                const current = profile.config_noticias.trim();
                const updated = current ? `${current}, ${keyword}` : keyword;
                setProfile({ ...profile, config_noticias: updated });
                toast({
                  title: t("channelSettings.news.suggestionAppliedTitle"),
                  description: t("channelSettings.news.suggestionAppliedDescription", { keyword }),
                });
              }}
            />
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50 shadow-sm overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-pink-500/5 via-purple-500/5 to-orange-500/5 pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-display flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-pink-500 to-orange-400">
                <Instagram className="h-4 w-4 text-white" />
              </div>
              {t("channelSettings.instagram.title")}
            </CardTitle>
            <div className="flex items-center gap-2">
              {igConnected ? (
                <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 flex items-center gap-1.5">
                  <CheckCircle2 className="h-3 w-3" /> {t("channelSettings.instagram.connected")}
                </Badge>
              ) : (
                <Badge variant="outline" className="text-muted-foreground flex items-center gap-1.5">
                  <AlertCircle className="h-3 w-3" /> {t("channelSettings.instagram.disconnected")}
                </Badge>
              )}
              <div className="h-8 w-8 rounded-full bg-pink-500/10 flex items-center justify-center">
                <span className="text-xs font-bold text-pink-500">03</span>
              </div>
            </div>
          </div>
          <CardDescription>{t("channelSettings.instagram.description")}</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {igConnected ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-pink-500 to-orange-400 flex items-center justify-center text-white text-xl font-bold shrink-0">
                  {igHandle[0]?.toUpperCase() || "I"}
                </div>
                <div>
                  <p className="font-bold text-base">@{igHandle}</p>
                  <p className="text-xs text-muted-foreground">{t("channelSettings.instagram.activeLabel")}</p>
                  <div className="flex gap-2 mt-1.5">
                    <Badge variant="outline" className="text-[9px] h-4 border-emerald-500/30 text-emerald-600 bg-emerald-500/5">
                      {t("channelSettings.instagram.postsSynced")}
                    </Badge>
                    <Badge variant="outline" className="text-[9px] h-4">
                      {t("channelSettings.instagram.public")}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 opacity-60">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="aspect-square rounded-lg bg-gradient-to-br from-pink-500/10 to-orange-400/10 border border-pink-500/10 flex items-center justify-center">
                    <Instagram className="h-6 w-6 text-pink-400/50" />
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground italic text-center">{t("channelSettings.instagram.rotateHint")}</p>

              <Separator />
              <Button
                variant="outline"
                size="sm"
                className="text-red-500 border-red-500/20 hover:bg-red-500/5 w-full gap-2"
                onClick={handleDisconnect}
              >
                <Link2Off className="h-4 w-4" /> {t("channelSettings.instagram.disconnectButton")}
              </Button>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row gap-4 items-start">
                <div className="flex-1 space-y-2">
                  <label className="text-sm font-semibold">{t("channelSettings.instagram.handleLabel")}</label>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold text-sm">@</span>
                      <Input
                        className="pl-7 bg-card"
                        placeholder={t("channelSettings.instagram.handlePlaceholder")}
                        value={igHandle}
                        onChange={(e) => setIgHandle(e.target.value.replace("@", ""))}
                        onKeyDown={(e) => e.key === "Enter" && handleConnectInstagram()}
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
                      {igConnecting ? t("common.connecting") : t("common.connect")}
                    </Button>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    <Trans i18nKey="channelSettings.instagram.publicHint" components={{ strong: <strong /> }} />
                  </p>
                </div>
              </div>

              <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">{t("channelSettings.instagram.privacyTitle")}</p>
                    <p className="text-xs text-muted-foreground mt-1">{t("channelSettings.instagram.privacyBody")}</p>
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
            <Sparkles className="h-3 w-3 text-amber-500" /> {t("channelSettings.footer.hint")}
          </p>
        </div>
        <Button onClick={handleSave} className="gap-2 px-8 py-6 h-auto text-lg font-semibold shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95">
          <Save className="h-5 w-5" /> {t("channelSettings.footer.saveButton")}
        </Button>
      </div>
    </div>
  );
}
