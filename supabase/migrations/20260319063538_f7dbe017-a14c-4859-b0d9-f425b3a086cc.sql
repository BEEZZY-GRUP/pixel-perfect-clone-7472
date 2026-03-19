
-- Moderators can delete posts
CREATE POLICY "Moderators can delete any post"
ON public.posts
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'moderator'::app_role));

-- Moderators can delete comments
CREATE POLICY "Moderators can delete any comment"
ON public.comments
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'moderator'::app_role));
