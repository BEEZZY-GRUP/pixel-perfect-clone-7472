import { VaultUser } from "@/hooks/useVaultAuth";

const VaultUsersPage = ({ user }: { user: VaultUser }) => {
  const users = [
    { username: "beezzygroup", name: "Admin Geral", role: "superadmin", email: "admin@beezzy.com", active: true },
    { username: "financeiro", name: "Ana Lima", role: "financeiro", email: "ana@beezzy.com", active: true },
    { username: "operacional", name: "Carlos Mendes", role: "operacional", email: "carlos@beezzy.com", active: true },
    { username: "visitante", name: "Visitante", role: "visualizador", email: "visit@beezzy.com", active: false },
  ];

  const roleBadge = (role: string) => {
    const c: Record<string, string> = {
      superadmin: "bg-[#FFD600]/10 text-[#FFD600]", financeiro: "bg-blue-500/10 text-blue-400",
      operacional: "bg-purple-500/10 text-purple-400", visualizador: "bg-white/5 text-white/40",
    };
    return <span className={`inline-flex text-[10px] font-medium px-2 py-0.5 rounded ${c[role] ?? "bg-white/5 text-white/40"}`}>{role.charAt(0).toUpperCase() + role.slice(1)}</span>;
  };

  return (
    <div>
      <div className="mb-5">
        <h1 className="font-heading text-xl font-semibold tracking-tight">Usuários & Permissões</h1>
        <p className="text-[11px]" style={{ color: "rgba(242,240,232,0.4)" }}>Gerencie acessos ao sistema</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mb-5">
        {[
          { label: "Total", value: String(users.length) },
          { label: "Ativos", value: String(users.filter(u => u.active).length), pos: true },
          { label: "Super Admins", value: String(users.filter(u => u.role === "superadmin").length), accent: true },
          { label: "Inativos", value: String(users.filter(u => !u.active).length), neg: true },
        ].map((k, i) => (
          <div key={i} className="rounded-xl p-3.5 border border-white/5" style={{ background: "#0e0e0a" }}>
            <div className="text-[10px] uppercase tracking-widest mb-1" style={{ color: "rgba(242,240,232,0.4)" }}>{k.label}</div>
            <div className={`font-heading text-lg font-semibold ${k.accent ? "bg-gradient-to-r from-[#FFD600] to-[#E6C200] bg-clip-text text-transparent" : k.pos ? "text-green-400" : k.neg ? "text-red-400" : ""}`}>{k.value}</div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-white/5 overflow-hidden mb-5" style={{ background: "#0e0e0a" }}>
        <div className="px-4 py-3 border-b border-white/5">
          <span className="text-xs font-medium">Usuários do Sistema</span>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5">
              {["Nome", "Usuário", "E-mail", "Perfil", "Status"].map(h => (
                <th key={h} className="text-left px-4 py-2 text-[9px] uppercase tracking-widest font-medium" style={{ color: "rgba(242,240,232,0.25)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.username} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                <td className="px-4 py-2.5 text-xs font-medium">{u.name}</td>
                <td className="px-4 py-2.5 text-xs font-mono" style={{ color: "rgba(242,240,232,0.4)" }}>{u.username}</td>
                <td className="px-4 py-2.5 text-xs" style={{ color: "rgba(242,240,232,0.4)" }}>{u.email}</td>
                <td className="px-4 py-2.5">{roleBadge(u.role)}</td>
                <td className="px-4 py-2.5">
                  <span className={`inline-flex text-[10px] font-medium px-2 py-0.5 rounded ${u.active ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
                    {u.active ? "Ativo" : "Inativo"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Role descriptions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
        {[
          { r: "Super Admin", c: "#FFD600", desc: "Acesso total: empresas, usuários, configurações, finanças e RH." },
          { r: "Financeiro", c: "#3B82F6", desc: "Lançamentos, relatórios, impostos e DRE. Sem RH e configurações." },
          { r: "Operacional", c: "#A855F7", desc: "Módulo de RH e pessoas. Sem acesso financeiro." },
          { r: "Visualizador", c: "#888", desc: "Apenas visualiza o dashboard. Sem edição." },
        ].map(p => (
          <div key={p.r} className="rounded-xl p-3 border border-white/5" style={{ background: "#0e0e0a" }}>
            <div className="text-[10px] uppercase tracking-widest mb-2" style={{ color: p.c }}>{p.r}</div>
            <div className="text-[11px] leading-relaxed" style={{ color: "rgba(242,240,232,0.4)" }}>{p.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VaultUsersPage;
