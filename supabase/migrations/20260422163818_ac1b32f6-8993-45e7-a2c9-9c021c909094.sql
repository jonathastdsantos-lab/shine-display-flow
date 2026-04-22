
-- ============= 1. AD LEADS (Anuncie Aqui) =============
CREATE TABLE public.ad_leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID,
  playlist_id UUID,
  nome TEXT NOT NULL,
  empresa TEXT,
  telefone TEXT NOT NULL,
  email TEXT,
  mensagem TEXT,
  status TEXT NOT NULL DEFAULT 'novo',
  source TEXT DEFAULT 'landing',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.ad_leads ENABLE ROW LEVEL SECURITY;

-- Anyone (including unauthenticated visitors) can submit a lead
CREATE POLICY "Anyone can submit ad leads"
  ON public.ad_leads FOR INSERT
  WITH CHECK (true);

-- Owners and master can view leads tied to them
CREATE POLICY "Owners can view their ad leads"
  ON public.ad_leads FOR SELECT
  USING (
    auth.uid() = client_id 
    OR (auth.jwt() ->> 'email') = 'jonathastdsantos@gmail.com'
    OR client_id IS NULL  -- general leads (no specific client) visible to master
  );

-- Owners and master can update status
CREATE POLICY "Owners can update their ad leads"
  ON public.ad_leads FOR UPDATE
  USING (
    auth.uid() = client_id 
    OR (auth.jwt() ->> 'email') = 'jonathastdsantos@gmail.com'
  );

CREATE POLICY "Owners can delete their ad leads"
  ON public.ad_leads FOR DELETE
  USING (
    auth.uid() = client_id 
    OR (auth.jwt() ->> 'email') = 'jonathastdsantos@gmail.com'
  );

CREATE TRIGGER update_ad_leads_updated_at
  BEFORE UPDATE ON public.ad_leads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============= 2. PLAYLIST CONTROLE REMOTO =============
-- Per-screen heartbeat + remote commands
ALTER TABLE public.playlists 
  ADD COLUMN IF NOT EXISTS last_heartbeat TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS remote_command TEXT,
  ADD COLUMN IF NOT EXISTS remote_command_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS playback_state TEXT DEFAULT 'playing',
  ADD COLUMN IF NOT EXISTS ad_widget_enabled BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS ad_widget_url TEXT;

-- Allow public (the player itself, even unauthenticated) to update heartbeat fields
CREATE POLICY "Anyone can update playlist heartbeat"
  ON public.playlists FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Realtime for remote commands
ALTER PUBLICATION supabase_realtime ADD TABLE public.ad_leads;
