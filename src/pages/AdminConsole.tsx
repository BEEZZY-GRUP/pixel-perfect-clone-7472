import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut, LayoutGrid, List, BarChart3, FileText } from "lucide-react";
import KanbanBoard from "@/components/admin/KanbanBoard";
import LeadsList from "@/components/admin/LeadsList";
import SalesDashboard from "@/components/admin/SalesDashboard";
import DiagnosticsList from "@/components/admin/DiagnosticsList";

const TABS = [
  { key: "Funil", label: "FUNIL", icon: LayoutGrid },
  { key: "Leads", label: "LEADS", icon: List },
  { key: "Dashboard", label: "DASHBOARD", icon: BarChart3 },
  { key: "Diagnosticos", label: "DIAGNÓSTICOS", icon: FileText },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function AdminConsole() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<TabKey>("Dashboard");

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
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div
          className="absolute inset-0 opacity-[0.012]"
          style={{
            backgroundImage: `linear-gradient(hsl(var(--border)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      {/* Top bar */}
      <header className="relative z-10 border-b border-border px-6 md:px-8 py-0 flex items-center justify-between bg-card/30 backdrop-blur-sm">
        {/* Logo */}
        <div className="flex items-center gap-3 py-4">
          <div className="w-2 h-2 bg-primary" />
          <p className="font-mono text-primary text-xs tracking-[0.3em] font-semibold">BZY</p>
          <span className="font-mono text-[9px] tracking-[0.15em] text-muted-foreground/50 hidden sm:inline">
            CONSOLE
          </span>
        </div>

        {/* Tabs */}
        <nav className="flex h-full">
          {TABS.map((t) => {
            const Icon = t.icon;
            const isActive = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`relative flex items-center gap-2 px-5 py-4 font-mono text-[10px] tracking-[0.15em] transition-colors duration-200 ${
                  isActive
                    ? "text-primary"
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

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 font-mono text-[10px] text-muted-foreground hover:text-destructive tracking-[0.15em] transition-colors duration-200 py-4"
        >
          <LogOut size={13} />
          <span className="hidden sm:inline">SAIR</span>
        </button>
      </header>

      {/* Content */}
      <main className="relative z-10 p-6 md:p-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            {tab === "Funil" && <KanbanBoard />}
            {tab === "Leads" && <LeadsList />}
            {tab === "Dashboard" && <SalesDashboard />}
            {tab === "Diagnosticos" && <DiagnosticsList />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
