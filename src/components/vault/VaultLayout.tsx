import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { VaultUser } from "@/hooks/useVaultAuth";
import VaultSidebar, { GlobalView } from "./VaultSidebar";
import VaultDashboard from "./VaultDashboard";
import VaultCompanyView from "./VaultCompanyView";
import VaultGlobalEntries from "./VaultGlobalEntries";
import VaultGlobalReports from "./VaultGlobalReports";
import VaultGlobalPlanning from "./VaultGlobalPlanning";
import VaultGlobalHR from "./VaultGlobalHR";
import VaultUsersPage from "./VaultUsersPage";
import VaultProfilePage from "./VaultProfilePage";

import { ChevronRight, Bell, LogOut, Save, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import VaultDeleteConfirm from "./VaultDeleteConfirm";

interface Props {
  user: VaultUser;
  onLogout: () => void;
  roleLabels: Record<string, string>;
  roleColors: Record<string, string>;
  hasPerm: (p: string) => boolean;
}

const VIEW_LABELS: Record<string, string> = {
  dashboard: "Dashboard", lancamentos: "Lançamentos", relatorios: "Relatórios",
  planejamento: "Planejamento", rh: "Pessoas & RH", notifications: "Notificações",
  settings: "Configurações", usuarios: "Usuários", perfil: "Meu Perfil",
};

const SETTINGS_FIELDS = [
  { key: "group_name", label: "Nome do Grupo", default: "Beezzy Group" },
  { key: "fiscal_year", label: "Exercício Fiscal", default: "Janeiro — Dezembro", type: "select", options: ["Janeiro — Dezembro", "Abril — Março", "Julho — Junho"] },
  { key: "tax_regime_default", label: "Regime Tributário Padrão", default: "Simples Nacional", type: "select", options: ["Simples Nacional", "Lucro Presumido", "Lucro Real", "MEI"] },
  { key: "holding_name", label: "Empresa Holding", default: "" },
  { key: "responsible", label: "Responsável Geral", default: "" },
  { key: "contact_email", label: "E-mail de Contato", default: "" },
  { key: "contact_phone", label: "Telefone de Contato", default: "" },
  { key: "address", label: "Endereço Sede", default: "" },
];

const VaultLayout = ({ user, onLogout, roleLabels, roleColors, hasPerm }: Props) => {
  const qc = useQueryClient();
  const [globalView, setGlobalView] = useState<GlobalView | null>("dashboard");
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [companyTab, setCompanyTab] = useState(0);

  // Settings state
  const [editingSettings, setEditingSettings] = useState(false);
  const [settingsForm, setSettingsForm] = useState<Record<string, string>>(() => {
    const saved = sessionStorage.getItem("vault_group_settings");
    return saved ? JSON.parse(saved) : {};
  });

  // Company CRUD
  const [companyModal, setCompanyModal] = useState<{ open: boolean; company?: any }>({ open: false });
  const [companyForm, setCompanyForm] = useState({ name: "", slug: "", cnpj: "", regime: "Simples Nacional", aliquota: "6", color: "#888", is_holding: false });
  const [deleteCompanyModal, setDeleteCompanyModal] = useState<{ open: boolean; id: string; name: string }>({ open: false, id: "", name: "" });

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

  const handleSelectCompany = (slug: string) => { setSelectedCompany(slug); setGlobalView(null); setCompanyTab(0); };
  const handleGlobalView = (view: GlobalView) => { setGlobalView(view); setSelectedCompany(null); };

  const company = companies?.find((c: any) => c.slug === selectedCompany);
  const breadcrumb = selectedCompany ? `${company?.name ?? selectedCompany}` : VIEW_LABELS[globalView ?? "dashboard"] ?? "Dashboard";

  // Settings handlers
  const getSettingValue = (key: string) => settingsForm[key] || SETTINGS_FIELDS.find(f => f.key === key)?.default || "";
  const handleSaveSettings = () => {
    sessionStorage.setItem("vault_group_settings", JSON.stringify(settingsForm));
    setEditingSettings(false);
    toast.success("Configurações salvas");
  };

  // Company form handlers
  const openNewCompany = () => {
    setCompanyForm({ name: "", slug: "", cnpj: "", regime: "Simples Nacional", aliquota: "6", color: "#888", is_holding: false });
    setCompanyModal({ open: true });
  };
  const openEditCompany = (co: any) => {
    setCompanyForm({ name: co.name, slug: co.slug, cnpj: co.cnpj || "", regime: co.regime || "Simples Nacional", aliquota: String(co.aliquota), color: co.color, is_holding: co.is_holding });
    setCompanyModal({ open: true, company: co });
  };
  const handleSaveCompany = async () => {
    if (!companyForm.name || !companyForm.slug) { toast.error("Nome e slug são obrigatórios"); return; }
    const payload = {
      name: companyForm.name, slug: companyForm.slug, cnpj: companyForm.cnpj || null,
      regime: companyForm.regime, aliquota: Number(companyForm.aliquota) || 6,
      color: companyForm.color, is_holding: companyForm.is_holding,
    };
    const { error } = companyModal.company
      ? await supabase.from("vault_companies").update(payload).eq("id", companyModal.company.id)
      : await supabase.from("vault_companies").insert(payload);
    if (error) { toast.error(error.message); return; }
    toast.success(companyModal.company ? "Empresa atualizada" : "Empresa criada");
    qc.invalidateQueries({ queryKey: ["vault_companies"] });
    setCompanyModal({ open: false });
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#060604", color: "#F2F0E8" }}>
      <VaultSidebar
        user={user} companies={companies ?? []} selectedCompany={selectedCompany}
        globalView={globalView} unreadCount={unreadCount}
        onSelectCompany={handleSelectCompany} onGlobalView={handleGlobalView}
        onLogout={onLogout} roleLabels={roleLabels} roleColors={roleColors}
        hasPerm={hasPerm} companyTab={companyTab} onCompanyTab={setCompanyTab}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <div className="h-12 flex items-center justify-between px-5 border-b border-white/5 shrink-0" style={{ background: "#070707" }}>
          <div className="flex items-center gap-1.5 text-xs">
            <span style={{ color: "rgba(242,240,232,0.4)" }}>Grupo</span>
            <ChevronRight size={10} style={{ color: "rgba(242,240,232,0.2)" }} />
            <span className="font-medium">{breadcrumb}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={() => handleGlobalView("notifications")}
              className="relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-white/10 text-[11px] hover:border-white/20 transition-colors"
              style={{ color: "rgba(242,240,232,0.4)" }}>
              <Bell size={12} /> Notificações
              {unreadCount > 0 && <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500" />}
            </button>
            <button onClick={onLogout}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-white/10 text-[11px] hover:border-white/20 transition-colors"
              style={{ color: "rgba(242,240,232,0.4)" }}>
              <LogOut size={12} /> Sair
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6" style={{ scrollbarWidth: "thin" }}>
          {globalView === "dashboard" && <VaultDashboard companies={companies ?? []} onSelectCompany={handleSelectCompany} />}
          {globalView === "lancamentos" && <VaultGlobalEntries />}
          {globalView === "relatorios" && <VaultGlobalReports />}
          {globalView === "planejamento" && <VaultGlobalPlanning />}
          {globalView === "rh" && <VaultGlobalHR />}
          {globalView === "notifications" && (
            <div>
              <h1 className="font-heading text-lg font-semibold mb-4">Notificações</h1>
              <div className="space-y-2">
                {notifications?.length === 0 && <div className="text-center py-12 text-xs" style={{ color: "rgba(242,240,232,0.3)" }}>Nenhuma notificação</div>}
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
          

          {/* Settings - Editable */}
          {globalView === "settings" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="font-heading text-lg font-semibold">Configurações do Grupo</h1>
                  <p className="text-[11px]" style={{ color: "rgba(242,240,232,0.4)" }}>Dados gerais e empresas do grupo</p>
                </div>
                {!editingSettings ? (
                  <Button size="sm" onClick={() => setEditingSettings(true)} className="bg-[#FFD600] text-black hover:bg-[#E6C200] h-7 text-[11px] px-2.5">
                    <Pencil size={12} className="mr-1" /> Editar
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" onClick={() => setEditingSettings(false)} className="h-7 text-[11px] px-2.5 text-white/60">Cancelar</Button>
                    <Button size="sm" onClick={handleSaveSettings} className="bg-[#FFD600] text-black hover:bg-[#E6C200] h-7 text-[11px] px-2.5">
                      <Save size={12} className="mr-1" /> Salvar
                    </Button>
                  </div>
                )}
              </div>

              <div className="max-w-lg space-y-3 mb-6">
                {SETTINGS_FIELDS.map((f) => (
                  <div key={f.key} className="rounded-xl p-3 border border-white/5" style={{ background: "#0e0e0a" }}>
                    <div className="text-[9px] uppercase tracking-widest mb-1" style={{ color: "rgba(242,240,232,0.3)" }}>{f.label}</div>
                    {editingSettings ? (
                      <input value={getSettingValue(f.key)} onChange={e => setSettingsForm(s => ({ ...s, [f.key]: e.target.value }))}
                        className="w-full bg-white/5 border border-white/10 rounded-md px-2 py-1.5 text-sm text-[#F2F0E8] outline-none" />
                    ) : (
                      <div className="text-sm">{getSettingValue(f.key)}</div>
                    )}
                  </div>
                ))}
              </div>

              {/* Companies management */}
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-heading text-sm font-semibold">Empresas do Grupo</h2>
                <Button size="sm" onClick={openNewCompany} className="bg-[#FFD600] text-black hover:bg-[#E6C200] h-7 text-[11px] px-2.5">
                  <Plus size={12} className="mr-1" /> Nova Empresa
                </Button>
              </div>

              <div className="rounded-xl border border-white/5 overflow-hidden" style={{ background: "#0e0e0a" }}>
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/5">
                      {["Empresa", "Slug", "CNPJ", "Regime", "Alíquota", "Ações"].map(h => (
                        <th key={h} className="text-left px-4 py-2 text-[9px] uppercase tracking-widest font-medium" style={{ color: "rgba(242,240,232,0.25)" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(companies?.length ?? 0) === 0 && <tr><td colSpan={6} className="text-center py-8 text-xs" style={{ color: "rgba(242,240,232,0.3)" }}>Nenhuma empresa</td></tr>}
                    {companies?.map((co: any) => (
                      <tr key={co.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ background: co.color }} />
                            <span className="text-xs font-medium">{co.name}</span>
                            {co.is_holding && <span className="text-[8px] font-bold px-1.5 rounded" style={{ background: "rgba(255,214,0,0.15)", color: "#FFD600" }}>HOLDING</span>}
                          </div>
                        </td>
                        <td className="px-4 py-2.5 text-xs font-mono" style={{ color: "rgba(242,240,232,0.4)" }}>{co.slug}</td>
                        <td className="px-4 py-2.5 text-xs" style={{ color: "rgba(242,240,232,0.4)" }}>{co.cnpj || "—"}</td>
                        <td className="px-4 py-2.5 text-xs" style={{ color: "rgba(242,240,232,0.4)" }}>{co.regime}</td>
                        <td className="px-4 py-2.5 text-xs">{co.aliquota}%</td>
                        <td className="px-4 py-2.5">
                          <div className="flex gap-1">
                            <button onClick={() => openEditCompany(co)} className="p-1 rounded hover:bg-white/10"><Pencil size={12} style={{ color: "rgba(242,240,232,0.4)" }} /></button>
                            <button onClick={() => setDeleteCompanyModal({ open: true, id: co.id, name: co.name })} className="p-1 rounded hover:bg-red-500/20"><Trash2 size={12} className="text-red-400" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {globalView === "usuarios" && <VaultUsersPage user={user} />}
          {globalView === "perfil" && <VaultProfilePage user={user} />}
          {selectedCompany && company && (
            <VaultCompanyView company={company} tab={companyTab} onTabChange={setCompanyTab} hasPerm={hasPerm} />
          )}
        </div>
      </div>

      {/* Company CRUD Modal */}
      <Dialog open={companyModal.open} onOpenChange={() => setCompanyModal({ open: false })}>
        <DialogContent className="bg-[#111] border-white/10 text-[#F2F0E8] max-w-md">
          <DialogHeader><DialogTitle className="text-[#F2F0E8]">{companyModal.company ? "Editar Empresa" : "Nova Empresa"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            {[
              { label: "Nome", key: "name" },
              { label: "Slug (identificador único)", key: "slug" },
              { label: "CNPJ", key: "cnpj" },
            ].map(f => (
              <div key={f.key}>
                <label className="text-[10px] uppercase tracking-widest mb-1 block" style={{ color: "rgba(242,240,232,0.4)" }}>{f.label}</label>
                <input value={(companyForm as any)[f.key]} onChange={e => setCompanyForm(fo => ({ ...fo, [f.key]: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-sm text-[#F2F0E8] outline-none" />
              </div>
            ))}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] uppercase tracking-widest mb-1 block" style={{ color: "rgba(242,240,232,0.4)" }}>Regime</label>
                <select value={companyForm.regime} onChange={e => setCompanyForm(f => ({ ...f, regime: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-sm text-[#F2F0E8] outline-none">
                  {["Simples Nacional", "Lucro Presumido", "Lucro Real", "MEI"].map(r => <option key={r} value={r} className="bg-[#111]">{r}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest mb-1 block" style={{ color: "rgba(242,240,232,0.4)" }}>Alíquota (%)</label>
                <input type="number" value={companyForm.aliquota} onChange={e => setCompanyForm(f => ({ ...f, aliquota: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-sm text-[#F2F0E8] outline-none" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] uppercase tracking-widest mb-1 block" style={{ color: "rgba(242,240,232,0.4)" }}>Cor</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={companyForm.color} onChange={e => setCompanyForm(f => ({ ...f, color: e.target.value }))} className="w-8 h-8 rounded border-0 bg-transparent cursor-pointer" />
                  <span className="text-sm">{companyForm.color}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-5">
                <input type="checkbox" checked={companyForm.is_holding} onChange={e => setCompanyForm(f => ({ ...f, is_holding: e.target.checked }))} className="w-4 h-4 rounded" />
                <label className="text-xs">É Holding</label>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-3">
            <Button variant="ghost" onClick={() => setCompanyModal({ open: false })} className="text-[#F2F0E8]/60">Cancelar</Button>
            <Button onClick={handleSaveCompany} className="bg-[#FFD600] text-black hover:bg-[#E6C200]">Salvar</Button>
          </div>
        </DialogContent>
      </Dialog>

      <VaultDeleteConfirm
        open={deleteCompanyModal.open}
        title={`Excluir ${deleteCompanyModal.name}?`}
        description="Todos os dados da empresa serão perdidos. Esta ação não pode ser desfeita."
        onConfirm={async () => {
          const { error } = await supabase.from("vault_companies").delete().eq("id", deleteCompanyModal.id);
          if (error) throw error;
          toast.success("Empresa excluída");
          qc.invalidateQueries({ queryKey: ["vault_companies"] });
          if (selectedCompany) { setSelectedCompany(null); setGlobalView("dashboard"); }
        }}
        onClose={() => setDeleteCompanyModal(d => ({ ...d, open: false }))}
      />
    </div>
  );
};

export default VaultLayout;
