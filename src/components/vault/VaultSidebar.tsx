import { VaultUser } from "@/hooks/useVaultAuth";
import {
  LayoutDashboard, Bell, Settings, Plug, ChevronDown, ChevronRight,
  Building2, DollarSign, Users, BarChart3, Wrench, CreditCard,
  FileText, Target, UserCircle,
} from "lucide-react";

export type GlobalView = "dashboard" | "lancamentos" | "relatorios" | "planejamento" | "rh" | "notifications" | "settings" | "usuarios" | "perfil";

const COMPANY_TABS = [
  { icon: LayoutDashboard, label: "Dashboard" },
  { icon: CreditCard, label: "Controle Bancário" },
  { icon: DollarSign, label: "Lançar Despesa" },
  { icon: DollarSign, label: "Lançar Faturamento" },
  { icon: FileText, label: "Contas a Pagar" },
  { icon: FileText, label: "Faturamentos" },
  { icon: BarChart3, label: "Relatórios" },
  { icon: Users, label: "Pessoas & RH" },
  { icon: UserCircle, label: "RH" },
  { icon: Wrench, label: "Configurações" },
];

interface Props {
  user: VaultUser;
  companies: any[];
  selectedCompany: string | null;
  globalView: GlobalView | null;
  unreadCount: number;
  onSelectCompany: (slug: string) => void;
  onGlobalView: (view: GlobalView) => void;
  onLogout: () => void;
  roleLabels: Record<string, string>;
  roleColors: Record<string, string>;
  hasPerm: (p: string) => boolean;
  companyTab: number;
  onCompanyTab: (tab: number) => void;
}

const VaultSidebar = ({
  user, companies, selectedCompany, globalView, unreadCount,
  onSelectCompany, onGlobalView, roleLabels, roleColors,
  companyTab, onCompanyTab,
}: Props) => {
  const navItem = (
    key: string, icon: React.ReactNode, label: string,
    active: boolean, onClick: () => void, badge?: number
  ) => (
    <button
      key={key}
      onClick={onClick}
      className={`w-full flex items-center gap-2 px-2.5 py-[7px] rounded-md text-[12.5px] transition-all border-l-2 mb-0.5 ${
        active
          ? "border-l-[#FFD600] text-[#F2F0E8]"
          : "border-l-transparent hover:bg-white/[0.03]"
      }`}
      style={{
        color: active ? "#F2F0E8" : "rgba(242,240,232,0.4)",
        background: active ? "rgba(255,214,0,0.08)" : undefined,
      }}
    >
      {icon}
      <span className="flex-1 text-left">{label}</span>
      {badge != null && badge > 0 && (
        <span className="text-[9px] bg-red-500 text-white px-1.5 rounded-full font-bold">{badge}</span>
      )}
    </button>
  );

  return (
    <div className="w-[240px] flex flex-col border-r border-white/5 shrink-0 overflow-y-auto scrollbar-gold" style={{ background: "#070707" }}>
      {/* Logo */}
      <div className="px-4 py-5 border-b border-white/5">
        <div className="font-heading font-bold text-sm tracking-tight">
          BEEZZY<span style={{ color: "#FFD600" }}>.</span>VAULT
        </div>
        <div className="text-[9px] tracking-widest uppercase mt-0.5" style={{ color: "rgba(242,240,232,0.2)" }}>
          Gestão Empresarial
        </div>
      </div>

      {/* Global Nav */}
      <div className="px-2 pt-3 pb-1">
        <div className="text-[9px] tracking-widest uppercase px-2.5 mb-1" style={{ color: "rgba(242,240,232,0.2)" }}>
          Principal
        </div>
        {navItem("dashboard", <LayoutDashboard size={13} />, "Dashboard", globalView === "dashboard", () => onGlobalView("dashboard"))}
        {navItem("lancamentos", <FileText size={13} />, "Lançamentos", globalView === "lancamentos", () => onGlobalView("lancamentos"))}
        {navItem("relatorios", <BarChart3 size={13} />, "Relatórios", globalView === "relatorios", () => onGlobalView("relatorios"))}
        {navItem("planejamento", <Target size={13} />, "Planejamento", globalView === "planejamento", () => onGlobalView("planejamento"))}
        {navItem("rh", <Users size={13} />, "Pessoas & RH", globalView === "rh", () => onGlobalView("rh"))}
        {navItem("notifications", <Bell size={13} />, "Notificações", globalView === "notifications", () => onGlobalView("notifications"), unreadCount)}
        {navItem("settings", <Settings size={13} />, "Configurações", globalView === "settings", () => onGlobalView("settings"))}
        {navItem("usuarios", <UserCircle size={13} />, "Usuários", globalView === "usuarios", () => onGlobalView("usuarios"))}
      </div>

      {/* Companies */}
      <div className="px-2 pt-3 pb-1">
        <div className="text-[9px] tracking-widest uppercase px-2.5 mb-1" style={{ color: "rgba(242,240,232,0.2)" }}>
          Empresas
        </div>
        {companies.map((co: any) => {
          const isSelected = selectedCompany === co.slug;
          return (
            <div key={co.slug}>
              <button
                onClick={() => onSelectCompany(co.slug)}
                className={`w-full flex items-center gap-2 px-2.5 py-[7px] rounded-md text-[12.5px] transition-all border-l-2 mb-0.5 ${
                  isSelected ? "border-l-[#FFD600]" : "border-l-transparent hover:bg-white/[0.03]"
                }`}
                style={{
                  color: isSelected ? "#F2F0E8" : "rgba(242,240,232,0.4)",
                  background: isSelected ? "rgba(255,214,0,0.08)" : undefined,
                }}
              >
                <span className="w-[5px] h-[5px] rounded-full shrink-0" style={{ background: co.color }} />
                <span className="flex-1 text-left">{co.name}</span>
                {co.is_holding && (
                  <span className="text-[8px] font-bold px-1.5 rounded" style={{ background: "linear-gradient(90deg,#FFD600,#E6C200)", color: "#000" }}>
                    HOLDING
                  </span>
                )}
                {isSelected ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
              </button>

              {isSelected && (
                <div className="ml-3 pl-2 border-l border-white/5 mb-1">
                  {COMPANY_TABS.map((tab, idx) => (
                    <button
                      key={idx}
                      onClick={() => onCompanyTab(idx)}
                      className={`w-full flex items-center gap-2 px-2 py-[5px] rounded text-[11px] transition-all mb-px ${
                        companyTab === idx
                          ? "text-[#FFD600] bg-[rgba(255,214,0,0.06)]"
                          : "hover:bg-white/[0.03]"
                      }`}
                      style={{ color: companyTab === idx ? "#FFD600" : "rgba(242,240,232,0.35)" }}
                    >
                      <tab.icon size={11} />
                      {tab.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* User footer */}
      <div className="mt-auto border-t border-white/5 p-2">
        <button
          onClick={() => onGlobalView("perfil")}
          className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md hover:bg-white/[0.03] transition-colors"
        >
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-black font-heading shrink-0"
            style={{ background: `linear-gradient(135deg, ${user.color}, ${user.color}aa)` }}
          >
            {user.avatar}
          </div>
          <div className="text-left">
            <div className="text-xs font-medium">{user.name}</div>
            <span
              className="inline-block text-[8px] font-bold px-1.5 rounded mt-0.5"
              style={{ background: `${roleColors[user.role]}22`, color: roleColors[user.role] }}
            >
              {roleLabels[user.role]}
            </span>
          </div>
        </button>
      </div>
    </div>
  );
};

export default VaultSidebar;
