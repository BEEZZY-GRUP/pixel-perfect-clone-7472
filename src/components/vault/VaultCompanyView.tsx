import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Pencil, Trash2, CheckCircle, XCircle, Save, DollarSign, CreditCard, User } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import VaultEntryForm from "./VaultEntryForm";
import VaultEmployeeForm from "./VaultEmployeeForm";
import VaultBankAccountForm from "./VaultBankAccountForm";
import VaultTransactionForm from "./VaultTransactionForm";
import VaultDeleteConfirm from "./VaultDeleteConfirm";
import { EmployeeProfile } from "./VaultGlobalHR";
import { maskCNPJ, maskPhone, maskCNAE, maskAgency, maskAccountNumber, unmaskCurrency } from "@/lib/masks";

interface Props {
  company: any;
  tab: number;
  onTabChange: (tab: number) => void;
  hasPerm: (p: string) => boolean;
  onDeleteCompany?: (id: string) => void;
}

const fmt = (v: number) => "R$ " + Math.round(v).toLocaleString("pt-BR");
const fmtK = (v: number) => v >= 1000 ? "R$ " + (v / 1000).toFixed(v % 1000 === 0 ? 0 : 1).replace(".", ",") + "k" : fmt(v);
const fmtDate = (s: string | null) => { if (!s) return "-"; const [y, m, d] = s.split("-"); return `${d}/${m}/${y}`; };

const statusBadge = (status: string) => {
  const colors: Record<string, string> = {
    pago: "bg-green-500/10 text-green-400", pendente: "bg-amber-500/10 text-amber-400",
    vencido: "bg-red-500/10 text-red-400", aprovado: "bg-green-500/10 text-green-400",
    ativo: "bg-green-500/10 text-green-400", ferias: "bg-amber-500/10 text-amber-400",
    inativo: "bg-red-500/10 text-red-400", receita: "bg-green-500/10 text-green-400",
    despesa: "bg-red-500/10 text-red-400", transferencia: "bg-blue-500/10 text-blue-400",
  };
  return <span className={`inline-flex text-[10px] font-medium px-2 py-0.5 rounded ${colors[status] ?? "bg-white/5 text-white/40"}`}>{status.charAt(0).toUpperCase() + status.slice(1)}</span>;
};

