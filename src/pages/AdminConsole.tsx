import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import PageBackground from "@/components/PageBackground";
import { LogOut, LayoutGrid, List, BarChart3, FileText, Trash2, Plus, RefreshCw } from "lucide-react";
import { LeadsProvider, useLeads } from "@/components/admin/LeadsContext";
import KanbanBoard from "@/components/admin/KanbanBoard";
import LeadsList from "@/components/admin/LeadsList";
import SalesDashboard from "@/components/admin/SalesDashboard";
import DiagnosticsList from "@/components/admin/DiagnosticsList";
import TrashPanel from "@/components/admin/TrashPanel";
import AddLeadModal from "@/components/admin/AddLeadModal";

const TABS = [
  { key: "Dashboard", label: "DASHBOARD", icon: BarChart3 },
  { key: "Funil", label: "FUNIL", icon: LayoutGrid },
  { key: "Leads", label: "LEADS", icon: List },
  { key: "Diagnosticos", label: "DIAGNÓSTICOS", icon: FileText },
  { key: "Lixeira", label: "LIXEIRA", icon: Trash2 },
] as const;

type TabKey = (typeof TABS)[number]["key"];

function ConsoleContent() {
  const navigate = useNavigate();
  const { refresh, loading } = useLeads();
  const [tab, setTab] = useState<TabKey>("Dashboard");
  const [addOpen, setAddOpen] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("bzy_auth") !== "1") {
      navigate("/adminconsole/login");
    }
  }, [navigate]);

  const handleLogout = () => {
    sessionStorage.removeItem("bzy_auth");
    navigate("/adminconsole/login");
  };

  return (
    <div className="min-h-screen bg-background relative">
      <PageBackground />

      {/* Top bar */}
      <header className="relative z-10 border-b border-border px-4 md:px-8 py-0 flex items-center justify-between bg-background/80 backdrop-blur-md">
        {/* Logo */}
        <div className="flex items-center gap-3 py-4">
          <div className="w-2 h-2 bg-gold rounded-full shadow-[0_0_8px_hsl(var(--gold)/0.6)]" />
          <p className="font-heading text-gold text-xs tracking-[0.3em] font-bold">BZY</p>
          <span className="font-heading text-[9px] tracking-[0.15em] text-muted-foreground/50 hidden sm:inline font-semibold">
            CONSOLE
          </span>
        </div>

        {/* Tabs */}
        <nav className="flex h-full overflow-x-auto">
          {TABS.map((t) => {
            const Icon = t.icon;
            const isActive = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`relative flex items-center gap-2 px-4 py-4 font-heading text-[10px] tracking-[0.15em] transition-colors duration-200 whitespace-nowrap font-semibold ${
                  isActive
                    ? "text-gold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon size={14} />
                <span className="hidden sm:inline">{t.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 w-full h-px bg-primary"
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setAddOpen(true)}
            className="flex items-center gap-1.5 font-mono text-[10px] tracking-[0.15em] px-3 py-2 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors hidden md:flex"
          >
            <Plus size={12} /> NOVO
          </button>
          <button
            onClick={() => refresh()}
            className="p-2 text-muted-foreground hover:text-foreground transition-colors"
            title="Atualizar"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 font-mono text-[10px] text-muted-foreground hover:text-destructive tracking-[0.15em] transition-colors duration-200 py-4"
          >
            <LogOut size={13} />
            <span className="hidden sm:inline">SAIR</span>
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="relative z-10 p-4 md:p-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            {tab === "Dashboard" && <SalesDashboard />}
            {tab === "Funil" && <KanbanBoard />}
            {tab === "Leads" && <LeadsList />}
            {tab === "Diagnosticos" && <DiagnosticsList />}
            {tab === "Lixeira" && <TrashPanel />}
          </motion.div>
        </AnimatePresence>
      </main>

      <AddLeadModal open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  );
}

export default function AdminConsole() {
  return (
    <LeadsProvider>
      <ConsoleContent />
    </LeadsProvider>
  );
}
