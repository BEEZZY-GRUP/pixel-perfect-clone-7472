import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMemo } from "react";
import { TrendingUp, TrendingDown, Building2, Users, DollarSign, Target, AlertTriangle, CalendarCheck, ArrowRight } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";

interface Props {
  companies: any[];
  onSelectCompany: (slug: string) => void;
}

const fmt = (v: number) => "R$ " + Math.round(v).toLocaleString("pt-BR");
const fmtK = (v: number) => v >= 1000 ? "R$ " + (v / 1000).toFixed(v % 1000 === 0 ? 0 : 1).replace(".", ",") + "k" : fmt(v);
const pct = (a: number, b: number) => b ? Math.min(Math.round((a / b) * 100), 999) : 0;
const COLORS = ["#FFD600", "#3B82F6", "#A855F7", "#22c55e", "#ef4444", "#f59e0b", "#06b6d4"];

const VaultDashboard = ({ companies, onSelectCompany }: Props) => {
  const { data: monthlyData } = useQuery({
    queryKey: ["vault_monthly_all"],
    queryFn: async () => {
      const { data } = await supabase.from("vault_monthly_data").select("*").order("month_date");
      return data ?? [];
    },
  });

  const { data: employees } = useQuery({
    queryKey: ["vault_employees_count"],
    queryFn: async () => {
      const { data } = await supabase.from("vault_employees").select("id, company_id, salary, status, department");
      return data ?? [];
    },
  });

  const { data: goals } = useQuery({
    queryKey: ["vault_goals_all"],
    queryFn: async () => {
      const { data } = await supabase.from("vault_goals").select("*");
      return data ?? [];
    },
  });

  const { data: entries } = useQuery({
    queryKey: ["vault_entries_dash"],
    queryFn: async () => {
      const { data } = await supabase.from("vault_entries").select("*").order("due_date", { ascending: true });
      return data ?? [];
    },
  });

  const { data: bankAccounts } = useQuery({
    queryKey: ["vault_bank_accounts_dash"],
    queryFn: async () => {
      const { data } = await supabase.from("vault_bank_accounts").select("*").eq("active", true);
      return data ?? [];
    },
  });

  // Current month
  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const currentMonth = monthlyData?.filter((m: any) => m.month_date === currentMonthStr) ?? [];
  const totalRevenue = currentMonth.reduce((a: number, m: any) => a + Number(m.revenue), 0);
  const totalExpenses = currentMonth.reduce((a: number, m: any) => a + Number(m.expenses), 0);
  const totalResult = totalRevenue - totalExpenses;
  const activeEmployees = employees?.filter((e: any) => e.status === "ativo") ?? [];
  const totalEmployees = activeEmployees.length;
  const totalPayroll = activeEmployees.reduce((a: number, e: any) => a + Number(e.salary), 0);
  const pendingEntries = entries?.filter((e: any) => e.status === "pendente") ?? [];
  const overdueEntries = entries?.filter((e: any) => e.status === "vencido") ?? [];
  const totalBankBalance = bankAccounts?.reduce((a: number, b: any) => a + Number(b.balance), 0) ?? 0;

  // Previous month comparison
  const prevMonthStr = useMemo(() => {
    const d = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
  }, []);
  const prevMonth = monthlyData?.filter((m: any) => m.month_date === prevMonthStr) ?? [];
  const prevRevenue = prevMonth.reduce((a: number, m: any) => a + Number(m.revenue), 0);
  const revGrowth = prevRevenue > 0 ? Math.round(((totalRevenue - prevRevenue) / prevRevenue) * 100) : 0;

  // Revenue trend (last 6 months)
  const trendData = useMemo(() => {
    const months: string[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`);
    }
    return months.map(m => {
      const rows = monthlyData?.filter((d: any) => d.month_date === m) ?? [];
      const rev = rows.reduce((a: number, r: any) => a + Number(r.revenue), 0);
      const exp = rows.reduce((a: number, r: any) => a + Number(r.expenses), 0);
      const [y, mo] = m.split("-");
      return { name: `${mo}/${y.slice(2)}`, Faturamento: rev, Despesas: exp, Resultado: rev - exp };
    });
  }, [monthlyData]);

  // Revenue breakdown by company (pie)
  const revByCompany = useMemo(() => {
    return companies.map((c: any) => {
      const md = currentMonth.find((m: any) => m.company_id === c.id);
      return { name: c.name, value: Number(md?.revenue ?? 0), color: c.color };
    }).filter(d => d.value > 0);
  }, [companies, currentMonth]);

  // Upcoming payments (next 7 days)
  const upcomingPayments = useMemo(() => {
    const today = new Date();
    const week = new Date(today.getTime() + 7 * 86400000);
    return pendingEntries
      .filter((e: any) => e.due_date && new Date(e.due_date) <= week)
      .slice(0, 5);
  }, [pendingEntries]);

  // Expense by category (top 5)
  const expByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    (entries ?? []).filter((e: any) => e.entry_type === "despesa" && (e.created_at as string).startsWith(String(now.getFullYear())))
      .forEach((e: any) => { const c = e.category || "Outros"; map[c] = (map[c] || 0) + Number(e.amount); });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([cat, val], i) => ({ name: cat, value: val, color: COLORS[i % COLORS.length] }));
  }, [entries]);

  const getCoName = (id: string) => companies.find((c: any) => c.id === id)?.name ?? "-";
  const getCoColor = (id: string) => companies.find((c: any) => c.id === id)?.color ?? "#888";
  const fmtDate = (s: string | null) => { if (!s) return "-"; const [y, m, d] = s.split("-"); return `${d}/${m}`; };

  return (
    <div>
      <div className="mb-5">
        <h1 className="font-heading text-xl font-semibold tracking-tight mb-1">Dashboard do Grupo</h1>
        <p className="text-[11px]" style={{ color: "rgba(242,240,232,0.4)" }}>
          Visão consolidada de todas as empresas • {String(now.getMonth() + 1).padStart(2, "0")}/{now.getFullYear()}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2.5 mb-5">
        {[
          { label: "Fat. Consolidado", value: fmtK(totalRevenue), icon: DollarSign, accent: true, sub: revGrowth !== 0 ? `${revGrowth > 0 ? "+" : ""}${revGrowth}% vs mês ant.` : undefined, subPositive: revGrowth > 0 },
          { label: "Despesas Totais", value: fmtK(totalExpenses), icon: TrendingDown },
          { label: "Resultado Líquido", value: fmtK(totalResult), icon: TrendingUp, positive: totalResult > 0 },
          { label: "Saldo Bancário", value: fmtK(totalBankBalance), icon: DollarSign, accent2: true },
          { label: "Colaboradores", value: String(totalEmployees), icon: Users, sub: `Folha: ${fmtK(totalPayroll)}` },
          { label: "Contas Pendentes", value: `${pendingEntries.length}`, icon: Target, badge: overdueEntries.length > 0 ? `${overdueEntries.length} vencidas` : undefined },
        ].map((kpi, i) => (
          <div key={i} className="rounded-xl p-3.5 border border-white/5 hover:border-white/10 transition-colors" style={{ background: "#0e0e0a" }}>
            <div className="flex items-center justify-between mb-2">
              <div className="text-[10px] uppercase tracking-widest" style={{ color: "rgba(242,240,232,0.4)" }}>{kpi.label}</div>
              <kpi.icon size={12} style={{ color: "rgba(242,240,232,0.2)" }} />
            </div>
            <div className={`font-heading text-lg font-semibold tracking-tight ${
              kpi.accent ? "bg-gradient-to-r from-[#FFD600] to-[#E6C200] bg-clip-text text-transparent" :
              kpi.accent2 ? "text-blue-400" :
              kpi.positive === true ? "text-green-400" :
              kpi.positive === false ? "text-red-400" : ""
            }`}>
              {kpi.value}
            </div>
            {kpi.sub && <div className={`text-[10px] mt-1 ${kpi.subPositive ? "text-green-400" : ""}`} style={!kpi.subPositive ? { color: "rgba(242,240,232,0.35)" } : undefined}>{kpi.sub}</div>}
            {kpi.badge && <div className="text-[10px] text-red-400 mt-1 flex items-center gap-1"><AlertTriangle size={9} />{kpi.badge}</div>}
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-5">
        {/* Revenue Trend */}
        <div className="lg:col-span-2 rounded-xl border border-white/5 p-4" style={{ background: "#0e0e0a" }}>
          <h3 className="text-xs font-medium mb-3">Evolução Mensal (6 meses)</h3>
          {trendData.some(d => d.Faturamento > 0 || d.Despesas > 0) ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={trendData} barGap={2}>
                <XAxis dataKey="name" tick={{ fill: "rgba(242,240,232,0.4)", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "rgba(242,240,232,0.4)", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, color: "#F2F0E8", fontSize: 12, padding: "8px 12px" }} itemStyle={{ color: "#F2F0E8" }} labelStyle={{ color: "#F2F0E8" }} formatter={(v: number) => fmt(v)} />
                <Bar dataKey="Faturamento" fill="#FFD600" radius={[4,4,0,0]} />
                <Bar dataKey="Despesas" fill="#ef4444" radius={[4,4,0,0]} opacity={0.7} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[200px] text-xs" style={{ color: "rgba(242,240,232,0.3)" }}>Sem dados mensais cadastrados</div>
          )}
        </div>

        {/* Revenue Pie */}
        <div className="rounded-xl border border-white/5 p-4" style={{ background: "#0e0e0a" }}>
          <h3 className="text-xs font-medium mb-3">Faturamento por Empresa</h3>
          {revByCompany.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={revByCompany} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={40}
                  label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}>
                  {revByCompany.map((entry, idx) => <Cell key={idx} fill={entry.color || COLORS[idx % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, color: "#F2F0E8", fontSize: 12, padding: "8px 12px" }} itemStyle={{ color: "#F2F0E8" }} formatter={(v: number) => fmt(v)} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[200px] text-xs" style={{ color: "rgba(242,240,232,0.3)" }}>Sem faturamento no mês</div>
          )}
        </div>
      </div>

      {/* Middle Row: Upcoming Payments + Expense Categories + Goals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-5">
        {/* Upcoming Payments */}
        <div className="rounded-xl border border-white/5 overflow-hidden" style={{ background: "#0e0e0a" }}>
          <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
            <span className="text-xs font-medium">Próximos Vencimentos</span>
            <CalendarCheck size={12} style={{ color: "rgba(242,240,232,0.3)" }} />
          </div>
          {upcomingPayments.length === 0 ? (
            <div className="text-center py-6 text-[11px]" style={{ color: "rgba(242,240,232,0.3)" }}>Nenhum vencimento próximo</div>
          ) : (
            <div className="divide-y divide-white/5">
              {upcomingPayments.map((e: any) => (
                <div key={e.id} className="px-4 py-2.5 flex items-center justify-between">
                  <div>
                    <div className="text-xs truncate max-w-[140px]">{e.description}</div>
                    <div className="text-[10px] flex items-center gap-1.5 mt-0.5">
                      <span className="inline-flex text-[9px] font-medium px-1.5 py-0.5 rounded" style={{ background: `${getCoColor(e.company_id)}15`, color: getCoColor(e.company_id) }}>{getCoName(e.company_id)}</span>
                      <span style={{ color: "rgba(242,240,232,0.35)" }}>{fmtDate(e.due_date)}</span>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-amber-400">{fmtK(Number(e.amount))}</span>
                </div>
              ))}
            </div>
          )}
          {overdueEntries.length > 0 && (
            <div className="px-4 py-2.5 border-t border-red-500/10 flex items-center gap-2 text-[10px] text-red-400">
              <AlertTriangle size={10} />
              {overdueEntries.length} conta{overdueEntries.length > 1 ? "s" : ""} vencida{overdueEntries.length > 1 ? "s" : ""} — {fmtK(overdueEntries.reduce((a: number, e: any) => a + Number(e.amount), 0))}
            </div>
          )}
        </div>

        {/* Expense by Category */}
        <div className="rounded-xl border border-white/5 overflow-hidden" style={{ background: "#0e0e0a" }}>
          <div className="px-4 py-3 border-b border-white/5">
            <span className="text-xs font-medium">Despesas por Categoria ({now.getFullYear()})</span>
          </div>
          {expByCategory.length === 0 ? (
            <div className="text-center py-6 text-[11px]" style={{ color: "rgba(242,240,232,0.3)" }}>Sem lançamentos</div>
          ) : (
            <div className="p-4 space-y-2.5">
              {expByCategory.map((cat, i) => {
                const maxVal = expByCategory[0]?.value ?? 1;
                return (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px]">{cat.name}</span>
                      <span className="text-[11px] font-medium">{fmtK(cat.value)}</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                      <div className="h-full rounded-full transition-all" style={{ width: `${(cat.value / maxVal) * 100}%`, background: cat.color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Goals Progress */}
        <div className="rounded-xl border border-white/5 overflow-hidden" style={{ background: "#0e0e0a" }}>
          <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
            <span className="text-xs font-medium">Metas Ativas</span>
            <Target size={12} style={{ color: "rgba(242,240,232,0.3)" }} />
          </div>
          {!goals || goals.length === 0 ? (
            <div className="text-center py-6 text-[11px]" style={{ color: "rgba(242,240,232,0.3)" }}>Nenhuma meta cadastrada</div>
          ) : (
            <div className="p-4 space-y-3">
              {goals.slice(0, 5).map((g: any) => {
                const p = pct(Number(g.current_value), Number(g.target_value));
                const co = companies.find((c: any) => c.id === g.company_id);
                return (
                  <div key={g.id}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        {co && <span className="w-1.5 h-1.5 rounded-full" style={{ background: co.color }} />}
                        <span className="text-[11px] truncate max-w-[130px]">{g.description || g.goal_type}</span>
                      </div>
                      <span className={`text-[10px] font-semibold ${p >= 100 ? "text-green-400" : p >= 70 ? "text-amber-400" : ""}`}>{p}%</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                      <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(p, 100)}%`, background: co?.color ?? "#FFD600" }} />
                    </div>
                    <div className="text-[9px] mt-0.5 flex justify-between" style={{ color: "rgba(242,240,232,0.3)" }}>
                      <span>{fmtK(Number(g.current_value))}</span>
                      <span>{fmtK(Number(g.target_value))}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Company Cards */}
      <h2 className="font-heading text-sm font-semibold mb-3">Empresas</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {companies.map((co: any) => {
          const coMonth = currentMonth.find((m: any) => m.company_id === co.id);
          const coRevenue = Number(coMonth?.revenue ?? 0);
          const coExpenses = Number(coMonth?.expenses ?? 0);
          const coResult = coRevenue - coExpenses;
          const coEmployees = employees?.filter((e: any) => e.company_id === co.id && e.status === "ativo").length ?? 0;
          const coGoal = goals?.find((g: any) => g.company_id === co.id);
          const goalPct = coGoal ? pct(Number(coGoal.current_value), Number(coGoal.target_value)) : 0;
          const coBankBal = bankAccounts?.filter((b: any) => b.company_id === co.id).reduce((a: number, b: any) => a + Number(b.balance), 0) ?? 0;
          const coPending = pendingEntries.filter((e: any) => e.company_id === co.id).length;

          return (
            <button
              key={co.slug}
              onClick={() => onSelectCompany(co.slug)}
              className="text-left rounded-xl p-4 border border-white/5 hover:border-white/15 transition-all group"
              style={{ background: "#0e0e0a" }}
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: co.color }} />
                <span className="font-heading font-semibold text-sm">{co.name}</span>
                {co.is_holding && (
                  <span className="text-[8px] font-bold px-1.5 rounded ml-auto" style={{ background: "rgba(255,214,0,0.15)", color: "#FFD600" }}>
                    HOLDING
                  </span>
                )}
                <ArrowRight size={12} className="ml-auto opacity-0 group-hover:opacity-40 transition-opacity" />
              </div>

              <div className="grid grid-cols-3 gap-2 mb-3">
                <div>
                  <div className="text-[9px] uppercase tracking-widest" style={{ color: "rgba(242,240,232,0.3)" }}>Faturamento</div>
                  <div className="text-sm font-semibold font-heading" style={{ color: co.color }}>{fmtK(coRevenue)}</div>
                </div>
                <div>
                  <div className="text-[9px] uppercase tracking-widest" style={{ color: "rgba(242,240,232,0.3)" }}>Resultado</div>
                  <div className={`text-sm font-semibold font-heading ${coResult >= 0 ? "text-green-400" : "text-red-400"}`}>{fmtK(coResult)}</div>
                </div>
                <div>
                  <div className="text-[9px] uppercase tracking-widest" style={{ color: "rgba(242,240,232,0.3)" }}>Saldo</div>
                  <div className="text-sm font-semibold font-heading text-blue-400">{fmtK(coBankBal)}</div>
                </div>
              </div>

              <div className="flex items-center justify-between text-[10px]" style={{ color: "rgba(242,240,232,0.35)" }}>
                <span>{coEmployees} colaboradores</span>
                {coPending > 0 && <span className="text-amber-400">{coPending} pendente{coPending > 1 ? "s" : ""}</span>}
                {coGoal && !coPending && <span>Meta: {goalPct}%</span>}
              </div>

              {coGoal && (
                <div className="mt-2 h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                  <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(goalPct, 100)}%`, background: co.color }} />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default VaultDashboard;
