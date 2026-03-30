import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import VaultDeleteConfirm from "./VaultDeleteConfirm";

const fmt = (v: number) => "R$ " + Math.round(v).toLocaleString("pt-BR");
const fmtK = (v: number) => v >= 1000 ? "R$ " + (v / 1000).toFixed(v % 1000 === 0 ? 0 : 1).replace(".", ",") + "k" : fmt(v);

const VaultGlobalPlanning = () => {
  const qc = useQueryClient();
  const [goalModal, setGoalModal] = useState<{ open: boolean; goal?: any; companyId?: string }>({ open: false });
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; id: string }>({ open: false, id: "" });

  const { data: companies } = useQuery({
    queryKey: ["vault_companies"],
    queryFn: async () => { const { data } = await supabase.from("vault_companies").select("*").eq("active", true).order("name"); return data ?? []; },
  });

  const { data: goals } = useQuery({
    queryKey: ["vault_goals_all"],
    queryFn: async () => { const { data } = await supabase.from("vault_goals").select("*"); return data ?? []; },
  });

  const [form, setForm] = useState({ description: "", goal_type: "", target_value: "", current_value: "", year: "2026" });

  const handleSaveGoal = async () => {
    if (!form.description || !form.target_value) { toast.error("Preencha descrição e meta"); return; }
    const companyId = goalModal.companyId || companies?.[0]?.id;
    if (!companyId) { toast.error("Nenhuma empresa disponível"); return; }
    const payload = {
      company_id: companyId,
      description: form.description,
      goal_type: form.goal_type || "Meta",
      target_value: Number(form.target_value),
      current_value: Number(form.current_value) || 0,
      year: Number(form.year) || 2026,
    };
    const { error } = goalModal.goal
      ? await supabase.from("vault_goals").update(payload).eq("id", goalModal.goal.id)
      : await supabase.from("vault_goals").insert(payload);
    if (error) { toast.error(error.message); return; }
    toast.success(goalModal.goal ? "Meta atualizada" : "Meta criada");
    qc.invalidateQueries({ queryKey: ["vault_goals_all"] });
    setGoalModal({ open: false });
  };

  const openEdit = (g: any) => {
    setForm({ description: g.description ?? "", goal_type: g.goal_type, target_value: String(g.target_value), current_value: String(g.current_value), year: String(g.year) });
    setGoalModal({ open: true, goal: g, companyId: g.company_id });
  };

  const openNew = (companyId?: string) => {
    setForm({ description: "", goal_type: "", target_value: "", current_value: "", year: "2026" });
    setGoalModal({ open: true, companyId: companyId || companies?.[0]?.id });
  };

  const getCoName = (id: string) => companies?.find((c: any) => c.id === id)?.name ?? "—";
  const getCoColor = (id: string) => companies?.find((c: any) => c.id === id)?.color ?? "#888";

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="font-heading text-xl font-semibold tracking-tight">Planejamento & Estratégia</h1>
          <p className="text-[11px]" style={{ color: "rgba(242,240,232,0.4)" }}>OKRs, metas e projeções do grupo</p>
        </div>
        <Button size="sm" onClick={() => openNew()} className="bg-[#FFD600] text-black hover:bg-[#E6C200] h-7 text-[11px] px-2.5">
          <Plus size={12} className="mr-1" /> Nova Meta
        </Button>
      </div>

      {companies?.map((c: any) => {
        const coGoals = goals?.filter((g: any) => g.company_id === c.id) ?? [];
        if (coGoals.length === 0) return null;
        return (
          <div key={c.id} className="rounded-xl border border-white/5 p-4 mb-4" style={{ background: "#0e0e0a" }}>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: c.color }} />
              <span className="text-sm font-semibold">{c.name}</span>
              {c.is_holding && <span className="text-[8px] font-bold px-1.5 rounded" style={{ background: "rgba(255,214,0,0.15)", color: "#FFD600" }}>HOLDING</span>}
              <Button size="sm" variant="ghost" onClick={() => openNew(c.id)} className="ml-auto h-6 text-[10px] px-2 text-[#FFD600]">
                <Plus size={10} className="mr-1" /> Adicionar
              </Button>
            </div>
            <div className="space-y-3">
              {coGoals.map((g: any) => {
                const p = Number(g.target_value) > 0 ? Math.round((Number(g.current_value) / Number(g.target_value)) * 100) : 0;
                return (
                  <div key={g.id} className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="flex justify-between text-[11px] mb-1">
                        <span>{g.description} <span className="text-[9px]" style={{ color: "rgba(242,240,232,0.3)" }}>({g.goal_type})</span></span>
                        <span style={{ color: "#FFD600" }}>{p}%</span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                        <div className="h-full rounded-full" style={{ width: `${Math.min(p, 100)}%`, background: p >= 100 ? "#22c55e" : p >= 70 ? "#FFD600" : "#f59e0b" }} />
                      </div>
                      <div className="text-[10px] mt-1" style={{ color: "rgba(242,240,232,0.3)" }}>
                        {fmtK(Number(g.current_value))} / {fmtK(Number(g.target_value))}
                      </div>
                    </div>
                    <button onClick={() => openEdit(g)} className="p-1 rounded hover:bg-white/10"><Pencil size={12} style={{ color: "rgba(242,240,232,0.4)" }} /></button>
                    <button onClick={() => setDeleteModal({ open: true, id: g.id })} className="p-1 rounded hover:bg-red-500/20"><Trash2 size={12} className="text-red-400" /></button>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {(goals?.length ?? 0) === 0 && (
        <div className="text-center py-12 text-xs" style={{ color: "rgba(242,240,232,0.3)" }}>Nenhuma meta cadastrada. Clique em "+ Nova Meta" para começar.</div>
      )}

      <Dialog open={goalModal.open} onOpenChange={() => setGoalModal({ open: false })}>
        <DialogContent className="bg-[#111] border-white/10 text-[#F2F0E8] max-w-md">
          <DialogHeader><DialogTitle className="text-[#F2F0E8]">{goalModal.goal ? "Editar Meta" : "Nova Meta"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-[10px] uppercase tracking-widest mb-1 block" style={{ color: "rgba(242,240,232,0.4)" }}>Empresa</label>
              <select value={goalModal.companyId} onChange={e => setGoalModal(g => ({ ...g, companyId: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-sm text-[#F2F0E8] outline-none">
                {companies?.map((c: any) => <option key={c.id} value={c.id} className="bg-[#111]">{c.name}</option>)}
              </select>
            </div>
            {[
              { label: "Descrição", key: "description" },
              { label: "Tipo (MRR, Churn, Clientes...)", key: "goal_type" },
            ].map(f => (
              <div key={f.key}>
                <label className="text-[10px] uppercase tracking-widest mb-1 block" style={{ color: "rgba(242,240,232,0.4)" }}>{f.label}</label>
                <input value={(form as any)[f.key]} onChange={e => setForm(fo => ({ ...fo, [f.key]: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-sm text-[#F2F0E8] outline-none" />
              </div>
            ))}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] uppercase tracking-widest mb-1 block" style={{ color: "rgba(242,240,232,0.4)" }}>Meta</label>
                <input type="number" value={form.target_value} onChange={e => setForm(f => ({ ...f, target_value: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-sm text-[#F2F0E8] outline-none" />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest mb-1 block" style={{ color: "rgba(242,240,232,0.4)" }}>Realizado</label>
                <input type="number" value={form.current_value} onChange={e => setForm(f => ({ ...f, current_value: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-sm text-[#F2F0E8] outline-none" />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-3">
            <Button variant="ghost" onClick={() => setGoalModal({ open: false })} className="text-[#F2F0E8]/60">Cancelar</Button>
            <Button onClick={handleSaveGoal} className="bg-[#FFD600] text-black hover:bg-[#E6C200]">Salvar</Button>
          </div>
        </DialogContent>
      </Dialog>

      <VaultDeleteConfirm
        open={deleteModal.open}
        title="Excluir Meta?"
        description="Esta ação não pode ser desfeita."
        onConfirm={async () => {
          const { error } = await supabase.from("vault_goals").delete().eq("id", deleteModal.id);
          if (error) throw error;
          toast.success("Meta excluída");
          qc.invalidateQueries({ queryKey: ["vault_goals_all"] });
        }}
        onClose={() => setDeleteModal(d => ({ ...d, open: false }))}
      />
    </div>
  );
};

export default VaultGlobalPlanning;
