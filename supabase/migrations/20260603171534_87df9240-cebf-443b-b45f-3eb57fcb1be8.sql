ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS screen_limit integer DEFAULT 1;