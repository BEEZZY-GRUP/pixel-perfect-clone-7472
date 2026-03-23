import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Users, Target, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Lead {
  id: string;
  status: string;
  created_at: string;
}

export default function SalesDashboard() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("leads").select("id, status, created_at").order("created_at", { ascending: false })
      .then(({ data }) => { if (data) setLeads(data as Lead[]); setLoading(false); });
  }, []);

  const total = leads.length;
  const novo = leads.filter((l) => l.status === "novo").length;
  const contatado = leads.filter((l) => l.status === "contatado").length;
  const qualificado = leads.filter((l) => l.status === "qualificado").length;
  const perdido = leads.filter((l) => l.status === "perdido").length;
  const conversionRate = total > 0 ? ((qualificado / total) * 100).toFixed(1) : "0";

  const stats = [
    { label: "TOTAL LEADS", value: total, icon: Users, color: "text-primary" },
    { label: "NOVOS", value: novo, icon: TrendingUp, color: "text-blue-400" },
    { label: "QUALIFICADOS", value: qualificado, icon: Target, color: "text-green-400" },
    { label: "TAXA CONVERSÃO", value: `${conversionRate}%`, icon: TrendingUp, color: "text-primary" },
    { label: "PERDIDOS", value: perdido, icon: AlertCircle, color: "text-red-400" },
  ];

  // Last 7 days leads
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split("T")[0];
    return {
      label: d.toLocaleDateString("pt-BR", { weekday: "short" }),
      count: leads.filter((l) => l.created_at.startsWith(dateStr)).length,
    };
  });
  const maxCount = Math.max(...last7.map((d) => d.count), 1);

  if (loading) return <p className="text-muted-foreground font-mono text-sm">Carregando...</p>;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-mono text-xs tracking-[0.2em] text-primary font-semibold">DASHBOARD</h2>
        <p className="font-mono text-[10px] text-muted-foreground mt-1">Visão geral dos leads</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="border border-border bg-card/20 p-5"
            >
              <div className="flex items-center gap-2 mb-3">
                <Icon size={14} className={s.color} />
                <p className="font-mono text-[9px] tracking-[0.15em] text-muted-foreground">{s.label}</p>
              </div>
              <p className={`font-mono text-2xl font-bold ${s.color}`}>{s.value}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Chart */}
      <div className="border border-border bg-card/20 p-6">
        <p className="font-mono text-[10px] tracking-[0.15em] text-muted-foreground mb-6">LEADS · ÚLTIMOS 7 DIAS</p>
        <div className="flex items-end gap-3 h-40">
          {last7.map((d, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2">
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${(d.count / maxCount) * 100}%` }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
                className="w-full bg-primary/20 border border-primary/30 min-h-[4px]"
              />
              <p className="font-mono text-[9px] text-muted-foreground">{d.label}</p>
              <p className="font-mono text-[10px] text-primary font-bold">{d.count}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Status breakdown */}
      <div className="border border-border bg-card/20 p-6">
        <p className="font-mono text-[10px] tracking-[0.15em] text-muted-foreground mb-4">DISTRIBUIÇÃO POR STATUS</p>
        <div className="space-y-3">
          {[
            { label: "Novos", count: novo, color: "bg-blue-500" },
            { label: "Contatados", count: contatado, color: "bg-yellow-500" },
            { label: "Qualificados", count: qualificado, color: "bg-green-500" },
            { label: "Perdidos", count: perdido, color: "bg-red-500" },
          ].map((s) => (
            <div key={s.label} className="flex items-center gap-4">
              <p className="font-mono text-xs text-muted-foreground w-28">{s.label}</p>
              <div className="flex-1 h-2 bg-border/30 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: total > 0 ? `${(s.count / total) * 100}%` : "0%" }}
                  transition={{ duration: 0.6 }}
                  className={`h-full ${s.color}/60`}
                />
              </div>
              <p className="font-mono text-xs text-foreground w-8 text-right">{s.count}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
