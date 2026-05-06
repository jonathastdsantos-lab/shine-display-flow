CREATE POLICY "Users can update their own media"
ON public.media_library
FOR UPDATE
USING (auth.uid() = client_id)
WITH CHECK (auth.uid() = client_id);