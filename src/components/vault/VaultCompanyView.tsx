import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Pencil, Trash2, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import VaultEntryForm from "./VaultEntryForm";
import VaultEmployeeForm from "./VaultEmployeeForm";
import VaultBankAccountForm from "./VaultBankAccountForm";
import VaultTransactionForm from "./VaultTransactionForm";
import VaultDeleteConfirm from "./VaultDeleteConfirm";

interface Props {
  company: any;
  tab: number;
  onTabChange: (tab: number) => void;
  hasPerm: (p: string) => boolean;
}

const fmt = (v: number) => "R$ " + Math.round(v).toLocaleString("pt-BR");
const fmtK = (v: number) => v >= 1000 ? "R$ " + (v / 1000).toFixed(v % 1000 === 0 ? 0 : 1).replace(".", ",") + "k" : fmt(v);
const fmtDate = (s: string | null) => { if (!s) return "—"; const [y, m, d] = s.split("-"); return `${d}/${m}/${y}`; };

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

const VaultCompanyView = ({ company, tab, onTabChange, hasPerm }: Props) => {
  const coId = company.id;
  const qc = useQueryClient();

  // Modals
  const [entryModal, setEntryModal] = useState<{ open: boolean; entry?: any }>({ open: false });
  const [employeeModal, setEmployeeModal] = useState<{ open: boolean; employee?: any }>({ open: false });
  const [bankAccountModal, setBankAccountModal] = useState<{ open: boolean; account?: any }>({ open: false });
  const [transactionModal, setTransactionModal] = useState<{ open: boolean; transaction?: any }>({ open: false });
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; title: string; desc: string; onConfirm: () => Promise<void> }>({ open: false, title: "", desc: "", onConfirm: async () => {} });

  const { data: monthlyData } = useQuery({
    queryKey: ["vault_monthly", coId],
    queryFn: async () => {
      const { data } = await supabase.from("vault_monthly_data").select("*").eq("company_id", coId).order("month_date");
      return data ?? [];
    },
  });

  const { data: entries } = useQuery({
    queryKey: ["vault_entries", coId],
    queryFn: async () => {
      const { data } = await supabase.from("vault_entries").select("*").eq("company_id", coId).order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const { data: employees } = useQuery({
    queryKey: ["vault_employees", coId],
    queryFn: async () => {
      const { data } = await supabase.from("vault_employees").select("*").eq("company_id", coId).order("name");
      return data ?? [];
    },
  });

  const { data: goals } = useQuery({
    queryKey: ["vault_goals", coId],
    queryFn: async () => {
      const { data } = await supabase.from("vault_goals").select("*").eq("company_id", coId);
      return data ?? [];
    },
  });

  const { data: bankAccounts } = useQuery({
    queryKey: ["vault_bank_accounts", coId],
    queryFn: async () => {
      const { data } = await supabase.from("vault_bank_accounts").select("*").eq("company_id", coId).order("bank_name");
      return data ?? [];
    },
  });

  const { data: bankTransactions } = useQuery({
    queryKey: ["vault_bank_transactions", coId],
    queryFn: async () => {
      const { data } = await supabase.from("vault_bank_transactions").select("*").eq("company_id", coId).order("transaction_date", { ascending: false });
      return data ?? [];
    },
  });

  const current = monthlyData?.find((m: any) => m.month_date === "2026-03-01");
  const rev = Number(current?.revenue ?? 0);
  const exp = Number(current?.expenses ?? 0);
  const tax = Math.round(rev * (Number(company.aliquota) / 100));
  const result = rev - exp - tax;
  const activeEmps = employees?.filter((e: any) => e.status === "ativo").length ?? 0;
  const payroll = employees?.reduce((a: number, e: any) => a + Number(e.salary), 0) ?? 0;
  const totalBalance = bankAccounts?.reduce((a: number, b: any) => a + Number(b.balance), 0) ?? 0;
  const activeAccounts = bankAccounts?.filter((a: any) => a.active).length ?? 0;
  const unconciledCount = bankTransactions?.filter((t: any) => !t.reconciled).length ?? 0;

  const handleDelete = (table: string, id: string, label: string, queryKey: string) => {
    setDeleteModal({
      open: true,
      title: `Excluir ${label}?`,
      desc: `Esta ação não pode ser desfeita.`,
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

  const addBtn = (label: string, onClick: () => void) => (
    <Button size="sm" onClick={onClick} className="bg-[#FFD600] text-black hover:bg-[#E6C200] h-7 text-[11px] px-2.5">
      <Plus size={12} className="mr-1" /> {label}
    </Button>
  );

  const actionBtns = (onEdit: () => void, onDelete: () => void) => (
    <div className="flex gap-1">
      <button onClick={onEdit} className="p-1 rounded hover:bg-white/10 transition-colors" title="Editar">
        <Pencil size={12} style={{ color: "rgba(242,240,232,0.4)" }} />
      </button>
      <button onClick={onDelete} className="p-1 rounded hover:bg-red-500/20 transition-colors" title="Excluir">
        <Trash2 size={12} className="text-red-400" />
      </button>
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
        <span className="text-[11px] ml-2" style={{ color: "rgba(242,240,232,0.35)" }}>CNPJ: {company.cnpj} • {company.regime}</span>
      </div>

      {/* Tab 0: Dashboard */}
      {tab === 0 && (
        <div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mb-5">
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

          {(goals?.length ?? 0) > 0 && (
            <div className="rounded-xl border border-white/5 p-4 mb-5" style={{ background: "#0e0e0a" }}>
              <h3 className="text-xs font-medium mb-3">Metas 2026</h3>
              <div className="space-y-3">
                {goals?.map((g: any) => {
                  const p = Number(g.target_value) > 0 ? Math.round((Number(g.current_value) / Number(g.target_value)) * 100) : 0;
                  return (
                    <div key={g.id}>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span>{g.description}</span>
                        <span style={{ color: "#FFD600" }}>{p}%</span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                        <div className="h-full rounded-full" style={{ width: `${Math.min(p, 100)}%`, background: company.color }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
            <div className="rounded-xl p-3.5 border border-white/5" style={{ background: "#0e0e0a" }}>
              <div className="text-[10px] uppercase tracking-widest mb-1" style={{ color: "rgba(242,240,232,0.4)" }}>Colaboradores</div>
              <div className="font-heading text-lg font-semibold">{activeEmps}</div>
            </div>
            <div className="rounded-xl p-3.5 border border-white/5" style={{ background: "#0e0e0a" }}>
              <div className="text-[10px] uppercase tracking-widest mb-1" style={{ color: "rgba(242,240,232,0.4)" }}>Folha Mensal</div>
              <div className="font-heading text-lg font-semibold">{fmtK(payroll)}</div>
            </div>
            <div className="rounded-xl p-3.5 border border-white/5" style={{ background: "#0e0e0a" }}>
              <div className="text-[10px] uppercase tracking-widest mb-1" style={{ color: "rgba(242,240,232,0.4)" }}>Saldo Bancário</div>
              <div className="font-heading text-lg font-semibold text-green-400">{fmtK(totalBalance)}</div>
            </div>
            <div className="rounded-xl p-3.5 border border-white/5" style={{ background: "#0e0e0a" }}>
              <div className="text-[10px] uppercase tracking-widest mb-1" style={{ color: "rgba(242,240,232,0.4)" }}>Contas Ativas</div>
              <div className="font-heading text-lg font-semibold">{activeAccounts}</div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 1: Lançamentos */}
      {tab === 1 && (
        <div className="rounded-xl border border-white/5 overflow-hidden" style={{ background: "#0e0e0a" }}>
          <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
            <span className="text-xs font-medium">Lançamentos — {company.name}</span>
            {hasPerm("fin") && addBtn("Novo Lançamento", () => setEntryModal({ open: true }))}
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                {["Descrição", "Tipo", "Categoria", "Valor", "Vencimento", "Status", "Ações"].map(h => (
                  <th key={h} className="text-left px-4 py-2 text-[9px] uppercase tracking-widest font-medium" style={{ color: "rgba(242,240,232,0.25)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {entries?.length === 0 && <tr><td colSpan={7} className="text-center py-8 text-xs" style={{ color: "rgba(242,240,232,0.3)" }}>Nenhum lançamento</td></tr>}
              {entries?.map((e: any) => (
                <tr key={e.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                  <td className="px-4 py-2.5 text-xs">{e.description}</td>
                  <td className="px-4 py-2.5 text-xs capitalize" style={{ color: e.entry_type === "faturamento" ? "#22c55e" : "#ef4444" }}>{e.entry_type}</td>
                  <td className="px-4 py-2.5 text-xs" style={{ color: "rgba(242,240,232,0.4)" }}>{e.category}</td>
                  <td className="px-4 py-2.5 text-xs font-medium">{fmt(Number(e.amount))}</td>
                  <td className="px-4 py-2.5 text-xs" style={{ color: "rgba(242,240,232,0.4)" }}>{fmtDate(e.due_date)}</td>
                  <td className="px-4 py-2.5">{statusBadge(e.status)}</td>
                  <td className="px-4 py-2.5">
                    {hasPerm("fin") && actionBtns(
                      () => setEntryModal({ open: true, entry: e }),
                      () => handleDelete("vault_entries", e.id, "Lançamento", "vault_entries")
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 2: Contas Bancárias & Transações */}
      {tab === 2 && (
        <div className="space-y-5">
          {/* Bank Account Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
            <div className="rounded-xl p-3.5 border border-white/5" style={{ background: "#0e0e0a" }}>
              <div className="text-[10px] uppercase tracking-widest mb-1" style={{ color: "rgba(242,240,232,0.4)" }}>Saldo Total</div>
              <div className="font-heading text-lg font-semibold bg-gradient-to-r from-[#FFD600] to-[#E6C200] bg-clip-text text-transparent">{fmtK(totalBalance)}</div>
            </div>
            <div className="rounded-xl p-3.5 border border-white/5" style={{ background: "#0e0e0a" }}>
              <div className="text-[10px] uppercase tracking-widest mb-1" style={{ color: "rgba(242,240,232,0.4)" }}>Contas Ativas</div>
              <div className="font-heading text-lg font-semibold">{activeAccounts}</div>
            </div>
            <div className="rounded-xl p-3.5 border border-white/5" style={{ background: "#0e0e0a" }}>
              <div className="text-[10px] uppercase tracking-widest mb-1" style={{ color: "rgba(242,240,232,0.4)" }}>Transações</div>
              <div className="font-heading text-lg font-semibold">{bankTransactions?.length ?? 0}</div>
            </div>
            <div className="rounded-xl p-3.5 border border-white/5" style={{ background: "#0e0e0a" }}>
              <div className="text-[10px] uppercase tracking-widest mb-1" style={{ color: "rgba(242,240,232,0.4)" }}>A Conciliar</div>
              <div className={`font-heading text-lg font-semibold ${unconciledCount > 0 ? "text-amber-400" : "text-green-400"}`}>{unconciledCount}</div>
            </div>
          </div>

          {/* Bank Accounts Table */}
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
                    <td className="px-4 py-2.5 text-xs" style={{ color: "rgba(242,240,232,0.4)" }}>{a.agency || "—"}</td>
                    <td className="px-4 py-2.5 text-xs" style={{ color: "rgba(242,240,232,0.4)" }}>{a.account_number || "—"}</td>
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

          {/* Transactions Table */}
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
                      <td className="px-4 py-2.5 text-xs" style={{ color: "rgba(242,240,232,0.4)" }}>{acct?.bank_name || "—"}</td>
                      <td className="px-4 py-2.5 text-xs" style={{ color: "rgba(242,240,232,0.4)" }}>{t.category || "—"}</td>
                      <td className={`px-4 py-2.5 text-xs font-medium ${t.transaction_type === "receita" ? "text-green-400" : "text-red-400"}`}>{fmt(Number(t.amount))}</td>
                      <td className="px-4 py-2.5">
                        {hasPerm("fin") ? (
                          <button
                            onClick={() => handleReconcile(t.id, !t.reconciled)}
                            className={`p-1 rounded transition-colors ${t.reconciled ? "text-green-400 hover:text-green-300" : "text-white/20 hover:text-amber-400"}`}
                            title={t.reconciled ? "Desconciliar" : "Marcar como conciliado"}
                          >
                            {t.reconciled ? <CheckCircle size={14} /> : <XCircle size={14} />}
                          </button>
                        ) : (
                          t.reconciled ? <CheckCircle size={14} className="text-green-400" /> : <XCircle size={14} className="text-white/20" />
                        )}
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

      {/* Tab 3: Pessoas & RH */}
      {tab === 3 && (
        <div className="rounded-xl border border-white/5 overflow-hidden" style={{ background: "#0e0e0a" }}>
          <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
            <span className="text-xs font-medium">Equipe — {company.name}</span>
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
                  <td className="px-4 py-2.5 text-xs" style={{ color: "rgba(242,240,232,0.4)" }}>{e.position}</td>
                  <td className="px-4 py-2.5 text-xs" style={{ color: "rgba(242,240,232,0.4)" }}>{e.department}</td>
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

      {/* Tab 4: Relatórios */}
      {tab === 4 && (
        <div className="text-sm" style={{ color: "rgba(242,240,232,0.4)" }}>
          <h2 className="font-heading text-sm font-semibold mb-3 text-[#F2F0E8]">Relatórios — {company.name}</h2>
          <p>Módulo de relatórios será expandido em breve.</p>
        </div>
      )}

      {/* Tab 5: Configurações */}
      {tab === 5 && (
        <div>
          <h2 className="font-heading text-sm font-semibold mb-4">Configurações — {company.name}</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "CNPJ", value: company.cnpj },
              { label: "Regime", value: company.regime },
              { label: "Alíquota", value: `${company.aliquota}%` },
              { label: "Responsável", value: company.responsible },
              { label: "Email", value: company.email },
              { label: "Telefone", value: company.phone },
              { label: "Banco Principal", value: company.main_bank },
              { label: "Fundação", value: fmtDate(company.founded_at) },
            ].map((f, i) => (
              <div key={i} className="rounded-xl p-3 border border-white/5" style={{ background: "#0e0e0a" }}>
                <div className="text-[9px] uppercase tracking-widest mb-1" style={{ color: "rgba(242,240,232,0.3)" }}>{f.label}</div>
                <div className="text-sm">{f.value || "—"}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      {entryModal.open && (
        <VaultEntryForm open companyId={coId} entry={entryModal.entry} onClose={() => setEntryModal({ open: false })} />
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
    </div>
  );
};

export default VaultCompanyView;
