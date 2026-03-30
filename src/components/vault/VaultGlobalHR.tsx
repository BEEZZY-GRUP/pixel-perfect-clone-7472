import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useState } from "react";
import VaultEmployeeForm from "./VaultEmployeeForm";
import VaultDeleteConfirm from "./VaultDeleteConfirm";

const fmt = (v: number) => "R$ " + Math.round(v).toLocaleString("pt-BR");
const fmtDate = (s: string | null) => { if (!s) return "—"; const [y, m, d] = s.split("-"); return `${d}/${m}/${y}`; };

const statusBadge = (status: string) => {
  const colors: Record<string, string> = {
    ativo: "bg-green-500/10 text-green-400", ferias: "bg-amber-500/10 text-amber-400", inativo: "bg-red-500/10 text-red-400",
  };
  return <span className={`inline-flex text-[10px] font-medium px-2 py-0.5 rounded ${colors[status] ?? "bg-white/5 text-white/40"}`}>{status.charAt(0).toUpperCase() + status.slice(1)}</span>;
};

const VaultGlobalHR = () => {
  const qc = useQueryClient();
  const [empModal, setEmpModal] = useState<{ open: boolean; employee?: any; companyId?: string }>({ open: false });
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; id: string }>({ open: false, id: "" });
  const [filterCo, setFilterCo] = useState("");

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

  const filtered = employees?.filter((e: any) => !filterCo || e.company_id === filterCo) ?? [];
  const totSalary = filtered.reduce((a: number, e: any) => a + Number(e.salary), 0);
  const activeCount = filtered.filter((e: any) => e.status === "ativo").length;
  const vacCount = filtered.filter((e: any) => e.status === "ferias").length;
  const cltCount = filtered.filter((e: any) => e.employment_type === "CLT").length;

  const getCoName = (id: string) => companies?.find((c: any) => c.id === id)?.name ?? "—";
  const getCoColor = (id: string) => companies?.find((c: any) => c.id === id)?.color ?? "#888";

  return (
    <div>
      <div className="mb-5">
        <h1 className="font-heading text-xl font-semibold tracking-tight">Pessoas & RH</h1>
        <p className="text-[11px]" style={{ color: "rgba(242,240,232,0.4)" }}>Gestão de colaboradores de todo o grupo</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mb-5">
        {[
          { label: "Total Colaboradores", value: String(filtered.length) },
          { label: "Folha Mensal", value: fmt(totSalary) },
          { label: "Em Férias", value: String(vacCount) },
          { label: "CLT", value: String(cltCount) },
        ].map((k, i) => (
          <div key={i} className="rounded-xl p-3.5 border border-white/5" style={{ background: "#0e0e0a" }}>
            <div className="text-[10px] uppercase tracking-widest mb-1" style={{ color: "rgba(242,240,232,0.4)" }}>{k.label}</div>
            <div className="font-heading text-lg font-semibold">{k.value}</div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-white/5 overflow-hidden mb-5" style={{ background: "#0e0e0a" }}>
        <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between flex-wrap gap-2">
          <span className="text-xs font-medium">Colaboradores</span>
          <div className="flex items-center gap-2">
            <select value={filterCo} onChange={e => setFilterCo(e.target.value)} className="bg-white/5 border border-white/10 rounded-md px-2 py-1 text-[11px] text-[#F2F0E8] outline-none">
              <option value="" className="bg-[#111]">Todas empresas</option>
              {companies?.map((c: any) => <option key={c.id} value={c.id} className="bg-[#111]">{c.name}</option>)}
            </select>
            <Button size="sm" onClick={() => setEmpModal({ open: true, companyId: filterCo || companies?.[0]?.id })} className="bg-[#FFD600] text-black hover:bg-[#E6C200] h-7 text-[11px] px-2.5">
              <Plus size={12} className="mr-1" /> Admitir
            </Button>
          </div>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5">
              {["Nome", "Empresa", "Cargo", "Depto", "Tipo", "Salário", "Admissão", "Status", "Ações"].map(h => (
                <th key={h} className="text-left px-4 py-2 text-[9px] uppercase tracking-widest font-medium" style={{ color: "rgba(242,240,232,0.25)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && <tr><td colSpan={9} className="text-center py-8 text-xs" style={{ color: "rgba(242,240,232,0.3)" }}>Nenhum colaborador</td></tr>}
            {filtered.map((e: any) => (
              <tr key={e.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                <td className="px-4 py-2.5 text-xs font-medium">{e.name}</td>
                <td className="px-4 py-2.5">
                  <span className="inline-flex text-[10px] font-medium px-2 py-0.5 rounded" style={{ background: `${getCoColor(e.company_id)}15`, color: getCoColor(e.company_id) }}>{getCoName(e.company_id)}</span>
                </td>
                <td className="px-4 py-2.5 text-xs" style={{ color: "rgba(242,240,232,0.4)" }}>{e.position}</td>
                <td className="px-4 py-2.5 text-xs" style={{ color: "rgba(242,240,232,0.4)" }}>{e.department}</td>
                <td className="px-4 py-2.5 text-xs" style={{ color: "rgba(242,240,232,0.4)" }}>{e.employment_type}</td>
                <td className="px-4 py-2.5 text-xs font-medium">{fmt(Number(e.salary))}</td>
                <td className="px-4 py-2.5 text-xs" style={{ color: "rgba(242,240,232,0.4)" }}>{fmtDate(e.admission_date)}</td>
                <td className="px-4 py-2.5">{statusBadge(e.status)}</td>
                <td className="px-4 py-2.5">
                  <div className="flex gap-1">
                    <button onClick={() => setEmpModal({ open: true, employee: e, companyId: e.company_id })} className="p-1 rounded hover:bg-white/10"><Pencil size={12} style={{ color: "rgba(242,240,232,0.4)" }} /></button>
                    <button onClick={() => setDeleteModal({ open: true, id: e.id })} className="p-1 rounded hover:bg-red-500/20"><Trash2 size={12} className="text-red-400" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-4 py-2.5 border-t border-white/5 flex gap-4 text-[11px]" style={{ color: "rgba(242,240,232,0.4)" }}>
          <span>Folha Total: <strong className="text-[#F2F0E8]">{fmt(totSalary)}</strong></span>
          <span>CLT: <strong>{cltCount}</strong></span>
          <span>PJ: <strong>{filtered.filter((e: any) => e.employment_type === "PJ").length}</strong></span>
        </div>
      </div>

      {/* Vacations */}
      <div className="rounded-xl border border-white/5 overflow-hidden" style={{ background: "#0e0e0a" }}>
        <div className="px-4 py-3 border-b border-white/5">
          <span className="text-xs font-medium">Férias & Afastamentos</span>
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
            {(vacations?.length ?? 0) === 0 && <tr><td colSpan={7} className="text-center py-8 text-xs" style={{ color: "rgba(242,240,232,0.3)" }}>Nenhum registro</td></tr>}
            {vacations?.map((v: any) => {
              const emp = employees?.find((e: any) => e.id === v.employee_id);
              return (
                <tr key={v.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                  <td className="px-4 py-2.5 text-xs font-medium">{emp?.name ?? "—"}</td>
                  <td className="px-4 py-2.5">
                    <span className="inline-flex text-[10px] font-medium px-2 py-0.5 rounded" style={{ background: `${getCoColor(v.company_id)}15`, color: getCoColor(v.company_id) }}>{getCoName(v.company_id)}</span>
                  </td>
                  <td className="px-4 py-2.5 text-xs">{v.leave_type}</td>
                  <td className="px-4 py-2.5 text-xs" style={{ color: "rgba(242,240,232,0.4)" }}>{fmtDate(v.start_date)}</td>
                  <td className="px-4 py-2.5 text-xs" style={{ color: "rgba(242,240,232,0.4)" }}>{fmtDate(v.return_date)}</td>
                  <td className="px-4 py-2.5 text-xs">{v.days} dias</td>
                  <td className="px-4 py-2.5">{statusBadge(v.status)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {empModal.open && empModal.companyId && (
        <VaultEmployeeForm open companyId={empModal.companyId} employee={empModal.employee} onClose={() => { setEmpModal({ open: false }); qc.invalidateQueries({ queryKey: ["vault_employees_global"] }); }} />
      )}
      <VaultDeleteConfirm
        open={deleteModal.open}
        title="Excluir Colaborador?"
        description="Esta ação não pode ser desfeita."
        onConfirm={async () => {
          const { error } = await supabase.from("vault_employees").delete().eq("id", deleteModal.id);
          if (error) throw error;
          toast.success("Colaborador excluído");
          qc.invalidateQueries({ queryKey: ["vault_employees_global"] });
        }}
        onClose={() => setDeleteModal(d => ({ ...d, open: false }))}
      />
    </div>
  );
};

export default VaultGlobalHR;
