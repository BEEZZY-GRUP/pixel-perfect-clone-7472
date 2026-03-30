import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, TrendingDown, Building2, Users, DollarSign, Target } from "lucide-react";

interface Props {
  companies: any[];
  onSelectCompany: (slug: string) => void;
}

const fmt = (v: number) => "R$ " + Math.round(v).toLocaleString("pt-BR");
const fmtK = (v: number) => v >= 1000 ? "R$ " + (v / 1000).toFixed(v % 1000 === 0 ? 0 : 1).replace(".", ",") + "k" : fmt(v);
const pct = (a: number, b: number) => b ? Math.min(Math.round((a / b) * 100), 999) : 0;

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
      const { data } = await supabase.from("vault_employees").select("id, company_id, salary, status");
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
    queryKey: ["vault_entries_pending"],
    queryFn: async () => {
      const { data } = await supabase.from("vault_entries").select("*").in("status", ["pendente", "vencido"]);
      return data ?? [];
    },
  });

  // Aggregate current month data (March 2026)
  const currentMonth = monthlyData?.filter((m: any) => m.month_date === "2026-03-01") ?? [];
  const totalRevenue = currentMonth.reduce((a: number, m: any) => a + Number(m.revenue), 0);
  const totalExpenses = currentMonth.reduce((a: number, m: any) => a + Number(m.expenses), 0);
  const totalResult = totalRevenue - totalExpenses;
  const totalEmployees = employees?.filter((e: any) => e.status === "ativo").length ?? 0;
  const totalPayroll = employees?.reduce((a: number, e: any) => a + Number(e.salary), 0) ?? 0;
  const pendingEntries = entries?.filter((e: any) => e.status === "pendente").length ?? 0;
  const overdueEntries = entries?.filter((e: any) => e.status === "vencido").length ?? 0;

  return (
    <div>
      <div className="mb-5">
        <h1 className="font-heading text-xl font-semibold tracking-tight mb-1">Dashboard do Grupo</h1>
        <p className="text-[11px]" style={{ color: "rgba(242,240,232,0.4)" }}>
          Visão consolidada de todas as empresas • Março 2026
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2.5 mb-5">
        {[
          { label: "Fat. Consolidado", value: fmtK(totalRevenue), icon: DollarSign, accent: true },
          { label: "Despesas Totais", value: fmtK(totalExpenses), icon: TrendingDown },
          { label: "Resultado", value: fmtK(totalResult), icon: TrendingUp, positive: totalResult > 0 },
          { label: "Colaboradores", value: String(totalEmployees), icon: Users },
          { label: "Folha Total", value: fmtK(totalPayroll), icon: DollarSign },
          { label: "Contas Pendentes", value: `${pendingEntries}`, icon: Target, badge: overdueEntries > 0 ? `${overdueEntries} vencidas` : undefined },
        ].map((kpi, i) => (
          <div key={i} className="rounded-xl p-3.5 border border-white/5 hover:border-white/10 transition-colors" style={{ background: "#0e0e0a" }}>
            <div className="text-[10px] uppercase tracking-widest mb-2" style={{ color: "rgba(242,240,232,0.4)" }}>
              {kpi.label}
            </div>
            <div className={`font-heading text-lg font-semibold tracking-tight ${
              kpi.accent ? "bg-gradient-to-r from-[#FFD600] to-[#E6C200] bg-clip-text text-transparent" :
              kpi.positive === true ? "text-green-400" :
              kpi.positive === false ? "text-red-400" : ""
            }`}>
              {kpi.value}
            </div>
            {kpi.badge && <div className="text-[10px] text-red-400 mt-1">{kpi.badge}</div>}
          </div>
        ))}
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
          const coGoal = goals?.find((g: any) => g.company_id === co.id && g.goal_type === "MRR");
          const goalPct = coGoal ? pct(Number(coGoal.current_value), Number(coGoal.target_value)) : 0;

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
              </div>

              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <div className="text-[9px] uppercase tracking-widest" style={{ color: "rgba(242,240,232,0.3)" }}>Faturamento</div>
                  <div className="text-sm font-semibold font-heading" style={{ color: co.color }}>{fmtK(coRevenue)}</div>
                </div>
                <div>
                  <div className="text-[9px] uppercase tracking-widest" style={{ color: "rgba(242,240,232,0.3)" }}>Resultado</div>
                  <div className={`text-sm font-semibold font-heading ${coResult >= 0 ? "text-green-400" : "text-red-400"}`}>{fmtK(coResult)}</div>
                </div>
              </div>

              <div className="flex items-center justify-between text-[10px]" style={{ color: "rgba(242,240,232,0.35)" }}>
                <span>{coEmployees} colaboradores</span>
                {coGoal && <span>Meta MRR: {goalPct}%</span>}
              </div>

              {coGoal && (
                <div className="mt-2 h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${Math.min(goalPct, 100)}%`, background: co.color }}
                  />
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
