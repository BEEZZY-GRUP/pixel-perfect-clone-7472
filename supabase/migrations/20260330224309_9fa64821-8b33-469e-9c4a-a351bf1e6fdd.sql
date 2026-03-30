
-- Enable pgcrypto for hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Hash all existing plaintext passwords in vault_users using SHA-256
UPDATE public.vault_users
SET password = encode(digest((password || '_vault_secure_salt_2026')::bytea, 'sha256'), 'hex')
WHERE length(password) != 64;
