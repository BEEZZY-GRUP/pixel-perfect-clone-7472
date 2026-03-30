
CREATE TABLE public.vault_salary_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.vault_employees(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.vault_companies(id) ON DELETE CASCADE,
  previous_salary numeric NOT NULL DEFAULT 0,
  new_salary numeric NOT NULL DEFAULT 0,
  change_date date NOT NULL DEFAULT CURRENT_DATE,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.vault_salary_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vault_salary_history_anon_all" ON public.vault_salary_history FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "vault_salary_history_auth_all" ON public.vault_salary_history FOR ALL TO authenticated USING (true) WITH CHECK (true);
