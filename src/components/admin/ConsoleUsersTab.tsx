import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Pencil, Trash2, Eye, EyeOff, Users, Shield, Briefcase } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

const ROLES = [
  { value: "admin", label: "Admin", desc: "Acesso completo", icon: Shield, color: "text-gold" },
  { value: "comercial", label: "Comercial", desc: "Não pode excluir leads", icon: Briefcase, color: "text-blue-400" },
];

interface ConsoleUser {
  id: string;
  username: string;
  name: string;
  role: string;
  active: boolean;
  created_at: string;
}

export default function ConsoleUsersTab() {
  const qc = useQueryClient();
  const [modal, setModal] = useState<{ open: boolean; userId?: string }>({ open: false });
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id: string; name: string }>({ open: false, id: "", name: "" });
  const [form, setForm] = useState({ name: "", username: "", password: "", role: "comercial", active: true });
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["console_users"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("console-auth", {
        body: { action: "list" },
      });
      if (error) throw error;
      return (data?.users ?? []) as ConsoleUser[];
    },
  });

  const openNew = () => {
    setForm({ name: "", username: "", password: "", role: "comercial", active: true });
    setShowPassword(false);
    setModal({ open: true });
  };

  const openEdit = (u: ConsoleUser) => {
    setForm({ name: u.name, username: u.username, password: "", role: u.role, active: u.active });
    setShowPassword(false);
    setModal({ open: true, userId: u.id });
  };

  const handleSave = async () => {
    if (!form.name || !form.username) { toast.error("Preencha nome e usuário"); return; }
    if (!modal.userId && (!form.password || form.password.length < 4)) { toast.error("Senha mínima: 4 caracteres"); return; }
    if (modal.userId && form.password && form.password.length < 4) { toast.error("Senha mínima: 4 caracteres"); return; }
    setSaving(true);

    const body: Record<string, unknown> = {
      action: modal.userId ? "update" : "create",
      name: form.name,
      username: form.username,
      role: form.role,
      active: form.active,
    };
    if (modal.userId) body.id = modal.userId;
    if (form.password) body.password = form.password;

    const { data, error } = await supabase.functions.invoke("console-auth", { body });
    setSaving(false);
    if (error || data?.error) { toast.error(data?.error || error?.message || "Erro"); return; }
    toast.success(modal.userId ? "Usuário atualizado" : "Usuário criado");
    qc.invalidateQueries({ queryKey: ["console_users"] });
    setModal({ open: false });
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.functions.invoke("console-auth", {
      body: { action: "delete", id },
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Usuário excluído");
    qc.invalidateQueries({ queryKey: ["console_users"] });
    setDeleteConfirm(d => ({ ...d, open: false }));
  };

  const roleBadge = (role: string) => {
    const r = ROLES.find(r => r.value === role);
    const colorClass = role === "admin" ? "bg-gold/10 text-gold" : "bg-blue-500/10 text-blue-400";
    return (
      <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded ${colorClass}`}>
        {r?.label || role}
      </span>
    );
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Users size={18} className="text-gold" />
          <div>
            <h2 className="font-heading text-sm tracking-[0.15em] font-bold text-foreground">USUÁRIOS</h2>
            <p className="text-[10px] text-muted-foreground/50 tracking-wide">Gerencie acessos ao console</p>
          </div>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-1.5 font-heading text-[9px] tracking-[0.15em] px-3 py-2 bg-gold/90 text-background hover:bg-gold transition-all duration-300 rounded-lg font-bold shadow-[0_0_20px_hsl(var(--gold)/0.15)]"
        >
          <Plus size={12} /> NOVO USUÁRIO
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: "Total", value: users.length, color: "text-foreground" },
          { label: "Admins", value: users.filter(u => u.role === "admin").length, color: "text-gold" },
          { label: "Comercial", value: users.filter(u => u.role === "comercial").length, color: "text-blue-400" },
        ].map(s => (
          <div key={s.label} className="card-gradient rounded-xl p-3 border border-gold-border/20">
            <div className="font-heading text-[9px] tracking-[0.15em] text-muted-foreground/50 mb-1">{s.label.toUpperCase()}</div>
            <div className={`font-heading text-lg font-bold ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="card-gradient rounded-xl border border-gold-border/20 overflow-hidden">
        <div className="px-4 py-3 border-b border-gold-border/20">
          <span className="font-heading text-[10px] tracking-[0.15em] text-muted-foreground/60 font-semibold">LISTA DE USUÁRIOS</span>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-gold-border/10">
              {["Nome", "Usuário", "Cargo", "Status", "Ações"].map(h => (
                <th key={h} className="text-left px-4 py-2.5 font-heading text-[9px] tracking-[0.15em] text-muted-foreground/40 font-semibold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={5} className="text-center py-8 text-xs text-muted-foreground/40">Carregando...</td></tr>
            )}
            {!isLoading && users.length === 0 && (
              <tr><td colSpan={5} className="text-center py-8 text-xs text-muted-foreground/40">Nenhum usuário cadastrado</td></tr>
            )}
            {users.map(u => (
              <tr key={u.id} className="border-b border-gold-border/5 last:border-0 hover:bg-gold-dim/30 transition-colors">
                <td className="px-4 py-2.5 text-xs font-medium text-foreground">{u.name}</td>
                <td className="px-4 py-2.5 text-xs font-mono text-muted-foreground/60">{u.username}</td>
                <td className="px-4 py-2.5">{roleBadge(u.role)}</td>
                <td className="px-4 py-2.5">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${u.active ? "bg-green-500/10 text-green-400" : "bg-destructive/10 text-destructive"}`}>
                    {u.active ? "Ativo" : "Inativo"}
                  </span>
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(u)} className="p-1.5 rounded hover:bg-gold-dim transition-colors" title="Editar">
                      <Pencil size={12} className="text-muted-foreground/50" />
                    </button>
                    <button onClick={() => setDeleteConfirm({ open: true, id: u.id, name: u.name })} className="p-1.5 rounded hover:bg-destructive/10 transition-colors" title="Excluir">
                      <Trash2 size={12} className="text-destructive/60" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Role descriptions */}
      <div className="grid grid-cols-2 gap-3 mt-6">
        {ROLES.map(r => {
          const Icon = r.icon;
          return (
            <div key={r.value} className="card-gradient rounded-xl p-3 border border-gold-border/20">
              <div className="flex items-center gap-2 mb-1">
                <Icon size={12} className={r.color} />
                <span className={`font-heading text-[10px] tracking-[0.15em] font-bold ${r.color}`}>{r.label.toUpperCase()}</span>
              </div>
              <p className="text-[11px] text-muted-foreground/50 leading-relaxed">{r.desc}</p>
            </div>
          );
        })}
      </div>

      {/* User Modal */}
      <Dialog open={modal.open} onOpenChange={() => setModal({ open: false })}>
        <DialogContent className="bg-background border-gold-border/30 text-foreground max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-sm tracking-[0.1em]">
              {modal.userId ? "EDITAR USUÁRIO" : "NOVO USUÁRIO"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {[
              { label: "Nome", key: "name", placeholder: "Nome completo" },
              { label: "Usuário (login)", key: "username", placeholder: "usuario" },
            ].map(f => (
              <div key={f.key}>
                <label className="font-heading text-[10px] tracking-[0.15em] text-muted-foreground/50 mb-1 block font-semibold">{f.label}</label>
                <input
                  value={(form as any)[f.key]}
                  onChange={e => setForm(fo => ({ ...fo, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  className="w-full bg-transparent border border-border px-3 py-2 text-sm text-foreground rounded-lg focus:outline-none focus:border-gold/50 transition-colors"
                />
              </div>
            ))}
            <div>
              <label className="font-heading text-[10px] tracking-[0.15em] text-muted-foreground/50 mb-1 block font-semibold">
                {modal.userId ? "NOVA SENHA (vazio = manter)" : "SENHA"}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={e => setForm(fo => ({ ...fo, password: e.target.value }))}
                  placeholder={modal.userId ? "Manter senha atual" : "Mínimo 4 caracteres"}
                  className="w-full bg-transparent border border-border px-3 py-2 text-sm text-foreground rounded-lg focus:outline-none focus:border-gold/50 transition-colors pr-10"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-gold-dim">
                  {showPassword ? <EyeOff size={14} className="text-muted-foreground/50" /> : <Eye size={14} className="text-muted-foreground/50" />}
                </button>
              </div>
            </div>
            <div>
              <label className="font-heading text-[10px] tracking-[0.15em] text-muted-foreground/50 mb-1 block font-semibold">CARGO</label>
              <select
                value={form.role}
                onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                className="w-full bg-transparent border border-border px-3 py-2 text-sm text-foreground rounded-lg focus:outline-none focus:border-gold/50 transition-colors"
              >
                {ROLES.map(r => <option key={r.value} value={r.value} className="bg-background">{r.label} — {r.desc}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={form.active} onChange={e => setForm(f => ({ ...f, active: e.target.checked }))} className="w-4 h-4 rounded accent-gold" />
              <label className="text-xs text-foreground">Ativo</label>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-3">
            <button onClick={() => setModal({ open: false })} className="font-heading text-[10px] tracking-[0.1em] px-4 py-2 text-muted-foreground/60 hover:text-foreground transition-colors">
              CANCELAR
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="font-heading text-[10px] tracking-[0.15em] px-4 py-2 bg-gold/90 text-background hover:bg-gold transition-all rounded-lg font-bold disabled:opacity-50"
            >
              {saving ? "SALVANDO..." : "SALVAR"}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={deleteConfirm.open} onOpenChange={() => setDeleteConfirm(d => ({ ...d, open: false }))}>
        <DialogContent className="bg-background border-gold-border/30 text-foreground max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-heading text-sm tracking-[0.1em]">EXCLUIR USUÁRIO</DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground/60">
            Tem certeza que deseja excluir <span className="text-foreground font-medium">{deleteConfirm.name}</span>? Esta ação não pode ser desfeita.
          </p>
          <div className="flex justify-end gap-2 mt-3">
            <button onClick={() => setDeleteConfirm(d => ({ ...d, open: false }))} className="font-heading text-[10px] tracking-[0.1em] px-4 py-2 text-muted-foreground/60 hover:text-foreground transition-colors">
              CANCELAR
            </button>
            <button
              onClick={() => handleDelete(deleteConfirm.id)}
              className="font-heading text-[10px] tracking-[0.15em] px-4 py-2 bg-destructive/90 text-destructive-foreground hover:bg-destructive transition-all rounded-lg font-bold"
            >
              EXCLUIR
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
