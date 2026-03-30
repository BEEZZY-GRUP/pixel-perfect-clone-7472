
-- 1) Lock down vault_users: remove permissive policies
DROP POLICY IF EXISTS "vault_users_anon_all" ON vault_users;
DROP POLICY IF EXISTS "vault_users_auth_all" ON vault_users;

-- Block all direct access to vault_users (edge function uses service role)
CREATE POLICY "No direct access to vault_users"
  ON vault_users FOR SELECT
  USING (false);

CREATE POLICY "No direct insert to vault_users"
  ON vault_users FOR INSERT
  WITH CHECK (false);

CREATE POLICY "No direct update to vault_users"
  ON vault_users FOR UPDATE
  USING (false);

CREATE POLICY "No direct delete to vault_users"
  ON vault_users FOR DELETE
  USING (false);

-- 2) Fix user_badges: remove self-insert policy (privilege escalation)
DROP POLICY IF EXISTS "System can insert user badges" ON user_badges;
