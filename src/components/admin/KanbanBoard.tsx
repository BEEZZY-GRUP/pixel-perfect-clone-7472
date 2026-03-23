import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Building2, Mail, GripVertical } from "lucide-react";

interface Lead {
  id: string;
  name: string;
  email: string;
  company: string;
  cnpj: string;
  status: string;
  created_at: string;
}

const COLUMNS = [
  { key: "novo", label: "NOVOS", color: "border-blue-500/40" },
  { key: "contatado", label: "CONTATADOS", color: "border-yellow-500/40" },
  { key: "qualificado", label: "QUALIFICADOS", color: "border-green-500/40" },
  { key: "perdido", label: "PERDIDOS", color: "border-red-500/40" },
];

export default function KanbanBoard() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("leads").select("*").order("created_at", { ascending: false })
      .then(({ data }) => { if (data) setLeads(data as Lead[]); setLoading(false); });
  }, []);

  const moveCard = async (id: string, newStatus: string) => {
    const { error } = await supabase.from("leads").update({ status: newStatus }).eq("id", id);
    if (error) { toast.error("Erro ao mover card"); return; }
    setLeads((prev) => prev.map((l) => l.id === id ? { ...l, status: newStatus } : l));
  };

  if (loading) return <p className="text-muted-foreground font-mono text-sm">Carregando...</p>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-mono text-xs tracking-[0.2em] text-primary font-semibold">FUNIL DE VENDAS</h2>
        <p className="font-mono text-[10px] text-muted-foreground mt-1">Arraste os leads entre colunas</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {COLUMNS.map((col) => {
          const items = leads.filter((l) => l.status === col.key);
          return (
            <div key={col.key} className={`border-t-2 ${col.color} border border-border bg-card/10 p-4 min-h-[400px]`}>
              <div className="flex items-center justify-between mb-4">
                <p className="font-mono text-[10px] tracking-[0.15em] text-muted-foreground">{col.label}</p>
                <span className="font-mono text-[10px] text-primary bg-primary/10 px-2 py-0.5">{items.length}</span>
              </div>
              <div className="space-y-3">
                {items.map((lead, i) => (
                  <motion.div
                    key={lead.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="border border-border bg-card/30 p-3 group hover:border-primary/30 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <p className="font-mono text-sm text-foreground font-medium">{lead.name}</p>
                      <GripVertical size={12} className="text-muted-foreground/30" />
                    </div>
                    <p className="flex items-center gap-1.5 font-mono text-[10px] text-muted-foreground mb-1">
                      <Building2 size={10} /> {lead.company}
                    </p>
                    <p className="flex items-center gap-1.5 font-mono text-[10px] text-muted-foreground mb-3">
                      <Mail size={10} /> {lead.email}
                    </p>
                    <div className="flex gap-1">
                      {COLUMNS.filter((c) => c.key !== col.key).map((c) => (
                        <button
                          key={c.key}
                          onClick={() => moveCard(lead.id, c.key)}
                          className="font-mono text-[8px] tracking-[0.1em] px-2 py-1 border border-border text-muted-foreground hover:text-primary hover:border-primary/30 transition-colors"
                        >
                          → {c.label}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
