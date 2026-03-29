-- Allow anon to read leads (admin console uses sessionStorage auth, not Supabase auth)
CREATE POLICY "Anon can view leads"
  ON public.leads FOR SELECT
  TO anon
  USING (true);

-- Allow anon to update leads
CREATE POLICY "Anon can update leads"
  ON public.leads FOR UPDATE
  TO anon
  USING (true);

-- Allow anon to delete leads
CREATE POLICY "Anon can delete leads"
  ON public.leads FOR DELETE
  TO anon
  USING (true);