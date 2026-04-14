import * as React from "react";
import { Wand2, Sparkles, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const SUGGESTIONS_MAP: Record<string, string[]> = {
  padaria: ["gastronomia", "café", "receitas", "pães", "doces"],
  academia: ["saúde", "fitness", "esportes", "bem-estar", "nutrição"],
  clinica: ["saúde", "medicina", "ciência", "bem-estar"],
  varejo: ["economia", "negócios", "tecnologia", "promoções"],
  salao: ["beleza", "moda", "estilo", "autoestima"],
  escola: ["educação", "cultura", "ciência", "enem"],
  geral: ["mundo", "brasil", "tecnologia", "entretenimento"]
};

interface AINewsAssistantProps {
  onSuggest: (keywords: string) => void;
}

export function AINewsAssistant({ onSuggest }: AINewsAssistantProps) {
  const [input, setInput] = React.useState("");
  const [suggestions, setSuggestions] = React.useState<string[]>([]);
  const [isThinking, setIsThinking] = React.useState(false);

  const handleSuggest = () => {
    if (!input) return;
    setIsThinking(true);
    
    // Simulando o tempo de pensamento da IA
    setTimeout(() => {
      const lowerInput = input.toLowerCase();
      let found = SUGGESTIONS_MAP["geral"];
      
      for (const [key, list] of Object.entries(SUGGESTIONS_MAP)) {
        if (lowerInput.includes(key)) {
          found = list;
          break;
        }
      }
      
      setSuggestions(found);
      setIsThinking(false);
    }, 800);
  };

  return (
    <div className="mt-4 p-4 border rounded-xl bg-primary/5 border-primary/20 space-y-4">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-primary/10 rounded-lg shrink-0">
          <Wand2 className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h4 className="text-sm font-bold">Assistente de Conteúdo IA</h4>
          <p className="text-xs text-muted-foreground mt-1">
            Diga qual o ramo do negócio para gerar palavras-chave relevantes.
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        <Input 
          placeholder="Ex: Padaria, Salão, Academia..." 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSuggest()}
          className="h-9 text-sm"
        />
        <Button 
          size="sm" 
          onClick={handleSuggest} 
          disabled={isThinking || !input}
          className="shrink-0"
        >
          {isThinking ? (
            <div className="h-4 w-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4 mr-1" />
          )}
          {isThinking ? "" : "Gerar"}
        </Button>
      </div>

      {suggestions.length > 0 && (
        <div className="space-y-3 pt-2">
          <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Sugestões Encontradas:</p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <Badge 
                key={s} 
                variant="secondary" 
                className="cursor-pointer hover:bg-primary hover:text-white transition-colors py-1"
                onClick={() => onSuggest(s)}
              >
                <Check className="h-3 w-3 mr-1" /> {s}
              </Badge>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground italic">Clique em uma sugestão para aplicar.</p>
        </div>
      )}
    </div>
  );
}
