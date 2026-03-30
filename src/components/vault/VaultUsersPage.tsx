import { useState } from "react";
import { VaultUser } from "@/hooks/useVaultAuth";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import VaultDeleteConfirm from "./VaultDeleteConfirm";

interface VaultSystemUser {
  id: string;
  username: string;
  name: string;
  role: string;
  email: string;
  active: boolean;
}

const INITIAL_USERS: VaultSystemUser[] = [
  { id: "1", username: "beezzygroup", name: "Admin Geral", role: "superadmin", email: "admin@beezzy.com", active: true },
  { id: "2", username: "financeiro", name: "Ana Lima", role: "financeiro", email: "ana@beezzy.com", active: true },
  { id: "3", username: "operacional", name: "Carlos Mendes", role: "operacional", email: "carlos@beezzy.com", active: true },
  { id: "4", username: "visitante", name: "Visitante", role: "visualizador", email: "visit@beezzy.com", active: false },
];

const ROLES = ["superadmin", "financeiro", "operacional", "visualizador"];

const VaultUsersPage = ({ user }: { user: VaultUser }) => {
  const [users, setUsers] = useState<VaultSystemUser[]>(() => {
    const saved = sessionStorage.getItem("vault_system_users");
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });
  const [modal, setModal] = useState<{ open: boolean; user?: VaultSystemUser }>({ open: false });
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; id: string; name: string }>({ open: false, id: "", name: "" });
  const [form, setForm] = useState({ name: "", username: "", email: "", role: "visualizador", active: true });

  const persist = (next: VaultSystemUser[]) => { setUsers(next); sessionStorage.setItem("vault_system_users", JSON.stringify(next)); };

  const openNew = () => {
    setForm({ name: "", username: "", email: "", role: "visualizador", active: true });
    setModal({ open: true });
  };
  const openEdit = (u: VaultSystemUser) => {
    setForm({ name: u.name, username: u.username, email: u.email, role: u.role, active: u.active });
    setModal({ open: true, user: u });
  };
  const handleSave = () => {
    if (!form.name || !form.username || !form.email) { toast.error("Preencha todos os campos"); return; }
    if (modal.user) {
      persist(users.map(u => u.id === modal.user!.id ? { ...u, ...form } : u));
      toast.success("Usuário atualizado");
    } else {
      persist([...users, { id: crypto.randomUUID(), ...form }]);
      toast.success("Usuário criado");
    }
    setModal({ open: false });
  };
  const handleDelete = (id: string) => {
    persist(users.filter(u => u.id !== id));
    toast.success("Usuário excluído");
  };

  const roleBadge = (role: string) => {
    const c: Record<string, string> = {
      superadmin: "bg-[#FFD600]/10 text-[#FFD600]", financeiro: "bg-blue-500/10 text-blue-400",
      operacional: "bg-purple-500/10 text-purple-400", visualizador: "bg-white/5 text-white/40",
    };
    return <span className={`inline-flex text-[10px] font-medium px-2 py-0.5 rounded ${c[role] ?? "bg-white/5 text-white/40"}`}>{role.charAt(0).toUpperCase() + role.slice(1)}</span>;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="font-heading text-xl font-semibold tracking-tight">Usuários & Permissões</h1>
          <p className="text-[11px]" style={{ color: "rgba(242,240,232,0.4)" }}>Gerencie acessos ao sistema</p>
        </div>
        <Button size="sm" onClick={openNew} className="bg-[#FFD600] text-black hover:bg-[#E6C200] h-8 text-[11px] px-3">
          <Plus size={14} className="mr-1.5" /> Novo Usuário
        </Button>
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
              {["Nome", "Usuário", "E-mail", "Perfil", "Status", "Ações"].map(h => (
                <th key={h} className="text-left px-4 py-2 text-[9px] uppercase tracking-widest font-medium" style={{ color: "rgba(242,240,232,0.25)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                <td className="px-4 py-2.5 text-xs font-medium">{u.name}</td>
                <td className="px-4 py-2.5 text-xs font-mono" style={{ color: "rgba(242,240,232,0.4)" }}>{u.username}</td>
                <td className="px-4 py-2.5 text-xs" style={{ color: "rgba(242,240,232,0.4)" }}>{u.email}</td>
                <td className="px-4 py-2.5">{roleBadge(u.role)}</td>
                <td className="px-4 py-2.5">
                  <span className={`inline-flex text-[10px] font-medium px-2 py-0.5 rounded ${u.active ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
                    {u.active ? "Ativo" : "Inativo"}
                  </span>
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(u)} className="p-1 rounded hover:bg-white/10" title="Editar"><Pencil size={12} style={{ color: "rgba(242,240,232,0.4)" }} /></button>
                    <button onClick={() => setDeleteModal({ open: true, id: u.id, name: u.name })} className="p-1 rounded hover:bg-red-500/20" title="Excluir"><Trash2 size={12} className="text-red-400" /></button>
                  </div>
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

      {/* User CRUD Modal */}
      <Dialog open={modal.open} onOpenChange={() => setModal({ open: false })}>
        <DialogContent className="bg-[#111] border-white/10 text-[#F2F0E8] max-w-md">
          <DialogHeader><DialogTitle className="text-[#F2F0E8]">{modal.user ? "Editar Usuário" : "Novo Usuário"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            {[{ label: "Nome", key: "name" }, { label: "Usuário (login)", key: "username" }, { label: "E-mail", key: "email" }].map(f => (
              <div key={f.key}>
                <label className="text-[10px] uppercase tracking-widest mb-1 block" style={{ color: "rgba(242,240,232,0.4)" }}>{f.label}</label>
                <input value={(form as any)[f.key]} onChange={e => setForm(fo => ({ ...fo, [f.key]: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-sm text-[#F2F0E8] outline-none" />
              </div>
            ))}
            <div>
              <label className="text-[10px] uppercase tracking-widest mb-1 block" style={{ color: "rgba(242,240,232,0.4)" }}>Perfil</label>
              <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-sm text-[#F2F0E8] outline-none">
                {ROLES.map(r => <option key={r} value={r} className="bg-[#111]">{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={form.active} onChange={e => setForm(f => ({ ...f, active: e.target.checked }))} className="w-4 h-4 rounded" />
              <label className="text-xs">Ativo</label>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-3">
            <Button variant="ghost" onClick={() => setModal({ open: false })} className="text-[#F2F0E8]/60">Cancelar</Button>
            <Button onClick={handleSave} className="bg-[#FFD600] text-black hover:bg-[#E6C200]">Salvar</Button>
          </div>
        </DialogContent>
      </Dialog>

      <VaultDeleteConfirm
        open={deleteModal.open}
        title={`Excluir ${deleteModal.name}?`}
        description="O usuário perderá acesso ao sistema. Esta ação não pode ser desfeita."
        onConfirm={async () => { handleDelete(deleteModal.id); }}
        onClose={() => setDeleteModal(d => ({ ...d, open: false }))}
      />
    </div>
  );
};

export default VaultUsersPage;
