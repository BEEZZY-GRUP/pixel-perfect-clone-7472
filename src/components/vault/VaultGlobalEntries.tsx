import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Pencil, Trash2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useState } from "react";
import VaultEntryForm from "./VaultEntryForm";
import VaultDeleteConfirm from "./VaultDeleteConfirm";

const fmt = (v: number) => "R$ " + Math.round(v).toLocaleString("pt-BR");
const fmtDate = (s: string | null) => { if (!s) return "—"; const [y, m, d] = s.split("-"); return `${d}/${m}/${y}`; };

const statusBadge = (status: string) => {
  const colors: Record<string, string> = {
    pago: "bg-green-500/10 text-green-400", pendente: "bg-amber-500/10 text-amber-400",
    vencido: "bg-red-500/10 text-red-400", aprovado: "bg-green-500/10 text-green-400",
  };
  return <span className={`inline-flex text-[10px] font-medium px-2 py-0.5 rounded ${colors[status] ?? "bg-white/5 text-white/40"}`}>{status.charAt(0).toUpperCase() + status.slice(1)}</span>;
};

const VaultGlobalEntries = () => {
  const qc = useQueryClient();
  const [entryModal, setEntryModal] = useState<{ open: boolean; entry?: any; companyId?: string }>({ open: false });
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; id: string; label: string }>({ open: false, id: "", label: "" });
  const [filterCo, setFilterCo] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterType, setFilterType] = useState("");

  const { data: companies } = useQuery({
    queryKey: ["vault_companies"],
    queryFn: async () => { const { data } = await supabase.from("vault_companies").select("*").eq("active", true).order("name"); return data ?? []; },
  });

  const { data: entries } = useQuery({
    queryKey: ["vault_entries_global"],
    queryFn: async () => { const { data } = await supabase.from("vault_entries").select("*").order("created_at", { ascending: false }); return data ?? []; },
  });

  const filtered = entries?.filter((e: any) =>
    (!filterCo || e.company_id === filterCo) &&
    (!filterStatus || e.status === filterStatus) &&
    (!filterType || e.entry_type === filterType)
  ) ?? [];

  const totPend = filtered.filter((e: any) => e.status === "pendente").reduce((a: number, e: any) => a + Number(e.amount), 0);
  const totVenc = filtered.filter((e: any) => e.status === "vencido").reduce((a: number, e: any) => a + Number(e.amount), 0);
  const totPago = filtered.filter((e: any) => e.status === "pago").reduce((a: number, e: any) => a + Number(e.amount), 0);

  const getCoName = (id: string) => companies?.find((c: any) => c.id === id)?.name ?? "—";
  const getCoColor = (id: string) => companies?.find((c: any) => c.id === id)?.color ?? "#888";

  return (
    <div>
      <div className="mb-5">
        <h1 className="font-heading text-xl font-semibold tracking-tight">Lançamentos</h1>
        <p className="text-[11px]" style={{ color: "rgba(242,240,232,0.4)" }}>Despesas e faturamentos de todo o grupo</p>
      </div>

      <div className="rounded-xl border border-white/5 overflow-hidden" style={{ background: "#0e0e0a" }}>
        <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between flex-wrap gap-2">
          <span className="text-xs font-medium">Todos os Lançamentos</span>
          <div className="flex items-center gap-2 flex-wrap">
            <select value={filterCo} onChange={e => setFilterCo(e.target.value)} className="bg-white/5 border border-white/10 rounded-md px-2 py-1 text-[11px] text-[#F2F0E8] outline-none">
              <option value="" className="bg-[#111]">Todas empresas</option>
              {companies?.map((c: any) => <option key={c.id} value={c.id} className="bg-[#111]">{c.name}</option>)}
            </select>
            <select value={filterType} onChange={e => setFilterType(e.target.value)} className="bg-white/5 border border-white/10 rounded-md px-2 py-1 text-[11px] text-[#F2F0E8] outline-none">
              <option value="" className="bg-[#111]">Todos tipos</option>
              <option value="despesa" className="bg-[#111]">Despesa</option>
              <option value="faturamento" className="bg-[#111]">Faturamento</option>
            </select>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="bg-white/5 border border-white/10 rounded-md px-2 py-1 text-[11px] text-[#F2F0E8] outline-none">
              <option value="" className="bg-[#111]">Todos status</option>
              <option value="pendente" className="bg-[#111]">Pendente</option>
              <option value="pago" className="bg-[#111]">Pago</option>
              <option value="vencido" className="bg-[#111]">Vencido</option>
              <option value="aprovado" className="bg-[#111]">Aprovado</option>
            </select>
            <Button size="sm" onClick={() => setEntryModal({ open: true, companyId: filterCo || companies?.[0]?.id })} className="bg-[#FFD600] text-black hover:bg-[#E6C200] h-7 text-[11px] px-2.5">
              <Plus size={12} className="mr-1" /> Novo
            </Button>
          </div>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5">
              {["Empresa", "Descrição", "Tipo", "Categoria", "Valor", "Vencimento", "Status", "Ações"].map(h => (
                <th key={h} className="text-left px-4 py-2 text-[9px] uppercase tracking-widest font-medium" style={{ color: "rgba(242,240,232,0.25)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && <tr><td colSpan={8} className="text-center py-8 text-xs" style={{ color: "rgba(242,240,232,0.3)" }}>Nenhum lançamento</td></tr>}
            {filtered.map((e: any) => (
              <tr key={e.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                <td className="px-4 py-2.5">
                  <span className="inline-flex text-[10px] font-medium px-2 py-0.5 rounded" style={{ background: `${getCoColor(e.company_id)}15`, color: getCoColor(e.company_id) }}>{getCoName(e.company_id)}</span>
                </td>
                <td className="px-4 py-2.5 text-xs">{e.description}</td>
                <td className="px-4 py-2.5 text-xs capitalize" style={{ color: e.entry_type === "faturamento" ? "#22c55e" : "#ef4444" }}>{e.entry_type}</td>
                <td className="px-4 py-2.5 text-xs" style={{ color: "rgba(242,240,232,0.4)" }}>{e.category}</td>
                <td className="px-4 py-2.5 text-xs font-medium">{fmt(Number(e.amount))}</td>
                <td className="px-4 py-2.5 text-xs" style={{ color: "rgba(242,240,232,0.4)" }}>{fmtDate(e.due_date)}</td>
                <td className="px-4 py-2.5">{statusBadge(e.status)}</td>
                <td className="px-4 py-2.5">
                  <div className="flex gap-1">
                    <button onClick={() => setEntryModal({ open: true, entry: e, companyId: e.company_id })} className="p-1 rounded hover:bg-white/10"><Pencil size={12} style={{ color: "rgba(242,240,232,0.4)" }} /></button>
                    <button onClick={() => setDeleteModal({ open: true, id: e.id, label: "Lançamento" })} className="p-1 rounded hover:bg-red-500/20"><Trash2 size={12} className="text-red-400" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-4 py-2.5 border-t border-white/5 flex gap-4 text-[11px]" style={{ color: "rgba(242,240,232,0.4)" }}>
          <span>Pendente: <strong className="text-amber-400">{fmt(totPend)}</strong></span>
          <span>Vencido: <strong className="text-red-400">{fmt(totVenc)}</strong></span>
          <span>Pago: <strong className="text-green-400">{fmt(totPago)}</strong></span>
        </div>
      </div>

      {entryModal.open && entryModal.companyId && (
        <VaultEntryForm open companyId={entryModal.companyId} entry={entryModal.entry} onClose={() => { setEntryModal({ open: false }); qc.invalidateQueries({ queryKey: ["vault_entries_global"] }); }} />
      )}
      <VaultDeleteConfirm
        open={deleteModal.open}
        title="Excluir Lançamento?"
        description="Esta ação não pode ser desfeita."
        onConfirm={async () => {
          const { error } = await supabase.from("vault_entries").delete().eq("id", deleteModal.id);
          if (error) throw error;
          toast.success("Lançamento excluído");
          qc.invalidateQueries({ queryKey: ["vault_entries_global"] });
        }}
        onClose={() => setDeleteModal(d => ({ ...d, open: false }))}
      />
    </div>
  );
};

export default VaultGlobalEntries;
