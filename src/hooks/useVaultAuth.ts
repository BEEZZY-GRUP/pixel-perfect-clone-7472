import { useState, useCallback, useEffect } from "react";

export type VaultRole = "superadmin" | "financeiro" | "operacional" | "visualizador";

export interface VaultUser {
  username: string;
  name: string;
  role: VaultRole;
  avatar: string;
  color: string;
  perms: string;
}

const USERS_DB: Record<string, Omit<VaultUser, "username"> & { pass: string }> = {
  beezzygroup: { pass: "1milhaoMRR", name: "Admin Geral", role: "superadmin", avatar: "BG", color: "#FFD600", perms: "all" },
  financeiro: { pass: "fin123", name: "Ana Lima", role: "financeiro", avatar: "AL", color: "#3B82F6", perms: "fin" },
  operacional: { pass: "op123", name: "Carlos Mendes", role: "operacional", avatar: "CM", color: "#A855F7", perms: "ops" },
  visitante: { pass: "vis123", name: "Visitante", role: "visualizador", avatar: "VI", color: "#888", perms: "view" },
};

const ROLE_LABELS: Record<VaultRole, string> = {
  superadmin: "Super Admin",
  financeiro: "Financeiro",
  operacional: "Operacional",
  visualizador: "Visualizador",
};

const ROLE_COLORS: Record<VaultRole, string> = {
  superadmin: "#FFD600",
  financeiro: "#3B82F6",
  operacional: "#A855F7",
  visualizador: "#888",
};

export function useVaultAuth() {
  const [user, setUser] = useState<VaultUser | null>(() => {
    const saved = sessionStorage.getItem("vault_user");
    return saved ? JSON.parse(saved) : null;
  });

  const login = useCallback((username: string, password: string): boolean => {
    const u = USERS_DB[username];
    if (u && u.pass === password) {
      const vaultUser: VaultUser = { username, name: u.name, role: u.role, avatar: u.avatar, color: u.color, perms: u.perms };
      setUser(vaultUser);
      sessionStorage.setItem("vault_user", JSON.stringify(vaultUser));
      return true;
    }
    return false;
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
