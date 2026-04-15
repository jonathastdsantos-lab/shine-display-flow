// Content Feed — curated content by business segment for the signage player
export interface ContentTip {
  id: string;
  text: string;
  emoji: string;
  category: string;
}

export type BusinessSegment =
  | "salao"
  | "barbearia"
  | "academia"
  | "restaurante"
  | "clinica"
  | "escola"
  | "varejo"
  | "corporativo"
  | "farmacia"
  | "odontologia"
  | "spa"
  | "pet";

export const SEGMENT_LABELS: Record<BusinessSegment, string> = {
  salao: "💇 Salão de Beleza",
  barbearia: "✂️ Barbearia",
  academia: "💪 Academia / Fitness",
  restaurante: "🍽️ Restaurante / Café",
  clinica: "🏥 Clínica de Saúde",
  escola: "📚 Escola / Educação",
  varejo: "🛒 Varejo / Loja",
  corporativo: "🏢 Corporativo",
  farmacia: "💊 Farmácia / Drogaria",
  odontologia: "😁 Clínica Odontológica",
  spa: "🌿 Spa / Centro Estético",
  pet: "🐾 Pet Shop / Veterinário",
};

export const CONTENT_FEEDS: Record<BusinessSegment, ContentTip[]> = {
  salao: [
    { id: "s1", emoji: "💇‍♀️", category: "Tendência", text: "Balayage e californianas estão em alta! Tons dourados e mel dominam o verão 2026." },
    { id: "s2", emoji: "🌿", category: "Cuidados", text: "Hidratação profunda: use máscara capilar 1x por semana para fios mais sedosos e brilhantes." },
    { id: "s3", emoji: "✨", category: "Dica Pro", text: "Corte em V alongado: faz o rosto parecer mais fino e rejuvenescido. Pergunte à sua especialista!" },
    { id: "s4", emoji: "💅", category: "Beleza", text: "Unhas em gel: durabilidade de até 3 semanas com brilho perfeito e sem lascas." },
    { id: "s5", emoji: "🔥", category: "Novidade", text: "Botox capilar: trata frizz, alisa e repõe proteínas dos fios sem formol." },
    { id: "s6", emoji: "🌸", category: "Saúde", text: "Couro cabeludo saudável = cabelos saudáveis. Evite lavar com água muito quente!" },
    { id: "s7", emoji: "💆‍♀️", category: "Relaxamento", text: "Massagem escalp estimula o crescimento capilar e alivia a tensão do dia a dia." },
    { id: "s8", emoji: "🎨", category: "Cor", text: "Coloração tonal: mechas sutis que realçam a cor natural sem mudar radicalmente o visual." },
    { id: "s9", emoji: "👩", category: "Cuidados Femininos", text: "Protetor solar no couro cabeludo também é essencial durante o verão — não esqueça!" },
    { id: "s10", emoji: "📢", category: "Promoção", text: "Reserve com antecedência e garanta horário preferencial — nossa agenda é limitada!" },
  ],
  barbearia: [
    { id: "b1", emoji: "✂️", category: "Tendência", text: "Degradê americano: o corte mais pedido de 2026. Fio 0 nas laterais com volume no topo." },
    { id: "b2", emoji: "🧔", category: "Barba", text: "Barba bem cuidada projeta profissionalismo e estilo. Mantenha a sua aparada toda semana." },
    { id: "b3", emoji: "🔥", category: "Dica", text: "Pomada mate x brilhante: entenda qual o melhor produto para o seu tipo de cabelo." },
    { id: "b4", emoji: "💈", category: "Clássico", text: "A navalha ainda é a melhor opção para acabamento impecável — só na barbearia especializada." },
    { id: "b5", emoji: "🌿", category: "Cuidados", text: "Óleo de barba hidrata, reduz coceira e deixa os fios mais macios e domados." },
    { id: "b6", emoji: "📢", category: "Agendamento", text: "Agende seu próximo corte com antecedência e evite esperar — aqui valorizamos seu tempo!" },
  ],
  academia: [
    { id: "a1", emoji: "💪", category: "Motivação", text: "\"O sucesso é a soma de pequenos esforços repetidos dia após dia.\" — Robert Collier" },
    { id: "a2", emoji: "🥗", category: "Nutrição", text: "Proteína pós-treino: consuma até 30 minutos após o exercício para maximizar a recuperação muscular." },
    { id: "a3", emoji: "💧", category: "Saúde", text: "Hidratação é fundamental! Beba pelo menos 35ml de água por kg de peso corporal diariamente." },
    { id: "a4", emoji: "🏃‍♂️", category: "Cardio", text: "30 minutos de cardio moderado por dia reduzem 35% o risco de doenças cardiovasculares." },
    { id: "a5", emoji: "🧘", category: "Flexibilidade", text: "Alongamento pós-treino reduz dores musculares e melhora a postura. Não pule essa etapa!" },
    { id: "a6", emoji: "😴", category: "Recuperação", text: "O músculo cresce durante o descanso. Durma pelo menos 7-8 horas por noite para melhores resultados." },
    { id: "a7", emoji: "🔥", category: "Treino", text: "Séries em superset aumentam a intensidade e reduzem o tempo de treino pela metade." },
    { id: "a8", emoji: "📊", category: "Progresso", text: "Meça seu progresso mensalmente. Fotos e medidas revelam resultados que a balança esconde." },
  ],
  restaurante: [
    { id: "r1", emoji: "🍽️", category: "Prato do Dia", text: "Prato especial preparado com ingredientes frescos selecionados hoje pela nossa equipe." },
    { id: "r2", emoji: "☕", category: "Café", text: "Café especial de origem única: notas de caramelo e chocolate com acidez equilibrada." },
    { id: "r3", emoji: "🥗", category: "Saudável", text: "Opções vegetarianas e veganas disponíveis todos os dias. Pergunte ao garçom!" },
    { id: "r4", emoji: "🍰", category: "Sobremesa", text: "Temos sobremesas artesanais feitas diariamente. Reserve a sua antes que acabe!" },
    { id: "r5", emoji: "🌟", category: "Qualidade", text: "Todos os nossos pratos são feitos com ingredientes locais e sem conservantes artificiais." },
    { id: "r6", emoji: "📱", category: "Delivery", text: "Peça pelo nosso app e receba em casa com o mesmo cuidado que servimos aqui." },
  ],
  clinica: [
    { id: "c1", emoji: "🩺", category: "Saúde Geral", text: "Check-up anual: a prevenção é o melhor tratamento. Agende hoje mesmo sua consulta." },
    { id: "c2", emoji: "💊", category: "Medicamentos", text: "Nunca interrompa o tratamento sem orientação médica mesmo que se sinta melhor." },
    { id: "c3", emoji: "🏃‍♀️", category: "Prevenção", text: "150 minutos de atividade física por semana reduzem significativamente o risco de diabetes tipo 2." },
    { id: "c4", emoji: "🧠", category: "Saúde Mental", text: "Saúde mental é tão importante quanto a física. Procure ajuda quando precisar — não há vergonha!" },
    { id: "c5", emoji: "🌙", category: "Sono", text: "Uma boa noite de sono fortalece o sistema imunológico e melhora o humor e produtividade." },
    { id: "c6", emoji: "🩸", category: "Exames", text: "Exames de rotina detectam doenças silenciosas antes que causem danos irreversíveis." },
    { id: "c7", emoji: "👶", category: "Pediatria", text: "A vacinação infantil é essencial para a proteção da criança e da comunidade." },
    { id: "c8", emoji: "❤️", category: "Cardio", text: "Pressão arterial elevada não tem sintomas visíveis. Meça regularmente para prevenir o infarto." },
  ],
  escola: [
    { id: "e1", emoji: "📚", category: "Aprendizado", text: "Estudar 25 minutos com 5 de pausa (Técnica Pomodoro) aumenta muito o rendimento e a memória." },
    { id: "e2", emoji: "🧠", category: "Curiosidade", text: "Sabia que o cérebro humano processa imagens 60.000 vezes mais rápido que texto?" },
    { id: "e3", emoji: "🌍", category: "Cidadania", text: "Educação é o investimento com maior retorno para o indivíduo e para a sociedade." },
    { id: "e4", emoji: "💡", category: "Motivação", text: "\"Educação não transforma o mundo. Educação muda pessoas. Pessoas transformam o mundo.\" — Paulo Freire" },
    { id: "e5", emoji: "🎯", category: "Metas", text: "Defina metas claras para seus estudos. Alunos com objetivos definidos rendem até 40% mais." },
    { id: "e6", emoji: "🤝", category: "Colaboração", text: "Aprendizado colaborativo: estudar em grupo melhora a retenção e o entendimento do conteúdo." },
  ],
  varejo: [
    { id: "v1", emoji: "🏷️", category: "Promoção", text: "Novidades chegando! Confira nossas ofertas exclusivas desta semana." },
    { id: "v2", emoji: "⭐", category: "Qualidade", text: "Produtos selecionados com controle de qualidade rigoroso para garantir sua satisfação." },
    { id: "v3", emoji: "📦", category: "Estoque", text: "Últimas unidades disponíveis! Aproveite e garanta o seu antes que acabe." },
    { id: "v4", emoji: "💳", category: "Pagamento", text: "Parcele suas compras em até 12x sem juros usando nosso cartão parceiro." },
    { id: "v5", emoji: "🚚", category: "Entrega", text: "Entrega rápida para todo o Brasil! Compre agora e receba em casa." },
  ],
  corporativo: [
    { id: "co1", emoji: "📈", category: "Mercado", text: "Empresas que investem em cultura organizacional têm receita 30% maior que as concorrentes." },
    { id: "co2", emoji: "🤝", category: "Inovação", text: "Colaboração entre equipes é o principal fator de inovação em organizações de alto desempenho." },
    { id: "co3", emoji: "🌱", category: "Sustentabilidade", text: "ESG: empresas com práticas sustentáveis atraem 65% mais talentos da nova geração." },
    { id: "co4", emoji: "💡", category: "Produtividade", text: "Deep Work: 4 horas de foco intenso valem mais que 8 horas de distração constante." },
    { id: "co5", emoji: "📊", category: "Dados", text: "Decisões baseadas em dados reduzem custos operacionais em até 25% nos primeiros 6 meses." },
  ],
  farmacia: [
    { id: "f1", emoji: "💊", category: "Orientação", text: "Nunca automédique. Consulte sempre um farmacêutico ou médico antes de tomar qualquer medicamento." },
    { id: "f2", emoji: "🩺", category: "Prevenção", text: "Aferição de pressão arterial gratuita — solicite ao atendente. Sua saúde em primeiro lugar." },
    { id: "f3", emoji: "🌡️", category: "Cuidados", text: "Atenção às temperaturas de armazenamento dos medicamentos. Leia sempre a bula." },
    { id: "f4", emoji: "❤️", category: "Saúde", text: "Medicamentos contínuos: adesão ao tratamento é fundamental para resultado eficaz e duradouro." },
  ],
  odontologia: [
    { id: "o1", emoji: "😁", category: "Cuidados", text: "Escove os dentes por no mínimo 2 minutos, 3x ao dia, com creme dental fluoretado." },
    { id: "o2", emoji: "🦷", category: "Prevenção", text: "Use fio dental todos os dias! Ele remove 35% da placa que a escova não alcança." },
    { id: "o3", emoji: "💧", category: "Saúde", text: "Boca seca favorece cáries. Mantenha boa hidratação e evite respirar pela boca." },
    { id: "o4", emoji: "✨", category: "Estética", text: "Clareamento dental: recupere o brilho do seu sorriso de forma segura e rápida com nossos especialistas." },
    { id: "o5", emoji: "📅", category: "Consulta", text: "Consulta de rotina a cada 6 meses previne 80% dos problemas dentários — agende já!" },
  ],
  spa: [
    { id: "sp1", emoji: "🌿", category: "Bem-estar", text: "Aromaterapia com lavanda reduz ansiedade em até 45%. Experimente nossa sessão relaxante." },
    { id: "sp2", emoji: "💆", category: "Massagem", text: "Massagem terapêutica semanal melhora circulação, alivia dores e reduz o cortisol (hormônio do estresse)." },
    { id: "sp3", emoji: "🛁", category: "Cuidados", text: "Esfoliação corporal remove pele morta, melhora a textura e prepara para hidratação profunda." },
    { id: "sp4", emoji: "✨", category: "Pele", text: "Protetor solar é o melhor anti-idade: previne manchas, rugas e o envelhecimento precoce." },
    { id: "sp5", emoji: "🧘", category: "Equilíbrio", text: "Mindfulness 10 minutos por dia melhora foco, reduz ansiedade e melhora a qualidade do sono." },
  ],
  pet: [
    { id: "p1", emoji: "🐾", category: "Saúde Pet", text: "Vacinação anual é essencial para proteger seu pet contra doenças graves como raiva e parvovirose." },
    { id: "p2", emoji: "🦷", category: "Higiene", text: "Escove os dentes do seu pet 3x por semana para evitar tártaro e doenças gengivais." },
    { id: "p3", emoji: "🥗", category: "Nutrição", text: "Alimentação balanceada é fundamental. Evite ração de baixa qualidade e alimentos humanos inadequados." },
    { id: "p4", emoji: "🏃", category: "Exercício", text: "Cães precisam de pelo menos 30 minutos de exercício diário para saúde física e mental." },
    { id: "p5", emoji: "💉", category: "Vermífugo", text: "Vermifugação a cada 3-6 meses protege seu pet e toda sua família de parasitas." },
    { id: "p6", emoji: "✂️", category: "Banho & Tosa", text: "Banho e tosa regular mantém pelagem saudável e evita odores e infecções de pele." },
  ],
};
