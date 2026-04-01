import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import PageBackground from "@/components/PageBackground";
import { LogOut, LayoutGrid, List, BarChart3, FileText, Trash2, Plus, RefreshCw, Users } from "lucide-react";
import { LeadsProvider, useLeads } from "@/components/admin/LeadsContext";
import KanbanBoard from "@/components/admin/KanbanBoard";
import LeadsList from "@/components/admin/LeadsList";
import SalesDashboard from "@/components/admin/SalesDashboard";
import DiagnosticsList from "@/components/admin/DiagnosticsList";
import TrashPanel from "@/components/admin/TrashPanel";
import AddLeadModal from "@/components/admin/AddLeadModal";
import ConsoleUsersTab from "@/components/admin/ConsoleUsersTab";

const TABS = [
  { key: "Dashboard", label: "DASHBOARD", icon: BarChart3, adminOnly: false },
  { key: "Funil", label: "FUNIL", icon: LayoutGrid, adminOnly: false },
  { key: "Leads", label: "LEADS", icon: List, adminOnly: false },
  { key: "Diagnosticos", label: "DIAGNÓSTICOS", icon: FileText, adminOnly: false },
  { key: "Lixeira", label: "LIXEIRA", icon: Trash2, adminOnly: false },
  { key: "Usuarios", label: "USUÁRIOS", icon: Users, adminOnly: true },
] as const;

type TabKey = (typeof TABS)[number]["key"];

function ConsoleContent() {
  const navigate = useNavigate();
  const { refresh, loading } = useLeads();
  const [tab, setTab] = useState<TabKey>("Dashboard");
  const [addOpen, setAddOpen] = useState(false);

  const consoleRole = sessionStorage.getItem("bzy_role") || "comercial";
  const isAdmin = consoleRole === "admin";

  useEffect(() => {
    if (sessionStorage.getItem("bzy_auth") !== "1") {
      navigate("/adminconsole/login");
    }
  }, [navigate]);

  const handleLogout = () => {
    sessionStorage.removeItem("bzy_auth");
    sessionStorage.removeItem("bzy_role");
    sessionStorage.removeItem("bzy_user_name");
    navigate("/adminconsole/login");
  };

  return (
    <div className="min-h-screen bg-background relative console-white">
      <PageBackground />

      {/* Top bar */}
      <header className="relative z-10 border-b border-gold-border/40 bg-background/70 backdrop-blur-xl">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between px-4 md:px-8">
          {/* Logo */}
          <div className="flex items-center gap-3 py-4 shrink-0">
            <div className="w-2 h-2 bg-gold rounded-full shadow-[0_0_10px_hsl(var(--gold)/0.5)]" />
            <h1 className="font-heading text-gold text-[11px] tracking-[0.35em] font-bold select-none">
              BEEZZY
            </h1>
            <span className="font-heading text-[9px] tracking-[0.2em] text-muted-foreground/40 font-semibold hidden sm:inline">
              .CONSOLE
            </span>
          </div>

          {/* Tabs */}
          <nav className="flex h-full overflow-x-auto scrollbar-none mx-2">
            {TABS.filter(t => !t.adminOnly || isAdmin).map((t) => {
              const Icon = t.icon;
              const isActive = tab === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`relative flex items-center gap-2 px-3 md:px-5 py-4 font-heading text-[10px] sm:text-[11px] tracking-[0.18em] transition-all duration-300 whitespace-nowrap font-semibold group ${
                    isActive
                      ? "text-gold"
                      : "text-muted-foreground/60 hover:text-foreground/80"
                  }`}
                >
                  <Icon size={14} className={isActive ? "text-gold" : "text-muted-foreground/40 group-hover:text-foreground/60 transition-colors"} />
                  <span className="hidden sm:inline">{t.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="consoleActiveTab"
                      className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full bg-gradient-to-r from-gold/60 via-gold to-gold/60"
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                    />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              onClick={() => setAddOpen(true)}
              className="flex items-center gap-1.5 font-heading text-[9px] sm:text-[10px] tracking-[0.15em] px-3 sm:px-4 py-2 bg-gold/90 text-background hover:bg-gold transition-all duration-300 rounded-lg font-bold shadow-[0_0_20px_hsl(var(--gold)/0.15)] hover:shadow-[0_0_30px_hsl(var(--gold)/0.25)]"
            >
              <Plus size={12} /> <span className="hidden sm:inline">NOVO LEAD</span>
            </button>
            <button
              onClick={() => refresh()}
              className="p-2 text-muted-foreground/50 hover:text-gold/70 transition-colors rounded-lg hover:bg-gold-dim"
              title="Atualizar"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            </button>
            <div className="w-px h-5 bg-border/30 mx-1 hidden sm:block" />
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 font-heading text-[9px] sm:text-[10px] text-muted-foreground/50 hover:text-destructive tracking-[0.15em] transition-all duration-300 py-4 font-semibold"
            >
              <LogOut size={13} />
              <span className="hidden sm:inline">SAIR</span>
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="relative z-10 max-w-[1600px] mx-auto p-4 md:p-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            {tab === "Dashboard" && <SalesDashboard />}
            {tab === "Funil" && <KanbanBoard />}
            {tab === "Leads" && <LeadsList consoleRole={consoleRole} />}
            {tab === "Diagnosticos" && <DiagnosticsList />}
            {tab === "Lixeira" && <TrashPanel consoleRole={consoleRole} />}
            {tab === "Usuarios" && isAdmin && <ConsoleUsersTab />}
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
