import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Search, Mail, Phone, Building2, Calendar, Trash2, Eye, Plus, ArrowUpDown, Filter, Tag, MessageSquare, Clock } from "lucide-react";
import { useLeads } from "./LeadsContext";
import { STATUS_OPTIONS, PRIORITY_OPTIONS, SOURCE_OPTIONS, type Lead } from "./types";
import LeadDetailModal from "./LeadDetailModal";
import AddLeadModal from "./AddLeadModal";

export default function LeadsList({ consoleRole = "admin" }: { consoleRole?: string }) {
  const { leads, deleteLead } = useLeads();
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<"created_at" | "name" | "company" | "priority" | "status">("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) setSortDir((d) => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("desc"); }
  };

  const filtered = useMemo(() => {
    let result = [...leads];
    const q = search.toLowerCase();
    if (q) result = result.filter((l) =>
      l.name.toLowerCase().includes(q) || l.email.toLowerCase().includes(q) ||
      l.company.toLowerCase().includes(q) || l.cnpj.includes(q) || (l.phone && l.phone.includes(q)) ||
      (l.tags && l.tags.some(t => t.toLowerCase().includes(q)))
    );
    if (statusFilter !== "all") result = result.filter((l) => l.status === statusFilter);
    if (priorityFilter !== "all") result = result.filter((l) => l.priority === priorityFilter);
    if (sourceFilter !== "all") result = result.filter((l) => l.source === sourceFilter);

    result.sort((a, b) => {
      let cmp = 0;
      if (sortField === "created_at") cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      else if (sortField === "name") cmp = a.name.localeCompare(b.name);
      else if (sortField === "company") cmp = a.company.localeCompare(b.company);
      else if (sortField === "status") {
        const order = STATUS_OPTIONS.map(s => s.key as string);
        cmp = order.indexOf(a.status) - order.indexOf(b.status);
      }
      else if (sortField === "priority") {
        const order = { urgent: 0, high: 1, medium: 2, low: 3 };
        cmp = (order[(a.priority || "medium") as keyof typeof order] ?? 2) - (order[(b.priority || "medium") as keyof typeof order] ?? 2);
      }
      return sortDir === "desc" ? -cmp : cmp;
    });
    return result;
  }, [leads, search, statusFilter, priorityFilter, sourceFilter, sortField, sortDir]);

  const SortIcon = ({ field }: { field: typeof sortField }) => (
    <button onClick={() => toggleSort(field)} className={`inline-flex ml-1 transition-colors ${sortField === field ? 'text-gold' : 'text-muted-foreground/30 hover:text-muted-foreground/60'}`}>
      <ArrowUpDown size={10} />
    </button>
  );

  const getStatusBadge = (status: string) => {
    const s = STATUS_OPTIONS.find((o) => o.key === status);
    if (!s) return null;
    return <span className={`font-heading text-[9px] tracking-[0.1em] px-2.5 py-1 rounded ${s.lightBg} ${s.text} font-semibold`}>{s.label}</span>;
  };

  const getPriorityBadge = (priority: string | null) => {
    const p = PRIORITY_OPTIONS.find((o) => o.key === (priority || "medium"));
    if (!p) return null;
    return (
      <span className="flex items-center gap-1">
        <span className="text-[10px]">{p.emoji}</span>
        <span className="font-heading text-[9px] text-muted-foreground/60">{p.label}</span>
      </span>
    );
  };

  const daysSince = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return "Hoje";
    if (days === 1) return "Ontem";
    return `${days}d atrás`;
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="section-eyebrow">Leads</p>
          <h2 className="font-heading text-foreground text-xl font-light tracking-tight">
            {filtered.length} de {leads.length} registros
          </h2>
        </div>
        <button
          onClick={() => setAddOpen(true)}
          className="flex items-center gap-2 font-heading text-[10px] tracking-[0.15em] px-4 py-2.5 bg-gold/90 text-background hover:bg-gold transition-all rounded-lg font-bold shadow-[0_0_20px_hsl(var(--gold)/0.15)]"
        >
          <Plus size={13} /> NOVO LEAD
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/40" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome, e-mail, empresa, CNPJ, tags..."
            className="w-full bg-card/20 border border-border/40 rounded-lg pl-9 pr-4 py-2.5 text-sm font-heading text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-gold-border transition-colors"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={12} className="text-muted-foreground/40" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-card/20 border border-border/40 rounded-lg px-3 py-2.5 text-xs font-heading text-foreground focus:outline-none focus:border-gold-border transition-colors appearance-none cursor-pointer"
          >
            <option value="all">Todos status</option>
            {STATUS_OPTIONS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-card/20 border border-border/40 rounded-lg px-3 py-2.5 text-xs font-heading text-foreground focus:outline-none focus:border-gold-border transition-colors appearance-none cursor-pointer"
          >
            <option value="all">Prioridade</option>
            {PRIORITY_OPTIONS.map((p) => <option key={p.key} value={p.key}>{p.emoji} {p.label}</option>)}
          </select>
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="bg-card/20 border border-border/40 rounded-lg px-3 py-2.5 text-xs font-heading text-foreground focus:outline-none focus:border-gold-border transition-colors appearance-none cursor-pointer"
          >
            <option value="all">Origem</option>
            {SOURCE_OPTIONS.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="border border-border/40 rounded-lg overflow-x-auto">
        <table className="w-full min-w-[1100px]">
          <thead>
            <tr className="border-b border-border/40 bg-card/10">
              <th className="text-left font-heading text-[9px] tracking-[0.15em] text-muted-foreground/60 px-4 py-3 font-semibold">
                NOME <SortIcon field="name" />
              </th>
              <th className="text-left font-heading text-[9px] tracking-[0.15em] text-muted-foreground/60 px-4 py-3 font-semibold">CONTATO</th>
              <th className="text-left font-heading text-[9px] tracking-[0.15em] text-muted-foreground/60 px-4 py-3 font-semibold">
                EMPRESA <SortIcon field="company" />
              </th>
              <th className="text-left font-heading text-[9px] tracking-[0.15em] text-muted-foreground/60 px-4 py-3 font-semibold">CNPJ</th>
              <th className="text-left font-heading text-[9px] tracking-[0.15em] text-muted-foreground/60 px-4 py-3 font-semibold">
                STATUS <SortIcon field="status" />
              </th>
              <th className="text-left font-heading text-[9px] tracking-[0.15em] text-muted-foreground/60 px-4 py-3 font-semibold">
                PRI <SortIcon field="priority" />
              </th>
              <th className="text-left font-heading text-[9px] tracking-[0.15em] text-muted-foreground/60 px-4 py-3 font-semibold">ORIGEM</th>
              <th className="text-left font-heading text-[9px] tracking-[0.15em] text-muted-foreground/60 px-4 py-3 font-semibold">DESAFIO</th>
              <th className="text-left font-heading text-[9px] tracking-[0.15em] text-muted-foreground/60 px-4 py-3 font-semibold">
                DATA <SortIcon field="created_at" />
              </th>
              <th className="text-left font-heading text-[9px] tracking-[0.15em] text-muted-foreground/60 px-4 py-3 font-semibold w-20">AÇÕES</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((lead, i) => (
              <motion.tr
                key={lead.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.015 }}
                className="border-b border-border/30 hover:bg-card/15 transition-colors group"
              >
                <td className="px-4 py-3">
                  <button onClick={() => setSelectedLead(lead)} className="text-left">
                    <p className="font-heading text-sm text-foreground hover:text-gold transition-colors font-medium">{lead.name}</p>
                    {lead.tags && lead.tags.length > 0 && (
                      <div className="flex gap-1 mt-1">
                        {lead.tags.slice(0, 2).map((tag) => (
                          <span key={tag} className="font-heading text-[7px] text-gold/50 bg-gold-dim px-1.5 py-0.5 rounded">
                            {tag}
                          </span>
                        ))}
                        {lead.tags.length > 2 && (
                          <span className="font-heading text-[7px] text-muted-foreground/40">+{lead.tags.length - 2}</span>
                        )}
                      </div>
                    )}
                  </button>
                </td>
                <td className="px-4 py-3 space-y-0.5">
                  <p className="flex items-center gap-1.5 font-heading text-[10px] text-muted-foreground/60">
                    <Mail size={9} className="shrink-0" /> {lead.email}
                  </p>
                  {lead.phone && (
                    <p className="flex items-center gap-1.5 font-heading text-[10px] text-muted-foreground/50">
                      <Phone size={9} className="shrink-0" /> {lead.phone}
                    </p>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className="flex items-center gap-1.5 font-heading text-xs text-muted-foreground/70">
                    <Building2 size={10} className="shrink-0" /> {lead.company}
                  </span>
                </td>
                <td className="px-4 py-3 font-heading text-[10px] text-muted-foreground/50 font-mono">{lead.cnpj}</td>
                <td className="px-4 py-3">{getStatusBadge(lead.status)}</td>
                <td className="px-4 py-3">{getPriorityBadge(lead.priority)}</td>
                <td className="px-4 py-3">
                  <span className="font-heading text-[10px] text-muted-foreground/50 capitalize">{lead.source || "website"}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="font-heading text-[10px] text-muted-foreground/50 truncate block max-w-[120px]">
                    {lead.challenge || "—"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="space-y-0.5">
                    <span className="flex items-center gap-1 font-heading text-[10px] text-muted-foreground/60">
                      <Calendar size={9} />
                      {new Date(lead.created_at).toLocaleDateString("pt-BR")}
                    </span>
                    <span className="font-heading text-[8px] text-muted-foreground/35">{daysSince(lead.created_at)}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-0.5">
                    <button onClick={() => setSelectedLead(lead)} className="p-1.5 text-muted-foreground/40 hover:text-gold transition-colors rounded">
                      <Eye size={13} />
                    </button>
                    <button onClick={() => deleteLead(lead.id)} className="p-1.5 text-muted-foreground/40 hover:text-red-400 transition-colors rounded">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </td>
              </motion.tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={10} className="text-center py-16 font-heading text-sm text-muted-foreground/40">
                  Nenhum lead encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selectedLead && <LeadDetailModal lead={selectedLead} onClose={() => setSelectedLead(null)} />}
      <AddLeadModal open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  );
}
