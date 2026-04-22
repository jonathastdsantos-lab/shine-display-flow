
-- Remove the overly-permissive policy
DROP POLICY IF EXISTS "Anyone can update playlist heartbeat" ON public.playlists;

-- Create a SECURITY DEFINER function that only updates heartbeat fields
CREATE OR REPLACE FUNCTION public.update_playlist_heartbeat(p_playlist_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.playlists
  SET last_heartbeat = now()
  WHERE id = p_playlist_id;
END;
$$;

-- Function to clear remote command after the player executes it
CREATE OR REPLACE FUNCTION public.clear_remote_command(p_playlist_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.playlists
  SET remote_command = NULL,
      remote_command_at = NULL
  WHERE id = p_playlist_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_playlist_heartbeat(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.clear_remote_command(UUID) TO anon, authenticated;
