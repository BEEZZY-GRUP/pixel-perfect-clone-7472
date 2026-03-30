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
const pct = (a: number, b: number) => b > 0 ? Math.min(Math.round((a / b) * 100), 999) : 0;

const VaultGlobalPlanning = () => {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState(0);
  const [goalModal, setGoalModal] = useState<{ open: boolean; goal?: any; companyId?: string }>({ open: false });
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; id: string }>({ open: false, id: "" });
  const [form, setForm] = useState({ description: "", goal_type: "", target_value: "", current_value: "", year: "2026" });

  const { data: companies } = useQuery({
    queryKey: ["vault_companies"],
    queryFn: async () => { const { data } = await supabase.from("vault_companies").select("*").eq("active", true).order("name"); return data ?? []; },
  });
  const { data: goals } = useQuery({
    queryKey: ["vault_goals_all"],
    queryFn: async () => { const { data } = await supabase.from("vault_goals").select("*"); return data ?? []; },
  });
  const { data: budgets } = useQuery({
    queryKey: ["vault_budgets_all"],
    queryFn: async () => { const { data } = await supabase.from("vault_budgets").select("*"); return data ?? []; },
  });
  const { data: entries } = useQuery({
    queryKey: ["vault_entries_plan"],
    queryFn: async () => { const { data } = await supabase.from("vault_entries").select("*").eq("entry_type", "despesa"); return data ?? []; },
  });

  const handleSaveGoal = async () => {
    if (!form.description || !form.target_value) { toast.error("Preencha descrição e meta"); return; }
    const companyId = goalModal.companyId || companies?.[0]?.id;
    if (!companyId) return;
    const payload = { company_id: companyId, description: form.description, goal_type: form.goal_type || "Meta", target_value: Number(form.target_value), current_value: Number(form.current_value) || 0, year: Number(form.year) || 2026 };
    const { error } = goalModal.goal ? await supabase.from("vault_goals").update(payload).eq("id", goalModal.goal.id) : await supabase.from("vault_goals").insert(payload);
    if (error) { toast.error(error.message); return; }
    toast.success(goalModal.goal ? "Meta atualizada" : "Meta criada");
    qc.invalidateQueries({ queryKey: ["vault_goals_all"] });
    setGoalModal({ open: false });
  };
  const openEdit = (g: any) => { setForm({ description: g.description ?? "", goal_type: g.goal_type, target_value: String(g.target_value), current_value: String(g.current_value), year: String(g.year) }); setGoalModal({ open: true, goal: g, companyId: g.company_id }); };
  const openNew = (cid?: string) => { setForm({ description: "", goal_type: "", target_value: "", current_value: "", year: "2026" }); setGoalModal({ open: true, companyId: cid || companies?.[0]?.id }); };

  const tabs = ["OKRs & Metas", "Projeções", "Budget Anual"];

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

      <div className="flex border-b border-white/5 mb-5 gap-0">
        {tabs.map((t, i) => (
          <button key={t} onClick={() => setActiveTab(i)}
            className={`px-3.5 py-2 text-xs whitespace-nowrap border-b-2 transition-colors ${activeTab === i ? "text-[#FFD600] border-[#FFD600] font-medium" : "text-white/40 border-transparent hover:text-white/60"}`}
          >{t}</button>
        ))}
      </div>

      {/* OKRs */}
      {activeTab === 0 && (
        <div>
          <div className="text-xs mb-4" style={{ color: "rgba(242,240,232,0.4)" }}>Objetivos 2026 — {goals?.length ?? 0} KRs ativos</div>
          {companies?.map((c: any) => {
            const coGoals = goals?.filter((g: any) => g.company_id === c.id) ?? [];
            if (coGoals.length === 0) return null;
            return (
              <div key={c.id} className="rounded-xl border border-white/5 p-4 mb-4" style={{ background: "#0e0e0a" }}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: c.color }} />
                  <span className="text-sm font-semibold">{c.name}</span>
                  {c.is_holding && <span className="text-[8px] font-bold px-1.5 rounded" style={{ background: "rgba(255,214,0,0.15)", color: "#FFD600" }}>HOLDING</span>}
                </div>
                <div className="space-y-2">
                  {coGoals.map((g: any) => {
                    const p = g.goal_type === "Churn" ? pct(Number(g.target_value), Number(g.current_value)) : pct(Number(g.current_value), Number(g.target_value));
                    return (
                      <div key={g.id} className="flex items-center gap-3 py-1.5 border-b border-white/5 last:border-0">
                        <div className="flex-1 text-[11px]" style={{ color: "rgba(242,240,232,0.4)" }}>{g.description}</div>
                        <div className="text-[11px] font-medium min-w-[80px] text-right">
                          {Number(g.current_value) < 100 ? g.current_value + (g.goal_type === "Churn" ? "%" : "") : fmtK(Number(g.current_value))} / {Number(g.target_value) < 100 ? g.target_value + (g.goal_type === "Churn" ? "%" : "") : fmtK(Number(g.target_value))}
                        </div>
                        <div className="w-[70px] h-[3px] rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.07)" }}>
                          <div className="h-full rounded-full" style={{ width: `${Math.min(p, 100)}%`, background: p >= 100 ? "#22c55e" : p >= 70 ? "#FFD600" : "#f59e0b" }} />
                        </div>
                        <span className="text-[10px] min-w-[30px] text-right" style={{ color: "#FFD600" }}>{p}%</span>
                        <button onClick={() => openEdit(g)} className="p-1 rounded hover:bg-white/10"><Pencil size={11} style={{ color: "rgba(242,240,232,0.4)" }} /></button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Projeções */}
      {activeTab === 1 && (
        <div>
          <div className="grid grid-cols-3 gap-2.5 mb-5">
            {[
              { label: "MRR Projetado Jun/26", value: "R$ 620k", sub: "▲ +27,3% vs atual", cls: "bg-gradient-to-r from-[#FFD600] to-[#E6C200] bg-clip-text text-transparent" },
              { label: "ARR Projetado 2026", value: "R$ 6,8M", sub: "Crescimento anual" },
              { label: "Runway", value: "18 meses", sub: "Com base no burn rate", cls: "text-green-400" },
            ].map((k, i) => (
              <div key={i} className="rounded-xl p-3.5 border border-white/5" style={{ background: "#0e0e0a" }}>
                <div className="text-[10px] uppercase tracking-widest mb-1" style={{ color: "rgba(242,240,232,0.4)" }}>{k.label}</div>
                <div className={`font-heading text-lg font-semibold ${k.cls ?? ""}`}>{k.value}</div>
                <div className="text-[10px] mt-1" style={{ color: "rgba(242,240,232,0.3)" }}>{k.sub}</div>
              </div>
            ))}
          </div>
          <div className="rounded-xl border border-white/5 overflow-hidden" style={{ background: "#0e0e0a" }}>
            <div className="px-4 py-3 border-b border-white/5"><span className="text-xs font-medium">Projeção MRR — Próximos 6 meses</span></div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left px-4 py-2 text-[9px] uppercase tracking-widest font-medium" style={{ color: "rgba(242,240,232,0.25)" }}>Empresa</th>
                  {["Abr", "Mai", "Jun", "Jul", "Ago", "Set"].map(m => <th key={m} className="text-left px-4 py-2 text-[9px] uppercase tracking-widest font-medium" style={{ color: "rgba(242,240,232,0.25)" }}>{m}/26</th>)}
                </tr>
              </thead>
              <tbody>
                {[
                  { name: "Beezzy", base: 248000, rate: 1.05, color: "#a78bfa" },
                  { name: "Palpita.io", base: 146000, rate: 1.06, color: "#f472b6" },
                  { name: "Starmind", base: 93000, rate: 1.04, color: "#F5C518" },
                ].map(co => (
                  <tr key={co.name} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                    <td className="px-4 py-2.5"><span className="inline-flex text-[10px] font-medium px-2 py-0.5 rounded" style={{ background: `${co.color}15`, color: co.color }}>{co.name}</span></td>
                    {[1,2,3,4,5,6].map(i => <td key={i} className="px-4 py-2.5 text-xs">{fmtK(Math.round(co.base * Math.pow(co.rate, i)))}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Budget Anual */}
      {activeTab === 2 && (
        <div>
          {companies?.map((c: any) => {
            const coBudgets = budgets?.filter((b: any) => b.company_id === c.id) ?? [];
            if (coBudgets.length === 0) return null;
            return (
              <div key={c.id} className="rounded-xl border border-white/5 mb-4 overflow-hidden" style={{ background: "#0e0e0a" }}>
                <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: c.color }} />
                    <span className="text-xs font-medium">{c.name}</span>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => toast.info("Editando budget...")} className="h-6 text-[10px] px-2 border-white/10 text-white/60">Editar Budget</Button>
                </div>
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/5">
                      {["Categoria", "Orçado", "Realizado", "Saldo", "Utilização"].map(h => (
                        <th key={h} className="text-left px-4 py-2 text-[9px] uppercase tracking-widest font-medium" style={{ color: "rgba(242,240,232,0.25)" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {coBudgets.map((b: any) => {
                      const realized = entries?.filter((e: any) => e.company_id === c.id && e.category === b.category).reduce((a: number, e: any) => a + Number(e.amount), 0) ?? 0;
                      const u = pct(realized, Number(b.amount));
                      const saldo = Number(b.amount) - realized;
                      return (
                        <tr key={b.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                          <td className="px-4 py-2.5 text-xs">{b.category}</td>
                          <td className="px-4 py-2.5 text-xs">{fmt(Number(b.amount))}</td>
                          <td className="px-4 py-2.5 text-xs">{fmt(realized)}</td>
                          <td className={`px-4 py-2.5 text-xs ${saldo >= 0 ? "text-green-400" : "text-red-400"}`}>{fmt(saldo)}</td>
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-2">
                              <div className="w-20 h-[3px] rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.07)" }}>
                                <div className="h-full rounded-full" style={{ width: `${Math.min(u, 100)}%`, background: u > 100 ? "#ef4444" : u > 85 ? "#f59e0b" : "#FFD600" }} />
                              </div>
                              <span className="text-[11px]" style={{ color: "rgba(242,240,232,0.4)" }}>{u}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
      )}

      {/* Goal Modal */}
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
            {[{ label: "Descrição", key: "description" }, { label: "Tipo (MRR, Churn...)", key: "goal_type" }].map(f => (
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

      <VaultDeleteConfirm open={deleteModal.open} title="Excluir Meta?" description="Esta ação não pode ser desfeita."
        onConfirm={async () => { const { error } = await supabase.from("vault_goals").delete().eq("id", deleteModal.id); if (error) throw error; toast.success("Meta excluída"); qc.invalidateQueries({ queryKey: ["vault_goals_all"] }); }}
        onClose={() => setDeleteModal(d => ({ ...d, open: false }))}
      />
    </div>
  );
};

export default VaultGlobalPlanning;
