
CREATE TABLE public.vault_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text NOT NULL UNIQUE,
  name text NOT NULL,
  email text NOT NULL,
  password text NOT NULL,
  role text NOT NULL DEFAULT 'visualizador',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.vault_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vault_users_anon_all" ON public.vault_users FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "vault_users_auth_all" ON public.vault_users FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Create vault_settings table for group settings
CREATE TABLE public.vault_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.vault_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vault_settings_anon_all" ON public.vault_settings FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "vault_settings_auth_all" ON public.vault_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);
