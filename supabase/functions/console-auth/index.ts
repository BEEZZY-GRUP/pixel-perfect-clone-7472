import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function respond(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

// Simple hash for console passwords (not Supabase Auth)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + "bzy_console_salt_2026");
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json();
    const { action } = body;

    if (action === "login") {
      const { username, password } = body;
      if (!username || !password) return respond({ error: "Usuário e senha obrigatórios" }, 400);

      const hash = await hashPassword(password);
      const { data, error } = await supabase
        .from("console_users")
        .select("id, username, name, role, active")
        .eq("username", username)
        .eq("password_hash", hash)
        .single();

      if (error || !data) return respond({ error: "Credenciais inválidas" }, 401);
      if (!data.active) return respond({ error: "Usuário desativado" }, 403);

      return respond({ user: data });
    }

    if (action === "list") {
      const { data, error } = await supabase
        .from("console_users")
        .select("id, username, name, role, active, created_at")
        .order("created_at", { ascending: true });

      if (error) return respond({ error: error.message }, 500);
      return respond({ users: data });
    }

    if (action === "create") {
      const { username, password, name, role } = body;
      if (!username || !password || !name) return respond({ error: "Campos obrigatórios" }, 400);
      if (password.length < 4) return respond({ error: "Senha mínima: 4 caracteres" }, 400);
      if (!["admin", "comercial"].includes(role)) return respond({ error: "Cargo inválido" }, 400);

      const hash = await hashPassword(password);
      const { data, error } = await supabase
        .from("console_users")
        .insert({ username, password_hash: hash, name, role })
        .select("id, username, name, role, active, created_at")
        .single();

      if (error) {
        if (error.message.includes("duplicate")) return respond({ error: "Usuário já existe" }, 409);
        return respond({ error: error.message }, 500);
      }
      return respond({ user: data });
    }

    if (action === "update") {
      const { id, username, name, role, active, password } = body;
      if (!id) return respond({ error: "ID obrigatório" }, 400);

      const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (username) updates.username = username;
      if (name) updates.name = name;
      if (role && ["admin", "comercial"].includes(role)) updates.role = role;
      if (typeof active === "boolean") updates.active = active;
      if (password && password.length >= 4) updates.password_hash = await hashPassword(password);

      const { error } = await supabase.from("console_users").update(updates).eq("id", id);
      if (error) return respond({ error: error.message }, 500);
      return respond({ success: true });
    }

    if (action === "delete") {
      const { id } = body;
      if (!id) return respond({ error: "ID obrigatório" }, 400);

      const { error } = await supabase.from("console_users").delete().eq("id", id);
      if (error) return respond({ error: error.message }, 500);
      return respond({ success: true });
    }

    return respond({ error: "Ação inválida" }, 400);
  } catch (err) {
    return respond({ error: err.message }, 500);
  }
});
