
CREATE TABLE public.lead_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  activity_type text NOT NULL DEFAULT 'nota',
  description text NOT NULL,
  scheduled_at timestamptz
);

ALTER TABLE public.lead_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lead_activities_anon_all" ON public.lead_activities FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "lead_activities_auth_all" ON public.lead_activities FOR ALL TO authenticated USING (true) WITH CHECK (true);
