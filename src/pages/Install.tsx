import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Smartphone, Download, Apple, Share, Plus, CheckCircle2 } from "lucide-react";

export default function Install() {
  const [deferred, setDeferred] = useState<any>(null);
  const [installed, setInstalled] = useState(false);
  const [platform, setPlatform] = useState<"ios" | "android" | "desktop">("desktop");

  useEffect(() => {
    document.title = "Instalar SignageOS | App";
    const ua = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(ua)) setPlatform("ios");
    else if (/android/.test(ua)) setPlatform("android");

    const handler = (e: any) => {
      e.preventDefault();
      setDeferred(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => setInstalled(true));

    if (window.matchMedia("(display-mode: standalone)").matches) setInstalled(true);

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const triggerInstall = async () => {
    if (!deferred) return;
    deferred.prompt();
    const { outcome } = await deferred.userChoice;
    if (outcome === "accepted") setInstalled(true);
    setDeferred(null);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-background to-indigo-950/20 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full space-y-8">
        <header className="text-center space-y-3">
          <div className="inline-flex p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/30">
            <Smartphone className="w-8 h-8 text-indigo-500" />
          </div>
          <h1 className="font-display text-4xl font-bold">Instale o SignageOS</h1>
          <p className="text-muted-foreground">
            Acesse seu painel e suas telas direto do celular, como um app nativo.
          </p>
        </header>

        {installed ? (
          <Card className="border-emerald-500/30 bg-emerald-500/5">
            <CardContent className="p-8 text-center space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
              <h2 className="text-xl font-bold">App já instalado!</h2>
              <p className="text-sm text-muted-foreground">
                Abra o SignageOS direto do ícone na tela inicial do seu dispositivo.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {deferred && (
              <Card className="border-indigo-500/30 bg-indigo-500/5">
                <CardContent className="p-6 flex flex-col sm:flex-row items-center gap-4 justify-between">
                  <div>
                    <h3 className="font-bold text-lg">Instalação rápida disponível</h3>
                    <p className="text-sm text-muted-foreground">Toque para instalar agora.</p>
                  </div>
                  <Button onClick={triggerInstall} size="lg" className="gap-2 bg-indigo-600 hover:bg-indigo-700">
                    <Download className="w-5 h-5" /> Instalar agora
                  </Button>
                </CardContent>
              </Card>
            )}

            <div className="grid sm:grid-cols-2 gap-4">
              <Card className={platform === "ios" ? "ring-2 ring-indigo-500/40" : ""}>
                <CardContent className="p-6 space-y-3">
                  <div className="flex items-center gap-2 font-bold">
                    <Apple className="w-5 h-5" /> iPhone / iPad
                  </div>
                  <ol className="text-sm space-y-2 text-muted-foreground">
                    <li className="flex gap-2">
                      <span className="font-bold text-foreground">1.</span> Abra esta página no <strong>Safari</strong>.
                    </li>
                    <li className="flex gap-2">
                      <span className="font-bold text-foreground">2.</span> Toque em <Share className="inline w-4 h-4" /> <strong>Compartilhar</strong>.
                    </li>
                    <li className="flex gap-2">
                      <span className="font-bold text-foreground">3.</span> Escolha <Plus className="inline w-4 h-4" /> <strong>"Adicionar à Tela de Início"</strong>.
                    </li>
                  </ol>
                </CardContent>
              </Card>

              <Card className={platform === "android" ? "ring-2 ring-indigo-500/40" : ""}>
                <CardContent className="p-6 space-y-3">
                  <div className="flex items-center gap-2 font-bold">
                    <Smartphone className="w-5 h-5" /> Android
                  </div>
                  <ol className="text-sm space-y-2 text-muted-foreground">
                    <li className="flex gap-2">
                      <span className="font-bold text-foreground">1.</span> Abra no <strong>Chrome</strong>.
                    </li>
                    <li className="flex gap-2">
                      <span className="font-bold text-foreground">2.</span> Toque no menu <strong>⋮</strong> no topo.
                    </li>
                    <li className="flex gap-2">
                      <span className="font-bold text-foreground">3.</span> Toque em <strong>"Instalar app"</strong> ou "Adicionar à tela inicial".
                    </li>
                  </ol>
                </CardContent>
              </Card>
            </div>

            <p className="text-center text-xs text-muted-foreground">
              Funciona offline para visualização do dashboard. Notificações nativas disponíveis após a instalação.
            </p>
          </>
        )}
      </div>
    </main>
  );
}
