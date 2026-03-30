import { useState } from "react";
import { motion } from "framer-motion";
import { Building2, Phone, GripVertical, Eye, Trash2, Mail, Calendar, Tag, Users } from "lucide-react";
import { useLeads } from "./LeadsContext";
import { STATUS_OPTIONS, PRIORITY_OPTIONS, type Lead } from "./types";
import { supabase } from "@/integrations/supabase/client";
import LeadDetailModal from "./LeadDetailModal";

export default function KanbanBoard() {
  const { leads, updateLead, deleteLead } = useLeads();
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, colKey: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverCol(colKey);
  };

  const handleDragLeave = () => setDragOverCol(null);

  const handleDrop = async (e: React.DragEvent, colKey: string) => {
    e.preventDefault();
    setDragOverCol(null);
    if (draggedId) {
      await updateLead(draggedId, { status: colKey });
      setDraggedId(null);
    }
  };

  const priorityInfo = (p: string | null) => PRIORITY_OPTIONS.find((o) => o.key === (p || "medium"));
  const totalLeads = leads.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="section-eyebrow">Funil de Vendas</p>
          <h2 className="font-heading text-foreground text-xl font-light tracking-tight">
            Pipeline comercial
          </h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-card/20 border border-border/30">
            <Users size={12} className="text-gold/70" />
            <span className="font-heading text-[10px] text-muted-foreground">{totalLeads} leads ativos</span>
          </div>
        </div>
      </div>

      {/* Pipeline summary bar */}
      <div className="flex h-2 rounded-full overflow-hidden bg-secondary/20">
        {STATUS_OPTIONS.map((col) => {
          const count = leads.filter((l) => l.status === col.key).length;
          const pct = totalLeads > 0 ? (count / totalLeads) * 100 : 0;
          return pct > 0 ? (
            <motion.div
              key={col.key}
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.6 }}
              className={`${col.color}/60 first:rounded-l-full last:rounded-r-full`}
              title={`${col.label}: ${count} (${pct.toFixed(0)}%)`}
            />
          ) : null;
        })}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {STATUS_OPTIONS.map((col) => {
          const items = leads.filter((l) => l.status === col.key);
          const isOver = dragOverCol === col.key;
          return (
            <div
              key={col.key}
              onDragOver={(e) => handleDragOver(e, col.key)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, col.key)}
              className={`rounded-lg border transition-all min-h-[480px] flex flex-col ${
                isOver 
                  ? `${col.border} bg-gold-dim/30 shadow-[0_0_20px_hsl(var(--gold)/0.1)]` 
                  : "border-border/40 bg-card/5"
              }`}
            >
              {/* Column header */}
              <div className={`border-b ${col.border}/50 px-3 py-3 flex items-center justify-between rounded-t-lg`}>
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${col.color} shadow-[0_0_6px] ${col.color}/50`} />
                  <p className="font-heading text-[9px] tracking-[0.12em] text-muted-foreground/80 font-semibold">{col.label}</p>
                </div>
                <span className={`font-heading text-xs font-bold ${col.text} bg-background/40 rounded-full w-6 h-6 flex items-center justify-center`}>
                  {items.length}
                </span>
              </div>

              {/* Cards */}
              <div className="p-2 space-y-2 flex-1 overflow-y-auto scrollbar-thin">
                {items.map((lead) => {
                  const pri = priorityInfo(lead.priority);
                  return (
                    <motion.div
                      key={lead.id}
                      layout
                      draggable
                      onDragStart={(e: any) => handleDragStart(e, lead.id)}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`rounded-lg border border-border/40 bg-card/30 backdrop-blur-sm p-3 group hover:border-gold-border/50 hover:bg-card/50 transition-all cursor-grab active:cursor-grabbing ${
                        draggedId === lead.id ? "opacity-30 scale-95" : ""
                      }`}
                    >
                      {/* Drag handle + Name */}
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-heading text-xs text-foreground font-semibold leading-tight truncate">{lead.name}</p>
                        </div>
                        <GripVertical size={10} className="text-muted-foreground/15 flex-shrink-0 mt-0.5 group-hover:text-muted-foreground/40 transition-colors" />
                      </div>

                      {/* Company */}
                      <p className="font-heading text-[9px] text-muted-foreground/70 truncate flex items-center gap-1.5 mb-1">
                        <Building2 size={9} className="shrink-0" /> {lead.company}
                      </p>

                      {/* Contact info */}
                      {lead.phone && (
                        <p className="font-heading text-[9px] text-muted-foreground/50 truncate flex items-center gap-1.5 mb-1">
                          <Phone size={9} className="shrink-0" /> {lead.phone}
                        </p>
                      )}
                      {lead.email && (
                        <p className="font-heading text-[8px] text-muted-foreground/40 truncate flex items-center gap-1.5 mb-1">
                          <Mail size={8} className="shrink-0" /> {lead.email}
                        </p>
                      )}

                      {/* Tags */}
                      {lead.tags && lead.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {lead.tags.slice(0, 2).map((tag) => (
                            <span key={tag} className="font-heading text-[7px] text-gold/60 bg-gold-dim px-1.5 py-0.5 rounded">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Footer */}
                      <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-border/30">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px]">{pri?.emoji}</span>
                          <span className="font-heading text-[8px] text-muted-foreground/40">
                            {new Date(lead.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
                          </span>
                        </div>
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => setSelectedLead(lead)} className="p-1 text-muted-foreground/50 hover:text-gold transition-colors rounded">
                            <Eye size={11} />
                          </button>
                          <button onClick={() => deleteLead(lead.id)} className="p-1 text-muted-foreground/50 hover:text-red-400 transition-colors rounded">
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
                {items.length === 0 && (
                  <div className="flex items-center justify-center h-20">
                    <p className="font-heading text-[9px] text-muted-foreground/30">Vazio</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {selectedLead && (
        <LeadDetailModal lead={selectedLead} onClose={() => setSelectedLead(null)} />
      )}
    </div>
  );
}
