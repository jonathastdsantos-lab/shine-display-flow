import * as React from "react";
import { Wand2, Sparkles, Plus, Check, Trash2, Tv2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

// Base de conteúdo por ramo — será gerado como frases de ticker reais
const CONTENT_BASE: Record<string, { noticias: string[]; dicas: string[]; sugestoes: string[] }> = {
  padaria: {
    noticias: [
      "Pesquisa aponta que 72% dos brasileiros preferem pão artesanal ao industrial",
      "Mercado de panificação cresce 12% no Brasil e gera mais de 800 mil empregos",
      "Novas técnicas de fermentação natural chegam às padarias brasileiras",
    ],
    dicas: [
      "💡 Dica: Pão integral tem mais fibras e ajuda no controle do colesterol",
      "💡 Dica: Congelar o pão em fatias preserva o sabor por até 3 meses",
      "💡 Dica: Prefira pães com menos de 5 ingredientes na lista — são mais naturais",
    ],
    sugestoes: [
      "🥐 Experimente nosso pão de fermentação natural — feito com carinho todo dia!",
      "☕ Café + croissant fresquinho: a combinação perfeita para começar bem o dia",
      "🎂 Encomende seu bolo personalizado com antecedência e garanta a melhor surpresa!",
    ],
  },
  academia: {
    noticias: [
      "OMS recomenda pelo menos 150 minutos de atividade física moderada por semana",
      "Brasil é o 2º país com mais academias no mundo, segundo pesquisa internacional",
      "Exercício físico regular reduz em 35% o risco de doenças cardiovasculares",
    ],
    dicas: [
      "💡 Dica: Hidrate-se bem antes, durante e após o treino para melhor desempenho",
      "💡 Dica: Intervalos de descanso entre séries são tão importantes quanto o esforço",
      "💡 Dica: Treino em jejum pode ser eficaz, mas consulte sempre um nutricionista",
    ],
    sugestoes: [
      "🏋️ Aula de musculação: vaga disponível! Fale com um de nossos instrutores agora",
      "🧘 Yoga e pilates às terças e quintas — venha relaxar e fortalecer o corpo",
      "🥗 Nosso plano nutricional personalizado ajuda você a alcançar seus objetivos mais rápido!",
    ],
  },
  clinica: {
    noticias: [
      "Ministério da Saúde amplia cobertura de exames preventivos pelo SUS",
      "Diagnóstico precoce aumenta em 9x as chances de cura do câncer de mama",
      "Telemedicina cresce 80% no Brasil e facilita acesso a especialistas",
    ],
    dicas: [
      "💡 Dica: Check-up anual é essencial — não espere sintomas para consultar um médico",
      "💡 Dica: Beba ao menos 2 litros de água por dia para manter o sistema saudável",
      "💡 Dica: Sono de qualidade é fundamental para a saúde imunológica",
    ],
    sugestoes: [
      "🩺 Agende sua consulta de rotina — prevenir é sempre o melhor remédio!",
      "📋 Realize seus exames laboratoriais aqui com resultado rápido e seguro",
      "👨‍⚕️ Nossa equipe médica está pronta para cuidar de você e da sua família",
    ],
  },
  salao: {
    noticias: [
      "Beleza e autocuidado: setor cresce 18% no Brasil nos últimos dois anos",
      "Tendências de corte e coloração para o segundo semestre de 2026",
      "Tratamentos capilares naturais ganham espaço nas prateleiras dos salões",
    ],
    dicas: [
      "💡 Dica: Use protetor térmico antes de usar chapinha ou babyliss para proteger os fios",
      "💡 Dica: Finalizadores a base de óleo dão brilho extra sem pesar o cabelo",
      "💡 Dica: Hidratação profunda quinzenal é essencial para cabelos quimicamente tratados",
    ],
    sugestoes: [
      "✂️ Corte + Escova + Hidratação: nosso combo mais amado está disponível!",
      "💅 Manicure e pedicure com esmaltes premium — agende pelo WhatsApp agora!",
      "💇 Coloração e mechas com produtos de alta durabilidade — venha se transformar!",
    ],
  },
  varejo: {
    noticias: [
      "Vendas do e-commerce brasileiro crescem 27% no primeiro trimestre de 2026",
      "Consumidores priorizam experiência de compra acima do preço, aponta pesquisa",
      "Black Friday gera expectativa de recorde de vendas para o comércio nacional",
    ],
    dicas: [
      "💡 Dica: Compare preços online antes de comprar — economize até 40%",
      "💡 Dica: Confira sempre a política de troca e devolução antes de finalizar a compra",
      "💡 Dica: Cashback e programas de fidelidade podem gerar ótima economia no longo prazo",
    ],
    sugestoes: [
      "🔥 Promoção relâmpago: produtos com até 50% OFF — só hoje!",
      "🛒 Aqui você encontra as melhores marcas com preços que cabem no seu bolso",
      "🎁 Presente para alguém especial? Temos embalagem gift gratuita nas compras acima de R$100",
    ],
  },
  escola: {
    noticias: [
      "ENEM 2026: inscrições abertas — prazo encerra em maio, fique atento!",
      "Pesquisa indica que leitura diária melhora raciocínio em 45% nos estudantes",
      "Universidades públicas ampliam vagas para cursos de tecnologia e saúde",
    ],
    dicas: [
      "💡 Dica: Dividir o estudo em blocos de 25 minutos com pausas aumenta a retenção",
      "💡 Dica: Fazer mapas mentais ajuda a memorizar conteúdos complexos com mais facilidade",
      "💡 Dica: Estudar em grupo melhora a compreensão e torna o aprendizado mais dinâmico",
    ],
    sugestoes: [
      "📚 Turmas de reforço escolar: matemática, português e ciências — vagas abertas!",
      "🎓 Prepare-se para o vestibular com nossos cursos preparatórios especializados",
      "🧠 Nossas aulas são interativas e adaptadas para cada ritmo de aprendizado",
    ],
  },
  restaurante: {
    noticias: [
      "Gastronomia brasileira é eleita patrimônio cultural imaterial da UNESCO",
      "Delivery de comida cresce 35% e impulsiona setor de alimentação no Brasil",
      "Novas tendências: pratos plant-based conquistam cardápios de restaurantes nacionais",
    ],
    dicas: [
      "💡 Dica: Alimentos frescos e da estação têm mais nutrientes e custam menos",
      "💡 Dica: Refeições coloridas indicam variedade de nutrientes essenciais",
      "💡 Dica: Mastigar devagar melhora a digestão e aumenta a sensação de saciedade",
    ],
    sugestoes: [
      "🍽️ Prato executivo do dia com entrada + principal + sobremesa por preço especial!",
      "🥩 Churrasco especial aos finais de semana — reserve sua mesa com antecedência",
      "🚗 Delivery disponível pelo app — peça agora e receba em até 40 minutos!",
    ],
  },
  geral: {
    noticias: [
      "Brasil registra crescimento de 2,8% no PIB no primeiro trimestre de 2026",
      "Tecnologia verde: empresas brasileiras lideram inovações sustentáveis na América Latina",
      "Pesquisa aponta aumento de 20% no turismo interno durante os feriados de 2026",
    ],
    dicas: [
      "💡 Dica: Planeje sua semana com antecedência para aumentar produtividade e bem-estar",
      "💡 Dica: Invista em aprendizado contínuo — cursos online gratuitos estão disponíveis",
      "💡 Dica: Economize energia: eletrodomésticos no modo standby consomem até 12% da conta",
    ],
    sugestoes: [
      "✨ Acompanhe nossos stories e novidades — siga nas redes sociais!",
      "📲 Cadastre-se em nossa lista VIP e receba ofertas exclusivas em primeira mão",
      "⭐ Adorou o atendimento? Deixe sua avaliação online e ajude outros clientes!",
    ],
  },
};

type ContentItem = { text: string; type: "noticia" | "dica" | "sugestao"; selected: boolean };

interface AINewsAssistantProps {
  onSuggest: (content: string) => void;
}

export function AINewsAssistant({ onSuggest }: AINewsAssistantProps) {
  const [input, setInput] = React.useState("");
  const [isThinking, setIsThinking] = React.useState(false);
  const [items, setItems] = React.useState<ContentItem[]>([]);
  const [activeTab, setActiveTab] = React.useState<"noticia" | "dica" | "sugestao">("noticia");

  const tabs: { key: "noticia" | "dica" | "sugestao"; label: string; emoji: string }[] = [
    { key: "noticia", label: "Notícias", emoji: "📰" },
    { key: "dica", label: "Dicas", emoji: "💡" },
    { key: "sugestao", label: "Sugestões", emoji: "🎯" },
  ];

  const handleGenerate = () => {
    if (!input.trim()) return;
    setIsThinking(true);
    setItems([]);

    setTimeout(() => {
      const lower = input.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      let match = "geral";

      for (const key of Object.keys(CONTENT_BASE)) {
        const normalizedKey = key.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        if (lower.includes(normalizedKey)) {
          match = key;
          break;
        }
      }

      const base = CONTENT_BASE[match];
      const generated: ContentItem[] = [
        ...base.noticias.map(t => ({ text: t, type: "noticia" as const, selected: false })),
        ...base.dicas.map(t => ({ text: t, type: "dica" as const, selected: false })),
        ...base.sugestoes.map(t => ({ text: t, type: "sugestao" as const, selected: false })),
      ];

      setItems(generated);
      setIsThinking(false);
    }, 900);
  };

  const toggleItem = (idx: number) => {
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, selected: !it.selected } : it));
  };

  const selectedItems = items.filter(i => i.selected);
  const visibleItems = items.filter(i => i.type === activeTab);

  const handleApplySelected = () => {
    if (selectedItems.length === 0) return;
    const joined = selectedItems.map(i => i.text).join(" ● ");
    onSuggest(joined);
    setItems([]);
    setInput("");
  };

  return (
    <div className="mt-4 border rounded-xl overflow-hidden bg-primary/5 border-primary/20">
      {/* Header */}
      <div className="p-4 flex items-start gap-3">
        <div className="p-2 bg-primary/10 rounded-lg shrink-0">
          <Wand2 className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h4 className="text-sm font-bold">Assistente de Conteúdo IA</h4>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Gera notícias, dicas e sugestões reais para o ticker do seu player.
          </p>
        </div>
      </div>

      <div className="px-4 pb-4 space-y-4">
        {/* Input */}
        <div className="flex gap-2">
          <Input
            placeholder="Ramo do negócio (ex: Padaria, Clínica, Salão...)"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleGenerate()}
            className="h-9 text-sm bg-background/50"
          />
          <Button
            size="sm"
            onClick={handleGenerate}
            disabled={isThinking || !input.trim()}
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

        {/* Content Tabs + Items */}
        {items.length > 0 && (
          <div className="space-y-3 pt-1 border-t border-primary/10">
            {/* Tabs */}
            <div className="flex gap-1">
              {tabs.map(t => (
                <button
                  key={t.key}
                  onClick={() => setActiveTab(t.key)}
                  className={cn(
                    "text-[11px] font-semibold px-3 py-1.5 rounded-full transition-all",
                    activeTab === t.key
                      ? "bg-primary text-white shadow-sm"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  {t.emoji} {t.label}
                </button>
              ))}
            </div>

            {/* Items List */}
            <ScrollArea className="h-[180px]">
              <ul className="space-y-2 pr-2">
                {visibleItems.map((item) => {
                  const globalIdx = items.indexOf(item);
                  return (
                    <li
                      key={globalIdx}
                      onClick={() => toggleItem(globalIdx)}
                      className={cn(
                        "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all text-xs",
                        item.selected
                          ? "bg-primary/10 border-primary/30 text-foreground"
                          : "bg-background/50 border-border/40 text-foreground/70 hover:border-primary/20 hover:bg-primary/5"
                      )}
                    >
                      <div className={cn(
                        "mt-0.5 h-4 w-4 shrink-0 rounded border-2 flex items-center justify-center transition-all",
                        item.selected ? "bg-primary border-primary" : "border-muted-foreground/40"
                      )}>
                        {item.selected && <Check className="h-2.5 w-2.5 text-white" />}
                      </div>
                      <span className="leading-snug">{item.text}</span>
                    </li>
                  );
                })}
              </ul>
            </ScrollArea>

            <Separator />

            {/* Apply Bar */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-muted-foreground">
                  {selectedItems.length > 0 ? (
                    <span className="text-primary font-bold">{selectedItems.length} selecionado(s)</span>
                  ) : (
                    "Selecione os itens desejados"
                  )}
                </span>
                {selectedItems.length > 0 && (
                  <button
                    onClick={() => setItems(prev => prev.map(i => ({ ...i, selected: false })))}
                    className="text-[10px] text-muted-foreground underline hover:text-foreground"
                  >
                    Limpar
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 gap-1.5 text-xs"
                  onClick={() => { setItems([]); setInput(""); }}
                >
                  <Trash2 className="h-3 w-3" /> Descartar
                </Button>
                <Button
                  size="sm"
                  className="h-8 gap-1.5 text-xs bg-primary hover:bg-primary/90"
                  disabled={selectedItems.length === 0}
                  onClick={handleApplySelected}
                >
                  <Tv2 className="h-3 w-3" /> Enviar ao Ticker
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
