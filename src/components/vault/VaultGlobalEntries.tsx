import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";

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
  const [activeTab, setActiveTab] = useState(0);
  const [filterCo, setFilterCo] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterCat, setFilterCat] = useState("");

  const { data: companies } = useQuery({
    queryKey: ["vault_companies"],
    queryFn: async () => { const { data } = await supabase.from("vault_companies").select("*").eq("active", true).order("name"); return data ?? []; },
  });

  const { data: entries } = useQuery({
    queryKey: ["vault_entries_global"],
    queryFn: async () => { const { data } = await supabase.from("vault_entries").select("*").order("created_at", { ascending: false }); return data ?? []; },
  });

  const despesas = entries?.filter((e: any) => e.entry_type === "despesa" && (!filterCo || e.company_id === filterCo) && (!filterStatus || e.status === filterStatus) && (!filterCat || e.category === filterCat)) ?? [];
  const faturamentos = entries?.filter((e: any) => e.entry_type === "faturamento" && (!filterCo || e.company_id === filterCo) && (!filterStatus || e.status === filterStatus)) ?? [];

  const totPend = despesas.filter((e: any) => e.status === "pendente").reduce((a: number, e: any) => a + Number(e.amount), 0);
  const totVenc = despesas.filter((e: any) => e.status === "vencido").reduce((a: number, e: any) => a + Number(e.amount), 0);
  const totPago = despesas.filter((e: any) => e.status === "pago").reduce((a: number, e: any) => a + Number(e.amount), 0);
  const totFat = faturamentos.reduce((a: number, e: any) => a + Number(e.amount), 0);

  const getCoName = (id: string) => companies?.find((c: any) => c.id === id)?.name ?? "—";
  const getCoColor = (id: string) => companies?.find((c: any) => c.id === id)?.color ?? "#888";
  const getAliq = (id: string) => Number(companies?.find((c: any) => c.id === id)?.aliquota ?? 0);

  const tabs = ["Contas a Pagar", "Faturamentos"];

  return (
    <div>
      <div className="mb-5">
        <h1 className="font-heading text-xl font-semibold tracking-tight">Lançamentos</h1>
        <p className="text-[11px]" style={{ color: "rgba(242,240,232,0.4)" }}>Centro de informações — despesas e faturamentos de todo o grupo</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mb-5">
        {[
          { label: "Total Pendente", value: fmt(totPend), cls: "text-amber-400" },
          { label: "Total Vencido", value: fmt(totVenc), cls: "text-red-400" },
          { label: "Total Pago", value: fmt(totPago), cls: "text-green-400" },
          { label: "Total Faturado", value: fmt(totFat), cls: "bg-gradient-to-r from-[#FFD600] to-[#E6C200] bg-clip-text text-transparent" },
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

      {/* Tab 0: Contas a Pagar */}
      {activeTab === 0 && (
        <div className="rounded-xl border border-white/5 overflow-hidden" style={{ background: "#0e0e0a" }}>
          <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between flex-wrap gap-2">
            <span className="text-xs font-medium">Contas a Pagar — Todas as Empresas</span>
            <div className="flex items-center gap-2 flex-wrap">
              <select value={filterCo} onChange={e => setFilterCo(e.target.value)} className="bg-white/5 border border-white/10 rounded-md px-2 py-1 text-[11px] text-[#F2F0E8] outline-none">
                <option value="" className="bg-[#111]">Todas empresas</option>
                {companies?.map((c: any) => <option key={c.id} value={c.id} className="bg-[#111]">{c.name}</option>)}
              </select>
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="bg-white/5 border border-white/10 rounded-md px-2 py-1 text-[11px] text-[#F2F0E8] outline-none">
                <option value="" className="bg-[#111]">Todos status</option>
                <option value="pendente" className="bg-[#111]">Pendente</option>
                <option value="pago" className="bg-[#111]">Pago</option>
                <option value="vencido" className="bg-[#111]">Vencido</option>
              </select>
              <select value={filterCat} onChange={e => setFilterCat(e.target.value)} className="bg-white/5 border border-white/10 rounded-md px-2 py-1 text-[11px] text-[#F2F0E8] outline-none">
                <option value="" className="bg-[#111]">Todas categorias</option>
                {["Marketing", "Folha", "Infraestrutura", "Serviços", "Fornecedores", "Aluguel", "Software", "Impostos"].map(c => <option key={c} className="bg-[#111]">{c}</option>)}
              </select>
            </div>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                {["Empresa", "Descrição", "Categoria", "Valor", "Vencimento", "Pagamento", "Método", "Status"].map(h => (
                  <th key={h} className="text-left px-4 py-2 text-[9px] uppercase tracking-widest font-medium" style={{ color: "rgba(242,240,232,0.25)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {despesas.length === 0 && <tr><td colSpan={8} className="text-center py-8 text-xs" style={{ color: "rgba(242,240,232,0.3)" }}>Nenhum lançamento</td></tr>}
              {despesas.map((e: any) => (
                <tr key={e.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                  <td className="px-4 py-2.5"><span className="inline-flex text-[10px] font-medium px-2 py-0.5 rounded" style={{ background: `${getCoColor(e.company_id)}15`, color: getCoColor(e.company_id) }}>{getCoName(e.company_id)}</span></td>
                  <td className="px-4 py-2.5 text-xs">{e.description}</td>
                  <td className="px-4 py-2.5 text-xs" style={{ color: "rgba(242,240,232,0.4)" }}>{e.category}</td>
                  <td className="px-4 py-2.5 text-xs font-medium">{fmt(Number(e.amount))}</td>
                  <td className="px-4 py-2.5 text-xs" style={{ color: "rgba(242,240,232,0.4)" }}>{fmtDate(e.due_date)}</td>
                  <td className="px-4 py-2.5 text-xs" style={{ color: "rgba(242,240,232,0.4)" }}>{fmtDate(e.payment_date)}</td>
                  <td className="px-4 py-2.5 text-xs" style={{ color: "rgba(242,240,232,0.4)" }}>{e.payment_method || "—"}</td>
                  <td className="px-4 py-2.5">{statusBadge(e.status)}</td>
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
      )}

      {/* Tab 1: Faturamentos */}
      {activeTab === 1 && (
        <div className="rounded-xl border border-white/5 overflow-hidden" style={{ background: "#0e0e0a" }}>
          <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between flex-wrap gap-2">
            <span className="text-xs font-medium">Faturamentos — Todas as Empresas</span>
            <div className="flex items-center gap-2">
              <select value={filterCo} onChange={e => setFilterCo(e.target.value)} className="bg-white/5 border border-white/10 rounded-md px-2 py-1 text-[11px] text-[#F2F0E8] outline-none">
                <option value="" className="bg-[#111]">Todas empresas</option>
                {companies?.map((c: any) => <option key={c.id} value={c.id} className="bg-[#111]">{c.name}</option>)}
              </select>
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="bg-white/5 border border-white/10 rounded-md px-2 py-1 text-[11px] text-[#F2F0E8] outline-none">
                <option value="" className="bg-[#111]">Todos status</option>
                <option value="pendente" className="bg-[#111]">Pendente</option>
                <option value="pago" className="bg-[#111]">Recebido</option>
              </select>
            </div>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                {["Empresa", "Descrição", "Categoria", "Val. Bruto", "Imposto", "Val. Líquido", "Data", "Forma", "Qtd", "Status"].map(h => (
                  <th key={h} className="text-left px-4 py-2 text-[9px] uppercase tracking-widest font-medium" style={{ color: "rgba(242,240,232,0.25)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {faturamentos.length === 0 && <tr><td colSpan={10} className="text-center py-8 text-xs" style={{ color: "rgba(242,240,232,0.3)" }}>Nenhum faturamento</td></tr>}
              {faturamentos.map((e: any) => {
                const aliq = getAliq(e.company_id);
                const imp = Math.round(Number(e.amount) * (aliq / 100));
                return (
                  <tr key={e.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                    <td className="px-4 py-2.5"><span className="inline-flex text-[10px] font-medium px-2 py-0.5 rounded" style={{ background: `${getCoColor(e.company_id)}15`, color: getCoColor(e.company_id) }}>{getCoName(e.company_id)}</span></td>
                    <td className="px-4 py-2.5 text-xs">{e.description}</td>
                    <td className="px-4 py-2.5 text-xs" style={{ color: "rgba(242,240,232,0.4)" }}>{e.category}</td>
                    <td className="px-4 py-2.5 text-xs font-medium">{fmt(Number(e.amount))}</td>
                    <td className="px-4 py-2.5 text-xs text-red-400">{fmt(imp)}</td>
                    <td className="px-4 py-2.5 text-xs text-green-400">{fmt(Number(e.amount) - imp)}</td>
                    <td className="px-4 py-2.5 text-xs" style={{ color: "rgba(242,240,232,0.4)" }}>{fmtDate(e.entry_date)}</td>
                    <td className="px-4 py-2.5 text-xs" style={{ color: "rgba(242,240,232,0.4)" }}>{e.payment_method || "—"}</td>
                    <td className="px-4 py-2.5 text-xs">{e.quantity || "—"}</td>
                    <td className="px-4 py-2.5">{statusBadge(e.status)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="px-4 py-2.5 border-t border-white/5 text-[11px]" style={{ color: "rgba(242,240,232,0.4)" }}>
            Total Bruto: <strong className="text-[#FFD600]">{fmt(totFat)}</strong>
          </div>
        </div>
      )}
    </div>
  );
};

export default VaultGlobalEntries;
