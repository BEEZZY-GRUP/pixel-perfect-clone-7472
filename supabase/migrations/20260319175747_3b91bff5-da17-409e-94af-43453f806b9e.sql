
CREATE POLICY "Moderators can insert videos" ON public.videos FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'moderator'::app_role));
CREATE POLICY "Moderators can update videos" ON public.videos FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'moderator'::app_role));
CREATE POLICY "Moderators can delete videos" ON public.videos FOR DELETE TO authenticated USING (has_role(auth.uid(), 'moderator'::app_role));
