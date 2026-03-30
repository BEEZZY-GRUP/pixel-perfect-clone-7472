import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { VaultUser } from "@/hooks/useVaultAuth";
import VaultSidebar from "./VaultSidebar";
import VaultDashboard from "./VaultDashboard";
import VaultCompanyView from "./VaultCompanyView";
import {
  LayoutDashboard, Bell, Settings, Plug, LogOut, ChevronRight,
} from "lucide-react";

type GlobalView = "dashboard" | "notifications" | "integrations" | "settings";

interface Props {
  user: VaultUser;
  onLogout: () => void;
  roleLabels: Record<string, string>;
  roleColors: Record<string, string>;
  hasPerm: (p: string) => boolean;
}

const VaultLayout = ({ user, onLogout, roleLabels, roleColors, hasPerm }: Props) => {
  const [globalView, setGlobalView] = useState<GlobalView | null>("dashboard");
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [companyTab, setCompanyTab] = useState(0);

  const { data: companies } = useQuery({
    queryKey: ["vault_companies"],
    queryFn: async () => {
      const { data } = await supabase.from("vault_companies").select("*").eq("active", true).order("name");
      return data ?? [];
    },
  });

  const { data: notifications } = useQuery({
    queryKey: ["vault_notifications"],
    queryFn: async () => {
      const { data } = await supabase.from("vault_notifications").select("*").order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const unreadCount = notifications?.filter((n: any) => !n.read).length ?? 0;

  const handleSelectCompany = (slug: string) => {
    setSelectedCompany(slug);
    setGlobalView(null);
    setCompanyTab(0);
  };

  const handleGlobalView = (view: GlobalView) => {
    setGlobalView(view);
    setSelectedCompany(null);
  };

  const company = companies?.find((c: any) => c.slug === selectedCompany);
  const breadcrumb = selectedCompany
    ? `${company?.name ?? selectedCompany}`
    : globalView === "dashboard" ? "Dashboard"
    : globalView === "notifications" ? "Notificações"
    : globalView === "integrations" ? "Integrações"
    : "Configurações";

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#060604", color: "#F2F0E8" }}>
      {/* Sidebar */}
      <VaultSidebar
        user={user}
        companies={companies ?? []}
        selectedCompany={selectedCompany}
        globalView={globalView}
        unreadCount={unreadCount}
        onSelectCompany={handleSelectCompany}
        onGlobalView={handleGlobalView}
        onLogout={onLogout}
        roleLabels={roleLabels}
        roleColors={roleColors}
        hasPerm={hasPerm}
        companyTab={companyTab}
        onCompanyTab={setCompanyTab}
      />

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <div className="h-12 flex items-center justify-between px-5 border-b border-white/5 shrink-0" style={{ background: "#070707" }}>
          <div className="flex items-center gap-1.5 text-xs">
            <span style={{ color: "rgba(242,240,232,0.4)" }}>Grupo</span>
            <ChevronRight size={10} style={{ color: "rgba(242,240,232,0.2)" }} />
            <span className="font-medium">{breadcrumb}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handleGlobalView("notifications")}
              className="relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-white/10 text-[11px] hover:border-white/20 transition-colors"
              style={{ color: "rgba(242,240,232,0.4)" }}
            >
              <Bell size={12} /> Notificações
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500" />
              )}
            </button>
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-white/10 text-[11px] hover:border-white/20 transition-colors"
              style={{ color: "rgba(242,240,232,0.4)" }}
            >
              <LogOut size={12} /> Sair
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6" style={{ scrollbarWidth: "thin" }}>
          {globalView === "dashboard" && <VaultDashboard companies={companies ?? []} onSelectCompany={handleSelectCompany} />}
          {globalView === "notifications" && (
            <div>
              <h1 className="font-heading text-lg font-semibold mb-4">Notificações</h1>
              <div className="space-y-2">
                {notifications?.map((n: any) => (
                  <div key={n.id} className="p-3 rounded-lg border border-white/5 flex items-start gap-3" style={{ background: "#0e0e0a" }}>
                    <span className="text-lg">{n.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-medium ${n.read ? 'opacity-50' : ''}`}>{n.message}</div>
                      {n.sub_message && <div className="text-[11px] mt-0.5" style={{ color: "rgba(242,240,232,0.4)" }}>{n.sub_message}</div>}
                    </div>
                    {!n.read && <span className="w-2 h-2 rounded-full bg-red-500 mt-1.5 shrink-0" />}
                  </div>
                ))}
              </div>
            </div>
          )}
          {globalView === "settings" && (
            <div>
              <h1 className="font-heading text-lg font-semibold mb-4">Configurações do Grupo</h1>
              <p className="text-sm" style={{ color: "rgba(242,240,232,0.4)" }}>Configurações globais serão implementadas em breve.</p>
            </div>
          )}
          {globalView === "integrations" && (
            <div>
              <h1 className="font-heading text-lg font-semibold mb-4">Integrações</h1>
              <p className="text-sm" style={{ color: "rgba(242,240,232,0.4)" }}>Módulo de integrações será implementado em breve.</p>
            </div>
          )}
          {selectedCompany && company && (
            <VaultCompanyView company={company} tab={companyTab} onTabChange={setCompanyTab} hasPerm={hasPerm} />
          )}
        </div>
      </div>
    </div>
  );
};

export default VaultLayout;
