import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Search, Mail, Phone, Building2, Calendar, Trash2, Eye, Plus, ArrowUpDown, Filter } from "lucide-react";
import { useLeads } from "./LeadsContext";
import { STATUS_OPTIONS, PRIORITY_OPTIONS, type Lead } from "./types";
import LeadDetailModal from "./LeadDetailModal";
import AddLeadModal from "./AddLeadModal";

export default function LeadsList() {
  const { leads, deleteLead } = useLeads();
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<"created_at" | "name" | "company" | "priority">("created_at");
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
      l.company.toLowerCase().includes(q) || l.cnpj.includes(q) || (l.phone && l.phone.includes(q))
    );
    if (statusFilter !== "all") result = result.filter((l) => l.status === statusFilter);
    if (priorityFilter !== "all") result = result.filter((l) => l.priority === priorityFilter);

    result.sort((a, b) => {
      let cmp = 0;
      if (sortField === "created_at") cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      else if (sortField === "name") cmp = a.name.localeCompare(b.name);
      else if (sortField === "company") cmp = a.company.localeCompare(b.company);
      else if (sortField === "priority") {
        const order = { urgent: 0, high: 1, medium: 2, low: 3 };
        cmp = (order[(a.priority || "medium") as keyof typeof order] ?? 2) - (order[(b.priority || "medium") as keyof typeof order] ?? 2);
      }
      return sortDir === "desc" ? -cmp : cmp;
    });
    return result;
  }, [leads, search, statusFilter, priorityFilter, sortField, sortDir]);

  const SortIcon = ({ field }: { field: typeof sortField }) => (
    <button onClick={() => toggleSort(field)} className="inline-flex ml-1 text-muted-foreground/40 hover:text-muted-foreground">
      <ArrowUpDown size={10} />
    </button>
  );

  const getStatusBadge = (status: string) => {
    const s = STATUS_OPTIONS.find((o) => o.key === status);
    if (!s) return null;
    return <span className={`font-mono text-[9px] tracking-[0.1em] px-2 py-1 ${s.lightBg} ${s.text}`}>{s.label}</span>;
  };

  const getPriorityBadge = (priority: string | null) => {
    const p = PRIORITY_OPTIONS.find((o) => o.key === (priority || "medium"));
    if (!p) return null;
    return <span className="font-mono text-[10px]">{p.emoji}</span>;
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-mono text-xs tracking-[0.2em] text-primary font-semibold">LEADS</h2>
          <p className="font-mono text-[10px] text-muted-foreground mt-1">
            {filtered.length} de {leads.length} registros
          </p>
        </div>
        <button
          onClick={() => setAddOpen(true)}
          className="flex items-center gap-2 font-mono text-[10px] tracking-[0.15em] px-4 py-2.5 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus size={13} /> NOVO LEAD
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome, e-mail, empresa, CNPJ..."
            className="w-full bg-transparent border border-border pl-9 pr-4 py-2 text-sm font-mono text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/50 transition-colors"
          />
        </div>
        <div className="flex items-center gap-1">
          <Filter size={12} className="text-muted-foreground" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-transparent border border-border px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:border-primary/50 transition-colors"
          >
            <option value="all">Todos status</option>
            {STATUS_OPTIONS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-transparent border border-border px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:border-primary/50 transition-colors"
          >
            <option value="all">Prioridade</option>
            {PRIORITY_OPTIONS.map((p) => <option key={p.key} value={p.key}>{p.emoji} {p.label}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="border border-border overflow-x-auto">
        <table className="w-full min-w-[900px]">
          <thead>
            <tr className="border-b border-border bg-card/30">
              <th className="text-left font-mono text-[10px] tracking-[0.12em] text-muted-foreground px-4 py-3">
                NOME <SortIcon field="name" />
              </th>
              <th className="text-left font-mono text-[10px] tracking-[0.12em] text-muted-foreground px-4 py-3">CONTATO</th>
              <th className="text-left font-mono text-[10px] tracking-[0.12em] text-muted-foreground px-4 py-3">
                EMPRESA <SortIcon field="company" />
              </th>
              <th className="text-left font-mono text-[10px] tracking-[0.12em] text-muted-foreground px-4 py-3">CNPJ</th>
              <th className="text-left font-mono text-[10px] tracking-[0.12em] text-muted-foreground px-4 py-3">STATUS</th>
              <th className="text-left font-mono text-[10px] tracking-[0.12em] text-muted-foreground px-4 py-3">
                <span className="flex items-center gap-1">PRI <SortIcon field="priority" /></span>
              </th>
              <th className="text-left font-mono text-[10px] tracking-[0.12em] text-muted-foreground px-4 py-3">
                DATA <SortIcon field="created_at" />
              </th>
              <th className="text-left font-mono text-[10px] tracking-[0.12em] text-muted-foreground px-4 py-3 w-24">AÇÕES</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((lead, i) => (
              <motion.tr
                key={lead.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.02 }}
                className="border-b border-border/50 hover:bg-card/20 transition-colors group"
              >
                <td className="px-4 py-3">
                  <button onClick={() => setSelectedLead(lead)} className="font-mono text-sm text-foreground hover:text-primary transition-colors text-left">
                    {lead.name}
                  </button>
                  {lead.source && lead.source !== "website" && (
                    <span className="ml-2 font-mono text-[8px] text-muted-foreground/50 border border-border/50 px-1.5 py-0.5">{lead.source}</span>
                  )}
                </td>
                <td className="px-4 py-3 space-y-1">
                  <p className="flex items-center gap-1.5 font-mono text-[10px] text-muted-foreground">
                    <Mail size={10} /> {lead.email}
                  </p>
                  {lead.phone && (
                    <p className="flex items-center gap-1.5 font-mono text-[10px] text-muted-foreground">
                      <Phone size={10} /> {lead.phone}
                    </p>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
                    <Building2 size={11} /> {lead.company}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono text-[10px] text-muted-foreground">{lead.cnpj}</td>
                <td className="px-4 py-3">{getStatusBadge(lead.status)}</td>
                <td className="px-4 py-3">{getPriorityBadge(lead.priority)}</td>
                <td className="px-4 py-3">
                  <span className="flex items-center gap-1.5 font-mono text-[10px] text-muted-foreground">
                    <Calendar size={10} />
                    {new Date(lead.created_at).toLocaleDateString("pt-BR")}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button onClick={() => setSelectedLead(lead)} className="p-1.5 text-muted-foreground hover:text-primary transition-colors">
                      <Eye size={13} />
                    </button>
                    <button onClick={() => deleteLead(lead.id)} className="p-1.5 text-muted-foreground hover:text-red-400 transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </td>
              </motion.tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center py-16 font-mono text-sm text-muted-foreground">
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
