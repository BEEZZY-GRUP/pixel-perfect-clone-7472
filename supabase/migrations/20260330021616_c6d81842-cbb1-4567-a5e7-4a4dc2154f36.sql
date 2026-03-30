
-- Vault Companies
CREATE TABLE vault_companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  is_holding boolean NOT NULL DEFAULT false,
  cnpj text,
  ie text,
  im text,
  regime text DEFAULT 'Simples Nacional',
  aliquota numeric NOT NULL DEFAULT 6,
  cnae text,
  color text NOT NULL DEFAULT '#888',
  active boolean NOT NULL DEFAULT true,
  responsible text,
  email text,
  phone text,
  address text,
  founded_at date,
  main_bank text,
  agency text,
  account_number text,
  pix_key text,
  emergency_fund numeric DEFAULT 0,
  emergency_fund_goal numeric DEFAULT 0,
  investment_fund numeric DEFAULT 0,
  dividend_fund numeric DEFAULT 0,
  dividend_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE vault_bank_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES vault_companies(id) ON DELETE CASCADE,
  bank_name text NOT NULL,
  agency text,
  account_number text,
  account_type text DEFAULT 'Corrente',
  balance numeric NOT NULL DEFAULT 0,
  credit_limit numeric DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE vault_bank_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES vault_companies(id) ON DELETE CASCADE,
  bank_account_id uuid REFERENCES vault_bank_accounts(id) ON DELETE SET NULL,
  transaction_date date NOT NULL,
  description text NOT NULL,
  transaction_type text NOT NULL DEFAULT 'despesa',
  amount numeric NOT NULL DEFAULT 0,
  category text,
  reconciled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE vault_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES vault_companies(id) ON DELETE CASCADE,
  entry_type text NOT NULL DEFAULT 'despesa',
  description text NOT NULL,
  category text,
  amount numeric NOT NULL DEFAULT 0,
  due_date date,
  payment_date date,
  entry_date date,
  payment_method text,
  quantity integer,
  status text NOT NULL DEFAULT 'pendente',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE vault_employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES vault_companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  position text,
  department text,
  salary numeric NOT NULL DEFAULT 0,
  employment_type text DEFAULT 'CLT',
  admission_date date,
  status text NOT NULL DEFAULT 'ativo',
  email text,
  cpf text,
  pis text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE vault_vacations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES vault_employees(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES vault_companies(id) ON DELETE CASCADE,
  leave_type text NOT NULL DEFAULT 'Férias',
  start_date date NOT NULL,
  return_date date NOT NULL,
  days integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'aprovado',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE vault_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES vault_companies(id) ON DELETE CASCADE,
  year integer NOT NULL DEFAULT 2026,
  goal_type text NOT NULL,
  target_value numeric NOT NULL DEFAULT 0,
  current_value numeric NOT NULL DEFAULT 0,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE vault_monthly_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES vault_companies(id) ON DELETE CASCADE,
  month_date date NOT NULL,
  revenue numeric DEFAULT 0,
  expenses numeric DEFAULT 0,
  sales_count integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id, month_date)
);

CREATE TABLE vault_budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES vault_companies(id) ON DELETE CASCADE,
  category text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  year integer NOT NULL DEFAULT 2026,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE vault_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_type text NOT NULL DEFAULT 'info',
  icon text DEFAULT '⚠',
  color text,
  message text NOT NULL,
  sub_message text,
  company_id uuid REFERENCES vault_companies(id) ON DELETE CASCADE,
  read boolean NOT NULL DEFAULT false,
  notification_date date,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE vault_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text,
  description text,
  status text NOT NULL DEFAULT 'desconectado',
  config jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Triggers
CREATE TRIGGER set_vault_companies_updated_at BEFORE UPDATE ON vault_companies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_vault_entries_updated_at BEFORE UPDATE ON vault_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_vault_employees_updated_at BEFORE UPDATE ON vault_employees FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE vault_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE vault_bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE vault_bank_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE vault_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE vault_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE vault_vacations ENABLE ROW LEVEL SECURITY;
ALTER TABLE vault_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE vault_monthly_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE vault_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE vault_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE vault_integrations ENABLE ROW LEVEL SECURITY;

-- RLS Policies (anon + auth full access, matching admin console pattern)
CREATE POLICY "vault_companies_anon_all" ON vault_companies FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "vault_companies_auth_all" ON vault_companies FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "vault_bank_accounts_anon_all" ON vault_bank_accounts FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "vault_bank_accounts_auth_all" ON vault_bank_accounts FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "vault_bank_txns_anon_all" ON vault_bank_transactions FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "vault_bank_txns_auth_all" ON vault_bank_transactions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "vault_entries_anon_all" ON vault_entries FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "vault_entries_auth_all" ON vault_entries FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "vault_employees_anon_all" ON vault_employees FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "vault_employees_auth_all" ON vault_employees FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "vault_vacations_anon_all" ON vault_vacations FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "vault_vacations_auth_all" ON vault_vacations FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "vault_goals_anon_all" ON vault_goals FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "vault_goals_auth_all" ON vault_goals FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "vault_monthly_anon_all" ON vault_monthly_data FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "vault_monthly_auth_all" ON vault_monthly_data FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "vault_budgets_anon_all" ON vault_budgets FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "vault_budgets_auth_all" ON vault_budgets FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "vault_notifs_anon_all" ON vault_notifications FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "vault_notifs_auth_all" ON vault_notifications FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "vault_integrations_anon_all" ON vault_integrations FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "vault_integrations_auth_all" ON vault_integrations FOR ALL TO authenticated USING (true) WITH CHECK (true);
