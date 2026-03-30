
CREATE TABLE public.console_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  role text NOT NULL DEFAULT 'comercial',
  name text NOT NULL DEFAULT '',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.console_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "No direct access to console_users"
  ON public.console_users FOR SELECT TO public USING (false);
CREATE POLICY "No direct insert to console_users"
  ON public.console_users FOR INSERT TO public WITH CHECK (false);
CREATE POLICY "No direct update to console_users"
  ON public.console_users FOR UPDATE TO public USING (false);
CREATE POLICY "No direct delete to console_users"
  ON public.console_users FOR DELETE TO public USING (false);
