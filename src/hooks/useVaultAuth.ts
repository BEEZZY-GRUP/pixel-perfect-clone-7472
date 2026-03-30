import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type VaultRole = "superadmin" | "financeiro" | "operacional" | "visualizador";

export interface VaultUser {
  id: string;
  username: string;
  name: string;
  role: VaultRole;
  avatar: string;
  color: string;
  perms: string;
}

const ROLE_COLORS: Record<VaultRole, string> = {
  superadmin: "#FFD600",
  financeiro: "#3B82F6",
  operacional: "#A855F7",
  visualizador: "#888",
};

const PERMS_MAP: Record<string, string> = {
  superadmin: "all",
  financeiro: "fin",
  operacional: "ops",
  visualizador: "view",
};

const ROLE_LABELS: Record<VaultRole, string> = {
  superadmin: "Super Admin",
  financeiro: "Financeiro",
  operacional: "Operacional",
  visualizador: "Visualizador",
};

export function useVaultAuth() {
  const [user, setUser] = useState<VaultUser | null>(() => {
    const saved = sessionStorage.getItem("vault_user");
    return saved ? JSON.parse(saved) : null;
  });

  const login = useCallback(async (username: string, password: string): Promise<boolean> => {
    const { data, error } = await supabase.functions.invoke("vault-auth", {
      body: { action: "login", username, password },
    });

    if (error || !data?.user) return false;

    const u = data.user;
    const role = u.role as VaultRole;
    const vaultUser: VaultUser = {
      id: u.id,
      username: u.username,
      name: u.name,
      role,
      avatar: u.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase(),
      color: ROLE_COLORS[role] ?? "#888",
      perms: PERMS_MAP[role] ?? "view",
    };
    setUser(vaultUser);
    sessionStorage.setItem("vault_user", JSON.stringify(vaultUser));
    return true;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    sessionStorage.removeItem("vault_user");
  }, []);

  const hasPerm = useCallback((perm: string) => {
    if (!user) return false;
    return user.perms === "all" || user.perms === perm || perm === "view";
  }, [user]);

  return { user, login, logout, hasPerm, ROLE_LABELS, ROLE_COLORS };
}
