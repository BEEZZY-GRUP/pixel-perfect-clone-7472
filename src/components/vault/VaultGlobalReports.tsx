import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from "recharts";

const fmt = (v: number) => "R$ " + Math.round(v).toLocaleString("pt-BR");
const fmtK = (v: number) => v >= 1000 ? "R$ " + (v / 1000).toFixed(v % 1000 === 0 ? 0 : 1).replace(".", ",") + "k" : fmt(v);

const CHART_COLORS = ["#FFD600", "#3B82F6", "#A855F7", "#22c55e", "#ef4444", "#f59e0b"];

const VaultGlobalReports = () => {
  const [activeTab, setActiveTab] = useState(0);

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

  const months = [...new Set(monthlyData?.map((m: any) => m.month_date) ?? [])].sort();

  // Chart data
  const chartData = months.map(m => {
    const rows = monthlyData?.filter((d: any) => d.month_date === m) ?? [];
    const rev = rows.reduce((a: number, r: any) => a + Number(r.revenue), 0);
    const exp = rows.reduce((a: number, r: any) => a + Number(r.expenses), 0);
    const [y, mo] = (m as string).split("-");
    return { name: `${mo}/${y}`, Faturamento: rev, Despesas: exp, Resultado: rev - exp };
  });

  // Pie data for company share
  const lastMonth = months[months.length - 1] as string | undefined;
  const pieData = companies?.map((c: any) => {
    const md = lastMonth ? monthlyData?.find((d: any) => d.company_id === c.id && d.month_date === lastMonth) : null;
    return { name: c.name, value: Number(md?.revenue ?? 0), color: c.color };
  }).filter((d: any) => d.value > 0) ?? [];

  // Cashflow data
  const cashflowData = months.map(m => {
    const rows = monthlyData?.filter((d: any) => d.month_date === m) ?? [];
    const rev = rows.reduce((a: number, r: any) => a + Number(r.revenue), 0);
    const exp = rows.reduce((a: number, r: any) => a + Number(r.expenses), 0);
    const [y, mo] = (m as string).split("-");
    return { name: `${mo}/${y}`, Entradas: rev, Saídas: exp, Saldo: rev - exp };
  });

  // Accumulate cashflow
  let accumulated = 0;
  const cashflowAccumulated = cashflowData.map(d => {
    accumulated += d.Saldo;
    return { ...d, Acumulado: accumulated };
  });

  const tabs = ["DRE", "Fluxo de Caixa", "Por Empresa", "Impostos", "Budget vs Realizado"];

  return (
    <div>
      <div className="mb-5">
        <h1 className="font-heading text-xl font-semibold tracking-tight">Relatórios</h1>
        <p className="text-[11px]" style={{ color: "rgba(242,240,232,0.4)" }}>DRE, fluxo de caixa, impostos e budget</p>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1 mb-5 border-b border-white/5 pb-2">
        {tabs.map((t, i) => (
          <button key={t} onClick={() => setActiveTab(i)}
            className={`px-3 py-1.5 rounded-md text-[11px] transition-colors ${activeTab === i ? "bg-[rgba(255,214,0,0.1)] text-[#FFD600]" : "text-white/40 hover:text-white/60"}`}
          >{t}</button>
        ))}
      </div>

      {/* DRE */}
      {activeTab === 0 && (
        <div className="space-y-5">
          {chartData.length > 0 && (
            <div className="rounded-xl border border-white/5 p-4" style={{ background: "#0e0e0a" }}>
              <h3 className="text-xs font-medium mb-3">Faturamento vs Despesas</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={chartData}>
                  <XAxis dataKey="name" tick={{ fill: "rgba(242,240,232,0.4)", fontSize: 10 }} />
                  <YAxis tick={{ fill: "rgba(242,240,232,0.4)", fontSize: 10 }} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={{ background: "#111", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#F2F0E8", fontSize: 11 }} formatter={(v: number) => fmt(v)} />
                  <Bar dataKey="Faturamento" fill="#FFD600" radius={[4,4,0,0]} />
                  <Bar dataKey="Despesas" fill="#ef4444" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="rounded-xl border border-white/5 overflow-hidden" style={{ background: "#0e0e0a" }}>
            <div className="px-4 py-3 border-b border-white/5">
              <span className="text-xs font-medium">DRE — Demonstrativo do Resultado</span>
            </div>
            {months.length === 0 ? (
              <div className="text-center py-8 text-xs" style={{ color: "rgba(242,240,232,0.3)" }}>Nenhum dado mensal cadastrado</div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5">
                    {["Período", "Fat. Bruto", "Despesas", "Resultado", "Margem"].map(h => (
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
                    const margin = rev > 0 ? Math.round((res / rev) * 100) : 0;
                    const [y, mo] = (m as string).split("-");
                    return (
                      <tr key={m as string} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                        <td className="px-4 py-2.5 text-xs">{`${mo}/${y}`}</td>
                        <td className="px-4 py-2.5 text-xs font-medium">{fmtK(rev)}</td>
                        <td className="px-4 py-2.5 text-xs text-red-400">{fmtK(exp)}</td>
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

      {/* Fluxo de Caixa */}
      {activeTab === 1 && (
        <div className="space-y-5">
          {cashflowAccumulated.length > 0 && (
            <div className="rounded-xl border border-white/5 p-4" style={{ background: "#0e0e0a" }}>
              <h3 className="text-xs font-medium mb-3">Fluxo de Caixa Acumulado</h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={cashflowAccumulated}>
                  <XAxis dataKey="name" tick={{ fill: "rgba(242,240,232,0.4)", fontSize: 10 }} />
                  <YAxis tick={{ fill: "rgba(242,240,232,0.4)", fontSize: 10 }} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={{ background: "#111", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#F2F0E8", fontSize: 11 }} formatter={(v: number) => fmt(v)} />
                  <Line type="monotone" dataKey="Entradas" stroke="#22c55e" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="Saídas" stroke="#ef4444" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="Acumulado" stroke="#FFD600" strokeWidth={2} dot={{ fill: "#FFD600", r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="rounded-xl border border-white/5 overflow-hidden" style={{ background: "#0e0e0a" }}>
            <div className="px-4 py-3 border-b border-white/5">
              <span className="text-xs font-medium">Detalhamento Mensal</span>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  {["Período", "Entradas", "Saídas", "Saldo Mês", "Acumulado"].map(h => (
                    <th key={h} className="text-left px-4 py-2 text-[9px] uppercase tracking-widest font-medium" style={{ color: "rgba(242,240,232,0.25)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cashflowAccumulated.map((d, i) => (
                  <tr key={i} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                    <td className="px-4 py-2.5 text-xs">{d.name}</td>
                    <td className="px-4 py-2.5 text-xs text-green-400">{fmtK(d.Entradas)}</td>
                    <td className="px-4 py-2.5 text-xs text-red-400">{fmtK(d.Saídas)}</td>
                    <td className={`px-4 py-2.5 text-xs font-semibold ${d.Saldo >= 0 ? "text-green-400" : "text-red-400"}`}>{fmtK(d.Saldo)}</td>
                    <td className={`px-4 py-2.5 text-xs font-semibold ${d.Acumulado >= 0 ? "text-[#FFD600]" : "text-red-400"}`}>{fmtK(d.Acumulado)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Por Empresa */}
      {activeTab === 2 && (
        <div className="space-y-5">
          {pieData.length > 0 && (
            <div className="rounded-xl border border-white/5 p-4" style={{ background: "#0e0e0a" }}>
              <h3 className="text-xs font-medium mb-3">Participação no Faturamento (Último Mês)</h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                    {pieData.map((entry: any, idx: number) => <Cell key={idx} fill={entry.color || CHART_COLORS[idx % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "#111", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#F2F0E8", fontSize: 11 }} formatter={(v: number) => fmt(v)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="rounded-xl border border-white/5 overflow-hidden" style={{ background: "#0e0e0a" }}>
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
        </div>
      )}

      {/* Impostos */}
      {activeTab === 3 && (
        <div className="space-y-5">
          <div className="rounded-xl border border-white/5 overflow-hidden" style={{ background: "#0e0e0a" }}>
            <div className="px-4 py-3 border-b border-white/5">
              <span className="text-xs font-medium">Impostos por Empresa (Último Mês)</span>
            </div>
            {(companies?.length ?? 0) === 0 ? (
              <div className="text-center py-8 text-xs" style={{ color: "rgba(242,240,232,0.3)" }}>Nenhuma empresa cadastrada</div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5">
                    {["Empresa", "Regime", "Faturamento", "Alíquota", "Imposto Estimado", "% do Fat."].map(h => (
                      <th key={h} className="text-left px-4 py-2 text-[9px] uppercase tracking-widest font-medium" style={{ color: "rgba(242,240,232,0.25)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    let totalTax = 0;
                    let totalRev = 0;
                    const rows = companies?.map((c: any) => {
                      const md = lastMonth ? monthlyData?.find((d: any) => d.company_id === c.id && d.month_date === lastMonth) : null;
                      const rev = Number(md?.revenue ?? 0);
                      const tax = Math.round(rev * (Number(c.aliquota) / 100));
                      totalTax += tax;
                      totalRev += rev;
                      return (
                        <tr key={c.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                          <td className="px-4 py-2.5">
                            <span className="inline-flex text-[10px] font-medium px-2 py-0.5 rounded" style={{ background: `${c.color}15`, color: c.color }}>{c.name}</span>
                          </td>
                          <td className="px-4 py-2.5 text-xs" style={{ color: "rgba(242,240,232,0.4)" }}>{c.regime}</td>
                          <td className="px-4 py-2.5 text-xs font-medium">{fmtK(rev)}</td>
                          <td className="px-4 py-2.5 text-xs" style={{ color: "rgba(242,240,232,0.4)" }}>{c.aliquota}%</td>
                          <td className="px-4 py-2.5 text-xs text-red-400 font-medium">{fmtK(tax)}</td>
                          <td className="px-4 py-2.5 text-xs" style={{ color: "rgba(242,240,232,0.4)" }}>{rev > 0 ? Math.round((tax / rev) * 100) : 0}%</td>
                        </tr>
                      );
                    });
                    return (
                      <>
                        {rows}
                        <tr className="border-t-2 border-white/10 font-semibold">
                          <td className="px-4 py-2.5 text-xs" colSpan={2}>TOTAL</td>
                          <td className="px-4 py-2.5 text-xs">{fmtK(totalRev)}</td>
                          <td className="px-4 py-2.5 text-xs" style={{ color: "rgba(242,240,232,0.4)" }}>{totalRev > 0 ? ((totalTax / totalRev) * 100).toFixed(1) : 0}%</td>
                          <td className="px-4 py-2.5 text-xs text-red-400">{fmtK(totalTax)}</td>
                          <td />
                        </tr>
                      </>
                    );
                  })()}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Budget vs Realizado */}
      {activeTab === 4 && (
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
      )}
    </div>
  );
};

export default VaultGlobalReports;
