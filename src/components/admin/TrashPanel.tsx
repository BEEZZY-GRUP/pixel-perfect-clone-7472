import { useState } from "react";
import { motion } from "framer-motion";
import { Trash2, RotateCcw, AlertTriangle, Search } from "lucide-react";
import { useLeads } from "./LeadsContext";

export default function TrashPanel({ consoleRole = "admin" }: { consoleRole?: string }) {
  const { archivedLeads, restoreLead, permanentDelete } = useLeads();
  const [search, setSearch] = useState("");
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const filtered = archivedLeads.filter((l) => {
    const q = search.toLowerCase();
    return l.name.toLowerCase().includes(q) || l.email.toLowerCase().includes(q) || l.company.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-mono text-xs tracking-[0.2em] text-primary font-semibold flex items-center gap-2">
            <Trash2 size={14} /> LIXEIRA
          </h2>
          <p className="font-mono text-[10px] text-muted-foreground mt-1">{archivedLeads.length} leads arquivados</p>
        </div>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar..."
            className="bg-transparent border border-border pl-9 pr-4 py-2 text-sm font-mono text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/50 transition-colors w-56"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="border border-border bg-card/10 p-12 flex flex-col items-center gap-3">
          <Trash2 size={32} className="text-muted-foreground/20" />
          <p className="font-mono text-sm text-muted-foreground">Lixeira vazia</p>
        </div>
      ) : (
        <div className="border border-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-card/30">
                {["Nome", "Empresa", "E-mail", "Status anterior", "Arquivado em", "Ações"].map((h) => (
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
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{lead.company}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{lead.email}</td>
                  <td className="px-4 py-3 font-mono text-[10px] text-muted-foreground uppercase">{lead.status}</td>
                  <td className="px-4 py-3 font-mono text-[10px] text-muted-foreground">
                    {lead.archived_at ? new Date(lead.archived_at).toLocaleDateString("pt-BR") : "-"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => restoreLead(lead.id)}
                        className="flex items-center gap-1 font-mono text-[9px] tracking-[0.1em] text-emerald-400 hover:text-emerald-300 transition-colors px-2 py-1 border border-emerald-500/20 hover:border-emerald-500/40"
                      >
                        <RotateCcw size={10} /> RESTAURAR
                      </button>
                      {confirmId === lead.id ? (
                        <div className="flex items-center gap-1">
                          {consoleRole === "admin" && (
                            <button
                              onClick={() => { permanentDelete(lead.id); setConfirmId(null); }}
                              className="font-mono text-[9px] text-red-400 hover:text-red-300 px-2 py-1 border border-red-500/30 hover:border-red-500/50 transition-colors"
                            >
                              CONFIRMAR
                            </button>
                          )}
                          <button onClick={() => setConfirmId(null)} className="font-mono text-[9px] text-muted-foreground px-2 py-1">
                            CANCELAR
                          </button>
                        </div>
                      ) : (
                        consoleRole === "admin" && (
                          <button
                            onClick={() => setConfirmId(lead.id)}
                            className="flex items-center gap-1 font-mono text-[9px] tracking-[0.1em] text-red-400/60 hover:text-red-400 transition-colors px-2 py-1 border border-red-500/10 hover:border-red-500/30"
                          >
                            <AlertTriangle size={10} /> EXCLUIR
                          </button>
                        )
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
