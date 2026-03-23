import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Building2, Mail, Phone, GripVertical, Eye, Trash2, Clock } from "lucide-react";
import { useLeads } from "./LeadsContext";
import { STATUS_OPTIONS, PRIORITY_OPTIONS, type Lead } from "./types";
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

  const priorityEmoji = (p: string | null) => PRIORITY_OPTIONS.find((o) => o.key === p)?.emoji || "🟡";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-mono text-xs tracking-[0.2em] text-primary font-semibold">FUNIL DE VENDAS</h2>
        <p className="font-mono text-[10px] text-muted-foreground mt-1">Arraste os cards entre colunas para mover leads no funil</p>
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
              className={`border ${isOver ? col.border + " bg-card/30" : "border-border bg-card/5"} transition-all min-h-[450px] flex flex-col`}
            >
              {/* Column header */}
              <div className={`border-b ${col.border} px-3 py-3 flex items-center justify-between`}>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${col.color}`} />
                  <p className="font-mono text-[9px] tracking-[0.12em] text-muted-foreground">{col.label}</p>
                </div>
                <span className={`font-mono text-[10px] font-bold ${col.text}`}>{items.length}</span>
              </div>

              {/* Cards */}
              <div className="p-2 space-y-2 flex-1">
                {items.map((lead) => (
                  <motion.div
                    key={lead.id}
                    layout
                    draggable
                    onDragStart={(e: any) => handleDragStart(e, lead.id)}
                    className={`border border-border bg-card/40 p-3 group hover:border-primary/30 transition-all cursor-grab active:cursor-grabbing ${
                      draggedId === lead.id ? "opacity-40" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <p className="font-mono text-xs text-foreground font-medium leading-tight truncate flex-1">{lead.name}</p>
                      <GripVertical size={10} className="text-muted-foreground/20 flex-shrink-0 mt-0.5" />
                    </div>
                    <p className="font-mono text-[9px] text-muted-foreground truncate flex items-center gap-1 mb-1">
                      <Building2 size={9} /> {lead.company}
                    </p>
                    {lead.phone && (
                      <p className="font-mono text-[9px] text-muted-foreground truncate flex items-center gap-1 mb-1">
                        <Phone size={9} /> {lead.phone}
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/50">
                      <span className="font-mono text-[8px] text-muted-foreground/50">
                        {priorityEmoji(lead.priority)} {new Date(lead.created_at).toLocaleDateString("pt-BR")}
                      </span>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setSelectedLead(lead)} className="p-1 text-muted-foreground hover:text-primary transition-colors">
                          <Eye size={11} />
                        </button>
                        <button onClick={() => deleteLead(lead.id)} className="p-1 text-muted-foreground hover:text-red-400 transition-colors">
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
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
