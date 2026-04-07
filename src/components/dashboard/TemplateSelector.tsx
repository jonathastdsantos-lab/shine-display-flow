import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Store, Building2, Check } from "lucide-react";
import type { ClientProfile } from "@/hooks/useDashboardData";

interface TemplateSelectorProps {
  profile: ClientProfile;
  onSave: (updates: Partial<ClientProfile>) => Promise<void>;
}

const templates = [
  {
    id: "varejo",
    label: "Modo Varejo",
    icon: Store,
    description: "Tela cheia para exibição de ofertas e promoções. Sem barra lateral — foco total no conteúdo visual.",
    features: ["Mídia em tela cheia", "Ticker de ofertas no rodapé", "Transições de impacto"],
  },
  {
    id: "corporativo",
    label: "Modo Corporativo",
    icon: Building2,
    description: "Layout com zonas dedicadas para notícias, clima e relógio. Ideal para lobbies e salas de espera.",
    features: ["Barra lateral com widgets", "Relógio e previsão do tempo", "Ticker de notícias RSS"],
  },
];

export default function TemplateSelector({ profile, onSave }: TemplateSelectorProps) {
  const { toast } = useToast();

  const handleSelect = async (templateId: string) => {
    await onSave({ template: templateId });
    toast({ title: `Template "${templateId === "varejo" ? "Varejo" : "Corporativo"}" ativado!` });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="font-display text-2xl font-bold">Templates</h2>
        <p className="text-muted-foreground text-sm mt-1">Escolha o layout do player para o seu setor</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {templates.map((tmpl) => {
          const isActive = profile.template === tmpl.id;
          return (
            <Card
              key={tmpl.id}
              className={`relative cursor-pointer border-2 transition-all duration-200 hover:shadow-lg ${
                isActive ? "border-primary shadow-md" : "border-border/50 hover:border-primary/30"
              }`}
              onClick={() => handleSelect(tmpl.id)}
            >
              {isActive && (
                <div className="absolute top-3 right-3 rounded-full bg-primary p-1">
                  <Check className="h-3 w-3 text-primary-foreground" />
                </div>
              )}
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className={`rounded-xl p-3 ${isActive ? "bg-primary/10" : "bg-muted"}`}>
                    <tmpl.icon className={`h-6 w-6 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-lg">{tmpl.label}</h3>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{tmpl.description}</p>
                <ul className="space-y-1.5">
                  {tmpl.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <div className="h-1.5 w-1.5 rounded-full bg-accent" />
                      {f}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Preview mockup */}
      <Card className="border-border/50 overflow-hidden">
        <CardContent className="p-0">
          <div className="bg-muted/30 p-4">
            <p className="text-xs font-medium text-muted-foreground mb-2">PREVIEW DO LAYOUT</p>
            {profile.template === "corporativo" ? (
              <div className="flex rounded-lg overflow-hidden border border-border/50 h-40">
                <div className="flex-1 bg-foreground/90 flex items-center justify-center">
                  <span className="text-xs text-background/60">Zona Principal</span>
                </div>
                <div className="w-1/5 bg-foreground/80 flex flex-col items-center justify-center gap-2 border-l border-background/10">
                  <span className="text-[10px] text-background/60">Relógio</span>
                  <span className="text-[10px] text-background/60">Clima</span>
                </div>
              </div>
            ) : (
              <div className="rounded-lg overflow-hidden border border-border/50 h-40">
                <div className="h-full bg-foreground/90 flex items-center justify-center">
                  <span className="text-xs text-background/60">Tela Cheia — Ofertas</span>
                </div>
              </div>
            )}
            <div className="mt-1 rounded-b-lg bg-foreground/70 py-1 text-center">
              <span className="text-[10px] text-background/60">Ticker de Notícias / Ofertas</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
