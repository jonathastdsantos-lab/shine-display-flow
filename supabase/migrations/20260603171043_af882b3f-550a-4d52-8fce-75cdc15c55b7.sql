ALTER TABLE public.playlists
  ADD COLUMN IF NOT EXISTS last_sync_at timestamptz,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS layout_config jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS widget_config jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS template text DEFAULT 'corporativo',
  ADD COLUMN IF NOT EXISTS config_clima text DEFAULT 'São Paulo',
  ADD COLUMN IF NOT EXISTS config_noticias text DEFAULT 'technology',
  ADD COLUMN IF NOT EXISTS instagram_handle text;

NOTIFY pgrst, 'reload schema';