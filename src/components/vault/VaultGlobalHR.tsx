import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect, useMemo } from "react";
import { Gift, Cake, User, Plus, ArrowLeft, Calendar, DollarSign, TrendingUp, TrendingDown, Minus, X } from "lucide-react";

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

  const { data: salaryHistory } = useQuery({
    queryKey: ["vault_salary_history_global"],
    queryFn: async () => { const { data } = await supabase.from("vault_salary_history").select("*").order("change_date", { ascending: false }); return data ?? []; },
  });

  const queryClient = useQueryClient();
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [showVacForm, setShowVacForm] = useState(false);
  const [showSalaryForm, setShowSalaryForm] = useState(false);
  const [vacForm, setVacForm] = useState({ start_date: "", return_date: "", days: 0, leave_type: "Férias", status: "aprovado" });
  const [salaryForm, setSalaryForm] = useState({ new_salary: "", change_date: new Date().toISOString().split("T")[0], reason: "" });

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

  const tabs = ["Colaboradores", "Folha de Pagamento", "Férias & Afastamentos", "Aniversários", "RH"];

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

      {/* Tab 3: Aniversários */}
      {activeTab === 3 && (
        <BirthdayTab employees={filtered} companies={companies} getCoName={getCoName} getCoColor={getCoColor} />
      )}

      {/* Tab 4: RH - Employee Profiles */}
      {activeTab === 4 && (
        <div>
          {selectedEmployee ? (
            <EmployeeProfile
              employee={selectedEmployee}
              vacations={vacations?.filter((v: any) => v.employee_id === selectedEmployee.id) ?? []}
              salaryHistory={salaryHistory?.filter((s: any) => s.employee_id === selectedEmployee.id) ?? []}
              getCoName={getCoName}
              getCoColor={getCoColor}
              onBack={() => { setSelectedEmployee(null); setShowVacForm(false); setShowSalaryForm(false); }}
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
                  employee_id: selectedEmployee.id,
                  company_id: selectedEmployee.company_id,
                  start_date: vacForm.start_date,
                  return_date: vacForm.return_date,
                  days,
                  leave_type: vacForm.leave_type,
                  status: vacForm.status,
                });
                queryClient.invalidateQueries({ queryKey: ["vault_vacations_global"] });
                setShowVacForm(false);
                setVacForm({ start_date: "", return_date: "", days: 0, leave_type: "Férias", status: "aprovado" });
              }}
              onSaveSalary={async () => {
                const newSal = Number(salaryForm.new_salary);
                if (!newSal) return;
                await supabase.from("vault_salary_history").insert({
                  employee_id: selectedEmployee.id,
                  company_id: selectedEmployee.company_id,
                  previous_salary: Number(selectedEmployee.salary),
                  new_salary: newSal,
                  change_date: salaryForm.change_date,
                  reason: salaryForm.reason || null,
                });
                await supabase.from("vault_employees").update({ salary: newSal }).eq("id", selectedEmployee.id);
                setSelectedEmployee({ ...selectedEmployee, salary: newSal });
                queryClient.invalidateQueries({ queryKey: ["vault_salary_history_global"] });
                queryClient.invalidateQueries({ queryKey: ["vault_employees_global"] });
                setShowSalaryForm(false);
                setSalaryForm({ new_salary: "", change_date: new Date().toISOString().split("T")[0], reason: "" });
              }}
            />
          ) : (
            <div className="rounded-xl border border-white/5 overflow-hidden" style={{ background: "#0e0e0a" }}>
              <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-[#FFD600]" />
                  <span className="text-xs font-medium">Perfis de RH</span>
                </div>
                <select value={filterCo} onChange={e => setFilterCo(e.target.value)} className="bg-white/5 border border-white/10 rounded-md px-2 py-1 text-[11px] text-[#F2F0E8] outline-none">
                  <option value="" className="bg-[#111]">Todas empresas</option>
                  {companies?.map((c: any) => <option key={c.id} value={c.id} className="bg-[#111]">{c.name}</option>)}
                </select>
              </div>
              <div className="divide-y divide-white/5">
                {filtered.length === 0 && <div className="text-center py-8 text-xs" style={{ color: "rgba(242,240,232,0.3)" }}>Nenhum colaborador</div>}
                {filtered.map((e: any) => {
                  const empVacs = vacations?.filter((v: any) => v.employee_id === e.id) ?? [];
                  const empSalary = salaryHistory?.filter((s: any) => s.employee_id === e.id) ?? [];
                  const activeVac = empVacs.find((v: any) => new Date(v.start_date) <= new Date() && new Date(v.return_date) >= new Date());
                  return (
                    <button
                      key={e.id}
                      onClick={() => setSelectedEmployee(e)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/[0.03] transition-colors text-left"
                    >
                      <div className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: `${getCoColor(e.company_id)}20`, color: getCoColor(e.company_id) }}>
                        {e.name?.charAt(0)?.toUpperCase() ?? "?"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium truncate">{e.name}</div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px]" style={{ color: "rgba(242,240,232,0.4)" }}>{e.position ?? "-"}</span>
                          <span className="inline-flex text-[9px] font-medium px-1.5 py-0.5 rounded" style={{ background: `${getCoColor(e.company_id)}15`, color: getCoColor(e.company_id) }}>{getCoName(e.company_id)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        {activeVac && <span className="text-[9px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 font-medium">Em férias</span>}
                        <div className="text-right">
                          <div className="text-[10px]" style={{ color: "rgba(242,240,232,0.4)" }}>{empVacs.length} férias · {empSalary.length} alterações</div>
                        </div>
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
  );
};

/* ───── Birthday Sub-Component ───── */

const getDaysUntilBirthday = (birthDateStr: string) => {
  const today = new Date();
  const [y, m, d] = birthDateStr.split("-").map(Number);
  const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  let next = new Date(today.getFullYear(), m - 1, d);
  if (next < todayDate) next = new Date(today.getFullYear() + 1, m - 1, d);
  return Math.ceil((next.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24));
};

const BirthdayTab = ({ employees, companies, getCoName, getCoColor }: {
  employees: any[];
  companies: any[] | undefined;
  getCoName: (id: string) => string;
  getCoColor: (id: string) => string;
}) => {
  const withBirthday = employees
    .filter((e: any) => e.birth_date && e.status !== "inativo")
    .map((e: any) => ({ ...e, _daysUntil: getDaysUntilBirthday(e.birth_date) }))
    .sort((a: any, b: any) => a._daysUntil - b._daysUntil);

  useEffect(() => {
    const todayBirthdays = withBirthday.filter((e: any) => e._daysUntil === 0);
    todayBirthdays.forEach(async (e: any) => {
      const msg = `🎂 Hoje é aniversário de ${e.name}!`;
      const todayStr = new Date().toISOString().slice(0, 10);
      const { data: existing } = await supabase
        .from("vault_notifications")
        .select("id")
        .eq("message", msg)
        .gte("created_at", todayStr);
      if (!existing || existing.length === 0) {
        await supabase.from("vault_notifications").insert({
          message: msg,
          sub_message: `${e.position ?? ""} — ${getCoName(e.company_id)}`,
          notification_type: "birthday",
          icon: "🎂",
          color: "#FFD600",
          company_id: e.company_id,
        });
      }
    });
  }, [withBirthday.length]);

  const fmtBday = (s: string) => {
    const [, m, d] = s.split("-");
    const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    return `${d} ${months[Number(m) - 1]}`;
  };

  return (
    <div className="rounded-xl border border-white/5 overflow-hidden" style={{ background: "#0e0e0a" }}>
      <div className="px-4 py-3 border-b border-white/5 flex items-center gap-2">
        <Cake className="w-4 h-4 text-[#FFD600]" />
        <span className="text-xs font-medium">Aniversários</span>
        <span className="text-[10px] ml-auto" style={{ color: "rgba(242,240,232,0.4)" }}>{withBirthday.length} colaboradores com data cadastrada</span>
      </div>
      {withBirthday.length === 0 ? (
        <div className="text-center py-12 text-xs" style={{ color: "rgba(242,240,232,0.3)" }}>
          <Gift className="w-8 h-8 mx-auto mb-2 opacity-30" />
          Nenhum colaborador com data de nascimento cadastrada
        </div>
      ) : (
        <div className="divide-y divide-white/5">
          {withBirthday.map((e: any) => {
            const isToday = e._daysUntil === 0;
            const isSoon = e._daysUntil <= 7 && e._daysUntil > 0;
            return (
              <div key={e.id} className={`flex items-center gap-3 px-4 py-3 ${isToday ? "bg-[#FFD600]/5" : "hover:bg-white/[0.02]"}`}>
                <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-lg ${isToday ? "bg-[#FFD600]/20" : isSoon ? "bg-amber-500/10" : "bg-white/5"}`}>
                  {isToday ? "🎂" : "🎁"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium truncate">{e.name}</span>
                    {isToday && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#FFD600]/20 text-[#FFD600]">HOJE!</span>}
                    {isSoon && <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400">Em {e._daysUntil} dia{e._daysUntil > 1 ? "s" : ""}</span>}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px]" style={{ color: "rgba(242,240,232,0.4)" }}>{e.position}</span>
                    <span className="inline-flex text-[9px] font-medium px-1.5 py-0.5 rounded" style={{ background: `${getCoColor(e.company_id)}15`, color: getCoColor(e.company_id) }}>{getCoName(e.company_id)}</span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-xs font-semibold" style={{ color: isToday ? "#FFD600" : isSoon ? "#f59e0b" : "rgba(242,240,232,0.6)" }}>{fmtBday(e.birth_date)}</div>
                  {!isToday && <div className="text-[10px]" style={{ color: "rgba(242,240,232,0.3)" }}>em {e._daysUntil} dias</div>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default VaultGlobalHR;
