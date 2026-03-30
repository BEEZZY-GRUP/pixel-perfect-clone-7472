
CREATE TABLE public.diagnostics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  meeting_date date NOT NULL DEFAULT CURRENT_DATE,
  meeting_type text NOT NULL DEFAULT 'online',
  commercial_name text,
  
  -- Section 1: Company Profile
  company_segment text,
  company_size text,
  employees_count text,
  annual_revenue text,
  years_in_market text,
  
  -- Section 2: Current Situation
  main_challenges text[],
  current_tools text,
  has_defined_processes boolean DEFAULT false,
  has_marketing_strategy boolean DEFAULT false,
  has_sales_team boolean DEFAULT false,
  digital_presence_level text,
  
  -- Section 3: Goals & Objectives
  short_term_goals text,
  long_term_goals text,
  revenue_goal text,
  growth_timeline text,
  
  -- Section 4: Pain Points
  biggest_pain text,
  tried_solutions text,
  investment_capacity text,
  decision_urgency text,
  
  -- Section 5: Decision Making
  decision_maker text,
  decision_process text,
  stakeholders_count text,
  budget_defined boolean DEFAULT false,
  budget_range text,
  
  -- Section 6: Additional Notes
  competitor_analysis text,
  additional_notes text,
  next_steps text,
  
  -- Result
  score integer DEFAULT 0,
  classification text DEFAULT 'frio',
  summary text
);

ALTER TABLE public.diagnostics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "diagnostics_anon_all" ON public.diagnostics FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "diagnostics_auth_all" ON public.diagnostics FOR ALL TO authenticated USING (true) WITH CHECK (true);
