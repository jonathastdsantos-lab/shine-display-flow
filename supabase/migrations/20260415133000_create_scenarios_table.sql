-- Create scenarios table
CREATE TABLE public.scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label TEXT NOT NULL,
  emoji TEXT NOT NULL DEFAULT '🚀',
  description TEXT,
  template TEXT NOT NULL,
  color TEXT,
  gradient TEXT,
  shadow_color TEXT,
  tags TEXT[] DEFAULT '{}',
  config JSONB NOT NULL DEFAULT '{}',
  widgets TEXT[] DEFAULT '{}',
  preview JSONB NOT NULL DEFAULT '{"zones": []}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  client_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  is_global BOOLEAN DEFAULT false
);

-- Enable RLS
ALTER TABLE public.scenarios ENABLE ROW LEVEL SECURITY;

-- Policies
-- 1. Anyone can view global scenarios OR scenarios assigned to them
CREATE POLICY "Users can view relevant scenarios" ON public.scenarios 
FOR SELECT USING (
  is_global = true OR 
  client_id = auth.uid() OR 
  auth.jwt()->>'email' = 'jonathastdsantos@gmail.com'
);

-- 2. Only admins can manage scenarios
CREATE POLICY "Admins can manage scenarios" ON public.scenarios 
FOR ALL USING (
  auth.jwt()->>'email' = 'jonathastdsantos@gmail.com'
);

-- Seed data with existing scenarios (making them global)
INSERT INTO public.scenarios (id, emoji, label, description, template, color, gradient, shadow_color, tags, config, widgets, preview, is_global)
VALUES 
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '🛒', 'Supermercado / Varejo', 'Destaque ofertas do dia, QR Code de cashback e preço em foco total. Máximo impacto visual nas gôndolas.', 'varejo', 'text-emerald-400', 'from-emerald-500/20 to-teal-500/10', 'shadow-emerald-500/20', ARRAY['QR Ofertas', 'Ticker de Preços', 'Tela Cheia'], '{"template": "varejo", "config_clima": "", "config_noticias": ""}', ARRAY['qrcode', 'ticker'], '{"zones": [{"label": "Oferta em Destaque", "size": "flex-1", "color": "bg-emerald-500/20"}, {"label": "Ticker de Preços", "size": "h-8", "color": "bg-emerald-600/30"}]}', true),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', '💇', 'Salão de Beleza / Spa', 'Feed do Instagram em destaque, QR para agendamento online e música ambiente com visual elegante.', 'corporativo', 'text-pink-400', 'from-pink-500/20 to-rose-500/10', 'shadow-pink-500/20', ARRAY['Instagram ao Vivo', 'QR Agendamento', 'Sidebar Widgets'], '{"template": "corporativo", "config_clima": "São Paulo", "config_noticias": ""}', ARRAY['social', 'qrcode', 'clock'], '{"zones": [{"label": "Vídeo / Lookbook", "size": "flex-1", "color": "bg-pink-500/20"}, {"label": "Instagram + QR", "size": "w-24", "color": "bg-pink-600/30"}]}', true),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', '🥐', 'Padaria / Café', 'Menu do dia em destaque, clima local e notícias leves no rodapé. Perfeito para o horário do café da manhã.', 'lbar', 'text-amber-400', 'from-amber-500/20 to-orange-500/10', 'shadow-amber-500/20', ARRAY['Menu do Dia', 'Clima Local', 'L-Bar Elegante'], '{"template": "lbar", "config_clima": "São Paulo", "config_noticias": "business"}', ARRAY['weather', 'ticker', 'clock'], '{"zones": [{"label": "Cardápio / Foto", "size": "flex-1", "color": "bg-amber-500/20"}, {"label": "Clima + Hora", "size": "w-20", "color": "bg-amber-600/30"}, {"label": "Noticias Locais", "size": "h-8", "color": "bg-orange-600/30"}]}', true);
