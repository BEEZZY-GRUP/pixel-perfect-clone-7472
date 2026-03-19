
-- Replace the permissive INSERT policy with one restricted to the notification owner
DROP POLICY "System can insert notifications" ON public.notifications;

CREATE POLICY "Insert own notifications"
  ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
