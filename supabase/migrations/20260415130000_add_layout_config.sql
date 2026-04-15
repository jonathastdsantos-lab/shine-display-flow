ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS layout_config jsonb DEFAULT '{
  "sidebar_width": 300,
  "footer_height": 60,
  "split_ratio": 60,
  "show_ticker": true,
  "sidebar_position": "right"
}'::jsonb;
