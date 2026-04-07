import { useState } from "react";
import { Send, Upload, Megaphone, AlertTriangle, MonitorPlay, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export function BroadcastCenter() {
  const [broadcastType, setBroadcastType] = useState("alert");
  const [target, setTarget] = useState("all");
  const [message, setMessage] = useState("");

  const handleSendBroadcast = () => {
    if (!message && broadcastType !== "media") {
      toast.error("A mensagem não pode estar vazia.");
      return;
    }
    
    toast.success("Comando enviado com sucesso!", {
      description: `Disparo do tipo "${broadcastType}" foi enfileirado para os alvos: ${target}`,
    });
    setMessage("");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full overflow-y-auto pb-8">
      {/* Coluna da Esquerda: Configuração */}
      <div className="lg:col-span-2 space-y-6">
        <Card className="border-border shadow-sm">
          <CardHeader className="bg-card/50 border-b pb-4">
            <CardTitle className="text-xl flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-indigo-500" /> 
              Nova Transmissão
            </CardTitle>
            <CardDescription>
              Envie informações instantâneas ou force a exibição de mídias em todos os players simultaneamente.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-8">
            
            <div className="space-y-4">
              <Label className="text-base font-semibold">Tipo de Intervenção</Label>
              <RadioGroup 
                defaultValue="alert" 
                className="grid grid-cols-1 md:grid-cols-3 gap-4"
                onValueChange={setBroadcastType}
              >
                <div className="relative">
                  <RadioGroupItem value="alert" id="type-alert" className="peer sr-only" />
                  <Label
                    htmlFor="type-alert"
                    className="flex flex-col items-center justify-center p-4 border-2 border-muted rounded-xl hover:bg-muted/50 peer-data-[state=checked]:border-amber-500 peer-data-[state=checked]:bg-amber-500/10 cursor-pointer transition-all"
                  >
                    <AlertTriangle className="h-6 w-6 mb-2 text-amber-500" />
                    <span className="font-medium">Alerta Crítico</span>
                    <span className="text-xs text-muted-foreground text-center mt-1">Interrompe a tela atual</span>
                  </Label>
                </div>

                <div className="relative">
                  <RadioGroupItem value="ticker" id="type-ticker" className="peer sr-only" />
                  <Label
                    htmlFor="type-ticker"
                    className="flex flex-col items-center justify-center p-4 border-2 border-muted rounded-xl hover:bg-muted/50 peer-data-[state=checked]:border-indigo-500 peer-data-[state=checked]:bg-indigo-500/10 cursor-pointer transition-all"
                  >
                    <Zap className="h-6 w-6 mb-2 text-indigo-500" />
                    <span className="font-medium">Letreiro Rotativo (Ticker)</span>
                    <span className="text-xs text-muted-foreground text-center mt-1">Aparece na barra inferior</span>
                  </Label>
                </div>

                <div className="relative">
                  <RadioGroupItem value="media" id="type-media" className="peer sr-only" />
                  <Label
                    htmlFor="type-media"
                    className="flex flex-col items-center justify-center p-4 border-2 border-muted rounded-xl hover:bg-muted/50 peer-data-[state=checked]:border-emerald-500 peer-data-[state=checked]:bg-emerald-500/10 cursor-pointer transition-all"
                  >
                    <MonitorPlay className="h-6 w-6 mb-2 text-emerald-500" />
                    <span className="font-medium">Mídia Imediata</span>
                    <span className="text-xs text-muted-foreground text-center mt-1">Toca um vídeo global</span>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-4">
              <Label className="text-base font-semibold">Público Alvo (Destinatários)</Label>
              <Select defaultValue="all" onValueChange={setTarget}>
                <SelectTrigger className="w-full text-left h-12">
                  <SelectValue placeholder="Selecione o público" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as TVs Ativas (Global)</SelectItem>
                  <SelectItem value="plan_premium">Apenas Contas Premium</SelectItem>
                  <SelectItem value="specific_1">Cliente: Academia Fitness Pro</SelectItem>
                  <SelectItem value="specific_2">Cliente: Supermercado Compre Bem</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4">
              <Label className="text-base font-semibold">
                {broadcastType === "media" ? "Upload de Mídia Global" : "Conteúdo da Mensagem"}
              </Label>
              
              {broadcastType === "media" ? (
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-xl p-8 flex flex-col items-center justify-center bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer group">
                  <div className="bg-background shadow-sm p-4 rounded-full mb-4 group-hover:scale-110 transition-transform">
                    <Upload className="h-8 w-8 text-indigo-500" />
                  </div>
                  <p className="font-medium">Clique para selecionar ou arraste o arquivo</p>
                  <p className="text-sm text-muted-foreground mt-1">MP4, JPG, PNG (Máx 50MB)</p>
                </div>
              ) : (
                <Textarea 
                  placeholder="Escreva a mensagem que será exibida nas telas..."
                  className="min-h-[120px] text-base resize-none bg-background focus-visible:ring-indigo-500"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              )}
            </div>

            <div className="pt-4 flex justify-end">
              <Button 
                size="lg" 
                className="gap-2 bg-indigo-600 hover:bg-indigo-700 w-full sm:w-auto"
                onClick={handleSendBroadcast}
              >
                <Send className="h-4 w-4" /> Enviar Transmissão
              </Button>
            </div>

          </CardContent>
        </Card>
      </div>

      {/* Coluna da Direita: Histórico / Logs */}
      <div className="space-y-6">
        <Card className="h-full max-h-[800px] border-border shadow-sm flex flex-col">
          <CardHeader className="py-4 border-b">
            <CardTitle className="text-base">Histórico de Envios</CardTitle>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-y-auto">
            <div className="divide-y">
              <div className="p-4 bg-muted/20 hover:bg-muted/40 transition-colors">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="text-amber-500 border-amber-500">Alerta</Badge>
                  <span className="text-xs text-muted-foreground">Hoje, 14:30</span>
                </div>
                <p className="text-sm font-medium">BEM VINDO A DIGITAL SIGNAGE!</p>
                <p className="text-xs text-muted-foreground mt-1">Alvo: Todas as TVs</p>
              </div>
              <div className="p-4 bg-muted/20 hover:bg-muted/40 transition-colors">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="text-emerald-500 border-emerald-500">Mídia</Badge>
                  <span className="text-xs text-muted-foreground">Ontem, 09:15</span>
                </div>
                <p className="text-sm font-medium">campanha_dia_das_maes.mp4</p>
                <p className="text-xs text-muted-foreground mt-1">Alvo: Clientes Premium</p>
              </div>
              <div className="p-4 bg-muted/20 hover:bg-muted/40 transition-colors">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="text-indigo-500 border-indigo-500">Ticker</Badge>
                  <span className="text-xs text-muted-foreground">12/05/2026</span>
                </div>
                <p className="text-sm font-medium">"O sistema passará por manutenção à meia-noite..."</p>
                <p className="text-xs text-muted-foreground mt-1">Alvo: Supermercado Compre Bem</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
