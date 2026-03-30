import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { Gift, Cake } from "lucide-react";

const fmt = (v: number) => "R$ " + Math.round(v).toLocaleString("pt-BR");
const fmtDate = (s: string | null) => { if (!s) return "-"; const [y, m, d] = s.split("-"); return `${d}/${m}/${y}`; };

const statusBadge = (status: string) => {
  const colors: Record<string, string> = {
    ativo: "bg-green-500/10 text-green-400", ferias: "bg-amber-500/10 text-amber-400", inativo: "bg-red-500/10 text-red-400", aprovado: "bg-green-500/10 text-green-400", pendente: "bg-amber-500/10 text-amber-400",
  };
  return <span className={`inline-flex text-[10px] font-medium px-2 py-0.5 rounded ${colors[status] ?? "bg-white/5 text-white/40"}`}>{status.charAt(0).toUpperCase() + status.slice(1)}</span>;
};

const VaultGlobalHR = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [filterCo, setFilterCo] = useState("");
  const [filterDept, setFilterDept] = useState("");
  const [filterType, setFilterType] = useState("");

  const { data: companies } = useQuery({
    queryKey: ["vault_companies"],
    queryFn: async () => { const { data } = await supabase.from("vault_companies").select("*").eq("active", true).order("name"); return data ?? []; },
  });

  const { data: employees } = useQuery({
    queryKey: ["vault_employees_global"],
    queryFn: async () => { const { data } = await supabase.from("vault_employees").select("*").order("name"); return data ?? []; },
  });

  const { data: vacations } = useQuery({
    queryKey: ["vault_vacations_global"],
    queryFn: async () => { const { data } = await supabase.from("vault_vacations").select("*").order("start_date", { ascending: false }); return data ?? []; },
  });

  const filtered = employees?.filter((e: any) =>
    (!filterCo || e.company_id === filterCo) &&
    (!filterDept || e.department === filterDept) &&
    (!filterType || e.employment_type === filterType)
  ) ?? [];
  const totSalary = filtered.reduce((a: number, e: any) => a + Number(e.salary), 0);
  const cltCount = filtered.filter((e: any) => e.employment_type === "CLT").length;
  const pjCount = filtered.filter((e: any) => e.employment_type === "PJ").length;
  const vacCount = filtered.filter((e: any) => e.status === "ferias").length;

  const departments = [...new Set(employees?.map((e: any) => e.department).filter(Boolean) ?? [])];

  const getCoName = (id: string) => companies?.find((c: any) => c.id === id)?.name ?? "-";
  const getCoColor = (id: string) => companies?.find((c: any) => c.id === id)?.color ?? "#888";

  const tabs = ["Colaboradores", "Folha de Pagamento", "Férias & Afastamentos"];

  return (
    <div>
      <div className="mb-5">
        <h1 className="font-heading text-xl font-semibold tracking-tight">Pessoas & RH</h1>
        <p className="text-[11px]" style={{ color: "rgba(242,240,232,0.4)" }}>Centro de informações de colaboradores de todo o grupo</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5 mb-5">
        {[
          { label: "Total Colaboradores", value: String(filtered.length) },
          { label: "Folha Mensal Total", value: fmt(totSalary) },
          { label: "CLT", value: String(cltCount), cls: "text-green-400" },
          { label: "PJ", value: String(pjCount), cls: "text-blue-400" },
          { label: "Em Férias", value: String(vacCount), cls: "text-amber-400" },
        ].map((k, i) => (
          <div key={i} className="rounded-xl p-3.5 border border-white/5" style={{ background: "#0e0e0a" }}>
            <div className="text-[10px] uppercase tracking-widest mb-1" style={{ color: "rgba(242,240,232,0.4)" }}>{k.label}</div>
            <div className={`font-heading text-lg font-semibold ${k.cls ?? ""}`}>{k.value}</div>
          </div>
        ))}
      </div>

      <div className="flex border-b border-white/5 mb-5 gap-0 overflow-x-auto">
        {tabs.map((t, i) => (
          <button key={t} onClick={() => setActiveTab(i)}
            className={`px-3.5 py-2 text-xs whitespace-nowrap border-b-2 transition-colors ${activeTab === i ? "text-[#FFD600] border-[#FFD600] font-medium" : "text-white/40 border-transparent hover:text-white/60"}`}
          >{t}</button>
        ))}
      </div>

      {/* Tab 0: Colaboradores */}
      {activeTab === 0 && (
        <div className="rounded-xl border border-white/5 overflow-hidden" style={{ background: "#0e0e0a" }}>
          <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between flex-wrap gap-2">
            <span className="text-xs font-medium">Colaboradores</span>
            <div className="flex items-center gap-2 flex-wrap">
              <select value={filterCo} onChange={e => setFilterCo(e.target.value)} className="bg-white/5 border border-white/10 rounded-md px-2 py-1 text-[11px] text-[#F2F0E8] outline-none">
                <option value="" className="bg-[#111]">Todas empresas</option>
                {companies?.map((c: any) => <option key={c.id} value={c.id} className="bg-[#111]">{c.name}</option>)}
              </select>
              <select value={filterDept} onChange={e => setFilterDept(e.target.value)} className="bg-white/5 border border-white/10 rounded-md px-2 py-1 text-[11px] text-[#F2F0E8] outline-none">
                <option value="" className="bg-[#111]">Todos departamentos</option>
                {departments.map((d: string) => <option key={d} value={d} className="bg-[#111]">{d}</option>)}
              </select>
              <select value={filterType} onChange={e => setFilterType(e.target.value)} className="bg-white/5 border border-white/10 rounded-md px-2 py-1 text-[11px] text-[#F2F0E8] outline-none">
                <option value="" className="bg-[#111]">Todos tipos</option>
                <option value="CLT" className="bg-[#111]">CLT</option>
                <option value="PJ" className="bg-[#111]">PJ</option>
                <option value="Estágio" className="bg-[#111]">Estágio</option>
              </select>
            </div>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                {["Nome", "Empresa", "Cargo", "Departamento", "Tipo", "Salário", "Admissão", "Status"].map(h => (
                  <th key={h} className="text-left px-4 py-2 text-[9px] uppercase tracking-widest font-medium" style={{ color: "rgba(242,240,232,0.25)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && <tr><td colSpan={8} className="text-center py-8 text-xs" style={{ color: "rgba(242,240,232,0.3)" }}>Nenhum colaborador</td></tr>}
              {filtered.map((e: any) => (
                <tr key={e.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                  <td className="px-4 py-2.5 text-xs font-medium">{e.name}</td>
                  <td className="px-4 py-2.5"><span className="inline-flex text-[10px] font-medium px-2 py-0.5 rounded" style={{ background: `${getCoColor(e.company_id)}15`, color: getCoColor(e.company_id) }}>{getCoName(e.company_id)}</span></td>
                  <td className="px-4 py-2.5 text-xs" style={{ color: "rgba(242,240,232,0.4)" }}>{e.position}</td>
                  <td className="px-4 py-2.5 text-xs" style={{ color: "rgba(242,240,232,0.4)" }}>{e.department}</td>
                  <td className="px-4 py-2.5"><span className={`inline-flex text-[10px] font-medium px-2 py-0.5 rounded ${e.employment_type === "CLT" ? "bg-green-500/10 text-green-400" : "bg-blue-500/10 text-blue-400"}`}>{e.employment_type}</span></td>
                  <td className="px-4 py-2.5 text-xs font-medium">{fmt(Number(e.salary))}</td>
                  <td className="px-4 py-2.5 text-xs" style={{ color: "rgba(242,240,232,0.4)" }}>{fmtDate(e.admission_date)}</td>
                  <td className="px-4 py-2.5">{statusBadge(e.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-2.5 border-t border-white/5 flex gap-4 text-[11px]" style={{ color: "rgba(242,240,232,0.4)" }}>
            <span>Folha Total: <strong className="text-[#F2F0E8]">{fmt(totSalary)}</strong></span>
            <span>CLT: <strong>{cltCount}</strong></span>
            <span>PJ: <strong>{pjCount}</strong></span>
          </div>
        </div>
      )}

      {/* Tab 1: Folha de Pagamento */}
      {activeTab === 1 && (
        <div>
          <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
            <div className="text-[13px] font-medium">Folha de Pagamento</div>
            <div className="flex gap-2">
              <select value={filterCo} onChange={e => setFilterCo(e.target.value)} className="bg-white/5 border border-white/10 rounded-md px-2 py-1 text-[11px] text-[#F2F0E8] outline-none">
                <option value="" className="bg-[#111]">Todas empresas</option>
                {companies?.map((c: any) => <option key={c.id} value={c.id} className="bg-[#111]">{c.name}</option>)}
              </select>
            </div>
          </div>
          <div className="rounded-xl border border-white/5 overflow-hidden" style={{ background: "#0e0e0a" }}>
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  {["Colaborador", "Empresa", "Cargo", "Tipo", "Sal. Bruto", "INSS (11%)", "IRRF", "Sal. Líquido"].map(h => (
                    <th key={h} className="text-left px-4 py-2 text-[9px] uppercase tracking-widest font-medium" style={{ color: "rgba(242,240,232,0.25)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((e: any) => {
                  const sal = Number(e.salary);
                  const inss = Math.round(sal * 0.11);
                  const irrf = sal > 4664 ? Math.round((sal - 4664) * 0.15) : 0;
                  return (
                    <tr key={e.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                      <td className="px-4 py-2.5 text-xs font-medium">{e.name}</td>
                      <td className="px-4 py-2.5"><span className="inline-flex text-[10px] font-medium px-2 py-0.5 rounded" style={{ background: `${getCoColor(e.company_id)}15`, color: getCoColor(e.company_id) }}>{getCoName(e.company_id)}</span></td>
                      <td className="px-4 py-2.5 text-xs" style={{ color: "rgba(242,240,232,0.4)" }}>{e.position}</td>
                      <td className="px-4 py-2.5"><span className={`inline-flex text-[10px] font-medium px-2 py-0.5 rounded ${e.employment_type === "CLT" ? "bg-green-500/10 text-green-400" : "bg-blue-500/10 text-blue-400"}`}>{e.employment_type}</span></td>
                      <td className="px-4 py-2.5 text-xs">{fmt(sal)}</td>
                      <td className="px-4 py-2.5 text-xs text-red-400">{fmt(inss)}</td>
                      <td className="px-4 py-2.5 text-xs text-red-400">{fmt(irrf)}</td>
                      <td className="px-4 py-2.5 text-xs text-green-400 font-semibold">{fmt(sal - inss - irrf)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {(() => {
              const tot = filtered.reduce((a: number, e: any) => a + Number(e.salary), 0);
              const totINSS = filtered.reduce((a: number, e: any) => a + Math.round(Number(e.salary) * 0.11), 0);
              const totLiq = filtered.reduce((a: number, e: any) => {
                const s = Number(e.salary); return a + (s - Math.round(s * 0.11) - (s > 4664 ? Math.round((s - 4664) * 0.15) : 0));
              }, 0);
              return (
                <div className="px-4 py-2.5 border-t border-white/5 flex gap-4 text-[11px]" style={{ color: "rgba(242,240,232,0.4)" }}>
                  <span>Total Bruto: <strong className="text-[#F2F0E8]">{fmt(tot)}</strong></span>
                  <span>Total INSS: <strong className="text-red-400">{fmt(totINSS)}</strong></span>
                  <span>Total Líquido: <strong className="text-green-400">{fmt(totLiq)}</strong></span>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Tab 2: Férias & Afastamentos */}
      {activeTab === 2 && (
        <div className="rounded-xl border border-white/5 overflow-hidden" style={{ background: "#0e0e0a" }}>
          <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between flex-wrap gap-2">
            <span className="text-xs font-medium">Férias & Afastamentos</span>
            <select value={filterCo} onChange={e => setFilterCo(e.target.value)} className="bg-white/5 border border-white/10 rounded-md px-2 py-1 text-[11px] text-[#F2F0E8] outline-none">
              <option value="" className="bg-[#111]">Todas empresas</option>
              {companies?.map((c: any) => <option key={c.id} value={c.id} className="bg-[#111]">{c.name}</option>)}
            </select>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                {["Colaborador", "Empresa", "Tipo", "Início", "Retorno", "Dias", "Status"].map(h => (
                  <th key={h} className="text-left px-4 py-2 text-[9px] uppercase tracking-widest font-medium" style={{ color: "rgba(242,240,232,0.25)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(() => {
                const filteredVac = vacations?.filter((v: any) => !filterCo || v.company_id === filterCo) ?? [];
                if (filteredVac.length === 0) return <tr><td colSpan={7} className="text-center py-8 text-xs" style={{ color: "rgba(242,240,232,0.3)" }}>Nenhum registro</td></tr>;
                return filteredVac.map((v: any) => {
                  const emp = employees?.find((e: any) => e.id === v.employee_id);
                  return (
                    <tr key={v.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                      <td className="px-4 py-2.5 text-xs font-medium">{emp?.name ?? "-"}</td>
                      <td className="px-4 py-2.5"><span className="inline-flex text-[10px] font-medium px-2 py-0.5 rounded" style={{ background: `${getCoColor(v.company_id)}15`, color: getCoColor(v.company_id) }}>{getCoName(v.company_id)}</span></td>
                      <td className="px-4 py-2.5 text-xs">{v.leave_type}</td>
                      <td className="px-4 py-2.5 text-xs" style={{ color: "rgba(242,240,232,0.4)" }}>{fmtDate(v.start_date)}</td>
                      <td className="px-4 py-2.5 text-xs" style={{ color: "rgba(242,240,232,0.4)" }}>{fmtDate(v.return_date)}</td>
                      <td className="px-4 py-2.5 text-xs">{v.days} dias</td>
                      <td className="px-4 py-2.5">{statusBadge(v.status)}</td>
                    </tr>
                  );
                });
              })()}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default VaultGlobalHR;
