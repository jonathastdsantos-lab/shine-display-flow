ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS layout_config jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS widget_config jsonb DEFAULT '{}'::jsonb;

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_template_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_template_check
  CHECK (template IN ('corporativo', 'varejo', 'lbar', 'split', 'custom'));