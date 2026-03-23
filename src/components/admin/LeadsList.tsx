import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Search, Mail, Phone, Building2, FileText, Calendar, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Lead {
  id: string;
  name: string;
  email: string;
  company: string;
  cnpj: string;
  phone: string | null;
  message: string | null;
  status: string;
  created_at: string;
}

export default function LeadsList() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchLeads = async () => {
    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setLeads(data as Lead[]);
    setLoading(false);
  };

  useEffect(() => { fetchLeads(); }, []);

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("leads").delete().eq("id", id);
    if (error) { toast.error("Erro ao excluir lead"); return; }
    setLeads((prev) => prev.filter((l) => l.id !== id));
    toast.success("Lead excluído");
  };

  const handleStatusChange = async (id: string, status: string) => {
    const { error } = await supabase.from("leads").update({ status }).eq("id", id);
    if (error) { toast.error("Erro ao atualizar status"); return; }
    setLeads((prev) => prev.map((l) => l.id === id ? { ...l, status } : l));
  };

  const filtered = leads.filter((l) => {
    const q = search.toLowerCase();
    return l.name.toLowerCase().includes(q) || l.email.toLowerCase().includes(q) || l.company.toLowerCase().includes(q) || l.cnpj.includes(q);
  });

  const statusColors: Record<string, string> = {
    novo: "bg-blue-500/20 text-blue-400",
    contatado: "bg-yellow-500/20 text-yellow-400",
    qualificado: "bg-green-500/20 text-green-400",
    perdido: "bg-red-500/20 text-red-400",
  };

  if (loading) return <p className="text-muted-foreground font-mono text-sm">Carregando...</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-mono text-xs tracking-[0.2em] text-primary font-semibold">LEADS</h2>
          <p className="font-mono text-[10px] text-muted-foreground mt-1">{leads.length} registros</p>
        </div>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar..."
            className="bg-transparent border border-border pl-9 pr-4 py-2 text-sm font-mono text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/50 transition-colors w-64"
          />
        </div>
      </div>

      <div className="border border-border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-card/30">
              {["Nome", "E-mail", "Empresa", "CNPJ", "Telefone", "Status", "Data", ""].map((h) => (
                <th key={h} className="text-left font-mono text-[10px] tracking-[0.15em] text-muted-foreground px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((lead, i) => (
              <motion.tr
                key={lead.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.03 }}
                className="border-b border-border/50 hover:bg-card/20 transition-colors"
              >
                <td className="px-4 py-3 font-mono text-sm text-foreground">{lead.name}</td>
                <td className="px-4 py-3">
                  <span className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
                    <Mail size={12} /> {lead.email}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
                    <Building2 size={12} /> {lead.company}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{lead.cnpj}</td>
                <td className="px-4 py-3">
                  {lead.phone ? (
                    <span className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
                      <Phone size={12} /> {lead.phone}
                    </span>
                  ) : <span className="text-muted-foreground/30 font-mono text-xs">—</span>}
                </td>
                <td className="px-4 py-3">
                  <select
                    value={lead.status}
                    onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                    className={`font-mono text-[10px] tracking-[0.1em] px-2 py-1 rounded-sm border-none cursor-pointer ${statusColors[lead.status] || "bg-muted text-muted-foreground"}`}
                  >
                    <option value="novo">NOVO</option>
                    <option value="contatado">CONTATADO</option>
                    <option value="qualificado">QUALIFICADO</option>
                    <option value="perdido">PERDIDO</option>
                  </select>
                </td>
                <td className="px-4 py-3">
                  <span className="flex items-center gap-1.5 font-mono text-[10px] text-muted-foreground">
                    <Calendar size={11} />
                    {new Date(lead.created_at).toLocaleDateString("pt-BR")}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => handleDelete(lead.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 size={14} />
                  </button>
                </td>
              </motion.tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center py-12 font-mono text-sm text-muted-foreground">
                  Nenhum lead encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
