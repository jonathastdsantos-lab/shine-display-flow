import * as React from "react";
import { Wand2, Sparkles, Check, Trash2, Tv2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

// Cada ramo tem subcategorias específicas com conteúdo real para o ticker
const CONTENT_BASE: Record<string, { subcategories: { label: string; emoji: string; items: string[] }[] }> = {
  salao: {
    subcategories: [
      {
        label: "Autocuidado", emoji: "✨",
        items: [
          "✨ Dica de autocuidado: use protetor solar diariamente, mesmo em dias nublados",
          "🧴 Hidratação da pele: beba ao menos 2L de água por dia para um brilho natural",
          "✨ Rotina de skincare: limpeza, tônico e hidratante são os 3 passos essenciais",
          "💅 Autocuidado começa por dentro — alimentação equilibrada reflete na sua pele e cabelos",
        ],
      },
      {
        label: "Cuidados com Cabelo", emoji: "💇",
        items: [
          "💇 Use protetor térmico sempre que usar chapinha ou babyliss — proteja seus fios!",
          "🚿 Lave o cabelo com água fria ou morna — água quente resseca e danifica os fios",
          "💆 Hidratação profunda quinzenal é essencial para cabelos quimicamente tratados",
          "✂️ Apare as pontas a cada 3 meses para manter o cabelo saudável e livre de pontas duplas",
          "🛁 Máscara capilar nutritiva: deixe agir por 20 minutos para resultado profissional",
        ],
      },
      {
        label: "Tendências", emoji: "🔥",
        items: [
          "🔥 Tendência 2026: franja curtinha está em alta e valoriza qualquer formato de rosto",
          "🎨 Coloração glossy: brilho intenso e duração prolongada são os hits do momento",
          "💡 Babylon layers: o corte que dá volume, movimento e rejuvenesce de forma natural",
          "🌈 Balayage californiano continua sendo o favorito para quem quer um visual descolado",
          "✨ Botox capilar sem formol: tratamento que está conquistando salões de todo o Brasil",
        ],
      },
      {
        label: "Promoções", emoji: "💸",
        items: [
          "💸 Corte + Hidratação: combo especial com preço exclusivo — agende pelo WhatsApp!",
          "🎁 Pacote mensal de manicure e pedicure com 20% de desconto para clientes fidelidade",
          "⭐ Indica um amigo e ganhe 15% de desconto no próximo serviço — aproveite!",
          "📅 Terças culturais: coloração com 25% OFF — vagas limitadas, reserve já!",
        ],
      },
    ],
  },
  academia: {
    subcategories: [
      {
        label: "Treino", emoji: "🏋️",
        items: [
          "🏋️ Aquecimento de 10 minutos antes do treino reduz lesões em até 60%",
          "💪 Descanse 48h antes de treinar o mesmo grupo muscular para melhor recuperação",
          "🔥 Treino HIIT de 20 minutos queima mais calorias que 1h de cardio moderado",
          "🏃 Corrida em inclinação: queima até 50% mais calorias e fortalece glúteos e panturrilhas",
        ],
      },
      {
        label: "Nutrição", emoji: "🥗",
        items: [
          "🥗 Proteínas pós-treino: consuma dentro de 30 minutos para melhor recuperação muscular",
          "💧 Hidratação é essencial: beba 400ml de água antes do treino intenso",
          "🍌 Banana antes do treino fornece energia rápida e previne cãibras musculares",
          "🥚 Ovo é uma proteína completa e econômica — excelente aliado do ganho de massa",
        ],
      },
      {
        label: "Motivação", emoji: "🔥",
        items: [
          "🔥 'O único treino ruim é aquele que você não fez' — mantenha a consistência!",
          "🌟 Transformações reais acontecem com pelo menos 3 meses de treino regular",
          "💪 Cada rep, cada série, cada gota de suor te aproxima do seu objetivo — não desista!",
          "🏆 Você não compete com ninguém — compete com a versão de ontem de você mesmo",
        ],
      },
      {
        label: "Aulas", emoji: "📅",
        items: [
          "📅 Hidroginástica às terças e quintas — ótima para articulações e condicionamento",
          "🧘 Yoga matinal às 7h: reserve sua vaga e comece o dia com equilíbrio e foco",
          "🥊 Novas turmas de muay thai abertas — experimente a primeira aula gratuitamente!",
          "💃 Aula de zumba toda sexta às 18h30 — venha dançar e se divertir while queima calorias",
        ],
      },
    ],
  },
  padaria: {
    subcategories: [
      {
        label: "Pães & Massas", emoji: "🥖",
        items: [
          "🥖 Sabias que o pão de fermentação natural tem índice glicêmico mais baixo?",
          "🌾 Pão integral: rico em fibras, ajuda na digestão e mantém a saciedade por mais tempo",
          "🥐 Croissant autêntico: feito com manteiga de qualidade e massa folhada traditional",
          "🍞 Nosso pão francês é assado fresquinho a cada 3 horas — sempre crocante!",
        ],
      },
      {
        label: "Nutrição & Saúde", emoji: "🥗",
        items: [
          "💡 Substitua o pão branco pelo integral e reduza o açúcar no sangue progressivamente",
          "🌿 Linhaça, chia e aveia: superalimentos que podem ser adicionados nos seus pães favoritos",
          "🥗 Café da manhã completo: pão + proteína + fruta = energia para o dia todo",
          "💧 Hidrate-se bem pela manhã antes do café — seu corpo agradece!",
        ],
      },
      {
        label: "Doces & Confeitaria", emoji: "🎂",
        items: [
          "🎂 Bolo personalizado: aceite encomendas com até 3 dias de antecedência",
          "🍰 Cheesecake do dia: cremoso, com calda de frutas vermelhas — experiência incrível!",
          "🍫 Brigadeiro gourmet em 12 sabores — embalagem especial disponível para presentes",
          "🧁 Cupcakes temáticos para festas e eventos — orçamento sem compromisso!",
        ],
      },
      {
        label: "Promoções", emoji: "💸",
        items: [
          "💸 Combo família: 10 pães + manteiga + suco por preço especial toda segunda-feira!",
          "🎁 Cartão fidelidade: a cada 10 cafés, ganhe 1 grátis — carimbe o seu hoje!",
          "⭐ Mini-tortas do dia com preço reduzido a partir das 17h — aproveite!",
        ],
      },
    ],
  },
  clinica: {
    subcategories: [
      {
        label: "Prevenção", emoji: "🩺",
        items: [
          "🩺 Check-up anual: detectar doenças cedo aumenta em 9x as chances de cura",
          "💉 Vacinação em dia é a maneira mais eficiente de prevenir doenças graves",
          "🩸 Exames de sangue semestrais revelam riscos silenciosos que não dão sintomas",
          "🫁 Espirometria: avalie a saúde dos pulmões — indicada para tabagistas e asmáticos",
        ],
      },
      {
        label: "Bem-Estar", emoji: "💚",
        items: [
          "💤 Sono de qualidade (7-9h) fortalece o sistema imunológico e melhora o humor",
          "🧘 Meditação diária de apenas 10 minutos reduz o cortisol em até 25%",
          "💧 Hidratação adequada melhora concentração, energia e saúde da pele",
          "🌿 Estresse crônico aumenta o risco de hipertensão — cuide da sua saúde mental",
        ],
      },
      {
        label: "Especialidades", emoji: "🔬",
        items: [
          "🔬 Consulta com cardiologista: recomendada anualmente para maiores de 40 anos",
          "🦷 Saúde bucal está relacionada à saúde cardiovascular — não negligencie o dentista",
          "👁️ Exame de vista anual: identifica miopia, astigmatismo e outros problemas precocemente",
          "🏥 Dermatologia: mapeamento de pintas detecta sinais precoces de câncer de pele",
        ],
      },
      {
        label: "Agendamento", emoji: "📋",
        items: [
          "📋 Agende sua consulta online em menos de 2 minutos — disponível 24h!",
          "⏰ Horários flexíveis: atendimento de segunda a sábado, inclusive pela manhã",
          "📱 Resultado de exames: acesse pelo portal do paciente sem sair de casa",
          "🚁 Emergência? Nossa equipe de plantão está disponível pelos nossos canais",
        ],
      },
    ],
  },
  varejo: {
    subcategories: [
      {
        label: "Ofertas", emoji: "🔥",
        items: [
          "🔥 Liquidação de temporada: até 60% OFF em produtos selecionados — só esta semana!",
          "🏷️ Compre 2 e leve 3: promoção especial em toda a linha de acessórios",
          "💳 Parcelamos em até 12x sem juros no cartão — compre com tranquilidade!",
          "📦 Frete grátis para compras acima de R$150 — aproveite e complete seu carrinho",
        ],
      },
      {
        label: "Novidades", emoji: "✨",
        items: [
          "✨ Nova coleção chegou: os primeiros a ver são nossos clientes VIP — cadastre-se!",
          "🆕 Linha exclusiva de produtos importados disponível apenas aqui — estoque limitado",
          "🎨 Lançamento: produtos em edição limitada com embalagem especial colecionável",
          "📲 App de compras: cliente app tem desconto extra de 10% em todas as compras",
        ],
      },
      {
        label: "Dicas de Compra", emoji: "💡",
        items: [
          "💡 Compare preços antes de comprar: aqui você sempre encontra o melhor custo-benefício",
          "🔍 Confira a garantia antes de levar — todos os nossos produtos têm nota fiscal",
          "💡 Programa de fidelidade: pontos acumulados viram desconto automático",
          "🎁 Presente especial? Temos embalagem gift gratuita em compras acima de R$100",
        ],
      },
    ],
  },
  escola: {
    subcategories: [
      {
        label: "Dicas de Estudo", emoji: "📚",
        items: [
          "📚 Técnica Pomodoro: 25 min de foco + 5 min de pausa = aprendizado mais eficiente",
          "🧠 Fazer resumos à mão melhora a retenção do conteúdo em até 40%",
          "📖 Leia ao menos 15 minutos por dia — amplia vocabulário e raciocínio crítico",
          "💡 Estude no horário em que você se sente mais alerta — manhã ou noite?",
        ],
      },
      {
        label: "ENEM & Vestibular", emoji: "🎓",
        items: [
          "🎓 ENEM 2026: comece estudando Redação — vale 20% da nota total!",
          "📐 Matemática ENEM: foque em estatística, funções e geometria — as mais cobradas",
          "📝 Leia textos de atualidades diariamente — alimenta a argumentação na redação",
          "🕐 Simule as provas com o cronômetro para dominar o tempo no dia da prova real",
        ],
      },
      {
        label: "Cursos & Turmas", emoji: "🏫",
        items: [
          "🏫 Turmas de reforço: matemática, português e ciências — vagas abertas para 2026!",
          "💻 Curso de informática básica: formação em 3 meses com certificado reconhecido",
          "🎨 Oficinas de arte e criatividade: inscrições abertas para crianças de 8 a 14 anos",
          "🌐 Inglês para iniciantes: turmas noturnas com professor nativo — poucas vagas!",
        ],
      },
    ],
  },
  restaurante: {
    subcategories: [
      {
        label: "Cardápio", emoji: "🍽️",
        items: [
          "🍽️ Prato executivo de hoje: file ao molho madeira + arroz + feijão + salada por R$35",
          "🥗 Opção vegetariana: risoto de cogumelos com rúcula e parmesão — muito pedida!",
          "🍖 Churrasco especial aos domingos: buffet completo com open saladas por preço fixo",
          "🍰 Sobremesa do dia: pudim artesanal feito pelo chefe — peça antes que acabe!",
        ],
      },
      {
        label: "Nutrição", emoji: "🌿",
        items: [
          "🌿 Nossa salada fresquinha é colhida de produtores locais — mais nutrientes, mais sabor",
          "💧 Hidratação durante a refeição: prefira água sem gás ou suco natural",
          "🐟 Peixe grelhado: proteína magra rica em ômega-3 para uma refeição saudável",
          "🥙 Wraps integrais: opção leve, saborosa e equilibrada para o almoço do dia a dia",
        ],
      },
      {
        label: "Delivery & Reservas", emoji: "🚗",
        items: [
          "🚗 Delivery disponível pelo app: pedido mínimo de R$30 e entrega em até 45 min",
          "📅 Reserve sua mesa para fins de semana — lotamos rapidinho, não perca!",
          "🎂 Comemorações especiais: decoração de mesa e bolo inclusas — consulte condições",
          "🛵 Cupom de desconto: primeira entrega grátis usando o código BEMESTAR2026",
        ],
      },
    ],
  },
  geral: {
    subcategories: [
      {
        label: "Informações", emoji: "📰",
        items: [
          "📰 Brasil registra crescimento de 2,8% no PIB — economia em recuperação constante",
          "🌱 Consumo consciente cresce: 65% dos brasileiros preferem marcas sustentáveis",
          "📲 5G já cobre 70% das cidades brasileiras e muda a forma de trabalhar e consumir",
        ],
      },
      {
        label: "Dicas Gerais", emoji: "💡",
        items: [
          "💡 Organize sua semana aos domingos: pequenas metas diárias constroem grandes resultados",
          "💡 Lembre-se: economia começa nos hábitos — desligue o que não está usando",
          "💡 Invista em aprendizado contínuo — cursos online gratuitos transformam carreiras",
        ],
      },
      {
        label: "Engajamento", emoji: "🎯",
        items: [
          "⭐ Gostou do atendimento? Deixe sua avaliação online e ajude outras pessoas!",
          "📲 Siga nossas redes sociais e fique por dentro das novidades e promoções exclusivas",
          "🎁 Programa de fidelidade: cada visita acumula pontos e vira desconto — cadastre-se!",
        ],
      },
    ],
  },
};

type ContentItem = { text: string; cat: string; selected: boolean };

interface AINewsAssistantProps {
  onSuggest: (content: string) => void;
}

export function AINewsAssistant({ onSuggest }: AINewsAssistantProps) {
  const [input, setInput] = React.useState("");
  const [isThinking, setIsThinking] = React.useState(false);
  const [items, setItems] = React.useState<ContentItem[]>([]);
  const [activeTab, setActiveTab] = React.useState<string>("");
  const [tabs, setTabs] = React.useState<{ label: string; emoji: string }[]>([]);

  const handleGenerate = () => {
    if (!input.trim()) return;
    setIsThinking(true);
    setItems([]);
    setActiveTab("");

    setTimeout(() => {
      const lower = input.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      let matchKey = "geral";
      const keys = Object.keys(CONTENT_BASE);
      for (const key of keys) {
        const normalizedKey = key.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        if (lower.includes(normalizedKey)) {
          matchKey = key;
          break;
        }
      }

      const base = CONTENT_BASE[matchKey];
      const newTabs = base.subcategories.map(s => ({ label: s.label, emoji: s.emoji }));
      const newItems: ContentItem[] = base.subcategories.flatMap(sub =>
        sub.items.map(text => ({ text, cat: sub.label, selected: false }))
      );

      setTabs(newTabs);
      setItems(newItems);
      setActiveTab(newTabs[0]?.label || "");
      setIsThinking(false);
    }, 900);
  };

  const toggleItem = (idx: number) => {
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, selected: !it.selected } : it));
  };

  const selectedItems = items.filter(i => i.selected);
  const visibleItems = items.filter(i => i.cat === activeTab);

  const handleApplySelected = () => {
    if (selectedItems.length === 0) return;
    const joined = selectedItems.map(i => i.text).join("   ●   ");
    onSuggest(joined);
    setItems([]);
    setInput("");
    setTabs([]);
    setActiveTab("");
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
            Gera conteúdo específico do seu ramo de negócio para o ticker do player.
          </p>
        </div>
      </div>

      <div className="px-4 pb-4 space-y-4">
        {/* Input */}
        <div className="flex gap-2">
          <Input
            placeholder="Ex: Salão de cabelo, Padaria, Clínica, Academia..."
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

        {/* Dynamic Tabs + Items */}
        {tabs.length > 0 && items.length > 0 && (
          <div className="space-y-3 pt-1 border-t border-primary/10">
            {/* Custom Tabs by Business Type */}
            <div className="flex flex-wrap gap-1.5">
              {tabs.map(t => (
                <button
                  key={t.label}
                  onClick={() => setActiveTab(t.label)}
                  className={cn(
                    "text-[11px] font-semibold px-3 py-1.5 rounded-full transition-all",
                    activeTab === t.label
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
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-[11px] text-muted-foreground truncate">
                  {selectedItems.length > 0 ? (
                    <span className="text-primary font-bold">{selectedItems.length} item(s) selecionado(s)</span>
                  ) : (
                    "Selecione os itens para o ticker"
                  )}
                </span>
                {selectedItems.length > 0 && (
                  <button
                    onClick={() => setItems(prev => prev.map(i => ({ ...i, selected: false })))}
                    className="text-[10px] text-muted-foreground underline hover:text-foreground shrink-0"
                  >
                    Limpar
                  </button>
                )}
              </div>
              <div className="flex gap-2 shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 gap-1.5 text-xs"
                  onClick={() => { setItems([]); setInput(""); setTabs([]); setActiveTab(""); }}
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
