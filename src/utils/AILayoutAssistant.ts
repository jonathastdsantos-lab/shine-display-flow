export interface Zone {
  id: string;
  type: "media" | "clock" | "weather" | "news" | "finance" | "social" | "qr" | "camera" | "text" | "content_feed";
  label: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  width: number; // percentage 0-100
  height: number; // percentage 0-100
  config?: Record<string, any>;
  // Visual properties
  opacity?: number;        // 0-100
  borderRadius?: number;   // px
  backgroundColor?: string;
  zIndex?: number;
}

export interface LayoutConfig {
  is_custom: boolean;
  zones: Zone[];
  background?: string;
  show_ticker?: boolean;
  sidebar_width?: number;
  split_ratio?: number;
}

const genId = () => `zone-${Math.random().toString(36).slice(2, 8)}`;

// Prompt-based layout generators
const LAYOUT_PRESETS: Array<{
  keywords: string[];
  generator: () => Zone[];
  label: string;
}> = [
  {
    keywords: ["academia", "fitness", "gym", "treino"],
    label: "Fitness & Gym",
    generator: () => [
      { id: genId(), type: "media", label: "Mídia Principal", x: 0, y: 0, width: 70, height: 85 },
      { id: genId(), type: "clock", label: "Relógio", x: 70, y: 0, width: 30, height: 20 },
      { id: genId(), type: "weather", label: "Clima", x: 70, y: 20, width: 30, height: 35 },
      { id: genId(), type: "social", label: "Redes Sociais", x: 70, y: 55, width: 30, height: 30 },
      { id: genId(), type: "news", label: "Ticker Notícias", x: 0, y: 85, width: 100, height: 15 },
    ],
  },
  {
    keywords: ["salão", "salao", "beleza", "cabeleireiro", "cabelo", "barbearia", "barber"],
    label: "Salão de Beleza",
    generator: () => [
      { id: genId(), type: "media", label: "Promoções & Looks", x: 0, y: 0, width: 65, height: 85 },
      { id: genId(), type: "clock", label: "Relógio", x: 65, y: 0, width: 35, height: 18 },
      { id: genId(), type: "content_feed", label: "Dicas & Tendências", x: 65, y: 18, width: 35, height: 47, config: { segment: "salao" } },
      { id: genId(), type: "social", label: "Instagram", x: 65, y: 65, width: 35, height: 35 },
      { id: genId(), type: "news", label: "Ticker Novidades", x: 0, y: 85, width: 65, height: 15 },
    ],
  },
  {
    keywords: ["varejo", "loja", "retail", "supermercado", "farmácia", "farmacia"],
    label: "Varejo",
    generator: () => [
      { id: genId(), type: "media", label: "Promoções em Destaque", x: 0, y: 0, width: 100, height: 82 },
      { id: genId(), type: "news", label: "Ticker Promoções", x: 0, y: 82, width: 70, height: 18 },
      { id: genId(), type: "qr", label: "QR Code Oferta", x: 70, y: 82, width: 30, height: 18 },
    ],
  },
  {
    keywords: ["restaurante", "pizzaria", "lanchonete", "menu", "cardápio", "cardapio", "bar"],
    label: "Restaurante / Menu",
    generator: () => [
      { id: genId(), type: "media", label: "Pratos Especiais", x: 0, y: 0, width: 65, height: 100 },
      { id: genId(), type: "clock", label: "Horário", x: 65, y: 0, width: 35, height: 20 },
      { id: genId(), type: "text", label: "Menu do Dia", x: 65, y: 20, width: 35, height: 55, config: { text: "Menu do Dia" } },
      { id: genId(), type: "qr", label: "Cardápio Digital", x: 65, y: 75, width: 35, height: 25 },
    ],
  },
  {
    keywords: ["clínica", "clinica", "saúde", "saude", "hospital", "médico", "medico"],
    label: "Clínica / Saúde",
    generator: () => [
      { id: genId(), type: "media", label: "Informações de Saúde", x: 0, y: 0, width: 72, height: 85 },
      { id: genId(), type: "clock", label: "Horário de Atendimento", x: 72, y: 0, width: 28, height: 25 },
      { id: genId(), type: "content_feed", label: "Dicas de Saúde", x: 72, y: 25, width: 28, height: 35, config: { segment: "clinica" } },
      { id: genId(), type: "qr", label: "Agendamento Online", x: 72, y: 60, width: 28, height: 40 },
      { id: genId(), type: "news", label: "Notícias de Saúde", x: 0, y: 85, width: 72, height: 15 },
    ],
  },
  {
    keywords: ["colégio", "colegio", "escola", "educação", "educacao", "faculdade", "campus"],
    label: "Educação",
    generator: () => [
      { id: genId(), type: "media", label: "Comunicados Escola", x: 0, y: 0, width: 60, height: 80 },
      { id: genId(), type: "clock", label: "Relógio", x: 60, y: 0, width: 40, height: 22 },
      { id: genId(), type: "weather", label: "Clima", x: 60, y: 22, width: 40, height: 30 },
      { id: genId(), type: "finance", label: "Informações", x: 60, y: 52, width: 40, height: 28 },
      { id: genId(), type: "social", label: "Redes/Eventos", x: 60, y: 80, width: 40, height: 20 },
      { id: genId(), type: "news", label: "Ticker Avisos", x: 0, y: 80, width: 60, height: 20 },
    ],
  },
  {
    keywords: ["corporativo", "empresa", "escritório", "escritorio", "corporate"],
    label: "Corporativo",
    generator: () => [
      { id: genId(), type: "media", label: "Comunicados Corporativos", x: 0, y: 0, width: 70, height: 90 },
      { id: genId(), type: "clock", label: "Relógio & Data", x: 70, y: 0, width: 30, height: 20 },
      { id: genId(), type: "weather", label: "Clima", x: 70, y: 20, width: 30, height: 35 },
      { id: genId(), type: "finance", label: "Financeiro", x: 70, y: 55, width: 30, height: 35 },
      { id: genId(), type: "news", label: "Ticker Notícias", x: 0, y: 90, width: 70, height: 10 },
    ],
  },
  {
    keywords: ["split", "divisão", "divisao", "metade", "dois"],
    label: "Split 60/40",
    generator: () => [
      { id: genId(), type: "media", label: "Zona de Mídia (60%)", x: 0, y: 0, width: 60, height: 90 },
      { id: genId(), type: "clock", label: "Relógio", x: 60, y: 0, width: 40, height: 20 },
      { id: genId(), type: "weather", label: "Clima", x: 60, y: 20, width: 40, height: 35 },
      { id: genId(), type: "social", label: "Social", x: 60, y: 55, width: 40, height: 35 },
      { id: genId(), type: "news", label: "Ticker", x: 0, y: 90, width: 100, height: 10 },
    ],
  },
  {
    keywords: ["simples", "tela cheia", "fullscreen", "full", "completo"],
    label: "Tela Cheia",
    generator: () => [
      { id: genId(), type: "media", label: "Mídia Full Screen", x: 0, y: 0, width: 100, height: 88 },
      { id: genId(), type: "news", label: "Ticker Rodapé", x: 0, y: 88, width: 70, height: 12 },
      { id: genId(), type: "clock", label: "Relógio", x: 70, y: 88, width: 30, height: 12 },
    ],
  },
];

