ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS widget_config jsonb DEFAULT '{
  "clock": {"enabled": true},
  "weather": {"enabled": true},
  "news": {"enabled": true},
  "finance": {"enabled": true},
  "social": {"enabled": true},
  "qr": {"enabled": true, "default_url": ""},
  "camera": {"enabled": false, "label": "Câmera 01", "url": ""}
}'::jsonb;