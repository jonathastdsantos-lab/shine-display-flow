ALTER TABLE public.playlists
  ADD COLUMN IF NOT EXISTS schedule_config JSONB DEFAULT NULL;

COMMENT ON COLUMN public.playlists.schedule_config IS
  'Configuração de agendamento da tela. Estrutura: { "enabled": boolean, "timezone": "America/Sao_Paulo", "slots": [{ "id": "uuid", "playlist_id": "uuid", "days": [1,2,3,4,5], "start_time": "08:00", "end_time": "12:00", "priority": 1 }], "default_playlist_id": "uuid" }';

CREATE INDEX IF NOT EXISTS idx_playlists_schedule_enabled
  ON public.playlists USING gin (schedule_config)
  WHERE schedule_config IS NOT NULL;