const DEFAULT_LAYOUT: Zone[] = [
  { id: genId(), type: "media", label: "Zona de Mídia", x: 0, y: 0, width: 70, height: 90 },
  { id: genId(), type: "clock", label: "Relógio", x: 70, y: 0, width: 30, height: 25 },
  { id: genId(), type: "weather", label: "Clima", x: 70, y: 25, width: 30, height: 35 },
  { id: genId(), type: "qr", label: "QR Code", x: 70, y: 60, width: 30, height: 30 },
  { id: genId(), type: "news", label: "Ticker", x: 0, y: 90, width: 70, height: 10 },
];

export function generateLayoutFromPrompt(prompt: string): { zones: Zone[]; label: string } {
  const normalized = prompt.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  for (const preset of LAYOUT_PRESETS) {
    const matchesKeyword = preset.keywords.some((kw) => {
      const normalizedKw = kw.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      return normalized.includes(normalizedKw);
    });
    if (matchesKeyword) {
      return { zones: preset.generator(), label: preset.label };
    }
  }

  return { zones: DEFAULT_LAYOUT, label: "Layout Padrão" };
}

export const ZONE_DEFAULTS: Record<Zone["type"], { label: string; defaultConfig: Record<string, any> }> = {
  media:        { label: "Zona de Mídia",        defaultConfig: {} },
  clock:        { label: "Relógio",              defaultConfig: {} },
  weather:      { label: "Previsão do Tempo",    defaultConfig: { city: "São Paulo" } },
  news:         { label: "Ticker de Notícias",   defaultConfig: { category: "technology" } },
  finance:      { label: "Widget Financeiro",    defaultConfig: {} },
  social:       { label: "Rede Social",          defaultConfig: {} },
  qr:           { label: "QR Code",              defaultConfig: { url: "" } },
  camera:       { label: "Câmera CCTV",          defaultConfig: { source: "webcam", url: "" } },
  text:         { label: "Texto Livre",          defaultConfig: { text: "Sua mensagem aqui...", fontSize: 24, align: "center" } },
  content_feed: { label: "Dicas & Tendências",   defaultConfig: { segment: "corporativo" } },
};