const VaultCompanyView = ({ company, tab, onTabChange, hasPerm, onDeleteCompany }: Props) => {
  const coId = company.id;
  const qc = useQueryClient();

  // Modals
  const [entryModal, setEntryModal] = useState<{ open: boolean; entry?: any; defaultType?: "despesa" | "faturamento" }>({ open: false });
  const [employeeModal, setEmployeeModal] = useState<{ open: boolean; employee?: any }>({ open: false });
  const [bankAccountModal, setBankAccountModal] = useState<{ open: boolean; account?: any }>({ open: false });
  const [transactionModal, setTransactionModal] = useState<{ open: boolean; transaction?: any }>({ open: false });
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; title: string; desc: string; onConfirm: () => Promise<void> }>({ open: false, title: "", desc: "", onConfirm: async () => {} });
  const [goalModal, setGoalModal] = useState<{ open: boolean; goal?: any }>({ open: false });
  const [goalForm, setGoalForm] = useState({ goal_type: "", description: "", target_value: "", current_value: "" });

  // RH tab state
  const [selectedRHEmployee, setSelectedRHEmployee] = useState<any>(null);
  const [hrSubTab, setHrSubTab] = useState(0);
  const [showVacForm, setShowVacForm] = useState(false);
  const [showSalaryForm, setShowSalaryForm] = useState(false);
  const [vacForm, setVacForm] = useState({ start_date: "", return_date: "", days: 0, leave_type: "Férias", status: "aprovado" });
  const [salaryForm, setSalaryForm] = useState({ new_salary: "", change_date: new Date().toISOString().split("T")[0], reason: "" });

  // Editable settings state
  const [editSettings, setEditSettings] = useState(false);
  const [settingsForm, setSettingsForm] = useState<Record<string, string>>({});

  const { data: monthlyData } = useQuery({
    queryKey: ["vault_monthly", coId],
    queryFn: async () => { const { data } = await supabase.from("vault_monthly_data").select("*").eq("company_id", coId).order("month_date"); return data ?? []; },
  });

  const { data: entries } = useQuery({
    queryKey: ["vault_entries", coId],
    queryFn: async () => { const { data } = await supabase.from("vault_entries").select("*").eq("company_id", coId).order("created_at", { ascending: false }); return data ?? []; },
  });

  const { data: employees } = useQuery({
    queryKey: ["vault_employees", coId],
    queryFn: async () => { const { data } = await supabase.from("vault_employees").select("*").eq("company_id", coId).order("name"); return data ?? []; },
  });

  const { data: goals } = useQuery({
    queryKey: ["vault_goals", coId],
    queryFn: async () => { const { data } = await supabase.from("vault_goals").select("*").eq("company_id", coId); return data ?? []; },
  });

  const { data: bankAccounts } = useQuery({
    queryKey: ["vault_bank_accounts", coId],
    queryFn: async () => { const { data } = await supabase.from("vault_bank_accounts").select("*").eq("company_id", coId).order("bank_name"); return data ?? []; },
  });

  const { data: bankTransactions } = useQuery({
    queryKey: ["vault_bank_transactions", coId],
    queryFn: async () => { const { data } = await supabase.from("vault_bank_transactions").select("*").eq("company_id", coId).order("transaction_date", { ascending: false }); return data ?? []; },
  });

  const { data: companyVacations } = useQuery({
    queryKey: ["vault_vacations_co", coId],
    queryFn: async () => { const { data } = await supabase.from("vault_vacations").select("*").eq("company_id", coId).order("start_date", { ascending: false }); return data ?? []; },
  });

  const { data: companySalaryHistory } = useQuery({
    queryKey: ["vault_salary_history_co", coId],
    queryFn: async () => { const { data } = await supabase.from("vault_salary_history").select("*").eq("company_id", coId).order("change_date", { ascending: false }); return data ?? []; },
  });

  // Compute monthly aggregates from entries
  const computedMonthly = useMemo(() => {
    const all = entries ?? [];
    const map: Record<string, { month_date: string; revenue: number; expenses: number }> = {};
    all.forEach((e: any) => {
      const date = e.entry_date || e.due_date || (e.created_at as string).substring(0, 10);
      const monthKey = (date as string).substring(0, 7);
      if (!map[monthKey]) map[monthKey] = { month_date: monthKey, revenue: 0, expenses: 0 };
      if (e.entry_type === "faturamento" || e.entry_type === "receita") {
        map[monthKey].revenue += Number(e.amount);
      } else {
        map[monthKey].expenses += Number(e.amount);
      }
    });
    // Merge with vault_monthly_data if it has data
    (monthlyData ?? []).forEach((m: any) => {
      const monthKey = (m.month_date as string).substring(0, 7);
      if (!map[monthKey]) {
        map[monthKey] = { month_date: monthKey, revenue: Number(m.revenue), expenses: Number(m.expenses) };
      }
    });
    return Object.values(map).sort((a, b) => a.month_date.localeCompare(b.month_date));
  }, [entries, monthlyData]);

  const current = computedMonthly.length ? computedMonthly[computedMonthly.length - 1] : null;
  const rev = current?.revenue ?? 0;
  const exp = current?.expenses ?? 0;
  const tax = Math.round(rev * (Number(company.aliquota) / 100));
  const result = rev - exp - tax;
  const activeEmps = employees?.filter((e: any) => e.status === "ativo").length ?? 0;
  const payroll = employees?.reduce((a: number, e: any) => a + Number(e.salary), 0) ?? 0;
  const totalBalance = bankAccounts?.reduce((a: number, b: any) => a + Number(b.balance), 0) ?? 0;
  const activeAccounts = bankAccounts?.filter((a: any) => a.active).length ?? 0;
  const unconciledCount = bankTransactions?.filter((t: any) => !t.reconciled).length ?? 0;

  // Filtered entries
  const despesas = entries?.filter((e: any) => e.entry_type === "despesa") ?? [];
  const faturamentos = entries?.filter((e: any) => e.entry_type === "faturamento") ?? [];
  const contasAPagar = despesas.filter((e: any) => e.status === "pendente" || e.status === "vencido");

  const handleDelete = (table: string, id: string, label: string, queryKey: string) => {
    setDeleteModal({
      open: true, title: `Excluir ${label}?`, desc: "Esta ação não pode ser desfeita.",
      onConfirm: async () => {
        const { error } = await supabase.from(table as any).delete().eq("id", id);
        if (error) throw error;
        toast.success(`${label} excluído`);
        qc.invalidateQueries({ queryKey: [queryKey, coId] });
      },
    });
  };

  const handleReconcile = async (id: string, val: boolean) => {
    const { error } = await supabase.from("vault_bank_transactions").update({ reconciled: val }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success(val ? "Conciliado" : "Desconciliado");
    qc.invalidateQueries({ queryKey: ["vault_bank_transactions", coId] });
  };

  const handlePayEntry = async (id: string) => {
    const { error } = await supabase.from("vault_entries").update({ status: "pago", payment_date: new Date().toISOString().split("T")[0] }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Marcado como pago");
    qc.invalidateQueries({ queryKey: ["vault_entries", coId] });
  };

  const addBtn = (label: string, onClick: () => void) => (
    <Button size="sm" onClick={onClick} className="bg-[#FFD600] text-black hover:bg-[#E6C200] h-7 text-[11px] px-2.5">
      <Plus size={12} className="mr-1" /> {label}
    </Button>
  );

  const actionBtns = (onEdit: () => void, onDelete: () => void) => (
    <div className="flex gap-1">
      <button onClick={onEdit} className="p-1 rounded hover:bg-white/10 transition-colors" title="Editar"><Pencil size={12} style={{ color: "rgba(242,240,232,0.4)" }} /></button>
      <button onClick={onDelete} className="p-1 rounded hover:bg-red-500/20 transition-colors" title="Excluir"><Trash2 size={12} className="text-red-400" /></button>
    </div>
  );

  // Settings fields config
  const settingsFields = [
    { key: "name", label: "Nome", type: "text" },
    { key: "cnpj", label: "CNPJ", type: "text" },
    { key: "regime", label: "Regime Tributário", type: "select", options: ["Simples Nacional", "Lucro Presumido", "Lucro Real", "MEI"] },
    { key: "aliquota", label: "Alíquota (%)", type: "number" },
    { key: "cnae", label: "CNAE", type: "text" },
    { key: "ie", label: "Inscrição Estadual", type: "text" },
    { key: "im", label: "Inscrição Municipal", type: "text" },
    { key: "responsible", label: "Responsável", type: "text" },
    { key: "email", label: "E-mail", type: "text" },
    { key: "phone", label: "Telefone", type: "text" },
    { key: "address", label: "Endereço", type: "text" },
    { key: "main_bank", label: "Banco Principal", type: "dynamic_select" },
    { key: "agency", label: "Agência", type: "text" },
    { key: "account_number", label: "Conta", type: "text" },
    { key: "pix_key", label: "Chave Pix", type: "text" },
    { key: "color", label: "Cor", type: "color" },
    { key: "founded_at", label: "Data Fundação", type: "date" },
  ];

  const startEditSettings = () => {
    const f: Record<string, string> = {};
    settingsFields.forEach(sf => { f[sf.key] = String(company[sf.key] ?? ""); });
    setSettingsForm(f);
    setEditSettings(true);
  };

  const handleSaveSettings = async () => {
    const payload: any = {};
    settingsFields.forEach(sf => {
      const v = settingsForm[sf.key];
      if (sf.type === "number") payload[sf.key] = Number(v) || 0;
      else payload[sf.key] = v || null;
    });
    payload.name = settingsForm.name || company.name;
    const { error } = await supabase.from("vault_companies").update(payload).eq("id", coId);
    if (error) { toast.error(error.message); return; }
    toast.success("Dados da empresa atualizados");
    qc.invalidateQueries({ queryKey: ["vault_companies"] });
    setEditSettings(false);
  };

  // Chart data for company reports
  const chartData = computedMonthly.map(m => {
    const [y, mo] = m.month_date.split("-");
    return { name: `${mo}/${y}`, Faturamento: m.revenue, Despesas: m.expenses, Resultado: m.revenue - m.expenses };
  });

  // Entries table renderer
  const renderEntriesTable = (data: any[], title: string, emptyMsg: string, showPayBtn = false) => (
    <div className="rounded-xl border border-white/5 overflow-hidden" style={{ background: "#0e0e0a" }}>
      <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
        <span className="text-xs font-medium">{title} | {company.name}</span>
        <span className="text-[10px] px-2 py-0.5 rounded bg-white/5" style={{ color: "rgba(242,240,232,0.5)" }}>{data.length} registro(s)</span>
      </div>
      <table className="w-full">
        <thead>
          <tr className="border-b border-white/5">
            {["Descrição", "Categoria", "Valor", "Vencimento", "Pagamento", "Status", "Ações"].map(h => (
              <th key={h} className="text-left px-4 py-2 text-[9px] uppercase tracking-widest font-medium" style={{ color: "rgba(242,240,232,0.25)" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 && <tr><td colSpan={7} className="text-center py-8 text-xs" style={{ color: "rgba(242,240,232,0.3)" }}>{emptyMsg}</td></tr>}
          {data.map((e: any) => (
            <tr key={e.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
              <td className="px-4 py-2.5 text-xs">{e.description}</td>
              <td className="px-4 py-2.5 text-xs" style={{ color: "rgba(242,240,232,0.4)" }}>{e.category || "-"}</td>
              <td className="px-4 py-2.5 text-xs font-medium">{fmt(Number(e.amount))}</td>
              <td className="px-4 py-2.5 text-xs" style={{ color: "rgba(242,240,232,0.4)" }}>{fmtDate(e.due_date)}</td>
              <td className="px-4 py-2.5 text-xs" style={{ color: "rgba(242,240,232,0.4)" }}>{fmtDate(e.payment_date)}</td>
              <td className="px-4 py-2.5">{statusBadge(e.status)}</td>
              <td className="px-4 py-2.5">
                <div className="flex gap-1">
                  {showPayBtn && e.status !== "pago" && hasPerm("fin") && (
                    <button onClick={() => handlePayEntry(e.id)} className="p-1 rounded hover:bg-green-500/20 transition-colors" title="Marcar como pago">
                      <CheckCircle size={12} className="text-green-400" />
                    </button>
                  )}
                  {hasPerm("fin") && actionBtns(
                    () => setEntryModal({ open: true, entry: e }),
                    () => handleDelete("vault_entries", e.id, "Lançamento", "vault_entries")
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <span className="w-3 h-3 rounded-full" style={{ background: company.color }} />
        <h1 className="font-heading text-xl font-semibold tracking-tight">{company.name}</h1>
        {company.is_holding && (
          <span className="text-[9px] font-bold px-2 py-0.5 rounded" style={{ background: "rgba(255,214,0,0.15)", color: "#FFD600" }}>HOLDING</span>
        )}
        <span className="text-[11px] ml-2" style={{ color: "rgba(242,240,232,0.35)" }}>CNPJ: {company.cnpj || "-"} • {company.regime}</span>
      </div>

      {/* Tab 0: Dashboard */}
      {tab === 0 && (
        <div>
          {/* KPI Row 1 - Financial */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mb-4">
            {[
              { label: "Faturamento", value: fmtK(rev), accent: true },
              { label: `Imposto (${company.aliquota}%)`, value: fmtK(tax), neg: true },
              { label: "Despesas", value: fmtK(exp) },
              { label: "Resultado", value: fmtK(result), pos: result > 0, neg2: result < 0 },
            ].map((k, i) => (
              <div key={i} className="rounded-xl p-3.5 border border-white/5" style={{ background: "#0e0e0a" }}>
                <div className="text-[10px] uppercase tracking-widest mb-2" style={{ color: "rgba(242,240,232,0.4)" }}>{k.label}</div>
                <div className={`font-heading text-lg font-semibold tracking-tight ${
                  k.accent ? "bg-gradient-to-r from-[#FFD600] to-[#E6C200] bg-clip-text text-transparent" :
                  k.neg ? "text-red-400" : k.pos ? "text-green-400" : k.neg2 ? "text-red-400" : ""
                }`}>{k.value}</div>
              </div>
            ))}
          </div>

          {/* KPI Row 2 - Operations */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mb-5">
            {[
              { label: "Colaboradores", value: String(activeEmps) },
              { label: "Folha Mensal", value: fmtK(payroll) },
              { label: "Saldo Bancário", value: fmtK(totalBalance), cls: "text-green-400" },
              { label: "Contas a Pagar", value: String(contasAPagar.length), cls: contasAPagar.length > 0 ? "text-amber-400" : "" },
            ].map((k, i) => (
              <div key={i} className="rounded-xl p-3.5 border border-white/5" style={{ background: "#0e0e0a" }}>
                <div className="text-[10px] uppercase tracking-widest mb-1" style={{ color: "rgba(242,240,232,0.4)" }}>{k.label}</div>
                <div className={`font-heading text-lg font-semibold ${k.cls ?? ""}`}>{k.value}</div>
              </div>
            ))}
          </div>

          {/* Chart + Goals Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
            {/* Revenue Chart */}
            <div className="rounded-xl border border-white/5 p-4" style={{ background: "#0e0e0a" }}>
              <h3 className="text-xs font-medium mb-3">Faturamento vs Despesas</h3>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={chartData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                    <XAxis dataKey="name" tick={{ fill: "rgba(242,240,232,0.35)", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "rgba(242,240,232,0.25)", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => fmtK(v)} />
                    <Tooltip contentStyle={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 11 }} itemStyle={{ color: "#F2F0E8" }} labelStyle={{ color: "#F2F0E8" }} formatter={(v: number) => fmt(v)} />
                    <Bar dataKey="Faturamento" fill={company.color} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Despesas" fill="#ef4444" radius={[4, 4, 0, 0]} opacity={0.6} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[180px] text-xs" style={{ color: "rgba(242,240,232,0.3)" }}>Sem dados mensais</div>
              )}
            </div>

            {/* Goals */}
            <div className="rounded-xl border border-white/5 p-4" style={{ background: "#0e0e0a" }}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-medium">Metas {new Date().getFullYear()}</h3>
                {hasPerm("fin") && (
                  <button
                    onClick={() => {
                      setGoalForm({ goal_type: "", description: "", target_value: "", current_value: "" });
                      setGoalModal({ open: true });
                    }}
                    className="p-1 rounded hover:bg-white/10 transition-colors"
                    title="Adicionar meta"
                  >
                    <Plus size={14} className="text-[#FFD600]" />
                  </button>
                )}
              </div>
              {(goals?.length ?? 0) > 0 ? (
                <div className="space-y-3">
                  {goals?.map((g: any) => {
                    const p = Number(g.target_value) > 0 ? Math.round((Number(g.current_value) / Number(g.target_value)) * 100) : 0;
                    return (
                      <div key={g.id} className="group">
                        <div className="flex justify-between text-[11px] mb-1">
                          <span className="truncate mr-2">{g.description || g.goal_type}</span>
                          <div className="flex items-center gap-1">
                            <span className="flex-shrink-0" style={{ color: p >= 100 ? "#22c55e" : "#FFD600" }}>{p}%</span>
                            {hasPerm("fin") && (
                              <>
                                <button onClick={() => { setGoalForm({ goal_type: g.goal_type, description: g.description || "", target_value: String(g.target_value), current_value: String(g.current_value) }); setGoalModal({ open: true, goal: g }); }} className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-white/10 transition-all"><Pencil size={10} className="text-white/40" /></button>
                                <button onClick={() => handleDelete("vault_goals", g.id, "Meta", "vault_goals")} className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-red-500/20 transition-all"><Trash2 size={10} className="text-red-400/60" /></button>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                          <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(p, 100)}%`, background: p >= 100 ? "#22c55e" : company.color }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[140px] gap-2">
                  <span className="text-xs" style={{ color: "rgba(242,240,232,0.3)" }}>Nenhuma meta cadastrada</span>
                  {hasPerm("fin") && (
                    <button
                      onClick={() => { setGoalForm({ goal_type: "", description: "", target_value: "", current_value: "" }); setGoalModal({ open: true }); }}
                      className="text-[10px] px-3 py-1 rounded bg-[#FFD600]/10 text-[#FFD600] hover:bg-[#FFD600]/20 transition-colors"
                    >
                      + Criar meta
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Bottom Row: Upcoming Payments + Recent Entries */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Upcoming Payments */}
            <div className="rounded-xl border border-white/5 overflow-hidden" style={{ background: "#0e0e0a" }}>
              <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
                <span className="text-xs font-medium">Próximos Vencimentos</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-white/5" style={{ color: "rgba(242,240,232,0.5)" }}>{contasAPagar.length}</span>
              </div>
              {contasAPagar.length === 0 ? (
                <div className="text-center py-8 text-xs" style={{ color: "rgba(242,240,232,0.3)" }}>Nenhuma conta pendente 🎉</div>
              ) : (
                <div className="divide-y divide-white/5">
                  {contasAPagar.slice(0, 5).map((e: any) => {
                    const isOverdue = e.status === "vencido";
                    return (
                      <div key={e.id} className="px-4 py-2.5 flex items-center justify-between">
                        <div className="min-w-0 flex-1 mr-3">
                          <div className="text-xs truncate">{e.description}</div>
                          <div className="text-[10px] mt-0.5" style={{ color: "rgba(242,240,232,0.35)" }}>{e.category || "Sem categoria"} • Vence {fmtDate(e.due_date)}</div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className={`text-xs font-semibold ${isOverdue ? "text-red-400" : ""}`}>{fmt(Number(e.amount))}</div>
                          {statusBadge(e.status)}
                        </div>
                      </div>
                    );
                  })}
                  {contasAPagar.length > 5 && (
                    <div className="px-4 py-2 text-center">
                      <button onClick={() => onTabChange(5)} className="text-[10px] text-[#FFD600] hover:underline">Ver todas ({contasAPagar.length})</button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Recent Entries */}
            <div className="rounded-xl border border-white/5 overflow-hidden" style={{ background: "#0e0e0a" }}>
              <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
                <span className="text-xs font-medium">Últimos Lançamentos</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-white/5" style={{ color: "rgba(242,240,232,0.5)" }}>{entries?.length ?? 0}</span>
              </div>
              {(entries?.length ?? 0) === 0 ? (
                <div className="text-center py-8 text-xs" style={{ color: "rgba(242,240,232,0.3)" }}>Nenhum lançamento registrado</div>
              ) : (
                <div className="divide-y divide-white/5">
                  {entries?.slice(0, 5).map((e: any) => {
                    const isFat = e.entry_type === "faturamento";
                    return (
                      <div key={e.id} className="px-4 py-2.5 flex items-center justify-between">
                        <div className="min-w-0 flex-1 mr-3">
                          <div className="text-xs truncate">{e.description}</div>
                          <div className="text-[10px] mt-0.5" style={{ color: "rgba(242,240,232,0.35)" }}>{e.category || "-"} • {fmtDate(e.entry_date || e.due_date)}</div>
                        </div>
                        <span className={`text-xs font-semibold flex-shrink-0 ${isFat ? "text-green-400" : "text-red-400"}`}>
                          {isFat ? "+" : "-"}{fmt(Number(e.amount))}
                        </span>
                      </div>
                    );
                  })}
                  {(entries?.length ?? 0) > 5 && (
                    <div className="px-4 py-2 text-center">
                      <button onClick={() => onTabChange(3)} className="text-[10px] text-[#FFD600] hover:underline">Ver todos ({entries?.length})</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Bank Accounts Summary */}
          {(bankAccounts?.length ?? 0) > 0 && (
            <div className="rounded-xl border border-white/5 p-4 mt-5" style={{ background: "#0e0e0a" }}>
              <h3 className="text-xs font-medium mb-3">Contas Bancárias</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {bankAccounts?.filter((a: any) => a.active).map((a: any) => (
                  <div key={a.id} className="rounded-lg border border-white/5 p-3 flex items-center gap-3" style={{ background: "rgba(255,255,255,0.02)" }}>
                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                      <CreditCard size={14} className="text-[#FFD600]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] font-medium truncate">{a.bank_name}</div>
                      <div className="text-[10px]" style={{ color: "rgba(242,240,232,0.35)" }}>Ag {a.agency || "-"} • {a.account_type}</div>
                    </div>
                    <div className={`text-xs font-semibold ${Number(a.balance) >= 0 ? "text-green-400" : "text-red-400"}`}>{fmtK(Number(a.balance))}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 1: Controle Bancário */}
      {tab === 1 && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
            {[
              { label: "Saldo Total", value: fmtK(totalBalance), cls: "bg-gradient-to-r from-[#FFD600] to-[#E6C200] bg-clip-text text-transparent" },
              { label: "Contas Ativas", value: String(activeAccounts) },
              { label: "Transações", value: String(bankTransactions?.length ?? 0) },
              { label: "A Conciliar", value: String(unconciledCount), cls: unconciledCount > 0 ? "text-amber-400" : "text-green-400" },
            ].map((k, i) => (
              <div key={i} className="rounded-xl p-3.5 border border-white/5" style={{ background: "#0e0e0a" }}>
                <div className="text-[10px] uppercase tracking-widest mb-1" style={{ color: "rgba(242,240,232,0.4)" }}>{k.label}</div>
                <div className={`font-heading text-lg font-semibold ${k.cls ?? ""}`}>{k.value}</div>
              </div>
            ))}
          </div>

          {/* Bank Accounts */}
          <div className="rounded-xl border border-white/5 overflow-hidden" style={{ background: "#0e0e0a" }}>
            <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
              <span className="text-xs font-medium">Contas Bancárias</span>
              {hasPerm("fin") && addBtn("Nova Conta", () => setBankAccountModal({ open: true }))}
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  {["Banco", "Agência", "Conta", "Tipo", "Saldo", "Limite", "Status", "Ações"].map(h => (
                    <th key={h} className="text-left px-4 py-2 text-[9px] uppercase tracking-widest font-medium" style={{ color: "rgba(242,240,232,0.25)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bankAccounts?.length === 0 && <tr><td colSpan={8} className="text-center py-8 text-xs" style={{ color: "rgba(242,240,232,0.3)" }}>Nenhuma conta bancária</td></tr>}
                {bankAccounts?.map((a: any) => (
                  <tr key={a.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                    <td className="px-4 py-2.5 text-xs font-medium">{a.bank_name}</td>
                    <td className="px-4 py-2.5 text-xs" style={{ color: "rgba(242,240,232,0.4)" }}>{a.agency || "-"}</td>
                    <td className="px-4 py-2.5 text-xs" style={{ color: "rgba(242,240,232,0.4)" }}>{a.account_number || "-"}</td>
                    <td className="px-4 py-2.5 text-xs" style={{ color: "rgba(242,240,232,0.4)" }}>{a.account_type}</td>
                    <td className={`px-4 py-2.5 text-xs font-medium ${Number(a.balance) >= 0 ? "text-green-400" : "text-red-400"}`}>{fmt(Number(a.balance))}</td>
                    <td className="px-4 py-2.5 text-xs" style={{ color: "rgba(242,240,232,0.4)" }}>{fmt(Number(a.credit_limit || 0))}</td>
                    <td className="px-4 py-2.5">{statusBadge(a.active ? "ativo" : "inativo")}</td>
                    <td className="px-4 py-2.5">
                      {hasPerm("fin") && actionBtns(
                        () => setBankAccountModal({ open: true, account: a }),
                        () => handleDelete("vault_bank_accounts", a.id, "Conta bancária", "vault_bank_accounts")
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Transactions */}
          <div className="rounded-xl border border-white/5 overflow-hidden" style={{ background: "#0e0e0a" }}>
            <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
              <span className="text-xs font-medium">Transações Bancárias</span>
              {hasPerm("fin") && addBtn("Nova Transação", () => setTransactionModal({ open: true }))}
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  {["Data", "Descrição", "Tipo", "Conta", "Categoria", "Valor", "Conciliado", "Ações"].map(h => (
                    <th key={h} className="text-left px-4 py-2 text-[9px] uppercase tracking-widest font-medium" style={{ color: "rgba(242,240,232,0.25)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bankTransactions?.length === 0 && <tr><td colSpan={8} className="text-center py-8 text-xs" style={{ color: "rgba(242,240,232,0.3)" }}>Nenhuma transação</td></tr>}
                {bankTransactions?.map((t: any) => {
                  const acct = bankAccounts?.find((a: any) => a.id === t.bank_account_id);
                  return (
                    <tr key={t.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                      <td className="px-4 py-2.5 text-xs" style={{ color: "rgba(242,240,232,0.4)" }}>{fmtDate(t.transaction_date)}</td>
                      <td className="px-4 py-2.5 text-xs">{t.description}</td>
                      <td className="px-4 py-2.5">{statusBadge(t.transaction_type)}</td>
                      <td className="px-4 py-2.5 text-xs" style={{ color: "rgba(242,240,232,0.4)" }}>{acct?.bank_name || "-"}</td>
                      <td className="px-4 py-2.5 text-xs" style={{ color: "rgba(242,240,232,0.4)" }}>{t.category || "-"}</td>
                      <td className={`px-4 py-2.5 text-xs font-medium ${t.transaction_type === "receita" ? "text-green-400" : "text-red-400"}`}>{fmt(Number(t.amount))}</td>
                      <td className="px-4 py-2.5">
                        {hasPerm("fin") ? (
                          <button onClick={() => handleReconcile(t.id, !t.reconciled)}
                            className={`p-1 rounded transition-colors ${t.reconciled ? "text-green-400 hover:text-green-300" : "text-white/20 hover:text-amber-400"}`}
                            title={t.reconciled ? "Desconciliar" : "Conciliar"}>
                            {t.reconciled ? <CheckCircle size={14} /> : <XCircle size={14} />}
                          </button>
                        ) : (t.reconciled ? <CheckCircle size={14} className="text-green-400" /> : <XCircle size={14} className="text-white/20" />)}
                      </td>
                      <td className="px-4 py-2.5">
                        {hasPerm("fin") && actionBtns(
                          () => setTransactionModal({ open: true, transaction: t }),
                          () => handleDelete("vault_bank_transactions", t.id, "Transação", "vault_bank_transactions")
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Lançar Despesa */}
      {tab === 2 && (
        <div>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-heading text-sm font-semibold">Lançar Despesa | {company.name}</h2>
              <p className="text-[11px] mt-0.5" style={{ color: "rgba(242,240,232,0.4)" }}>Registre uma nova despesa para esta empresa</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 mb-5">
            {[
              { label: "Total Despesas", value: fmtK(despesas.reduce((a: number, e: any) => a + Number(e.amount), 0)) },
              { label: "Pendentes", value: String(despesas.filter((e: any) => e.status === "pendente").length), cls: "text-amber-400" },
              { label: "Vencidas", value: String(despesas.filter((e: any) => e.status === "vencido").length), cls: "text-red-400" },
            ].map((k, i) => (
              <div key={i} className="rounded-xl p-3.5 border border-white/5" style={{ background: "#0e0e0a" }}>
                <div className="text-[10px] uppercase tracking-widest mb-1" style={{ color: "rgba(242,240,232,0.4)" }}>{k.label}</div>
                <div className={`font-heading text-lg font-semibold ${k.cls ?? ""}`}>{k.value}</div>
              </div>
            ))}
          </div>

          <div className="flex justify-center mb-5">
            <Button onClick={() => setEntryModal({ open: true, defaultType: "despesa" })}
              className="bg-[#FFD600] text-black hover:bg-[#E6C200] h-10 px-6 text-sm font-medium">
              <DollarSign size={16} className="mr-2" /> Nova Despesa
            </Button>
          </div>

          {despesas.length > 0 && renderEntriesTable(despesas, "Despesas Registradas", "Nenhuma despesa", true)}
        </div>
      )}

      {/* Tab 3: Lançar Faturamento */}
      {tab === 3 && (
        <div>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-heading text-sm font-semibold">Lançar Faturamento | {company.name}</h2>
              <p className="text-[11px] mt-0.5" style={{ color: "rgba(242,240,232,0.4)" }}>Registre uma nova receita para esta empresa</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 mb-5">
            {[
              { label: "Total Faturado", value: fmtK(faturamentos.reduce((a: number, e: any) => a + Number(e.amount), 0)), cls: "bg-gradient-to-r from-[#FFD600] to-[#E6C200] bg-clip-text text-transparent" },
              { label: "Pendentes", value: String(faturamentos.filter((e: any) => e.status === "pendente").length), cls: "text-amber-400" },
              { label: "Recebidos", value: String(faturamentos.filter((e: any) => e.status === "pago").length), cls: "text-green-400" },
            ].map((k, i) => (
              <div key={i} className="rounded-xl p-3.5 border border-white/5" style={{ background: "#0e0e0a" }}>
                <div className="text-[10px] uppercase tracking-widest mb-1" style={{ color: "rgba(242,240,232,0.4)" }}>{k.label}</div>
                <div className={`font-heading text-lg font-semibold ${k.cls ?? ""}`}>{k.value}</div>
              </div>
            ))}
          </div>

          <div className="flex justify-center mb-5">
            <Button onClick={() => setEntryModal({ open: true, defaultType: "faturamento" })}
              className="bg-[#FFD600] text-black hover:bg-[#E6C200] h-10 px-6 text-sm font-medium">
              <CreditCard size={16} className="mr-2" /> Novo Faturamento
            </Button>
          </div>

          {faturamentos.length > 0 && renderEntriesTable(faturamentos, "Faturamentos Registrados", "Nenhum faturamento")}
        </div>
      )}

      {/* Tab 4: Contas a Pagar */}
      {tab === 4 && (
        <div>
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-heading text-sm font-semibold">Contas a Pagar | {company.name}</h2>
            {hasPerm("fin") && addBtn("Nova Despesa", () => setEntryModal({ open: true, defaultType: "despesa" }))}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mb-5">
            {[
              { label: "Total Pendente", value: fmtK(contasAPagar.reduce((a: number, e: any) => a + Number(e.amount), 0)), cls: "text-amber-400" },
              { label: "Vencidas", value: String(contasAPagar.filter((e: any) => e.status === "vencido").length), cls: "text-red-400" },
              { label: "A Vencer", value: String(contasAPagar.filter((e: any) => e.status === "pendente").length) },
              { label: "Total Pagas", value: fmtK(despesas.filter((e: any) => e.status === "pago").reduce((a: number, e: any) => a + Number(e.amount), 0)), cls: "text-green-400" },
            ].map((k, i) => (
              <div key={i} className="rounded-xl p-3.5 border border-white/5" style={{ background: "#0e0e0a" }}>
                <div className="text-[10px] uppercase tracking-widest mb-1" style={{ color: "rgba(242,240,232,0.4)" }}>{k.label}</div>
                <div className={`font-heading text-lg font-semibold ${k.cls ?? ""}`}>{k.value}</div>
              </div>
            ))}
          </div>

          {renderEntriesTable(contasAPagar, "Contas Pendentes", "Nenhuma conta pendente", true)}
        </div>
      )}

      {/* Tab 5: Faturamentos */}
      {tab === 5 && (
        <div>
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-heading text-sm font-semibold">Faturamentos | {company.name}</h2>
            {hasPerm("fin") && addBtn("Novo Faturamento", () => setEntryModal({ open: true, defaultType: "faturamento" }))}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mb-5">
            {[
              { label: "Total Faturado", value: fmtK(faturamentos.reduce((a: number, e: any) => a + Number(e.amount), 0)), cls: "bg-gradient-to-r from-[#FFD600] to-[#E6C200] bg-clip-text text-transparent" },
              { label: "Recebidos", value: fmtK(faturamentos.filter((e: any) => e.status === "pago").reduce((a: number, e: any) => a + Number(e.amount), 0)), cls: "text-green-400" },
              { label: "Pendentes", value: String(faturamentos.filter((e: any) => e.status === "pendente").length), cls: "text-amber-400" },
              { label: "Imposto Est.", value: fmtK(faturamentos.reduce((a: number, e: any) => a + Number(e.amount), 0) * Number(company.aliquota) / 100), cls: "text-red-400" },
            ].map((k, i) => (
              <div key={i} className="rounded-xl p-3.5 border border-white/5" style={{ background: "#0e0e0a" }}>
                <div className="text-[10px] uppercase tracking-widest mb-1" style={{ color: "rgba(242,240,232,0.4)" }}>{k.label}</div>
                <div className={`font-heading text-lg font-semibold ${k.cls ?? ""}`}>{k.value}</div>
              </div>
            ))}
          </div>

          {renderEntriesTable(faturamentos, "Todos os Faturamentos", "Nenhum faturamento")}
        </div>
      )}

      {/* Tab 6: Relatórios */}
      {tab === 6 && (
        <div className="space-y-5">
          <h2 className="font-heading text-sm font-semibold text-[#F2F0E8]">Relatórios | {company.name}</h2>

          {chartData.length > 0 && (
            <div className="rounded-xl border border-white/5 p-4" style={{ background: "#0e0e0a" }}>
              <h3 className="text-xs font-medium mb-3">Faturamento vs Despesas</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData}>
                  <XAxis dataKey="name" tick={{ fill: "rgba(242,240,232,0.4)", fontSize: 10 }} />
                  <YAxis tick={{ fill: "rgba(242,240,232,0.4)", fontSize: 10 }} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, color: "#F2F0E8", fontSize: 12, padding: "8px 12px" }} itemStyle={{ color: "#F2F0E8" }} labelStyle={{ color: "#F2F0E8" }} formatter={(v: number) => fmt(v)} />
                  <Bar dataKey="Faturamento" fill={company.color} radius={[4,4,0,0]} />
                  <Bar dataKey="Despesas" fill="#ef4444" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="rounded-xl border border-white/5 overflow-hidden" style={{ background: "#0e0e0a" }}>
            <div className="px-4 py-3 border-b border-white/5">
              <span className="text-xs font-medium">DRE | {company.name}</span>
            </div>
            {computedMonthly.length === 0 ? (
              <div className="text-center py-8 text-xs" style={{ color: "rgba(242,240,232,0.3)" }}>Nenhum dado mensal</div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5">
                    {["Período", "Faturamento", "Despesas", "Imposto", "Resultado", "Margem"].map(h => (
                      <th key={h} className="text-left px-4 py-2 text-[9px] uppercase tracking-widest font-medium" style={{ color: "rgba(242,240,232,0.25)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {computedMonthly.map((m, idx) => {
                    const r = m.revenue; const e = m.expenses;
                    const t = Math.round(r * (Number(company.aliquota) / 100));
                    const res = r - e - t;
                    const margin = r > 0 ? Math.round((res / r) * 100) : 0;
                    const [y, mo] = (m.month_date as string).split("-");
                    return (
                      <tr key={m.month_date} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                        <td className="px-4 py-2.5 text-xs">{`${mo}/${y}`}</td>
                        <td className="px-4 py-2.5 text-xs font-medium">{fmtK(r)}</td>
                        <td className="px-4 py-2.5 text-xs text-red-400">{fmtK(e)}</td>
                        <td className="px-4 py-2.5 text-xs text-red-400">{fmtK(t)}</td>
                        <td className={`px-4 py-2.5 text-xs font-semibold ${res >= 0 ? "text-green-400" : "text-red-400"}`}>{fmtK(res)}</td>
                        <td className={`px-4 py-2.5 text-xs ${margin >= 0 ? "text-green-400" : "text-red-400"}`}>{margin}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Tab 7: Pessoas & RH (with sub-tabs: Equipe / RH) */}
      {tab === 7 && (
        <div>
          <div className="flex border-b border-white/5 mb-4 gap-0">
            {["Equipe", "RH"].map((t, i) => (
              <button key={t} onClick={() => setHrSubTab(i)}
                className={`px-3.5 py-2 text-xs whitespace-nowrap border-b-2 transition-colors ${hrSubTab === i ? "text-[#FFD600] border-[#FFD600] font-medium" : "text-white/40 border-transparent hover:text-white/60"}`}
              >{t}</button>
            ))}
          </div>

          {/* Sub-tab 0: Equipe (employee table) */}
          {hrSubTab === 0 && (
            <div className="rounded-xl border border-white/5 overflow-hidden" style={{ background: "#0e0e0a" }}>
              <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
                <span className="text-xs font-medium">Equipe | {company.name}</span>
                {hasPerm("ops") && addBtn("Novo Colaborador", () => setEmployeeModal({ open: true }))}
              </div>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5">
                    {["Nome", "Cargo", "Departamento", "Tipo", "Salário", "Admissão", "Status", "Ações"].map(h => (
                      <th key={h} className="text-left px-4 py-2 text-[9px] uppercase tracking-widest font-medium" style={{ color: "rgba(242,240,232,0.25)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {employees?.length === 0 && <tr><td colSpan={8} className="text-center py-8 text-xs" style={{ color: "rgba(242,240,232,0.3)" }}>Nenhum colaborador</td></tr>}
                  {employees?.map((e: any) => (
                    <tr key={e.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                      <td className="px-4 py-2.5 text-xs font-medium">{e.name}</td>
                      <td className="px-4 py-2.5 text-xs" style={{ color: "rgba(242,240,232,0.4)" }}>{e.position || "-"}</td>
                      <td className="px-4 py-2.5 text-xs" style={{ color: "rgba(242,240,232,0.4)" }}>{e.department || "-"}</td>
                      <td className="px-4 py-2.5 text-xs" style={{ color: "rgba(242,240,232,0.4)" }}>{e.employment_type}</td>
                      <td className="px-4 py-2.5 text-xs font-medium">{fmt(Number(e.salary))}</td>
                      <td className="px-4 py-2.5 text-xs" style={{ color: "rgba(242,240,232,0.4)" }}>{fmtDate(e.admission_date)}</td>
                      <td className="px-4 py-2.5">{statusBadge(e.status)}</td>
                      <td className="px-4 py-2.5">
                        {hasPerm("ops") && actionBtns(
                          () => setEmployeeModal({ open: true, employee: e }),
                          () => handleDelete("vault_employees", e.id, "Colaborador", "vault_employees")
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Sub-tab 1: RH (employee profiles with vacations/salary) */}
          {hrSubTab === 1 && (
            <div>
              {selectedRHEmployee ? (
                <EmployeeProfile
                  employee={selectedRHEmployee}
                  vacations={companyVacations?.filter((v: any) => v.employee_id === selectedRHEmployee.id) ?? []}
                  salaryHistory={companySalaryHistory?.filter((s: any) => s.employee_id === selectedRHEmployee.id) ?? []}
                  getCoName={() => company.name}
                  getCoColor={() => company.color}
                  onBack={() => { setSelectedRHEmployee(null); setShowVacForm(false); setShowSalaryForm(false); }}
                  showVacForm={showVacForm}
                  setShowVacForm={setShowVacForm}
                  vacForm={vacForm}
                  setVacForm={setVacForm}
                  showSalaryForm={showSalaryForm}
                  setShowSalaryForm={setShowSalaryForm}
                  salaryForm={salaryForm}
                  setSalaryForm={setSalaryForm}
                  onSaveVacation={async () => {
                    const days = Math.max(1, Math.ceil((new Date(vacForm.return_date).getTime() - new Date(vacForm.start_date).getTime()) / 86400000));
                    await supabase.from("vault_vacations").insert({
                      employee_id: selectedRHEmployee.id,
                      company_id: coId,
                      start_date: vacForm.start_date,
                      return_date: vacForm.return_date,
                      days,
                      leave_type: vacForm.leave_type,
                      status: vacForm.status,
                    });
                    qc.invalidateQueries({ queryKey: ["vault_vacations_co", coId] });
                    qc.invalidateQueries({ queryKey: ["vault_employees", coId] });
                    setShowVacForm(false);
                    setVacForm({ start_date: "", return_date: "", days: 0, leave_type: "Férias", status: "aprovado" });
                  }}
                  onSaveSalary={async () => {
                     const newSal = Number(unmaskCurrency(salaryForm.new_salary));
                    if (!newSal) return;
                    await supabase.from("vault_salary_history").insert({
                      employee_id: selectedRHEmployee.id,
                      company_id: coId,
                      previous_salary: Number(selectedRHEmployee.salary),
                      new_salary: newSal,
                      change_date: salaryForm.change_date,
                      reason: salaryForm.reason || null,
                    });
                    await supabase.from("vault_employees").update({ salary: newSal }).eq("id", selectedRHEmployee.id);
                    setSelectedRHEmployee({ ...selectedRHEmployee, salary: newSal });
                    qc.invalidateQueries({ queryKey: ["vault_salary_history_co", coId] });
                    qc.invalidateQueries({ queryKey: ["vault_employees", coId] });
                    setShowSalaryForm(false);
                    setSalaryForm({ new_salary: "", change_date: new Date().toISOString().split("T")[0], reason: "" });
                  }}
                />
              ) : (
                <div className="rounded-xl border border-white/5 overflow-hidden" style={{ background: "#0e0e0a" }}>
                  <div className="px-4 py-3 border-b border-white/5 flex items-center gap-2">
                    <User size={14} className="text-[#FFD600]" />
                    <span className="text-xs font-medium">Perfis de RH | {company.name}</span>
                  </div>
                  <div className="divide-y divide-white/5">
                    {employees?.length === 0 && <div className="text-center py-8 text-xs" style={{ color: "rgba(242,240,232,0.3)" }}>Nenhum colaborador</div>}
                    {employees?.map((e: any) => {
                      const empVacs = companyVacations?.filter((v: any) => v.employee_id === e.id) ?? [];
                      const empSalary = companySalaryHistory?.filter((s: any) => s.employee_id === e.id) ?? [];
                      const activeVac = empVacs.find((v: any) => new Date(v.start_date) <= new Date() && new Date(v.return_date) >= new Date());
                      return (
                        <button
                          key={e.id}
                          onClick={() => setSelectedRHEmployee(e)}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/[0.03] transition-colors text-left"
                        >
                          <div className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: `${company.color}20`, color: company.color }}>
                            {e.name?.charAt(0)?.toUpperCase() ?? "?"}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium truncate">{e.name}</div>
                            <span className="text-[10px]" style={{ color: "rgba(242,240,232,0.4)" }}>{e.position ?? "-"} · {e.department ?? "-"}</span>
                          </div>
                          <div className="flex items-center gap-3 flex-shrink-0">
                            {activeVac && <span className="text-[9px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 font-medium">Em férias</span>}
                            <div className="text-[10px]" style={{ color: "rgba(242,240,232,0.4)" }}>{empVacs.length} férias · {empSalary.length} alterações</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tab 8: Configurações (Editable) */}
      {tab === 8 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading text-sm font-semibold">Configurações | {company.name}</h2>
            {!editSettings ? (
              <Button size="sm" onClick={startEditSettings} className="bg-[#FFD600] text-black hover:bg-[#E6C200] h-7 text-[11px] px-2.5">
                <Pencil size={12} className="mr-1" /> Editar
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" onClick={() => setEditSettings(false)} className="h-7 text-[11px] px-2.5 text-white/60">Cancelar</Button>
                <Button size="sm" onClick={handleSaveSettings} className="bg-[#FFD600] text-black hover:bg-[#E6C200] h-7 text-[11px] px-2.5">
                  <Save size={12} className="mr-1" /> Salvar
                </Button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {settingsFields.map((f) => (
              <div key={f.key} className="rounded-xl p-3 border border-white/5" style={{ background: "#0e0e0a" }}>
                <div className="text-[9px] uppercase tracking-widest mb-1" style={{ color: "rgba(242,240,232,0.3)" }}>{f.label}</div>
                {editSettings ? (
                  f.type === "select" ? (
                    <select value={settingsForm[f.key] ?? ""} onChange={e => setSettingsForm(s => ({ ...s, [f.key]: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 rounded-md px-2 py-1.5 text-sm text-[#F2F0E8] outline-none">
                      <option value="" className="bg-[#111]">Selecione...</option>
                      {f.options?.map(o => <option key={o} value={o} className="bg-[#111]">{o}</option>)}
                    </select>
                  ) : f.type === "dynamic_select" ? (
                    <select value={settingsForm[f.key] ?? ""} onChange={e => setSettingsForm(s => ({ ...s, [f.key]: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 rounded-md px-2 py-1.5 text-sm text-[#F2F0E8] outline-none">
                      <option value="" className="bg-[#111]">Selecione...</option>
                      {bankAccounts?.filter((a: any) => a.active).map((a: any) => <option key={a.id} value={a.bank_name} className="bg-[#111]">{a.bank_name} ({a.account_type})</option>)}
                    </select>
                  ) : f.type === "color" ? (
                    <div className="flex items-center gap-2">
                      <input type="color" value={settingsForm[f.key] ?? "#888"} onChange={e => setSettingsForm(s => ({ ...s, [f.key]: e.target.value }))} className="w-8 h-8 rounded border-0 bg-transparent cursor-pointer" />
                      <span className="text-sm">{settingsForm[f.key]}</span>
                    </div>
                  ) : (
                    <input
                      type={["cnpj","phone","cnae","agency","account_number"].includes(f.key) ? "text" : f.type}
                      inputMode={["cnpj","phone","cnae","agency","account_number"].includes(f.key) ? "numeric" : undefined}
                      maxLength={{ cnpj: 18, phone: 15, cnae: 9, agency: 6, account_number: 15 }[f.key]}
                      value={settingsForm[f.key] ?? ""}
                      onChange={e => {
                        const maskFns: Record<string, (v: string) => string> = { cnpj: maskCNPJ, phone: maskPhone, cnae: maskCNAE, agency: maskAgency, account_number: maskAccountNumber };
                        const fn = maskFns[f.key];
                        setSettingsForm(s => ({ ...s, [f.key]: fn ? fn(e.target.value) : e.target.value }));
                      }}
                      className="w-full bg-white/5 border border-white/10 rounded-md px-2 py-1.5 text-sm text-[#F2F0E8] outline-none"
                    />
                  )
                ) : (
                  <div className="text-sm">{f.type === "color" ? (
                    <div className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full" style={{ background: company[f.key] ?? "#888" }} />
                      <span>{company[f.key] ?? "-"}</span>
                    </div>
                  ) : (f.key === "founded_at" ? fmtDate(company[f.key]) : (company[f.key] ?? "-"))}</div>
                )}
              </div>
            ))}
          </div>

          {/* Delete Company */}
          <div className="mt-8 rounded-xl border border-red-500/20 p-4" style={{ background: "rgba(239,68,68,0.03)" }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-red-400">Zona de Perigo</div>
                <div className="text-[11px] mt-0.5" style={{ color: "rgba(242,240,232,0.4)" }}>Excluir permanentemente esta empresa e todos os seus dados</div>
              </div>
              <Button size="sm" variant="destructive"
                onClick={() => setDeleteModal({
                  open: true,
                  title: `Excluir ${company.name}?`,
                  desc: "Todos os dados desta empresa (lançamentos, colaboradores, contas bancárias) serão excluídos permanentemente. Esta ação não pode ser desfeita.",
                  onConfirm: async () => {
                    const { error } = await supabase.from("vault_companies").delete().eq("id", coId);
                    if (error) throw error;
                    toast.success("Empresa excluída");
                    qc.invalidateQueries({ queryKey: ["vault_companies"] });
                    onDeleteCompany?.(coId);
                  }
                })}
                className="h-8 text-[11px] px-3 bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20"
              >
                <Trash2 size={12} className="mr-1" /> Excluir Empresa
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {entryModal.open && (
        <VaultEntryForm open companyId={coId} entry={entryModal.entry} defaultType={entryModal.defaultType} onClose={() => setEntryModal({ open: false })} />
      )}
      {employeeModal.open && (
        <VaultEmployeeForm open companyId={coId} employee={employeeModal.employee} onClose={() => setEmployeeModal({ open: false })} />
      )}
      {bankAccountModal.open && (
        <VaultBankAccountForm open companyId={coId} account={bankAccountModal.account} onClose={() => setBankAccountModal({ open: false })} />
      )}
      {transactionModal.open && (
        <VaultTransactionForm open companyId={coId} bankAccounts={bankAccounts ?? []} transaction={transactionModal.transaction} onClose={() => setTransactionModal({ open: false })} />
      )}
      <VaultDeleteConfirm
        open={deleteModal.open}
        title={deleteModal.title}
        description={deleteModal.desc}
        onConfirm={deleteModal.onConfirm}
        onClose={() => setDeleteModal(d => ({ ...d, open: false }))}
      />

      {/* Goal Modal */}
      <Dialog open={goalModal.open} onOpenChange={() => setGoalModal({ open: false })}>
        <DialogContent className="bg-[#111] border-white/10 text-[#F2F0E8] max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#F2F0E8]">{goalModal.goal ? "Editar Meta" : "Nova Meta"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-[10px] uppercase tracking-widest mb-1 block" style={{ color: "rgba(242,240,232,0.4)" }}>Tipo</label>
              <select
                value={goalForm.goal_type}
                onChange={e => setGoalForm(f => ({ ...f, goal_type: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-sm text-[#F2F0E8] focus:border-[#FFD600]/50 outline-none"
              >
                <option value="" className="bg-[#111]">Selecione...</option>
                {["Faturamento", "Clientes", "Margem", "Redução de Custos", "Outros"].map(t => (
                  <option key={t} value={t} className="bg-[#111]">{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest mb-1 block" style={{ color: "rgba(242,240,232,0.4)" }}>Descrição</label>
              <input
                type="text"
                placeholder="Ex: Atingir R$ 100k de faturamento"
                value={goalForm.description}
                onChange={e => setGoalForm(f => ({ ...f, description: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-sm text-[#F2F0E8] focus:border-[#FFD600]/50 outline-none placeholder:text-white/20"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] uppercase tracking-widest mb-1 block" style={{ color: "rgba(242,240,232,0.4)" }}>Valor Alvo</label>
                <input
                  type="number"
                  placeholder="0"
                  value={goalForm.target_value}
                  onChange={e => setGoalForm(f => ({ ...f, target_value: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-sm text-[#F2F0E8] focus:border-[#FFD600]/50 outline-none placeholder:text-white/20"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest mb-1 block" style={{ color: "rgba(242,240,232,0.4)" }}>Valor Atual</label>
                <input
                  type="number"
                  placeholder="0"
                  value={goalForm.current_value}
                  onChange={e => setGoalForm(f => ({ ...f, current_value: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-sm text-[#F2F0E8] focus:border-[#FFD600]/50 outline-none placeholder:text-white/20"
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-3">
            <Button variant="ghost" onClick={() => setGoalModal({ open: false })} className="text-[#F2F0E8]/60">Cancelar</Button>
            <Button
              className="bg-[#FFD600] text-black hover:bg-[#E6C200]"
              onClick={async () => {
                if (!goalForm.goal_type) { toast.error("Selecione o tipo da meta"); return; }
                const payload = {
                  company_id: coId,
                  goal_type: goalForm.goal_type,
                  description: goalForm.description || null,
                  target_value: Number(goalForm.target_value) || 0,
                  current_value: Number(goalForm.current_value) || 0,
                  year: new Date().getFullYear(),
                };
                const { error } = goalModal.goal
                  ? await supabase.from("vault_goals").update(payload).eq("id", goalModal.goal.id)
                  : await supabase.from("vault_goals").insert(payload);
                if (error) { toast.error(error.message); return; }
                toast.success(goalModal.goal ? "Meta atualizada" : "Meta criada");
                qc.invalidateQueries({ queryKey: ["vault_goals", coId] });
                setGoalModal({ open: false });
              }}
            >
              Salvar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VaultCompanyView;
