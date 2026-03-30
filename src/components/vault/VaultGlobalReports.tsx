import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";

const fmt = (v: number) => "R$ " + Math.round(v).toLocaleString("pt-BR");
const fmtK = (v: number) => v >= 1000 ? "R$ " + (v / 1000).toFixed(v % 1000 === 0 ? 0 : 1).replace(".", ",") + "k" : fmt(v);

const CHART_COLORS = ["#FFD600", "#3B82F6", "#A855F7", "#22c55e", "#ef4444", "#f59e0b"];

const VaultGlobalReports = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [filterCo, setFilterCo] = useState<string[]>([]);
  const [filterYear, setFilterYear] = useState("2026");
  const [compareMode, setCompareMode] = useState(false);

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

  const { data: employees } = useQuery({
    queryKey: ["vault_employees_global"],
    queryFn: async () => { const { data } = await supabase.from("vault_employees").select("*"); return data ?? []; },
  });

  // Filtered data
  const filteredMonthly = useMemo(() => {
    let data = monthlyData ?? [];
    if (filterYear) data = data.filter((m: any) => (m.month_date as string).startsWith(filterYear));
    if (filterCo.length > 0) data = data.filter((m: any) => filterCo.includes(m.company_id));
    return data;
  }, [monthlyData, filterYear, filterCo]);

  const filteredEntries = useMemo(() => {
    let data = entries ?? [];
    if (filterYear) data = data.filter((e: any) => (e.created_at as string).startsWith(filterYear));
    if (filterCo.length > 0) data = data.filter((e: any) => filterCo.includes(e.company_id));
    return data;
  }, [entries, filterYear, filterCo]);

  const months = [...new Set(filteredMonthly.map((m: any) => m.month_date))].sort();
  const years = [...new Set((monthlyData ?? []).map((m: any) => (m.month_date as string).substring(0, 4)))].sort();

  // Chart data
  const chartData = months.map(m => {
    const rows = filteredMonthly.filter((d: any) => d.month_date === m);
    const rev = rows.reduce((a: number, r: any) => a + Number(r.revenue), 0);
    const exp = rows.reduce((a: number, r: any) => a + Number(r.expenses), 0);
    const [y, mo] = (m as string).split("-");
    return { name: `${mo}/${y}`, Faturamento: rev, Despesas: exp, Resultado: rev - exp };
  });

  // Compare chart
  const compareData = useMemo(() => {
    if (!compareMode || filterCo.length < 2) return [];
    return months.map(m => {
      const row: any = { name: (m as string).split("-").reverse().slice(0, 2).join("/") };
      filterCo.forEach(cid => {
        const co = companies?.find((c: any) => c.id === cid);
        const md = filteredMonthly.find((d: any) => d.company_id === cid && d.month_date === m);
        if (co) row[co.name] = Number(md?.revenue ?? 0);
      });
      return row;
    });
  }, [compareMode, filterCo, months, filteredMonthly, companies]);

  // Pie data
  const lastMonth = months[months.length - 1] as string | undefined;
  const pieData = companies?.map((c: any) => {
    const md = lastMonth ? filteredMonthly.find((d: any) => d.company_id === c.id && d.month_date === lastMonth) : null;
    return { name: c.name, value: Number(md?.revenue ?? 0), color: c.color };
  }).filter((d: any) => d.value > 0) ?? [];

  // Cashflow
  let accumulated = 0;
  const cashflowData = chartData.map(d => {
    accumulated += d.Resultado;
    return { ...d, Entradas: d.Faturamento, Saídas: d.Despesas, Saldo: d.Resultado, Acumulado: accumulated };
  });

  // Category breakdown from entries
  const categoryBreakdown = useMemo(() => {
    const map: Record<string, { desp: number; fat: number }> = {};
    filteredEntries.forEach((e: any) => {
      const cat = e.category || "Sem categoria";
      if (!map[cat]) map[cat] = { desp: 0, fat: 0 };
      if (e.entry_type === "despesa") map[cat].desp += Number(e.amount);
      else map[cat].fat += Number(e.amount);
    });
    return Object.entries(map).map(([cat, v]) => ({ category: cat, ...v })).sort((a, b) => (b.desp + b.fat) - (a.desp + a.fat));
  }, [filteredEntries]);

  // Payroll per company
  const payrollByCompany = useMemo(() => {
    const filteredEmps = filterCo.length > 0
      ? (employees ?? []).filter((e: any) => filterCo.includes(e.company_id))
      : employees ?? [];
    return companies?.map((c: any) => {
      const emps = filteredEmps.filter((e: any) => e.company_id === c.id);
      const total = emps.reduce((a: number, e: any) => a + Number(e.salary), 0);
      return { name: c.name, color: c.color, total, count: emps.length };
    }).filter(c => c.count > 0) ?? [];
  }, [companies, employees, filterCo]);

  const toggleCompanyFilter = (id: string) => {
    setFilterCo(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
  };

  const tabs = ["DRE", "Fluxo de Caixa", "Por Empresa", "Categorias", "Impostos", "Folha", "Budget vs Realizado"];

  // Tabs that support company comparison
  const comparableTabs = [0, 1, 2]; // DRE, Fluxo de Caixa, Por Empresa

  const handleTabChange = (idx: number) => {
    setActiveTab(idx);
    setFilterCo([]);
    setCompareMode(false);
  };

  // Filter bar
  const filterBar = (
    <div className="flex flex-wrap items-center gap-2 mb-5 p-3 rounded-xl border border-white/5" style={{ background: "#0e0e0a" }}>
      <div className="text-[10px] uppercase tracking-widest mr-2" style={{ color: "rgba(242,240,232,0.4)" }}>Filtros:</div>
      <select value={filterYear} onChange={e => setFilterYear(e.target.value)} className="bg-white/5 border border-white/10 rounded-md px-2 py-1 text-[11px] text-[#F2F0E8] outline-none">
        <option value="" className="bg-[#111]">Todos os anos</option>
        {years.map(y => <option key={y} value={y} className="bg-[#111]">{y}</option>)}
        {!years.includes("2026") && <option value="2026" className="bg-[#111]">2026</option>}
      </select>
      <div className="flex items-center gap-1 flex-wrap">
        {companies?.map((c: any) => (
          <button key={c.id} onClick={() => toggleCompanyFilter(c.id)}
            className={`text-[10px] px-2 py-0.5 rounded transition-colors border ${filterCo.includes(c.id) ? "border-white/30" : "border-transparent opacity-50 hover:opacity-80"}`}
            style={{ background: `${c.color}20`, color: c.color }}
          >{c.name}</button>
        ))}
      </div>
      {comparableTabs.includes(activeTab) && filterCo.length >= 2 && (
        <label className="flex items-center gap-1 text-[10px] ml-2 cursor-pointer" style={{ color: "rgba(242,240,232,0.5)" }}>
          <input type="checkbox" checked={compareMode} onChange={e => setCompareMode(e.target.checked)} className="accent-[#FFD600] w-3 h-3" />
          Comparar empresas
        </label>
      )}
      {filterCo.length > 0 && (
        <button onClick={() => { setFilterCo([]); setCompareMode(false); }} className="text-[10px] text-red-400 hover:text-red-300 ml-1">Limpar filtros</button>
      )}
    </div>
  );

  return (
    <div>
      <div className="mb-5">
        <h1 className="font-heading text-xl font-semibold tracking-tight">Relatórios</h1>
        <p className="text-[11px]" style={{ color: "rgba(242,240,232,0.4)" }}>DRE, fluxo de caixa, impostos, folha e budget | dados consolidados do grupo</p>
      </div>

      {filterBar}

      <div className="flex gap-1 mb-5 border-b border-white/5 pb-2 overflow-x-auto">
        {tabs.map((t, i) => (
          <button key={t} onClick={() => setActiveTab(i)}
            className={`px-3 py-1.5 rounded-md text-[11px] whitespace-nowrap transition-colors ${activeTab === i ? "bg-[rgba(255,214,0,0.1)] text-[#FFD600]" : "text-white/40 hover:text-white/60"}`}
          >{t}</button>
        ))}
      </div>

      {/* DRE */}
      {activeTab === 0 && (
        <div className="space-y-5">
          {compareMode && compareData.length > 0 ? (
            <div className="rounded-xl border border-white/5 p-4" style={{ background: "#0e0e0a" }}>
              <h3 className="text-xs font-medium mb-3">Comparativo de Faturamento</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={compareData}>
                  <XAxis dataKey="name" tick={{ fill: "rgba(242,240,232,0.4)", fontSize: 10 }} />
                  <YAxis tick={{ fill: "rgba(242,240,232,0.4)", fontSize: 10 }} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={{ background: "#111", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#F2F0E8", fontSize: 11 }} formatter={(v: number) => fmt(v)} />
                  {filterCo.map((cid, idx) => {
                    const co = companies?.find((c: any) => c.id === cid);
                    return <Bar key={cid} dataKey={co?.name ?? ""} fill={co?.color ?? CHART_COLORS[idx]} radius={[4,4,0,0]} />;
                  })}
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : chartData.length > 0 && (
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
              <span className="text-xs font-medium">DRE | Demonstrativo do Resultado {filterCo.length > 0 ? "(Filtrado)" : "(Consolidado)"}</span>
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
                    const rows = filteredMonthly.filter((d: any) => d.month_date === m);
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
          {cashflowData.length > 0 && (
            <div className="rounded-xl border border-white/5 p-4" style={{ background: "#0e0e0a" }}>
              <h3 className="text-xs font-medium mb-3">Fluxo de Caixa Acumulado</h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={cashflowData}>
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
                {cashflowData.map((d, i) => (
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
                  const md = lastMonth ? filteredMonthly.find((d: any) => d.company_id === c.id && d.month_date === lastMonth) : null;
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
          </div>
        </div>
      )}

      {/* Categorias */}
      {activeTab === 3 && (
        <div className="rounded-xl border border-white/5 overflow-hidden" style={{ background: "#0e0e0a" }}>
          <div className="px-4 py-3 border-b border-white/5">
            <span className="text-xs font-medium">Breakdown por Categoria</span>
          </div>
          {categoryBreakdown.length === 0 ? (
            <div className="text-center py-8 text-xs" style={{ color: "rgba(242,240,232,0.3)" }}>Nenhum lançamento</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  {["Categoria", "Despesas", "Faturamentos", "Saldo"].map(h => (
                    <th key={h} className="text-left px-4 py-2 text-[9px] uppercase tracking-widest font-medium" style={{ color: "rgba(242,240,232,0.25)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {categoryBreakdown.map((c, i) => (
                  <tr key={i} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                    <td className="px-4 py-2.5 text-xs">{c.category}</td>
                    <td className="px-4 py-2.5 text-xs text-red-400">{fmtK(c.desp)}</td>
                    <td className="px-4 py-2.5 text-xs text-green-400">{fmtK(c.fat)}</td>
                    <td className={`px-4 py-2.5 text-xs font-semibold ${c.fat - c.desp >= 0 ? "text-green-400" : "text-red-400"}`}>{fmtK(c.fat - c.desp)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Impostos */}
      {activeTab === 4 && (
        <div className="rounded-xl border border-white/5 overflow-hidden" style={{ background: "#0e0e0a" }}>
          <div className="px-4 py-3 border-b border-white/5">
            <span className="text-xs font-medium">Impostos por Empresa (Último Mês)</span>
          </div>
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
                const displayCompanies = filterCo.length > 0 ? companies?.filter((c: any) => filterCo.includes(c.id)) : companies;
                let totalTax = 0;
                let totalRev = 0;
                const rows = displayCompanies?.map((c: any) => {
                  const md = lastMonth ? filteredMonthly.find((d: any) => d.company_id === c.id && d.month_date === lastMonth) : null;
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
        </div>
      )}

      {/* Folha */}
      {activeTab === 5 && (
        <div className="rounded-xl border border-white/5 overflow-hidden" style={{ background: "#0e0e0a" }}>
          <div className="px-4 py-3 border-b border-white/5">
            <span className="text-xs font-medium">Custo de Folha por Empresa</span>
          </div>
          {payrollByCompany.length === 0 ? (
            <div className="text-center py-8 text-xs" style={{ color: "rgba(242,240,232,0.3)" }}>Nenhum colaborador</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  {["Empresa", "Colaboradores", "Folha Mensal", "Folha Anual", "Custo Médio"].map(h => (
                    <th key={h} className="text-left px-4 py-2 text-[9px] uppercase tracking-widest font-medium" style={{ color: "rgba(242,240,232,0.25)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payrollByCompany.map((c, i) => (
                  <tr key={i} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                    <td className="px-4 py-2.5">
                      <span className="inline-flex text-[10px] font-medium px-2 py-0.5 rounded" style={{ background: `${c.color}15`, color: c.color }}>{c.name}</span>
                    </td>
                    <td className="px-4 py-2.5 text-xs">{c.count}</td>
                    <td className="px-4 py-2.5 text-xs font-medium">{fmtK(c.total)}</td>
                    <td className="px-4 py-2.5 text-xs" style={{ color: "rgba(242,240,232,0.4)" }}>{fmtK(c.total * 12)}</td>
                    <td className="px-4 py-2.5 text-xs" style={{ color: "rgba(242,240,232,0.4)" }}>{fmtK(c.count > 0 ? Math.round(c.total / c.count) : 0)}</td>
                  </tr>
                ))}
                <tr className="border-t-2 border-white/10 font-semibold">
                  <td className="px-4 py-2.5 text-xs">TOTAL</td>
                  <td className="px-4 py-2.5 text-xs">{payrollByCompany.reduce((a, c) => a + c.count, 0)}</td>
                  <td className="px-4 py-2.5 text-xs">{fmtK(payrollByCompany.reduce((a, c) => a + c.total, 0))}</td>
                  <td className="px-4 py-2.5 text-xs" style={{ color: "rgba(242,240,232,0.4)" }}>{fmtK(payrollByCompany.reduce((a, c) => a + c.total, 0) * 12)}</td>
                  <td />
                </tr>
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Budget vs Realizado */}
      {activeTab === 6 && (
        <div className="rounded-xl border border-white/5 overflow-hidden" style={{ background: "#0e0e0a" }}>
          <div className="px-4 py-3 border-b border-white/5">
            <span className="text-xs font-medium">Budget vs Realizado | {filterYear || "Todos"}</span>
          </div>
          {(budgets?.length ?? 0) === 0 ? (
            <div className="text-center py-8 text-xs" style={{ color: "rgba(242,240,232,0.3)" }}>Nenhum budget cadastrado</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  {["Empresa", "Categoria", "Orçado", "Realizado", "Saldo", "Utilização"].map(h => (
                    <th key={h} className="text-left px-4 py-2 text-[9px] uppercase tracking-widest font-medium" style={{ color: "rgba(242,240,232,0.25)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const displayBudgets = filterCo.length > 0
                    ? budgets?.filter((b: any) => filterCo.includes(b.company_id))
                    : budgets;
                  return displayBudgets?.map((b: any) => {
                    const co = companies?.find((c: any) => c.id === b.company_id);
                    const realized = filteredEntries.filter((e: any) => e.company_id === b.company_id && e.category === b.category && e.entry_type === "despesa").reduce((a: number, e: any) => a + Number(e.amount), 0);
                    const p = Number(b.amount) > 0 ? Math.round((realized / Number(b.amount)) * 100) : 0;
                    return (
                      <tr key={b.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                        <td className="px-4 py-2.5">
                          {co && <span className="inline-flex text-[10px] font-medium px-2 py-0.5 rounded" style={{ background: `${co.color}15`, color: co.color }}>{co.name}</span>}
                        </td>
                        <td className="px-4 py-2.5 text-xs">{b.category}</td>
                        <td className="px-4 py-2.5 text-xs font-medium">{fmt(Number(b.amount))}</td>
                        <td className="px-4 py-2.5 text-xs">{fmt(realized)}</td>
                        <td className={`px-4 py-2.5 text-xs ${Number(b.amount) - realized >= 0 ? "text-green-400" : "text-red-400"}`}>{fmt(Number(b.amount) - realized)}</td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                              <div className="h-full rounded-full" style={{ width: `${Math.min(p, 100)}%`, background: p > 100 ? "#ef4444" : p > 85 ? "#f59e0b" : "#FFD600" }} />
                            </div>
                            <span className="text-[10px]" style={{ color: "rgba(242,240,232,0.4)" }}>{p}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  });
                })()}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};

export default VaultGlobalReports;
