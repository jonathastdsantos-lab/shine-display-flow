-- Fix play_logs FK: player_id stores playlist UUIDs but pointed at profiles(user_id)
ALTER TABLE public.play_logs DROP CONSTRAINT IF EXISTS play_logs_player_id_fkey;

-- Clean orphan rows that don't match any playlist (legacy/invalid data)
DELETE FROM public.play_logs
WHERE player_id IS NOT NULL
  AND player_id NOT IN (SELECT id FROM public.playlists);

ALTER TABLE public.play_logs
  ADD CONSTRAINT play_logs_player_id_fkey
  FOREIGN KEY (player_id) REFERENCES public.playlists(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_play_logs_player_id ON public.play_logs(player_id);
CREATE INDEX IF NOT EXISTS idx_play_logs_played_at ON public.play_logs(played_at DESC);