import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const fmt = (v: number) => "R$ " + Math.round(v).toLocaleString("pt-BR");
const fmtK = (v: number) => v >= 1000 ? "R$ " + (v / 1000).toFixed(v % 1000 === 0 ? 0 : 1).replace(".", ",") + "k" : fmt(v);

const VaultGlobalReports = () => {
  const { data: companies } = useQuery({
    queryKey: ["vault_companies"],
    queryFn: async () => { const { data } = await supabase.from("vault_companies").select("*").eq("active", true).order("name"); return data ?? []; },
  });

  const { data: monthlyData } = useQuery({
    queryKey: ["vault_monthly_all"],
    queryFn: async () => { const { data } = await supabase.from("vault_monthly_data").select("*").order("month_date"); return data ?? []; },
  });

  const { data: entries } = useQuery({
    queryKey: ["vault_entries_global"],
    queryFn: async () => { const { data } = await supabase.from("vault_entries").select("*"); return data ?? []; },
  });

  const { data: budgets } = useQuery({
    queryKey: ["vault_budgets_all"],
    queryFn: async () => { const { data } = await supabase.from("vault_budgets").select("*"); return data ?? []; },
  });

  // Group monthly data by month
  const months = [...new Set(monthlyData?.map((m: any) => m.month_date) ?? [])].sort();

  return (
    <div>
      <div className="mb-5">
        <h1 className="font-heading text-xl font-semibold tracking-tight">Relatórios</h1>
        <p className="text-[11px]" style={{ color: "rgba(242,240,232,0.4)" }}>DRE, fluxo de caixa, impostos e budget</p>
      </div>

      {/* DRE Table */}
      <div className="rounded-xl border border-white/5 overflow-hidden mb-5" style={{ background: "#0e0e0a" }}>
        <div className="px-4 py-3 border-b border-white/5">
          <span className="text-xs font-medium">DRE — Demonstrativo do Resultado</span>
        </div>
        {months.length === 0 ? (
          <div className="text-center py-8 text-xs" style={{ color: "rgba(242,240,232,0.3)" }}>Nenhum dado mensal cadastrado</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                {["Período", "Fat. Bruto", "Despesas", "Resultado"].map(h => (
                  <th key={h} className="text-left px-4 py-2 text-[9px] uppercase tracking-widest font-medium" style={{ color: "rgba(242,240,232,0.25)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {months.map(m => {
                const rows = monthlyData?.filter((d: any) => d.month_date === m) ?? [];
                const rev = rows.reduce((a: number, r: any) => a + Number(r.revenue), 0);
                const exp = rows.reduce((a: number, r: any) => a + Number(r.expenses), 0);
                const res = rev - exp;
                const [y, mo] = (m as string).split("-");
                return (
                  <tr key={m as string} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                    <td className="px-4 py-2.5 text-xs">{`${mo}/${y}`}</td>
                    <td className="px-4 py-2.5 text-xs font-medium">{fmtK(rev)}</td>
                    <td className="px-4 py-2.5 text-xs text-red-400">{fmtK(exp)}</td>
                    <td className={`px-4 py-2.5 text-xs font-semibold ${res >= 0 ? "text-green-400" : "text-red-400"}`}>{fmtK(res)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* By Company */}
      <div className="rounded-xl border border-white/5 overflow-hidden mb-5" style={{ background: "#0e0e0a" }}>
        <div className="px-4 py-3 border-b border-white/5">
          <span className="text-xs font-medium">Resumo por Empresa (Último Mês)</span>
        </div>
        {(companies?.length ?? 0) === 0 ? (
          <div className="text-center py-8 text-xs" style={{ color: "rgba(242,240,232,0.3)" }}>Nenhuma empresa cadastrada</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                {["Empresa", "Faturamento", "Alíquota", "Imposto", "Despesas", "Resultado"].map(h => (
                  <th key={h} className="text-left px-4 py-2 text-[9px] uppercase tracking-widest font-medium" style={{ color: "rgba(242,240,232,0.25)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {companies?.map((c: any) => {
                const lastMonth = months[months.length - 1] as string | undefined;
                const md = lastMonth ? monthlyData?.find((d: any) => d.company_id === c.id && d.month_date === lastMonth) : null;
                const rev = Number(md?.revenue ?? 0);
                const exp = Number(md?.expenses ?? 0);
                const tax = Math.round(rev * (Number(c.aliquota) / 100));
                const res = rev - exp - tax;
                return (
                  <tr key={c.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                    <td className="px-4 py-2.5">
                      <span className="inline-flex text-[10px] font-medium px-2 py-0.5 rounded" style={{ background: `${c.color}15`, color: c.color }}>{c.name}</span>
                    </td>
                    <td className="px-4 py-2.5 text-xs font-medium">{fmtK(rev)}</td>
                    <td className="px-4 py-2.5 text-xs" style={{ color: "rgba(242,240,232,0.4)" }}>{c.aliquota}%</td>
                    <td className="px-4 py-2.5 text-xs text-red-400">{fmtK(tax)}</td>
                    <td className="px-4 py-2.5 text-xs text-red-400">{fmtK(exp)}</td>
                    <td className={`px-4 py-2.5 text-xs font-semibold ${res >= 0 ? "text-green-400" : "text-red-400"}`}>{fmtK(res)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Budget vs Realizado */}
      <div className="rounded-xl border border-white/5 overflow-hidden" style={{ background: "#0e0e0a" }}>
        <div className="px-4 py-3 border-b border-white/5">
          <span className="text-xs font-medium">Budget vs Realizado — 2026</span>
        </div>
        {(budgets?.length ?? 0) === 0 ? (
          <div className="text-center py-8 text-xs" style={{ color: "rgba(242,240,232,0.3)" }}>Nenhum budget cadastrado</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                {["Categoria", "Orçado", "Realizado", "Saldo", "Utilização"].map(h => (
                  <th key={h} className="text-left px-4 py-2 text-[9px] uppercase tracking-widest font-medium" style={{ color: "rgba(242,240,232,0.25)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {budgets?.map((b: any) => {
                const realized = entries?.filter((e: any) => e.category === b.category && e.entry_type === "despesa").reduce((a: number, e: any) => a + Number(e.amount), 0) ?? 0;
                const pct = Number(b.amount) > 0 ? Math.round((realized / Number(b.amount)) * 100) : 0;
                return (
                  <tr key={b.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                    <td className="px-4 py-2.5 text-xs">{b.category}</td>
                    <td className="px-4 py-2.5 text-xs font-medium">{fmt(Number(b.amount))}</td>
                    <td className="px-4 py-2.5 text-xs">{fmt(realized)}</td>
                    <td className={`px-4 py-2.5 text-xs ${Number(b.amount) - realized >= 0 ? "text-green-400" : "text-red-400"}`}>{fmt(Number(b.amount) - realized)}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                          <div className="h-full rounded-full" style={{ width: `${Math.min(pct, 100)}%`, background: pct > 100 ? "#ef4444" : pct > 85 ? "#f59e0b" : "#FFD600" }} />
                        </div>
                        <span className="text-[10px]" style={{ color: "rgba(242,240,232,0.4)" }}>{pct}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default VaultGlobalReports;
