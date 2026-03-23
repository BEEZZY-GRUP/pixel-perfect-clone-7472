import { useMemo } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Users, Target, AlertCircle, Zap, Clock, ArrowDownRight, ArrowUpRight } from "lucide-react";
import { useLeads } from "./LeadsContext";
import { STATUS_OPTIONS } from "./types";

export default function SalesDashboard() {
  const { leads, archivedLeads } = useLeads();

  const stats = useMemo(() => {
    const total = leads.length;
    const byStatus = Object.fromEntries(STATUS_OPTIONS.map((s) => [s.key, leads.filter((l) => l.status === s.key).length]));
    const conversionRate = total > 0 ? ((byStatus.fechado || 0) / total * 100).toFixed(1) : "0";
    const lossRate = total > 0 ? ((byStatus.perdido || 0) / total * 100).toFixed(1) : "0";

    // Last 7 days
    const now = Date.now();
    const last7 = leads.filter((l) => now - new Date(l.created_at).getTime() < 7 * 86400000).length;
    const prev7 = leads.filter((l) => {
      const age = now - new Date(l.created_at).getTime();
      return age >= 7 * 86400000 && age < 14 * 86400000;
    }).length;
    const growth = prev7 > 0 ? (((last7 - prev7) / prev7) * 100).toFixed(0) : last7 > 0 ? "100" : "0";

    // By priority
    const byPriority = {
      urgent: leads.filter((l) => l.priority === "urgent").length,
      high: leads.filter((l) => l.priority === "high").length,
      medium: leads.filter((l) => l.priority === "medium" || !l.priority).length,
      low: leads.filter((l) => l.priority === "low").length,
    };

    // By source
    const sources: Record<string, number> = {};
    leads.forEach((l) => { const s = l.source || "website"; sources[s] = (sources[s] || 0) + 1; });

    // Daily chart
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
    { label: "TOTAL LEADS", value: stats.total, icon: Users, color: "text-primary", sub: `+${stats.last7} esta semana` },
    { label: "EM NEGOCIAÇÃO", value: stats.byStatus.negociacao || 0, icon: Zap, color: "text-purple-400", sub: "leads ativos" },
    { label: "FECHADOS", value: stats.byStatus.fechado || 0, icon: Target, color: "text-green-400", sub: `${stats.conversionRate}% conversão` },
    { label: "PERDIDOS", value: stats.byStatus.perdido || 0, icon: AlertCircle, color: "text-red-400", sub: `${stats.lossRate}% perda` },
    { label: "NOVOS 7D", value: stats.last7, icon: TrendingUp, color: "text-blue-400", sub: `${Number(stats.growth) >= 0 ? "+" : ""}${stats.growth}% vs anterior` },
    { label: "LIXEIRA", value: archivedLeads.length, icon: Clock, color: "text-muted-foreground", sub: "arquivados" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-mono text-xs tracking-[0.2em] text-primary font-semibold">DASHBOARD</h2>
        <p className="font-mono text-[10px] text-muted-foreground mt-1">Visão geral do pipeline de vendas</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {kpiCards.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <motion.div
              key={kpi.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="border border-border bg-card/15 p-4"
            >
              <div className="flex items-center gap-2 mb-3">
                <Icon size={13} className={kpi.color} />
                <p className="font-mono text-[8px] tracking-[0.15em] text-muted-foreground">{kpi.label}</p>
              </div>
              <p className={`font-mono text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
              <p className="font-mono text-[9px] text-muted-foreground/60 mt-1">{kpi.sub}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Funnel + Chart row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Funnel visualization */}
        <div className="border border-border bg-card/15 p-6">
          <p className="font-mono text-[10px] tracking-[0.15em] text-muted-foreground mb-5">FUNIL DE CONVERSÃO</p>
          <div className="space-y-2">
            {STATUS_OPTIONS.map((s, i) => {
              const count = stats.byStatus[s.key] || 0;
              const pct = stats.total > 0 ? (count / stats.total) * 100 : 0;
              return (
                <div key={s.key} className="flex items-center gap-3">
                  <p className="font-mono text-[10px] text-muted-foreground w-24 truncate">{s.label}</p>
                  <div className="flex-1 h-6 bg-border/20 overflow-hidden relative">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.6, delay: i * 0.08 }}
                      className={`h-full ${s.color}/30`}
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 font-mono text-[9px] text-muted-foreground">{count}</span>
                  </div>
                  <p className="font-mono text-[10px] text-foreground w-10 text-right">{pct.toFixed(0)}%</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Daily chart */}
        <div className="border border-border bg-card/15 p-6">
          <p className="font-mono text-[10px] tracking-[0.15em] text-muted-foreground mb-5">LEADS · ÚLTIMOS 14 DIAS</p>
          <div className="flex items-end gap-1.5 h-36">
            {stats.daily.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <span className="font-mono text-[8px] text-primary font-bold">{d.count > 0 ? d.count : ""}</span>
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.max((d.count / maxDaily) * 100, 4)}%` }}
                  transition={{ delay: i * 0.04, duration: 0.4 }}
                  className={`w-full ${d.count > 0 ? "bg-primary/25 border border-primary/30" : "bg-border/20"}`}
                />
                <span className="font-mono text-[7px] text-muted-foreground/50 rotate-[-45deg] origin-top-left whitespace-nowrap mt-1">{d.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sources + Priority row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="border border-border bg-card/15 p-6">
          <p className="font-mono text-[10px] tracking-[0.15em] text-muted-foreground mb-4">ORIGEM DOS LEADS</p>
          <div className="space-y-2">
            {Object.entries(stats.sources).sort((a, b) => b[1] - a[1]).map(([source, count]) => (
              <div key={source} className="flex items-center gap-3">
                <p className="font-mono text-[10px] text-muted-foreground w-20 capitalize truncate">{source}</p>
                <div className="flex-1 h-4 bg-border/20 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(count / stats.total) * 100}%` }}
                    transition={{ duration: 0.5 }}
                    className="h-full bg-primary/20"
                  />
                </div>
                <p className="font-mono text-[10px] text-foreground w-6 text-right">{count}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="border border-border bg-card/15 p-6">
          <p className="font-mono text-[10px] tracking-[0.15em] text-muted-foreground mb-4">PRIORIDADE</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Urgente", emoji: "🔴", count: stats.byPriority.urgent, color: "border-red-500/30" },
              { label: "Alta", emoji: "🟠", count: stats.byPriority.high, color: "border-orange-500/30" },
              { label: "Média", emoji: "🟡", count: stats.byPriority.medium, color: "border-yellow-500/30" },
              { label: "Baixa", emoji: "🟢", count: stats.byPriority.low, color: "border-green-500/30" },
            ].map((p) => (
              <div key={p.label} className={`border ${p.color} bg-card/10 p-4 flex items-center gap-3`}>
                <span className="text-lg">{p.emoji}</span>
                <div>
                  <p className="font-mono text-lg font-bold text-foreground">{p.count}</p>
                  <p className="font-mono text-[9px] text-muted-foreground">{p.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
