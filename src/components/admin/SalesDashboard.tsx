import { useMemo } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Users, Target, AlertCircle, Zap, Clock } from "lucide-react";
import { useLeads } from "./LeadsContext";
import { STATUS_OPTIONS } from "./types";

export default function SalesDashboard() {
  const { leads, archivedLeads } = useLeads();

  const stats = useMemo(() => {
    const total = leads.length;
    const byStatus = Object.fromEntries(STATUS_OPTIONS.map((s) => [s.key, leads.filter((l) => l.status === s.key).length]));
    const conversionRate = total > 0 ? ((byStatus.fechado || 0) / total * 100).toFixed(1) : "0";
    const lossRate = total > 0 ? ((byStatus.perdido || 0) / total * 100).toFixed(1) : "0";

    const now = Date.now();
    const last7 = leads.filter((l) => now - new Date(l.created_at).getTime() < 7 * 86400000).length;
    const prev7 = leads.filter((l) => {
      const age = now - new Date(l.created_at).getTime();
      return age >= 7 * 86400000 && age < 14 * 86400000;
    }).length;
    const growth = prev7 > 0 ? (((last7 - prev7) / prev7) * 100).toFixed(0) : last7 > 0 ? "100" : "0";

    const byPriority = {
      urgent: leads.filter((l) => l.priority === "urgent").length,
      high: leads.filter((l) => l.priority === "high").length,
      medium: leads.filter((l) => l.priority === "medium" || !l.priority).length,
      low: leads.filter((l) => l.priority === "low").length,
    };

    const sources: Record<string, number> = {};
    leads.forEach((l) => { const s = l.source || "website"; sources[s] = (sources[s] || 0) + 1; });

    const daily = Array.from({ length: 14 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (13 - i));
      const dateStr = d.toISOString().split("T")[0];
      return {
        label: d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
        count: leads.filter((l) => l.created_at.startsWith(dateStr)).length,
      };
    });

    return { total, byStatus, conversionRate, lossRate, last7, growth, byPriority, sources, daily };
  }, [leads]);

  const maxDaily = Math.max(...stats.daily.map((d) => d.count), 1);

  const kpiCards = [
    { label: "TOTAL LEADS", value: stats.total, icon: Users, accent: "from-gold/20 to-gold/5", iconColor: "text-gold", sub: `+${stats.last7} esta semana` },
    { label: "EM NEGOCIAÇÃO", value: stats.byStatus.negociacao || 0, icon: Zap, accent: "from-purple-500/15 to-purple-500/5", iconColor: "text-purple-400", sub: "leads ativos" },
    { label: "FECHADOS", value: stats.byStatus.fechado || 0, icon: Target, accent: "from-green-500/15 to-green-500/5", iconColor: "text-green-400", sub: `${stats.conversionRate}% conversão` },
    { label: "PERDIDOS", value: stats.byStatus.perdido || 0, icon: AlertCircle, accent: "from-red-500/15 to-red-500/5", iconColor: "text-red-400", sub: `${stats.lossRate}% perda` },
    { label: "NOVOS 7D", value: stats.last7, icon: TrendingUp, accent: "from-blue-500/15 to-blue-500/5", iconColor: "text-blue-400", sub: `${Number(stats.growth) >= 0 ? "+" : ""}${stats.growth}% vs anterior` },
    { label: "LIXEIRA", value: archivedLeads.length, icon: Clock, accent: "from-muted/30 to-muted/10", iconColor: "text-muted-foreground", sub: "arquivados" },
  ];

  return (
    <div className="space-y-8">
      {/* Section header */}
      <div>
        <p className="section-eyebrow">Dashboard</p>
        <h2 className="font-heading text-foreground text-xl font-light tracking-tight">
          Visão geral do pipeline
        </h2>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {kpiCards.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <motion.div
              key={kpi.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.4 }}
              className={`relative overflow-hidden rounded-lg border border-border/50 bg-gradient-to-br ${kpi.accent} p-4 backdrop-blur-sm`}
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 rounded-md bg-background/40">
                  <Icon size={13} className={kpi.iconColor} />
                </div>
                <p className="font-heading text-[8px] tracking-[0.18em] text-muted-foreground/70 font-semibold">{kpi.label}</p>
              </div>
              <p className={`font-heading text-2xl font-bold ${kpi.iconColor}`}>{kpi.value}</p>
              <p className="font-heading text-[9px] text-muted-foreground/50 mt-1.5">{kpi.sub}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Funnel + Chart row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Funnel */}
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="rounded-lg border border-border/50 bg-card/10 backdrop-blur-sm p-6"
        >
          <p className="font-heading text-[10px] tracking-[0.2em] text-gold/80 mb-5 font-semibold">FUNIL DE CONVERSÃO</p>
          <div className="space-y-2.5">
            {STATUS_OPTIONS.map((s, i) => {
              const count = stats.byStatus[s.key] || 0;
              const pct = stats.total > 0 ? (count / stats.total) * 100 : 0;
              return (
                <div key={s.key} className="flex items-center gap-3 group">
                  <p className="font-heading text-[10px] text-muted-foreground/70 w-24 truncate group-hover:text-foreground/80 transition-colors">{s.label}</p>
                  <div className="flex-1 h-7 bg-secondary/30 rounded overflow-hidden relative">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.7, delay: i * 0.08, ease: "easeOut" }}
                      className={`h-full ${s.color}/20 rounded`}
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 font-heading text-[9px] text-muted-foreground/60 font-semibold">{count}</span>
                  </div>
                  <p className="font-heading text-[10px] text-foreground/70 w-10 text-right font-semibold">{pct.toFixed(0)}%</p>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Daily chart */}
        <motion.div
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.25, duration: 0.5 }}
          className="rounded-lg border border-border/50 bg-card/10 backdrop-blur-sm p-6"
        >
          <p className="font-heading text-[10px] tracking-[0.2em] text-gold/80 mb-5 font-semibold">LEADS · ÚLTIMOS 14 DIAS</p>
          <div className="flex items-end gap-1.5 h-40">
            {stats.daily.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                <span className="font-heading text-[8px] text-gold/70 font-bold opacity-0 group-hover:opacity-100 transition-opacity">{d.count > 0 ? d.count : ""}</span>
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.max((d.count / maxDaily) * 100, 4)}%` }}
                  transition={{ delay: i * 0.04, duration: 0.5 }}
                  className={`w-full rounded-sm ${d.count > 0 ? "bg-gold/20 border border-gold-border/50 hover:bg-gold/30 transition-colors" : "bg-secondary/20"}`}
                />
                <span className="font-heading text-[7px] text-muted-foreground/40 -rotate-45 origin-top-left whitespace-nowrap mt-1">{d.label}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Sources + Priority row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="rounded-lg border border-border/50 bg-card/10 backdrop-blur-sm p-6"
        >
          <p className="font-heading text-[10px] tracking-[0.2em] text-gold/80 mb-4 font-semibold">ORIGEM DOS LEADS</p>
          <div className="space-y-2.5">
            {Object.entries(stats.sources).sort((a, b) => b[1] - a[1]).map(([source, count]) => (
              <div key={source} className="flex items-center gap-3 group">
                <p className="font-heading text-[10px] text-muted-foreground/60 w-24 capitalize truncate group-hover:text-foreground/70 transition-colors">{source}</p>
                <div className="flex-1 h-5 bg-secondary/20 rounded overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(count / stats.total) * 100}%` }}
                    transition={{ duration: 0.5 }}
                    className="h-full bg-gold/15 rounded"
                  />
                </div>
                <p className="font-heading text-[10px] text-foreground/70 w-6 text-right font-semibold">{count}</p>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.5 }}
          className="rounded-lg border border-border/50 bg-card/10 backdrop-blur-sm p-6"
        >
          <p className="font-heading text-[10px] tracking-[0.2em] text-gold/80 mb-4 font-semibold">PRIORIDADE</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Urgente", emoji: "🔴", count: stats.byPriority.urgent, border: "border-red-500/20 hover:border-red-500/40" },
              { label: "Alta", emoji: "🟠", count: stats.byPriority.high, border: "border-orange-500/20 hover:border-orange-500/40" },
              { label: "Média", emoji: "🟡", count: stats.byPriority.medium, border: "border-yellow-500/20 hover:border-yellow-500/40" },
              { label: "Baixa", emoji: "🟢", count: stats.byPriority.low, border: "border-green-500/20 hover:border-green-500/40" },
            ].map((p) => (
              <div key={p.label} className={`border ${p.border} bg-card/10 rounded-lg p-4 flex items-center gap-3 transition-all duration-300`}>
                <span className="text-lg">{p.emoji}</span>
                <div>
                  <p className="font-heading text-lg font-bold text-foreground/90">{p.count}</p>
                  <p className="font-heading text-[9px] text-muted-foreground/60">{p.label}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
