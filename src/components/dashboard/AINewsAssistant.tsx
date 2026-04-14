import * as React from "react";
import { Wand2, Sparkles, Check, Search, ListFilter, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

const SUGGESTIONS_MAP: Record<string, string[]> = {
  padaria: ["gastronomia", "café", "receitas", "pães", "doces"],
  academia: ["saúde", "fitness", "esportes", "bem-estar", "nutrição"],
  clinica: ["saúde", "medicina", "ciência", "bem-estar"],
  varejo: ["economia", "negócios", "tecnologia", "promoções"],
  salao: ["beleza", "moda", "estilo", "autoestima"],
  escola: ["educação", "cultura", "ciência", "enem"],
  geral: ["mundo", "brasil", "tecnologia", "entretenimento"]
};

const HEADLINES_PREVIEW: Record<string, string[]> = {
  gastronomia: ["Novas tendências em panificação artesanal para 2026", "Cafeterias registram alta de 15% no consumo de grãos especiais", "Festival de doces gourmet agita o setor de confeitaria"],
  saúde: ["Avanços na medicina preventiva reduzem tempo de recuperação", "Importância da hidratação constante em dias de calor intenso", "Novas diretrizes para check-ups anuais são divulgadas"],
  tecnologia: ["IA generativa transforma a criação de conteúdo em tempo real", "Novos dispositivos vestíveis monitoram saúde com precisão médica", "Brasil lidera adoção de pagamentos digitais na América Latina"],
  economia: ["Mercado financeiro projeta estabilidade para o próximo trimestre", "Varejo físico investe em experiência do cliente para atrair público", "Pequenas empresas recebem incentivo fiscal para digitalização"],
  esportes: ["Atletas brasileiros se preparam para os jogos internacionais", "Cresce a busca por modalidades de alto impacto em centros urbanos", "Nova liga de e-sports atrai investimentos milionários"],
  mundo: ["Acordos climáticos globais avançam em nova conferência", "Turismo na Europa bate recorde de visitantes nesta temporada", "Tecnologia espacial permite novas descobertas em Marte"],
  entretenimento: ["Lançamentos do cinema prometem bilheterias recordes", "Plataformas de streaming investem em conteúdo local", "Festivais de música retornam com foco em sustentabilidade"]
};

interface AINewsAssistantProps {
  onSuggest: (keywords: string) => void;
}

export function AINewsAssistant({ onSuggest }: AINewsAssistantProps) {
  const [input, setInput] = React.useState("");
  const [suggestions, setSuggestions] = React.useState<string[]>([]);
  const [isThinking, setIsThinking] = React.useState(false);
  const [selectedPreview, setSelectedPreview] = React.useState<string | null>(null);
  const [searching, setSearching] = React.useState(false);

  const handleSuggest = () => {
    if (!input) return;
    setIsThinking(true);
    setSelectedPreview(null);
    
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

  const handlePreview = (category: string) => {
    setSearching(true);
    setSelectedPreview(category);
    setTimeout(() => setSearching(false), 600);
  };

  return (
    <div className="mt-4 p-4 border rounded-xl bg-primary/5 border-primary/20 space-y-4 animate-in fade-in slide-in-from-top-2">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-primary/10 rounded-lg shrink-0">
          <Wand2 className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h4 className="text-sm font-bold">Assistente de Conteúdo IA</h4>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Analise ramos de negócio para extrair as melhores manchetes.
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        <Input 
          placeholder="Ramo do negócio (ex: Padaria, Clínica...)" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSuggest()}
          className="h-9 text-sm bg-background/50"
        />
        <Button 
          size="sm" 
          onClick={handleSuggest} 
          disabled={isThinking || !input}
          className="shrink-0 h-9"
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
        <div className="space-y-4 pt-2 border-t border-primary/10">
          <div className="flex items-center justify-between">
            <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground flex items-center gap-1.5">
              <ListFilter className="w-3 h-3" /> Categorias Sugeridas
            </p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <div key={s} className="group flex items-center gap-1">
                <Badge 
                  variant={selectedPreview === s ? "default" : "secondary"}
                  className="cursor-pointer hover:bg-primary hover:text-white transition-colors py-1.5 pl-3 pr-2 flex items-center gap-2"
                  onClick={() => onSuggest(s)}
                >
                  <Check className="h-3 w-3" /> {s}
                </Badge>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className={cn(
                    "h-8 w-8 rounded-full border border-transparent hover:border-primary/20",
                    selectedPreview === s ? "bg-primary/10 text-primary" : "text-muted-foreground"
                  )}
                  onClick={(e) => { e.stopPropagation(); handlePreview(s); }}
                >
                  <Search className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>

          {selectedPreview && (
            <div className="mt-4 p-3 bg-background/80 border rounded-lg animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between mb-2">
                <h5 className="text-[10px] font-bold text-primary flex items-center gap-1">
                  <span className="w-1 h-1 bg-primary rounded-full animate-pulse" />
                  PRÉVIA DE CONTEÚDO: {selectedPreview.toUpperCase()}
                </h5>
                <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1" onClick={() => onSuggest(selectedPreview)}>
                  Aplicar Categoria <ArrowRight className="w-3 h-3" />
                </Button>
              </div>
              
              <ScrollArea className="h-24 px-1">
                {searching ? (
                  <div className="flex flex-col gap-2 pt-2">
                    <div className="h-3 w-[200px] bg-muted animate-pulse rounded" />
                    <div className="h-3 w-[150px] bg-muted animate-pulse rounded" />
                    <div className="h-3 w-[180px] bg-muted animate-pulse rounded" />
                  </div>
                ) : (
                  <ul className="space-y-2.5">
                    {(HEADLINES_PREVIEW[selectedPreview] || HEADLINES_PREVIEW["geral"]).map((h, i) => (
                      <li key={i} className="text-xs text-foreground/80 flex gap-2">
                        <span className="text-primary font-bold opacity-50">•</span>
                        {h}
                      </li>
                    ))}
                  </ul>
                )}
              </ScrollArea>
              <p className="text-[9px] text-muted-foreground mt-2 italic">* Exemplos baseados no feed dinâmico global.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
